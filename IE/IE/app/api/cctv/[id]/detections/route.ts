import { NextResponse } from 'next/server'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { floodEventManager } from '@/lib/services/flood-event-manager'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cctv = PANTAUSEMAR_CCTV_POINTS.find(
      (c) => c.id === id || c.code.toLowerCase() === id.toLowerCase()
    )

    if (!cctv) {
      return NextResponse.json(
        { success: false, error: 'Kamera tidak ditemukan' },
        { status: 404 }
      )
    }

    const activeEvent = floodEventManager.getActiveEventForCamera(cctv.id)
    const allEventsForCam = floodEventManager
      .getAllEvents()
      .filter((e) => e.camera_id === cctv.id)

    return NextResponse.json({
      success: true,
      data: {
        camera_id: cctv.id,
        camera_code: cctv.code,
        active_event: activeEvent,
        historical_events: allEventsForCam,
        timeline: activeEvent ? activeEvent.timeline : [],
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
