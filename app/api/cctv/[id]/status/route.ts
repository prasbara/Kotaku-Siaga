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

    const health = floodEventManager
      .getAllCCTVHealth()
      .find((h) => h.camera_id === cctv.id)

    return NextResponse.json({
      success: true,
      data: {
        camera_id: cctv.id,
        camera_code: cctv.code,
        name: cctv.name,
        status: health?.status || 'ONLINE',
        detection_state: health?.current_state || 'NORMAL',
        last_seen_at: health?.last_seen_at || new Date().toISOString(),
        consecutive_errors: health?.consecutive_errors || 0,
        sampling_interval_sec: health?.sampling_interval_sec || 10,
        last_confidence: health?.last_confidence || 0,
        last_frame_url: health?.last_frame_url || null,
        methodology_note:
          health?.status === 'OFFLINE' || health?.status === 'STALE'
            ? 'Status kamera UNKNOWN (offline/stale), bukan NO_FLOOD.'
            : 'Kamera aktif memonitor visual jalan.',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
