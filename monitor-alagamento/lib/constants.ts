import type { Alert, Trend } from './types'

export const ONLINE_THRESHOLD = 15
export const UNSTABLE_THRESHOLD = 45

export const ALERT_LABELS: Record<Alert, string> = {
  normal: 'NORMAL',
  attention: 'ATENCAO',
  alert: 'ALERTA',
  danger: 'PERIGO',
  critical: 'CRITICO',
  sensor_fault: 'FALHA SENSOR',
}

export const ALERT_STYLES: Record<
  Alert,
  { bg: string; border: string; text: string; glow: string }
> = {
  normal: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-700/60',
    text: 'text-emerald-300',
    glow: 'shadow-emerald-500/20',
  },
  attention: {
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-700/60',
    text: 'text-yellow-300',
    glow: 'shadow-yellow-500/20',
  },
  alert: {
    bg: 'bg-orange-950/60',
    border: 'border-orange-700/60',
    text: 'text-orange-300',
    glow: 'shadow-orange-500/20',
  },
  danger: {
    bg: 'bg-red-950/60',
    border: 'border-red-700/60',
    text: 'text-red-300',
    glow: 'shadow-red-500/20',
  },
  critical: {
    bg: 'bg-red-950',
    border: 'border-red-500',
    text: 'text-red-200',
    glow: 'shadow-red-500/40',
  },
  sensor_fault: {
    bg: 'bg-slate-800/60',
    border: 'border-slate-600',
    text: 'text-slate-300',
    glow: 'shadow-slate-500/10',
  },
}

export const TREND_LABELS: Record<Trend, { icon: string; label: string }> = {
  stable: { icon: 'S', label: 'Estavel' },
  rising: { icon: '^', label: 'Subindo' },
  rising_fast: { icon: 'A', label: 'Subindo rapidamente' },
  falling: { icon: 'v', label: 'Descendo' },
}
