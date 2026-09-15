import { NextResponse } from 'next/server'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { floodEventManager } from '@/lib/services/flood-event-manager'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const district = searchParams.get('district')
    const healthParam = searchParams.get('health')
    const stateParam = searchParams.get('state')

    const healthList = floodEventManager.getAllCCTVHealth()
    const healthMap = new Map(healthList.map((h) => [h.camera_id, h]))

    let results = PANTAUSEMAR_CCTV_POINTS.map((c) => {
      const health = healthMap.get(c.id)
      const activeEvent = floodEventManager.getActiveEventForCamera(c.id)
      return {
        ...c,
        health_status: health?.status || 'ONLINE',
        detection_state: health?.current_state || 'NORMAL',
        last_confidence: health?.last_confidence || 0,
        last_seen_at: health?.last_seen_at || null,
        sampling_interval_sec: health?.sampling_interval_sec || 10,
        has_active_event: !!activeEvent,
        active_event_id: activeEvent?.event_id || null,
      }
    })

    if (category && category !== 'all') {
      results = results.filter((c) => c.category === category)
    }

    if (district && district !== 'all') {
      results = results.filter(
        (c) => c.district.toLowerCase() === district.toLowerCase()
      )
    }

    if (healthParam && healthParam !== 'all') {
      results = results.filter(
        (c) => c.health_status.toLowerCase() === healthParam.toLowerCase()
      )
    }

    if (stateParam && stateParam !== 'all') {
      results = results.filter(
        (c) => c.detection_state.toLowerCase() === stateParam.toLowerCase()
      )
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      data: results,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat CCTV' },
      { status: 500 }
    )
  }
}
