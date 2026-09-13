import { NextResponse } from 'next/server'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { floodEventManager } from '@/lib/services/flood-event-manager'
import { getFloodDetectionEngine } from '@/lib/cv/engine-factory'
import { isRequestAuthorizedAdmin } from '@/lib/auth/session'

export async function POST(request: Request) {
  if (!(await isRequestAuthorizedAdmin(request))) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Akses ditolak. Diperlukan autentikasi admin untuk trigger scan manual CCTV.' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const { cameraId, count = 1 } = body

    // 1. Determine which cameras to scan
    let targetCameras = []
    if (cameraId) {
      const found = PANTAUSEMAR_CCTV_POINTS.find(
        (c) => c.id === cameraId || c.code.toLowerCase() === cameraId.toLowerCase()
      )
      if (!found) {
        return NextResponse.json(
          { success: false, error: `Kamera ${cameraId} tidak ditemukan.` },
          { status: 404 }
        )
      }
      targetCameras = [found]
    } else {
      // Prioritize "rob_banjir" category
      const highRisk = PANTAUSEMAR_CCTV_POINTS.filter((c) => c.category === 'rob_banjir')
      targetCameras = highRisk.slice(0, Math.min(count, highRisk.length))
    }

    const engine = getFloodDetectionEngine()
    const scanResults = []

    for (const cam of targetCameras) {
      try {
        const prevObservation = floodEventManager.getObservations(cam.id, 1)[0]
        const activeEvent = floodEventManager.getActiveEventForCamera(cam.id)

        const analysis = await engine.analyzeCamera({
          id: cam.id,
          code: cam.code,
          name: cam.name,
          district: cam.district,
          streamUrl: cam.streamUrl,
          historicalObservation: prevObservation
            ? {
                water_region_score: prevObservation.water_region_score,
                status: prevObservation.status,
                consecutive_suspect_count: activeEvent ? 2 : 0,
              }
            : undefined,
        })

        const processed = await floodEventManager.processAnalysisResult(analysis)

        scanResults.push({
          camera_id: cam.id,
          camera_code: cam.code,
          camera_name: cam.name,
          cctv_status: analysis.cctv_status,
          state: analysis.state,
          flood_confidence: analysis.visual_confidence,
          estimated_visual_severity: analysis.estimated_visual_severity,
          evidence_url: analysis.evidence_url,
          event_id: processed.event?.event_id || null,
          event_status: processed.event?.status || null,
          is_new_event: processed.isNewEvent,
          processing_time_ms: analysis.processing_time_ms,
          engine_used: analysis.engine_used,
        })
      } catch (err: any) {
        console.error(`Gagal memproses CCTV ${cam.code}:`, err.message)
        floodEventManager.updateCCTVHealth(cam.id, 'ERROR')

        scanResults.push({
          camera_id: cam.id,
          camera_code: cam.code,
          camera_name: cam.name,
          cctv_status: 'ERROR',
          error: err.message,
          methodology_note:
            'Status kamera UNKNOWN karena kegagalan inferensi/stream, bukan NO_FLOOD.',
        })
      }
    }

    return NextResponse.json({
      success: true,
      engine: engine.engineName,
      scanned_count: scanResults.length,
      results: scanResults,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
