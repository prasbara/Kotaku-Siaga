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

    const meta = data.verification_metadata
    const isFire = meta?.actual_category === 'kebakaran' || meta?.incident_details?.incident_type === 'kebakaran'
    const reportData = {
      ...data,
      category: isFire ? 'kebakaran' : data.category,
      reporter_name: data.reporter_name || meta?.reporter_name || 'Pelapor Anonim',
      reporter_phone: data.reporter_phone || data.reporter_contact || meta?.reporter_phone || null,
      reporter_email: data.reporter_email || meta?.reporter_email || null,
      email_verified: data.email_verified ?? meta?.email_verified ?? false,
    }

    const role = await getUserRole(request)
    const sanitized = sanitizeReportForRole(reportData, role)

    return NextResponse.json({ success: true, data: sanitized })
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
      console.warn(`PATCH /api/reports/${id} Supabase error [${error.code}]: ${error.message}`)

      // Always try local store fallback on ANY Supabase error
      // (e.g., report exists in localStore but not yet synced to Supabase,
      //  or UUID format mismatch on local test IDs, or Supabase RLS/network errors)
      const localUpdated = localReportStore.update(id, updateData)
      if (localUpdated) {
        return NextResponse.json({ success: true, data: localUpdated, is_local_store: true })
      }

      // Report not found anywhere
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
      }

      // PostgreSQL invalid UUID syntax — ID format mismatch
      if (error.code === '22P02') {
        return NextResponse.json(
          { error: 'ID laporan tidak valid.', detail: 'Format ID tidak sesuai dengan basis data.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Gagal memperbarui status laporan di basis data.', detail: error.message },
        { status: 503 }
      )
    }

    // Also update local store mirror if present
    localReportStore.update(id, updateData)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('PATCH /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui laporan.' }, { status: 500 })
  }
}
