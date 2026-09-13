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
        { success: false, error: `Kamera CCTV ${id} tidak ditemukan.` },
        { status: 404 }
      )
    }

    const health = floodEventManager
      .getAllCCTVHealth()
      .find((h) => h.camera_id === cctv.id)
    const activeEvent = floodEventManager.getActiveEventForCamera(cctv.id)

    return NextResponse.json({
      success: true,
      data: {
        ...cctv,
        health: health || {
          status: 'ONLINE',
          current_state: 'NORMAL',
          last_confidence: 0,
          sampling_interval_sec: 10,
        },
        active_event: activeEvent,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
