import { NextRequest, NextResponse } from 'next/server'
import { floodEventManager } from '@/lib/services/flood-event-manager'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const { data: dbObs, error } = await supabase
          .from('cctv_observations')
          .select('*')
          .or(`camera_id.eq.${cctv.id},camera_code.eq.${cctv.code}`)
          .order('timestamp', { ascending: false })
          .limit(limit)

        if (!error && dbObs && dbObs.length > 0) {
          return NextResponse.json({
            success: true,
            camera_id: cctv.id,
            camera_code: cctv.code,
            camera_name: cctv.name,
            total_observations: dbObs.length,
            data: dbObs,
            source: 'supabase',
          })
        }
      } catch (err) {
        console.warn('Supabase cctv_observations fetch fallback:', err)
      }
    }

    const observations = floodEventManager.getObservations(cctv.id, limit)

    return NextResponse.json({
      success: true,
      camera_id: cctv.id,
      camera_code: cctv.code,
      camera_name: cctv.name,
      total_observations: observations.length,
      data: observations,
      source: 'local_store',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
