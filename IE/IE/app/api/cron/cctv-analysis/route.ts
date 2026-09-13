import { NextRequest, NextResponse } from 'next/server'
import { getFloodDetectionEngine } from '@/lib/cv/engine-factory'
import { floodEventManager } from '@/lib/services/flood-event-manager'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // Serverless execution timeout buffer

export async function GET(request: NextRequest) {
  return handleCron(request)
}

export async function POST(request: NextRequest) {
  return handleCron(request)
}

async function handleCron(request: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)

  // 1. Authorization: Verify CRON_SECRET (Section 21 & 23)
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const querySecret = searchParams.get('secret')

  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET' },
        { status: 401 }
      )
    }
  }

  // 2. Select priority batch (Section 10 Batch Processing)
  const limitParam = parseInt(searchParams.get('limit') || '6', 10)
  const batchSize = Math.max(1, Math.min(limitParam, 12)) // Max 12 to guarantee sub-5s response
  const targetCameras = floodEventManager.selectBatchForAnalysis(batchSize)

  // 3. Obtain CPU-only Vercel-compatible Engine
  const engine = getFloodDetectionEngine()
  const results = []

  for (const cam of targetCameras) {
    try {
      const activeEvent = floodEventManager.getActiveEventForCamera(cam.id)
      const prevObservation = floodEventManager.getObservations(cam.id, 1)[0]

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

      results.push({
        camera_id: cam.id,
        camera_code: cam.code,
        camera_name: cam.name,
        cctv_status: analysis.cctv_status,
        state: analysis.state,
        visual_confidence: analysis.visual_confidence,
        water_region_score: analysis.water_region_score,
        road_coverage_score: analysis.road_coverage_score,
        estimated_visual_severity: analysis.estimated_visual_severity,
        event_id: processed.event?.event_id || null,
        event_status: processed.event?.status || null,
        is_new_event: processed.isNewEvent,
        processing_time_ms: analysis.processing_time_ms,
      })
    } catch (err: any) {
      console.error(`Gagal menganalisis kamera ${cam.code}:`, err.message)
      floodEventManager.updateCCTVHealth(cam.id, 'ERROR')
      results.push({
        camera_id: cam.id,
        camera_code: cam.code,
        camera_name: cam.name,
        cctv_status: 'ERROR',
        error: err.message,
        methodology_note: 'Status kamera UNKNOWN karena kegagalan pemrosesan.',
      })
    }
  }

  const durationMs = Date.now() - startTime

  return NextResponse.json({
    success: true,
    engine: engine.engineName,
    execution_time_ms: durationMs,
    batch_size: results.length,
    results,
  })
}
