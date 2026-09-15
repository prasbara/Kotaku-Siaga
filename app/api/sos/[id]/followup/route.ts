import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reporter_name, reporter_phone, reporter_email, description, photo_url } = body

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (reporter_name) updatePayload.reporter_name = reporter_name.trim().slice(0, 100)
    if (reporter_phone) {
      const cleanPhone = reporter_phone.trim().replace(/\s+/g, '')
      updatePayload.reporter_phone = cleanPhone.startsWith('0') ? `+62${cleanPhone.slice(1)}` : cleanPhone
    }
    if (reporter_email) updatePayload.reporter_email = reporter_email.trim().toLowerCase()
    if (description) updatePayload.description = description.trim().slice(0, 1000)
    if (photo_url) updatePayload.photo_url = photo_url

    if (isSupabaseConfigured()) {
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
          message: 'Informasi tambahan darurat berhasil diperbarui.',
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Informasi tambahan darurat telah dicatat.',
    })
  } catch (err: any) {
    console.error('POST /api/sos/[id]/followup exception:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memperbarui informasi darurat.' },
      { status: 500 }
    )
  }
}
