import { FloodSeverity, FloodStateMachineState } from '@/types/flood-event'

export interface CameraROIConfig {
  camera_id: string
  /** Normalized polygon coordinates [[x, y], ...] in range [0..1] */
  roi_polygon?: [number, number][]
  road_region?: [number, number, number, number] // [x, y, w, h]
  water_sensitive_region?: [number, number, number, number]
}

export type CameraHealthStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'OBSTRUCTED'
export type SceneIllumination = 'DAY' | 'NIGHT' | 'RAIN' | 'LOW_LIGHT' | 'UNKNOWN'

export interface MultiSignalBreakdown {
  /** Water surface coverage percentage relative to calibrated ROI (0..1) */
  water_area_score: number
  /** Waterline elevation boundary score (0..1) */
  waterline_score: number
  /** Texture homogeneity / lack of road grain (0..1) */
  texture_score: number
  /** Spatial blob continuity and compactness (0..1) */
  spatial_score: number
  /** Scene context & lighting consistency (0..1) */
  scene_score: number
  /** Temporal consistency over sliding window (0..1) */
  temporal_score: number
  /** Composite Non-YOLO detection score before threshold gating (0..1) */
  composite_detection_score: number
}

export interface ExplainabilityReport {
  verdict: string
  primary_factors: string[]
  suppression_factors: string[]
  confidence_rationale: string
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
  signals?: MultiSignalBreakdown
  camera_health?: CameraHealthStatus
  explainability?: ExplainabilityReport
  evidence_url?: string | null
  created_at: string
}

export interface CVAnalysisResult {
  camera_id: string
  camera_code: string
  camera_name: string
  district: string
  cctv_status: 'ONLINE' | 'OFFLINE' | 'STALE' | 'ERROR' | 'UNKNOWN'
  camera_health: CameraHealthStatus
  scene: SceneIllumination
  state: FloodStateMachineState
  detection_score: number
  visual_confidence: number
  water_region_score: number
  road_coverage_score: number
  temporal_score: number
  estimated_visual_severity: FloodSeverity
  signals: MultiSignalBreakdown
  detected_features: string[]
  explainability: ExplainabilityReport
  evidence_url?: string | null
  debug_visual_url?: string | null
  processing_time_ms: number
  engine_used: 'NonYOLOCVEngine' | 'LightweightCVEngine' | 'YOLOEngine'
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
