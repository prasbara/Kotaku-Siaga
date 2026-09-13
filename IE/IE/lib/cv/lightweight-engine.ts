// ============================================================
// KotaKu Siaga -- Lightweight CV Engine (REWORKED v2)
// CRITICAL FIX: No hardcoded scores, no fake detections
// Separates: object_detection | water_evidence | flood_event_confidence
// CPU-Only . Vercel-Compatible . No Telegram . No Fake Scores
// ============================================================

import {
  IFloodDetectionEngine,
  CVAnalysisResult,
  CameraROIConfig,
} from './types'
import { FloodSeverity, FloodStateMachineState } from '@/types/flood-event'

interface WaterEvidenceDetail {
  available: boolean
  water_region_score: number
  road_coverage: number
  spatial_continuity: number
  boundary_score: number
  color_confidence: number
  negative_evidence: {
    road_clearly_visible: boolean
    normal_traffic_flow: boolean
    no_persistent_region: boolean
  }
  explanation: string[]
}

interface AnalysisDetail {
  water_evidence: WaterEvidenceDetail
  has_flood_specific_evidence: boolean
  visual_confidence: number
  detected_features: string[]
}

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

    let isStreamLive = false
    let manifestText: string | null = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4500)
      const res = await fetch(camera.streamUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'KotaKu-Siaga-CivicRadar/1.1' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const text = await res.text()
        if (text.includes('#EXTM3U')) {
          isStreamLive = true
          manifestText = text
        }
      }
    } catch {
      isStreamLive = false
    }

    // METHODOLOGICAL RULE: OFFLINE = UNKNOWN (NOT NO_FLOOD)
    if (!isStreamLive) {
      return {
        camera_id: camera.id,
        camera_code: camera.code,
        camera_name: camera.name,
        district: camera.district,
        cctv_status: 'OFFLINE',
        state: 'NORMAL',
        visual_confidence: 0,
        water_region_score: 0,
        road_coverage_score: 0,
        temporal_score: 0,
        estimated_visual_severity: 'minor',
        detected_features: [
          'Stream tidak dapat diakses (timeout/error).',
          'UNKNOWN -- bukan bukti tidak ada banjir (OFFLINE != NO_FLOOD).',
        ],
        evidence_url: null,
        processing_time_ms: Date.now() - startTime,
        engine_used: 'LightweightCVEngine',
        methodology_note: 'Kamera OFFLINE/timeout. Status UNKNOWN bukan NO_FLOOD.',
      }
    }

    const detail = this.analyzeWaterEvidence(camera, manifestText)

    // GATE 1: Is there flood-specific visual evidence?
    if (!detail.has_flood_specific_evidence) {
      return {
        camera_id: camera.id,
        camera_code: camera.code,
        camera_name: camera.name,
        district: camera.district,
        cctv_status: 'ONLINE',
        state: 'NORMAL',
        visual_confidence: 0,
        water_region_score: detail.water_evidence.water_region_score,
        road_coverage_score: 0,
        temporal_score: 0,
        estimated_visual_severity: 'minor',
        detected_features: detail.detected_features,
        evidence_url: null,
        processing_time_ms: Date.now() - startTime,
        engine_used: 'LightweightCVEngine',
        methodology_note:
          'Tidak ada flood-specific visual evidence. ' +
          'Kendaraan/orang TIDAK digunakan sebagai bukti banjir. ' +
          'Laporan warga dan cuaca memerlukan verifikasi lapangan independen.',
      }
    }

    const { state, visualConf } = this.computeStateMachine(
      detail.water_evidence,
      camera.historicalObservation
    )
    const severity = this.computeSeverity(detail.water_evidence)
    const temporalScore = this.computeTemporalScore(camera.historicalObservation)

    return {
      camera_id: camera.id,
      camera_code: camera.code,
      camera_name: camera.name,
      district: camera.district,
      cctv_status: 'ONLINE',
      state,
      visual_confidence: visualConf,
      water_region_score: detail.water_evidence.water_region_score,
      road_coverage_score: detail.water_evidence.road_coverage,
      temporal_score: temporalScore,
      estimated_visual_severity: severity === 'unknown' ? 'minor' : severity,
      detected_features: detail.detected_features,
      evidence_url: null,
      processing_time_ms: Date.now() - startTime,
      engine_used: 'LightweightCVEngine',
      methodology_note:
        `Analisis metadata HLS stream. Status: ${state}. ` +
        `water_region_score=${detail.water_evidence.water_region_score.toFixed(3)}, ` +
        `road_coverage=${detail.water_evidence.road_coverage.toFixed(3)}. ` +
        'Untuk deteksi pixel-level, diperlukan Python CV sidecar.',
    }
  }

  private analyzeWaterEvidence(
    camera: {
      id: string
      historicalObservation?: {
        water_region_score: number
        status: FloodStateMachineState
        consecutive_suspect_count: number
      }
    },
    manifestText: string | null
  ): AnalysisDetail {
    const manifestProps = this.parseManifestProps(manifestText)
    const historical = camera.historicalObservation

    // NO SCORES HARDCODED PER CAMERA ID. NO RANDOM VALUES.
    let manifestWaterSignal = 0
    if (manifestProps.isStale && manifestProps.segmentCount === 0) {
      manifestWaterSignal = 0.10
    } else if (manifestProps.isStale) {
      manifestWaterSignal = 0.08
    } else if (manifestProps.bitrateDropPct > 0.50) {
      manifestWaterSignal = 0.08
    } else if (manifestProps.bitrateDropPct > 0.30) {
      manifestWaterSignal = 0.04
    }

    const historicalBonus = this.computeHistoricalBonus(historical)
    const water_region_score = Number(
      Math.min(0.35, manifestWaterSignal + historicalBonus).toFixed(4)
    )

    // Negative evidence
    const road_clearly_visible = !manifestProps.isStale && manifestWaterSignal < 0.05
    const normal_traffic_flow = !manifestProps.isStale
    const no_persistent_region = !historical || historical.water_region_score < 0.20

    // HIERARCHICAL GATE: must cross threshold AND have historical persistence
    const hasFloodSpecificEvidence =
      water_region_score >= 0.20 &&
      !road_clearly_visible &&
      historicalBonus > 0

    const road_coverage = hasFloodSpecificEvidence
      ? Number((water_region_score * 0.65).toFixed(4))
      : 0

    const explanation: string[] = []
    if (!hasFloodSpecificEvidence) {
      explanation.push('NO_FLOOD_SPECIFIC_VISUAL_EVIDENCE')
      explanation.push(
        'Engine berbasis metadata HLS. Flood confidence = 0. ' +
          'Diperlukan Python CV sidecar untuk deteksi pixel-level.'
      )
      if (road_clearly_visible)
        explanation.push('Manifest sehat -- jalan kemungkinan normal')
      if (normal_traffic_flow)
        explanation.push('Stream aktif -- kamera tidak terhalang air')
    } else {
      explanation.push(
        `Anomali manifest: stale=${manifestProps.isStale}, ` +
          `bitrate_drop=${(manifestProps.bitrateDropPct * 100).toFixed(0)}%`
      )
      if (historicalBonus > 0)
        explanation.push(
          `Persistensi historis: ${historical!.consecutive_suspect_count} observasi, ` +
            `water_region_score=${historical!.water_region_score.toFixed(3)}`
        )
      explanation.push('CANDIDATE EVIDENCE berbasis metadata, bukan deteksi pixel nyata.')
    }

    return {
      water_evidence: {
        available: water_region_score > 0,
        water_region_score,
        road_coverage,
        spatial_continuity: hasFloodSpecificEvidence ? 0.3 : 0,
        boundary_score: 0,
        color_confidence: 0,
        negative_evidence: {
          road_clearly_visible,
          normal_traffic_flow,
          no_persistent_region,
        },
        explanation,
      },
      has_flood_specific_evidence: hasFloodSpecificEvidence,
      visual_confidence: hasFloodSpecificEvidence
        ? Number(Math.min(0.45, water_region_score * 0.80).toFixed(4))
        : 0,
      detected_features: explanation,
    }
  }

  private parseManifestProps(manifest: string | null): {
    isStale: boolean
    bitrateDropPct: number
    segmentCount: number
  } {
    if (!manifest) return { isStale: true, bitrateDropPct: 0, segmentCount: 0 }

    const lines = manifest.split('\n').map((l) => l.trim())
    let segmentCount = 0
    let totalDuration = 0
    let lastSegmentTs: number | null = null

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const m = lines[i].match(/#EXTINF:([\d.]+)/)
        if (m) { totalDuration += parseFloat(m[1]); segmentCount++ }
      }
      if (lines[i].startsWith('#EXT-X-PROGRAM-DATE-TIME:')) {
        const dtStr = lines[i].replace('#EXT-X-PROGRAM-DATE-TIME:', '')
        try { lastSegmentTs = new Date(dtStr).getTime() } catch { /* ignore */ }
      }
    }

    const ageMs = lastSegmentTs ? Date.now() - lastSegmentTs : 0
    const isStale = segmentCount === 0 || (lastSegmentTs !== null && ageMs > 60000)
    const expectedSegments = totalDuration > 0 ? Math.ceil(totalDuration / 10) : 0
    const bitrateDropPct =
      expectedSegments > 0
        ? Number(Math.max(0, 1 - segmentCount / expectedSegments).toFixed(4))
        : 0

    return { isStale, bitrateDropPct, segmentCount }
  }

  private computeHistoricalBonus(
    historical?: {
      water_region_score: number
      status: FloodStateMachineState
      consecutive_suspect_count: number
    }
  ): number {
    if (!historical) return 0
    if (historical.water_region_score < 0.20) return 0
    const frames = Math.min(historical.consecutive_suspect_count, 6)
    return Number((frames * 0.03 + historical.water_region_score * 0.12).toFixed(4))
  }

  private computeTemporalScore(
    historical?: {
      water_region_score: number
      status: FloodStateMachineState
      consecutive_suspect_count: number
    }
  ): number {
    if (!historical || historical.consecutive_suspect_count === 0) return 0
    return Number(Math.min(0.90, historical.consecutive_suspect_count * 0.15).toFixed(4))
  }

  private computeStateMachine(
    evidence: WaterEvidenceDetail,
    historical?: {
      water_region_score: number
      status: FloodStateMachineState
      consecutive_suspect_count: number
    }
  ): { state: FloodStateMachineState; visualConf: number } {
    const wrs = evidence.water_region_score
    const count = historical?.consecutive_suspect_count ?? 0

    let state: FloodStateMachineState = 'WATER_SUSPECTED'
    if (wrs >= 0.32 && count >= 5) {
      state = 'FLOOD_CONFIRMED'
    } else if (wrs >= 0.25 && count >= 3) {
      state = 'FLOOD_SUSPECTED'
    }

    const visualConf = Number(Math.min(0.70, wrs * 0.55 + count * 0.04).toFixed(4))
    return { state, visualConf }
  }

  private computeSeverity(evidence: WaterEvidenceDetail): FloodSeverity | 'unknown' {
    if (!evidence.available || evidence.road_coverage === 0) return 'unknown'
    if (evidence.road_coverage >= 0.50) return 'severe'
    if (evidence.road_coverage >= 0.25) return 'moderate'
    if (evidence.road_coverage >= 0.05) return 'minor'
    return 'unknown'
  }
}
