import { IFloodDetectionEngine, CVAnalysisResult } from './types'
import { LightweightCVEngine } from './lightweight-engine'

class NonYOLOCVEngine implements IFloodDetectionEngine {
  public engineName = 'NonYOLOCVEngine'
  private serviceUrl: string

  constructor(serviceUrl = process.env.CV_SERVICE_URL || 'http://127.0.0.1:8000') {
    this.serviceUrl = serviceUrl
  }

  public async analyzeCamera(camera: {
    id: string
    code: string
    name: string
    district: string
    streamUrl: string
  }): Promise<CVAnalysisResult> {
    const res = await fetch(`${this.serviceUrl}/infer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: camera.id,
        camera_code: camera.code,
        camera_name: camera.name,
        district: camera.district,
        stream_url: camera.streamUrl,
        save_evidence: true,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`Non-YOLO CV daemon responded with HTTP ${res.status}`)
    }

    const data = await res.json()
    return {
      camera_id: camera.id,
      camera_code: camera.code,
      camera_name: camera.name,
      district: camera.district,
      cctv_status: data.cctv_status || 'ONLINE',
      camera_health: data.camera_health || 'ONLINE',
      scene: data.scene || 'DAY',
      state: data.state || 'NORMAL',
      detection_score: data.detection_score || 0,
      visual_confidence: data.visual_confidence || 0,
      water_region_score: data.water_region_score || 0,
      road_coverage_score: data.road_coverage_score || 0,
      temporal_score: data.temporal_score || 0,
      estimated_visual_severity: data.estimated_visual_severity || 'minor',
      signals: data.signals || {
        water_area_score: 0,
        waterline_score: 0,
        texture_score: 0,
        spatial_score: 0,
        scene_score: 0,
        temporal_score: 0,
        composite_detection_score: 0,
      },
      detected_features: data.detected_features || ['Permukaan jalan normal'],
      explainability: data.explainability || {
        verdict: 'NORMAL',
        primary_factors: ['Kondisi normal'],
        suppression_factors: [],
        confidence_rationale: 'Analisis classical computer vision.',
      },
      evidence_url: data.evidence_url || null,
      debug_visual_url: data.debug_visual_url || null,
      processing_time_ms: data.processing_time_ms || 0,
      engine_used: 'NonYOLOCVEngine',
      methodology_note: data.methodology_note,
    }
  }
}

export function getFloodDetectionEngine(): IFloodDetectionEngine {
  const preferredEngine = process.env.CV_ENGINE_TYPE || 'lightweight'
  const cvUrl = process.env.CV_SERVICE_URL

  // If local or sidecar Non-YOLO CV service is configured, use it
  if (preferredEngine === 'nonyolo' && cvUrl) {
    return new NonYOLOCVEngine(cvUrl)
  }

  // Default for Vercel Serverless: 100% CPU-only LightweightCVEngine
  return new LightweightCVEngine()
}
