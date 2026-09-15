import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { localSosStore } from '@/lib/services/local-sos-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (isSupabaseConfigured()) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('sos_events')
        .select('*')
        .or(`id.eq.${id},sos_code.eq.${id}`)
        .single()

      if (!error && data) {
        return NextResponse.json({ success: true, data })
      }
    }

    const localData = localSosStore.getById(id)
    if (localData) {
      return NextResponse.json({ success: true, data: localData })
    }

    return NextResponse.json({ error: 'Sinyal SOS tidak ditemukan.' }, { status: 404 })
  } catch (err: any) {
    console.error('GET /api/sos/[id] error:', err)
    return NextResponse.json({ error: 'Gagal mengambil detail SOS.' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, admin_notes, reporter_name, reporter_phone, description } = body

    const now = new Date().toISOString()
    const updatePayload: Record<string, any> = {
      updated_at: now,
    }

    if (status) {
      updatePayload.status = status
      if (status === 'DISPATCHED') {
        updatePayload.dispatched_at = now
      } else if (status === 'RESOLVED') {
        updatePayload.resolved_at = now
      }
    }
    if (admin_notes) updatePayload.admin_notes = admin_notes.trim()
    if (reporter_name) updatePayload.reporter_name = reporter_name.trim()
    if (reporter_phone) updatePayload.reporter_phone = reporter_phone.trim()
    if (description) updatePayload.description = description.trim()

    let updatedResult = localSosStore.update(id, updatePayload)

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
          .from('sos_events')
          .update(updatePayload)
          .or(`id.eq.${id},sos_code.eq.${id}`)
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json({
            success: true,
            data,
            message: 'Status SOS berhasil diperbarui.',
          })
        }
      } catch (dbErr) {
        console.warn('Supabase SOS PATCH error:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedResult,
      message: 'Status SOS telah diperbarui.',
    })
  } catch (err: any) {
    console.error('PATCH /api/sos/[id] error:', err)
    return NextResponse.json({ error: 'Gagal memperbarui status SOS.' }, { status: 500 })
  }
}
