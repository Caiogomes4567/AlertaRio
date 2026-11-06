// components/HistoryChart.tsx

'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { Reading } from '@/lib/types'

type Props = {
  readings: Reading[]
}

export function HistoryChart({ readings }: Props) {
  const data = useMemo(() => {
    if (readings.length === 0) return []
    const now = Date.now()
    return readings.map((r) => ({
      t: Math.round((now - r.received_at) / 1000),
      nivel: Number(r.water_depth_cm.toFixed(2)),
    }))
  }, [readings])

  if (data.length < 2) {
    return (
      <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-4">
          Histórico
        </div>
        <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
          Aguardando mais leituras...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          Histórico
        </div>
        <div className="text-xs text-slate-500">
          Últimos {data.length} pontos
        </div>
      </div>

      <div className="h-56 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorNivel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

            <XAxis
              dataKey="t"
              reversed
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${v}s`}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${v}cm`}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={(v) => `${v}s atrás`}
              formatter={((v: any) => [`${v} cm`, 'Nível']) as any}
            />

            {/* Linhas de referência dos limites */}
            <ReferenceLine
              y={3}
              stroke="#eab308"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={7}
              stroke="#f97316"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={12}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              y={20}
              stroke="#dc2626"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
            />

            <Area
              type="monotone"
              dataKey="nivel"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#colorNivel)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-yellow-500"></span> Atenção
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-orange-500"></span> Alerta
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-500"></span> Perigo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-600"></span> Crítico
        </span>
      </div>
    </div>
  )
}