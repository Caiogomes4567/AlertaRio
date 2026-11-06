'use client'

import { useDeviceStream, useNow } from '@/hooks/useDeviceStream'
import { ONLINE_THRESHOLD, UNSTABLE_THRESHOLD } from '@/lib/constants'
import { DashboardHeader } from '@/components/DashboardHeader'
import { WaterLevelCard } from '@/components/WaterLevelCard'
import { AlertCard } from '@/components/AlertCard'
import { DeviceDetails } from '@/components/DeviceDetails'
import { EmptyState } from '@/components/EmptyState'

export default function Dashboard() {
  const { device, connected } = useDeviceStream()
  const now = useNow(1000)

  if (!device) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-200 p-6 md:p-10">
        <div className="max-w-3xl mx-auto">
          <DashboardHeader online={connected} connectionLabel="CONECTADO" />
          <EmptyState />
        </div>
      </main>
    )
  }

  const ageSec = (now - device.last_seen_at) / 1000
  const online = ageSec < ONLINE_THRESHOLD
  const unstable = ageSec >= ONLINE_THRESHOLD && ageSec < UNSTABLE_THRESHOLD

  const connectionLabel = online ? 'ONLINE' : unstable ? 'INSTAVEL' : 'OFFLINE'

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-200 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <DashboardHeader online={online} connectionLabel={connectionLabel} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-5">
          <WaterLevelCard
            depth={device.water_depth_cm}
            trend={device.trend}
            riseRate={device.rise_rate_cm_min}
          />
          <AlertCard alert={device.alert} online={online} />
        </div>

        <DeviceDetails
          distance={device.distance_cm}
          sensorOk={device.sensor_ok}
          wifiRssi={device.wifi_rssi}
          firmware={device.firmware_version}
          ageSec={ageSec}
          receivedAt={device.last_seen_at}
        />

        {!online && (
          <div className="mt-5 border border-red-700/60 bg-red-950/40 text-red-300 rounded-2xl p-4 text-sm backdrop-blur">
            <strong className="font-semibold">Aviso: dispositivo offline.</strong>{' '}
            Exibindo o ultimo estado conhecido.
          </div>
        )}

        <footer className="mt-10 text-center text-xs text-slate-600">
          Monitor de Alagamento - v1.0 - ESP32 + Next.js
        </footer>
      </div>
    </main>
  )
}
