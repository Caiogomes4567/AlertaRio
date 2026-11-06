export type Alert =
  | 'normal'
  | 'attention'
  | 'alert'
  | 'danger'
  | 'critical'
  | 'sensor_fault'

export type Trend = 'stable' | 'rising' | 'rising_fast' | 'falling'

export type DeviceState = {
  distance_cm: number
  water_depth_cm: number
  rise_rate_cm_min: number
  alert: Alert
  trend: Trend
  sensor_ok: boolean
  wifi_rssi: number
  firmware_version: string
  last_seen_at: number
}
export type Reading = {
  id: number
  water_depth_cm: number
  distance_cm: number
  rise_rate_cm_min: number
  alert: Alert
  trend: Trend
  received_at: number
}

export type AlertEvent = {
  id: number
  previous_alert: Alert | null
  new_alert: Alert
  water_depth_cm: number
  rise_rate_cm_min: number
  created_at: number
}