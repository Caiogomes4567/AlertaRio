'use client'

import { ConnectionBadge } from './ConnectionBadge'

type Props = {
  online: boolean
  connectionLabel: string
}

export function DashboardHeader({ online, connectionLabel }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-5 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
          W
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Monitor de Alagamento
          </h1>
          <p className="text-xs text-slate-500">
            Sistema de monitoramento em tempo real
          </p>
        </div>
      </div>

      <ConnectionBadge online={online} label={connectionLabel} />
    </header>
  )
}
