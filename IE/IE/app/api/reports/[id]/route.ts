import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { findFallbackReport } from '@/lib/data/reports'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')

    if (!isDummySupabase) {
      try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
          .from('reports')
          .select('*, ai_analysis(*)')
          .eq('id', id)
          .single()

        if (!error && data) {
          return NextResponse.json({ success: true, data })
        }
      } catch (dbErr) {
        console.warn('Supabase query failed in /api/reports/[id]:', dbErr)
      }
    }

    const fallback = findFallbackReport(id)
    if (fallback) {
      return NextResponse.json({ success: true, data: fallback, is_fallback: true })
    }

    return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil laporan.' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')

    if (!isDummySupabase) {
      try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
          .from('reports')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json({ success: true, data })
        }
      } catch (dbErr) {
        console.warn('Supabase update failed, updating local repository:', dbErr)
      }
    }

    const report = findFallbackReport(id)
    if (report) {
      Object.assign(report, updateData, { updated_at: new Date().toISOString() })
      return NextResponse.json({ success: true, data: report })
    }
    const updated = { id, ...updateData, updated_at: new Date().toISOString() }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui laporan.' }, { status: 500 })
  }
}
