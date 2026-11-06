'use client'

export function EmptyState() {
  return (
    <div className="border-2 border-dashed border-slate-800 rounded-2xl p-16 md:p-24 text-center">
      <div className="text-5xl mb-4 opacity-40">SAT</div>
      <h2 className="text-lg font-semibold text-slate-300 mb-2">
        Aguardando primeira leitura
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        O dashboard vai atualizar automaticamente assim que a ESP32 enviar
        telemetria para o servidor.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        Conectado ao servidor, aguardando dados
      </div>
    </div>
  )
}
