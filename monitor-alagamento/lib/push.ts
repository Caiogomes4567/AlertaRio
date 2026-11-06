// lib/push.ts — Gerenciamento de subscriptions e envio de notificações

import webpush from 'web-push'

// Configura VAPID (só uma vez)
const pushEnabled = Boolean(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
)
if (pushEnabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

type PushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  subscribedAt: number
}

const g = globalThis as unknown as {
  __subscriptions?: Map<string, PushSubscription>
}

export const subscriptions = (g.__subscriptions ??= new Map())

export function addSubscription(sub: PushSubscription) {
  subscriptions.set(sub.endpoint, sub)
  console.log(`[push] Nova subscription. Total: ${subscriptions.size}`)
}

export function removeSubscription(endpoint: string) {
  subscriptions.delete(endpoint)
  console.log(`[push] Subscription removida. Total: ${subscriptions.size}`)
}

export function getSubscriptions(): PushSubscription[] {
  return Array.from(subscriptions.values())
}

export async function enviarNotificacao(payload: {
  title: string
  body: string
  alert: string
  water_depth_cm: number
  rise_rate_cm_min: number
}) {
  if (!pushEnabled) return { ok: 0, fail: 0, total: 0 }

  const notif = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'alagamento-alert',
    requireInteraction: payload.alert === 'critical' || payload.alert === 'danger',
    data: {
      alert: payload.alert,
      water_depth_cm: payload.water_depth_cm,
      rise_rate_cm_min: payload.rise_rate_cm_min,
      url: '/',
    },
  })

  const subs = getSubscriptions()
  console.log(`[push] Enviando para ${subs.length} subscriptions`)

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          notif
        )
        return { ok: true }
      } catch (err: any) {
        // 410/404 = subscription expirada, remove
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[push] Removendo subscription expirada`)
          removeSubscription(sub.endpoint)
        } else {
          console.error(`[push] Erro:`, err.statusCode, err.body || err.message)
        }
        throw err
      }
    })
  )

  const ok = results.filter((r) => r.status === 'fulfilled').length
  const fail = results.filter((r) => r.status === 'rejected').length
  console.log(`[push] Resultado: ${ok} ok, ${fail} falha`)

  return { ok, fail, total: subs.length }
}