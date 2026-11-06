'use client'

import type { Alert } from '@/lib/types'
import { ALERT_LABELS, ALERT_STYLES } from '@/lib/constants'

type Props = {
  alert: Alert
  online: boolean
}

export function AlertCard({ alert, online }: Props) {
  const styles = ALERT_STYLES[alert]
  const label = ALERT_LABELS[alert]

  return (
    <div
      className={`border rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-500 ${styles.bg} ${styles.border} shadow-2xl ${styles.glow}`}
    >
      <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
        Status
      </div>

      <div
        className={`my-4 text-3xl md:text-4xl font-bold tracking-tight ${styles.text}`}
      >
        {label}
      </div>

      <div className="text-xs text-slate-400">
        {online ? 'Dispositivo online' : 'Ultimo estado conhecido'}
      </div>
    </div>
  )
}
