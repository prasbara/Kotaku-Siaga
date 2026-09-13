import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// PRODUCTION: citizen reports come from the real database only.
// No hardcoded citizen reports are used as fallback data.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured.' },
      { status: 503 }
    )
  }

  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reports')
      .select('*, ai_analysis(*)')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // PostgREST "no rows returned" — report genuinely not found
        return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
      }
      console.error('GET /api/reports/[id] database error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed.', detail: error.message },
        { status: 503 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil laporan.' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured.' },
      { status: 503 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['status', 'urgency', 'credibility_score', 'verification_status']
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diperbarui.' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
      }
      console.error('PATCH /api/reports/[id] database error:', error.message)
      return NextResponse.json(
        { error: 'Database update failed.', detail: error.message },
        { status: 503 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PATCH /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui laporan.' }, { status: 500 })
  }
}
