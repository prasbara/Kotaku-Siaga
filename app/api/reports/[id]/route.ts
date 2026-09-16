import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { isRequestAuthorizedAdmin } from '@/lib/auth/session'
import { localReportStore } from '@/lib/services/local-report-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    const report = localReportStore.getById(id)
    if (!report) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
    }
    return NextResponse.json({ success: true, data: report, is_local_store: true })
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
  if (!(await isRequestAuthorizedAdmin(request))) {
    return NextResponse.json(
      { error: 'Unauthorized: Diperlukan autentikasi administrator untuk memperbarui status laporan.' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()

    const allowedFields = ['status', 'urgency', 'credibility_score', 'verification_status', 'title', 'description']
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diperbarui.' }, { status: 400 })
    }

    // Local Testing: If Supabase is not configured, update local file store
    if (!isSupabaseConfigured()) {
      const updated = localReportStore.update(id, updateData)
      if (!updated) {
        return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: updated, is_local_store: true })
    }

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // If not in Supabase, check local report store
      const localUpdated = localReportStore.update(id, updateData)
      if (localUpdated) {
        return NextResponse.json({ success: true, data: localUpdated, is_local_store: true })
      }

      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
      }
      console.error('PATCH /api/reports/[id] database error:', error.message)
      return NextResponse.json(
        { error: 'Database update failed.', detail: error.message },
        { status: 503 }
      )
    }

    // Also update local store if present
    localReportStore.update(id, updateData)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PATCH /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui laporan.' }, { status: 500 })
  }
}
