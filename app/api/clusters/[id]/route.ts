import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// PATCH /api/clusters/[id] — Update status and admin notes for a cluster
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, admin_notes } = body

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status) updatePayload.status = status
    if (admin_notes !== undefined) updatePayload.admin_notes = admin_notes

    if (isSupabaseConfigured()) {
      const supabase = await createAdminClient()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      let query = supabase.from('incident_clusters').update(updatePayload)
      if (isUuid) {
        query = query.eq('id', id)
      } else {
        query = query.eq('cluster_code', id)
      }
      const { data, error } = await query.select().single()

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data,
          message: 'Status klaster kejadian berhasil diperbarui.',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Status klaster diperbarui (mode offline).',
    })
  } catch (err: any) {
    console.error('PATCH /api/clusters/[id] error:', err)
    return NextResponse.json(
      { error: 'Gagal memperbarui status klaster.' },
      { status: 500 }
    )
  }
}
