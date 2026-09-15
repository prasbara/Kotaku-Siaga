import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { localSosStore } from '@/lib/services/local-sos-store'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reporter_name, reporter_phone, reporter_email, description, photo_url, status, admin_notes } = body

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
    if (reporter_name) updatePayload.reporter_name = reporter_name.trim().slice(0, 100)
    if (reporter_phone) {
      const cleanPhone = reporter_phone.trim().replace(/\s+/g, '')
      updatePayload.reporter_phone = cleanPhone.startsWith('0') ? `+62${cleanPhone.slice(1)}` : cleanPhone
    }
    if (reporter_email) updatePayload.reporter_email = reporter_email.trim().toLowerCase()
    if (description) updatePayload.description = description.trim().slice(0, 1000)
    if (photo_url) updatePayload.photo_url = photo_url

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
            message: 'Status dan informasi darurat SOS berhasil diperbarui.',
          })
        }
      } catch (dbErr) {
        console.warn('Supabase SOS followup update error:', dbErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedResult,
      message: 'Status dan informasi darurat SOS telah diperbarui.',
    })
  } catch (err: any) {
    console.error('POST /api/sos/[id]/followup exception:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memperbarui informasi darurat.' },
      { status: 500 }
    )
  }
}
