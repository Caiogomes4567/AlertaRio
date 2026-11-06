'use client'

import type { Trend } from '@/lib/types'
import { TREND_LABELS } from '@/lib/constants'

type Props = {
  trend: Trend
  riseRate: number
}

export function TrendIndicator({ trend, riseRate }: Props) {
  const { icon, label } = TREND_LABELS[trend]
  const sign = riseRate >= 0 ? '+' : ''

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-xl text-cyan-400 font-bold">{icon}</span>
      <span className="text-slate-300">{label}</span>
      <span className="text-slate-500">
        ({sign}
        {riseRate.toFixed(1)} cm/min)
      </span>
    </div>
  )
}
