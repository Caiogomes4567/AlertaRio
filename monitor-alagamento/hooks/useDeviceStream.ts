'use client'

import { useEffect, useState } from 'react'
import type { DeviceState } from '@/lib/types'

// Na Vercel não há conexão aberta (SSE), então o painel consulta a API a cada poucos segundos.
export function useDeviceStream(intervalMs = 3000) {
  const [device, setDevice] = useState<DeviceState | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const res = await fetch('/api/telemetry', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!alive) return
        if (data.device) setDevice(data.device)
        setConnected(true)
      } catch {
        if (alive) setConnected(false)
      }
    }

    load()
    const t = setInterval(load, intervalMs)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [intervalMs])

  return { device, connected }
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
