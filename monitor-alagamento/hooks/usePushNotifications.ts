// hooks/usePushNotifications.ts

'use client'

import { useCallback, useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}
export type PushState = 'loading' | 'unsupported' | 'denied' | 'granted' | 'default'

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    setState(Notification.permission as PushState)

    // Registra o service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        // Verifica se já está inscrito
        return navigator.serviceWorker.ready
      })
      .then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
      .catch((err) => {
        console.error('[push] Erro ao registrar SW:', err)
      })
  }, [])

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    try {
      const permission = await Notification.requestPermission()
      setState(permission as PushState)
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (res.ok) {
        setSubscribed(true)
        console.log('[push] Inscrito com sucesso')
      }
    } catch (err) {
      console.error('[push] Erro ao inscrever:', err)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setSubscribed(false)
    }
  }, [])

  return { state, subscribed, subscribe, unsubscribe }
}