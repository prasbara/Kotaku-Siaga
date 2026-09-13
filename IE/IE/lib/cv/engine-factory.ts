import { IFloodDetectionEngine, CVAnalysisResult } from './types'
import { LightweightCVEngine } from './lightweight-engine'

class YOLOEngine implements IFloodDetectionEngine {
  public engineName = 'YOLOEngine'
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
      throw new Error(`YOLO daemon responded with HTTP ${res.status}`)
    }

    const data = await res.json()
    return {
      camera_id: camera.id,
      camera_code: camera.code,
      camera_name: camera.name,
      district: camera.district,
      cctv_status: data.cctv_status || 'ONLINE',
      state: data.state || 'NORMAL',
      visual_confidence: data.flood_confidence || 0,
      water_region_score: data.flood_confidence || 0,
      road_coverage_score: data.flood_confidence * 0.8,
      temporal_score: 0.85,
      estimated_visual_severity: data.estimated_visual_severity || 'minor',
      detected_features: (data.detections || []).map((d: any) => `${d.class} (${(d.confidence * 100).toFixed(0)}%)`),
      evidence_url: data.frame_url || null,
      processing_time_ms: data.processing_time_ms || 0,
      engine_used: 'YOLOEngine',
    }
  }
}

export function getFloodDetectionEngine(): IFloodDetectionEngine {
  // Check if explicit YOLO service is requested and configured
  const preferredEngine = process.env.CV_ENGINE_TYPE || 'lightweight'
  const yoloUrl = process.env.CV_SERVICE_URL

  if (preferredEngine === 'yolo' && yoloUrl) {
    return new YOLOEngine(yoloUrl)
  }

  // Default for Vercel Serverless: 100% CPU-only LightweightCVEngine
  return new LightweightCVEngine()
}
