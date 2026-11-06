'use client'

type Props = {
  distance: number
  sensorOk: boolean
  wifiRssi: number
  firmware: string
  ageSec: number
  receivedAt: number
}

export function DeviceDetails({
  distance,
  sensorOk,
  wifiRssi,
  firmware,
  ageSec,
  receivedAt,
}: Props) {
  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 md:p-6">
      <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4">
        Detalhes do Dispositivo
      </div>

      <div className="grid grid-cols-2 gap-y-3 text-sm">
        <Detail label="Distancia" value={`${distance.toFixed(1)} cm`} />
        <Detail
          label="Sensor"
          value={sensorOk ? 'OK' : 'FALHA'}
          valueClass={sensorOk ? 'text-emerald-400' : 'text-red-400'}
        />
        <Detail label="Wi-Fi" value={`${wifiRssi} dBm`} />
        <Detail label="Firmware" value={firmware} />
        <Detail label="Ultima leitura" value={formatAge(ageSec)} />
        <Detail
          label="Recebido as"
          value={new Date(receivedAt).toLocaleTimeString('pt-BR')}
        />
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  valueClass = 'text-slate-200',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <>
      <div className="text-slate-500">{label}</div>
      <div className={`text-right font-medium tabular-nums ${valueClass}`}>
        {value}
      </div>
    </>
  )
}

function formatAge(sec: number) {
  if (sec < 60) return `${Math.floor(sec)}s atras`
  if (sec < 3600) return `${Math.floor(sec / 60)}min atras`
  return `${Math.floor(sec / 3600)}h atras`
}
