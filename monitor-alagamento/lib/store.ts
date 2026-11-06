import type { DeviceState } from './types'

// Último estado em memória. Na Vercel pode ser perdido em cold start;
// o bridge no PC reenvia a cada poucos segundos e o estado se refaz sozinho.
const g = globalThis as unknown as { __device?: DeviceState | null }

export function getDevice(): DeviceState | null {
  return g.__device ?? null
}

export function setDevice(state: DeviceState) {
  g.__device = state
}
