import { FloodSeverity, FloodStateMachineState, FloodEventStatus } from '@/types/flood-event'

export interface CameraROIConfig {
  camera_id: string
  // Normalized or pixel coordinates for polygon [[x, y], [x, y], ...]
  roi_polygon?: [number, number][]
  road_region?: [number, number, number, number] // [x, y, w, h]
  water_sensitive_region?: [number, number, number, number]
}

export interface CCTVObservationRecord {
  id: string
  camera_id: string
  camera_code: string
  timestamp: string
  visual_score: number
  water_region_score: number
  road_coverage_score: number
  temporal_score: number
  status: FloodStateMachineState
  estimated_visual_severity: FloodSeverity
  evidence_url?: string | null
  created_at: string
}

export interface CVAnalysisResult {
  camera_id: string
  camera_code: string
  camera_name: string
  district: string
  cctv_status: 'ONLINE' | 'OFFLINE' | 'STALE' | 'ERROR' | 'UNKNOWN'
  state: FloodStateMachineState
  visual_confidence: number
  water_region_score: number
  road_coverage_score: number
  temporal_score: number
  estimated_visual_severity: FloodSeverity
  detected_features: string[]
  evidence_url?: string | null
  processing_time_ms: number
  engine_used: 'LightweightCVEngine' | 'YOLOEngine'
  methodology_note?: string
}

export interface IFloodDetectionEngine {
  engineName: string
  analyzeCamera(camera: {
    id: string
    code: string
    name: string
    district: string
    streamUrl: string
    roi?: CameraROIConfig
    historicalObservation?: {
      water_region_score: number
      status: FloodStateMachineState
      consecutive_suspect_count: number
    }
  }): Promise<CVAnalysisResult>
}
