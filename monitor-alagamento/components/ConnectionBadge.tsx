'use client'

type Props = {
  online: boolean
  label: string
}

export function ConnectionBadge({ online, label }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-colors ${
        online
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-500/10 text-red-400 border border-red-500/30'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          online ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
        }`}
      />
      {label}
    </span>
  )
}
