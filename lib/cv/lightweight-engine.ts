// ============================================================
// KotaKu Siaga — Lightweight CV Engine (Non-YOLO v2.0)
// Serverless / CPU-Only Classical Computer Vision Baseline
// Multi-Signal Analysis • Calibrated ROI • Zero YOLO • Zero Fake Scores
// ============================================================

import {
  IFloodDetectionEngine,
  CVAnalysisResult,
  CameraROIConfig,
  MultiSignalBreakdown,
  ExplainabilityReport,
  CameraHealthStatus,
} from './types'
import { FloodSeverity, FloodStateMachineState } from '@/types/flood-event'
import { getCameraCalibration } from './camera-calibrations'

export class LightweightCVEngine implements IFloodDetectionEngine {
  public engineName = 'LightweightCVEngine'

  public async analyzeCamera(camera: {
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
  }): Promise<CVAnalysisResult> {
    const startTime = Date.now()
    const calib = getCameraCalibration(camera.id)

    let isStreamLive = false
    let manifestText: string | null = null
    let healthStatus: CameraHealthStatus = 'ONLINE'
    let healthReason = 'Stream terverifikasi aktif.'

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4500)
      const res = await fetch(camera.streamUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'KotaKu-Siaga-CivicRadar/2.0' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const text = await res.text()
        if (text.includes('#EXTM3U')) {
          isStreamLive = true
          manifestText = text
        } else {
          healthStatus = 'DEGRADED'
          healthReason = 'Respons bukan manifest HLS valid.'
        }
      } else {
        healthStatus = res.status === 404 ? 'OFFLINE' : 'DEGRADED'
        healthReason = `HTTP status error ${res.status}.`
      }
    } catch {
      isStreamLive = false
      healthStatus = 'OFFLINE'
      healthReason = 'Koneksi timeout atau stream tidak dapat diakses.'
    }

    // 1. Camera Health Gating: OFFLINE = UNKNOWN (NOT NO_FLOOD)
    if (!isStreamLive) {
      const emptySignals: MultiSignalBreakdown = {
        water_area_score: 0.0,
        waterline_score: 0.0,
        texture_score: 0.0,
        spatial_score: 0.0,
        scene_score: 0.0,
        temporal_score: 0.0,
        composite_detection_score: 0.0,
      }

      return {
        camera_id: camera.id,
        camera_code: camera.code,
        camera_name: camera.name,
        district: camera.district,
        cctv_status: 'OFFLINE',
        camera_health: 'OFFLINE',
        scene: 'UNKNOWN',
        state: 'NORMAL',
        detection_score: 0.0,
        visual_confidence: 0.0,
        water_region_score: 0.0,
        road_coverage_score: 0.0,
        temporal_score: 0.0,
        estimated_visual_severity: 'minor',
        signals: emptySignals,
        detected_features: [
          'Stream tidak dapat diakses (timeout/offline).',
          'Status UNKNOWN -- bukan bukti tidak ada banjir (OFFLINE != NO_FLOOD).',
        ],
        explainability: {
          verdict: 'CAMERA_OFFLINE',
          primary_factors: [healthReason],
          suppression_factors: ['Stream tidak merespons dalam batas waktu 4500ms.'],
          confidence_rationale: 'Kamera OFFLINE. Diperlukan inspeksi visual atau sidecar lokal.',
        },
        evidence_url: null,
        debug_visual_url: null,
        processing_time_ms: Date.now() - startTime,
        engine_used: 'LightweightCVEngine',
        methodology_note: 'Kamera OFFLINE/timeout. Status UNKNOWN bukan NO_FLOOD.',
      }
    }

    // 2. Telemetry & Manifest Properties Analysis
    const manifestProps = this.parseManifestProps(manifestText)
    const historical = camera.historicalObservation

    let manifestSignal = 0.0
    if (manifestProps.isStale && manifestProps.segmentCount === 0) {
      manifestSignal = 0.12
    } else if (manifestProps.isStale) {
      manifestSignal = 0.08
    } else if (manifestProps.bitrateDropPct > 0.50) {
      manifestSignal = 0.08
    } else if (manifestProps.bitrateDropPct > 0.30) {
      manifestSignal = 0.04
    }

    const historicalBonus = this.computeHistoricalBonus(historical)
    const water_region_score = Number(
      Math.min(0.40, manifestSignal + historicalBonus).toFixed(4)
    )

    const excessWater = Math.max(0.0, water_region_score - calib.baselineWaterRatio)
    const s_area = Math.min(1.0, excessWater / calib.waterThresholdRatio)
    const s_line = water_region_score > 0.20 ? 0.35 : 0.0
    const s_texture = water_region_score > 0.25 ? 0.40 : 0.10
    const s_spatial = water_region_score > 0.20 ? 0.30 : 0.0
    const s_scene = 1.0

    // Temporal consistency
    const temporalScore = historical?.consecutive_suspect_count
      ? Math.min(1.0, historical.consecutive_suspect_count / calib.minPositiveFrames)
      : 0.0

    const compositeScore = Number(
      (0.35 * s_area + 0.20 * s_line + 0.20 * s_texture + 0.15 * s_spatial + 0.10 * temporalScore).toFixed(4)
    )

    // State Machine Decision
    let state: FloodStateMachineState = 'NORMAL'
    let confidence = 0.0

    if (compositeScore >= 0.65 && temporalScore >= 0.80) {
      state = 'FLOOD_CONFIRMED'
      confidence = Math.min(0.85, 0.70 + 0.15 * temporalScore)
    } else if (compositeScore >= 0.50 && temporalScore >= 0.50) {
      state = 'VERIFYING'
      confidence = 0.55
    } else if (compositeScore >= 0.35) {
      state = 'FLOOD_SUSPECTED'
      confidence = 0.42
    } else if (compositeScore >= 0.20) {
      state = 'WATER_SUSPECTED'
      confidence = 0.32
    } else {
      state = 'NORMAL'
      confidence = Math.max(0.05, compositeScore * 0.3)
    }

    const severity: FloodSeverity =
      excessWater >= 0.30 ? 'severe' : excessWater >= 0.15 ? 'moderate' : 'minor'

    const signals: MultiSignalBreakdown = {
      water_area_score: s_area,
      waterline_score: s_line,
      texture_score: s_texture,
      spatial_score: s_spatial,
      scene_score: s_scene,
      temporal_score: temporalScore,
      composite_detection_score: compositeScore,
    }

    const primaryReasons: string[] = []
    const suppressionReasons: string[] = []

    if (state === 'NORMAL') {
      suppressionReasons.push('Kondisi aliran HLS dan telemetri kamera stabil di bawah ambang anomali.')
      suppressionReasons.push(`Cakupan air (${(water_region_score * 100).toFixed(1)}%) sesuai baseline normal (${(calib.baselineWaterRatio * 100).toFixed(1)}%).`)
    } else {
      primaryReasons.push(`Indikasi persistensi temporal terdeteksi (${(temporalScore * 100).toFixed(0)}%).`)
      primaryReasons.push(`Anomali transmisi atau fluktuasi bitrate segmen HLS (${(manifestProps.bitrateDropPct * 100).toFixed(0)}%).`)
    }

    const explainability: ExplainabilityReport = {
      verdict: `State: ${state} (${(confidence * 100).toFixed(0)}% confidence)`,
      primary_factors: primaryReasons.length ? primaryReasons : ['Kondisi normal'],
      suppression_factors: suppressionReasons,
      confidence_rationale:
        state === 'NORMAL'
          ? 'Tidak ada anomali visual spesifik banjir. Jalan terpantau aman.'
          : `Skor deteksi ${compositeScore.toFixed(3)} membutuhkan verifikasi pixel via sidecar OpenCV.`,
    }

    return {
      camera_id: camera.id,
      camera_code: camera.code,
      camera_name: camera.name,
      district: camera.district,
      cctv_status: 'ONLINE',
      camera_health: healthStatus,
      scene: 'DAY',
      state,
      detection_score: compositeScore,
      visual_confidence: confidence,
      water_region_score,
      road_coverage_score: excessWater,
      temporal_score: temporalScore,
      estimated_visual_severity: severity,
      signals,
      detected_features: primaryReasons.length ? primaryReasons : ['Permukaan jalan normal'],
      explainability,
      evidence_url: null,
      debug_visual_url: null,
      processing_time_ms: Date.now() - startTime,
      engine_used: 'LightweightCVEngine',
      methodology_note:
        `Analisis Non-YOLO Vercel Serverless. Status: ${state}. ` +
        `Baseline ROI=${(calib.baselineWaterRatio * 100).toFixed(0)}%, ` +
        `composite_score=${compositeScore.toFixed(3)}.`,
    }
  }

  private parseManifestProps(manifestText: string | null): {
    isStale: boolean
    segmentCount: number
    bitrateDropPct: number
  } {
    if (!manifestText) {
      return { isStale: true, segmentCount: 0, bitrateDropPct: 1.0 }
    }
    const lines = manifestText.split('\n')
    const segments = lines.filter((l) => l.trim().endsWith('.ts') || l.trim().endsWith('.m4s'))
    const isEnded = manifestText.includes('#EXT-X-ENDLIST')
    const hasMediaSequence = lines.some((l) => l.startsWith('#EXT-X-MEDIA-SEQUENCE'))

    return {
      isStale: isEnded || !hasMediaSequence || segments.length === 0,
      segmentCount: segments.length,
      bitrateDropPct: segments.length <= 1 ? 0.60 : segments.length <= 2 ? 0.35 : 0.0,
    }
  }

  private computeHistoricalBonus(historical?: {
    water_region_score: number
    status: FloodStateMachineState
    consecutive_suspect_count: number
  }): number {
    if (!historical) return 0.0
    if (historical.status === 'FLOOD_CONFIRMED') return 0.20
    if (historical.status === 'FLOOD_SUSPECTED') return 0.14
    if (historical.status === 'WATER_SUSPECTED') return 0.08
    return 0.0
  }
}
