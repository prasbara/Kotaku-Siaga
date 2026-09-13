export type FloodSeverity = 'minor' | 'moderate' | 'severe'

export type FloodEventStatus = 'suspected' | 'confirmed' | 'resolved'

export type ConfidenceCategory = 'LOW' | 'MEDIUM' | 'HIGH'

export type CCTVHealthState = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'STALE' | 'UNKNOWN'

export type FloodStateMachineState =
  | 'NORMAL'
  | 'WATER_SUSPECTED'
  | 'FLOOD_SUSPECTED'
  | 'FLOOD_CONFIRMED'
  | 'FLOOD_RESOLVED'

export interface BoundingBox {
  x: number // normalized 0-1 or pixel
  y: number
  width: number
  height: number
}

export interface YOLODetectionItem {
  class: 'normal_road' | 'standing_water' | 'flooded_road' | 'deep_flood' | 'vehicle_in_water' | 'person_in_water' | (string & {})
  confidence: number
  bbox: [number, number, number, number] // [x, y, w, h]
}

export interface RawInferenceOutput {
  camera_id: string
  camera_name?: string
  timestamp: string
  detections: YOLODetectionItem[]
  flood_confidence: number
  state: FloodStateMachineState
  estimated_visual_severity: FloodSeverity
  frame_url?: string
  processing_time_ms: number
  cctv_status: CCTVHealthState
}

export interface EventTimelineItem {
  timestamp: string
  time_wib: string
  message: string
  state: FloodStateMachineState
  confidence?: number
  severity?: FloodSeverity
  corroboration_notes?: string
}

export interface FloodEvent {
  id: string
  event_id: string // e.g. "SMG-FLD-2026-000123"
  camera_id: string
  camera_code: string
  camera_name: string
  district_name: string
  address?: string
  stream_url: string
  latitude: number
  longitude: number
  started_at: string
  resolved_at: string | null
  status: FloodEventStatus
  state: FloodStateMachineState
  severity: FloodSeverity
  estimated_visual_severity: FloodSeverity
  model_confidence: number // 0 - 1
  event_confidence: number // 0 - 1
  confidence_category: ConfidenceCategory
  corroboration_score: number
  
  // Correlations
  citizen_corroboration: boolean
  citizen_reports_count: number
  weather_corroboration: 'true' | 'false' | 'unknown'
  weather_condition_notes?: string
  nearby_cctv_corroboration: boolean
  nearby_cctv_count: number
  
  // Evidence
  evidence_url: string | null
  timeline: EventTimelineItem[]
  
  created_at: string
  updated_at: string
}

export interface CCTVHealthInfo {
  camera_id: string
  camera_code: string
  camera_name: string
  district: string
  status: CCTVHealthState
  last_seen_at: string | null
  last_frame_url?: string
  consecutive_errors: number
  sampling_interval_sec: number
  current_state: FloodStateMachineState
  last_confidence: number
}
