'use client'

import type { Trend } from '@/lib/types'
import { TrendIndicator } from './TrendIndicator'

type Props = {
  depth: number
  trend: Trend
  riseRate: number
}

export function WaterLevelCard({ depth, trend, riseRate }: Props) {
  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col justify-between">
      <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
        Nivel da Agua
      </div>

      <div className="my-4 flex items-baseline gap-2">
        <span className="text-6xl md:text-7xl font-bold text-white tabular-nums">
          {depth.toFixed(1)}
        </span>
        <span className="text-3xl text-slate-400 font-light">cm</span>
      </div>

      <TrendIndicator trend={trend} riseRate={riseRate} />
    </div>
  )
}
