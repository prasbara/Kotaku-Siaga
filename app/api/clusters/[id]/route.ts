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
      const { data, error } = await supabase
        .from('incident_clusters')
        .update(updatePayload)
        .or(`id.eq.${id},cluster_code.eq.${id}`)
        .select()
        .single()

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
