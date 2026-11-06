// app/api/telemetry/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { setDevice, getDevice } from '@/lib/store'
import { enviarNotificacao } from '@/lib/push'

export const dynamic = 'force-dynamic'

const Schema = z.object({
  distance_cm: z.number().min(0).max(400),
  water_depth_cm: z.number().min(0).max(400),
  rise_rate_cm_min: z.number().min(-200).max(200),
  alert: z.enum([
    'normal',
    'attention',
    'alert',
    'danger',
    'critical',
    'sensor_fault',
  ]),
  trend: z.enum(['stable', 'rising', 'rising_fast', 'falling']),
  sensor_ok: z.boolean(),
  wifi_rssi: z.number().int().min(-120).max(0),
  firmware_version: z.string().max(50),
})

export async function POST(req: NextRequest) {
  const expected = process.env.DEVICE_TOKEN
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid payload', issues: parsed.error.issues },
      { status: 422 }
    )
  }

  const previous = getDevice()
  const previousAlert = previous?.alert
  const newAlert = parsed.data.alert

  setDevice({ ...parsed.data, last_seen_at: Date.now() })

  // Notifica quando entra em perigo/crítico/falha
  const virouPerigo =
    (newAlert === 'danger' &&
      previousAlert !== 'danger' &&
      previousAlert !== 'critical') ||
    (newAlert === 'critical' && previousAlert !== 'critical') ||
    (newAlert === 'sensor_fault' && previousAlert !== 'sensor_fault')

  if (virouPerigo) {
    const titulos: Record<string, string> = {
      danger: '⚠️ PERIGO — Nível elevado',
      critical: '🚨 CRÍTICO — Alagamento iminente',
      sensor_fault: '🔧 Falha no sensor',
    }

    const corpos: Record<string, string> = {
      danger: `Nível: ${parsed.data.water_depth_cm.toFixed(1)} cm | Subida: ${parsed.data.rise_rate_cm_min.toFixed(1)} cm/min`,
      critical: `Nível: ${parsed.data.water_depth_cm.toFixed(1)} cm | Subida: ${parsed.data.rise_rate_cm_min.toFixed(1)} cm/min`,
      sensor_fault: 'Verifique o sensor do dispositivo',
    }

    enviarNotificacao({
      title: titulos[newAlert] || 'Alerta',
      body: corpos[newAlert] || '',
      alert: newAlert,
      water_depth_cm: parsed.data.water_depth_cm,
      rise_rate_cm_min: parsed.data.rise_rate_cm_min,
    }).catch((err) => console.error('[push] erro:', err))
  }

  return NextResponse.json({ ok: true, server_time: Date.now() })
}

export async function GET() {
  return NextResponse.json(
    { device: getDevice() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}