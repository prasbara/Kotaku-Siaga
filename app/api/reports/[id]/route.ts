import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { isRequestAuthorizedAdmin, getUserRole, sanitizeReportForRole } from '@/lib/auth/session'
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

    const isCameraVerified = meta?.verification_method === 'camera_liveness' || Boolean(meta?.verification_photo_url)
    const isOtpVerified = Boolean(data.email_verified || meta?.email_verified)
    const verificationMethod = meta?.verification_method || (isCameraVerified ? 'camera_liveness' : isOtpVerified ? 'otp' : 'none')
    const verificationStatus = data.verification_status || meta?.verification_status || (isCameraVerified || isOtpVerified ? 'verified' : 'pending')

    const assignedAgency =
      data.assigned_agency ||
      meta?.assigned_agency ||
      (isFire || data.category === 'kebakaran'
        ? 'Dinas Pemadam Kebakaran (Damkar)'
        : data.category === 'pohon_tumbang'
        ? 'Dinas Lingkungan Hidup (DLH)'
        : ['banjir', 'genangan', 'rob'].includes(data.category)
        ? 'BPBD & DPU Kota Semarang'
        : 'BPBD Kota Semarang')

    const reportData = {
      ...data,
      category: isFire ? 'kebakaran' : data.category,
      reporter_name: data.reporter_name || meta?.reporter_name || 'Pelapor Anonim',
      reporter_phone: data.reporter_phone || data.reporter_contact || meta?.reporter_phone || null,
      reporter_email: data.reporter_email || meta?.reporter_email || null,
      email_verified: data.email_verified ?? meta?.email_verified ?? false,
      verification_method: verificationMethod,
      verification_status: verificationStatus,
      verification_photo_url: meta?.verification_photo_url || null,
      verification_timestamp: meta?.verification_timestamp || data.created_at,
      liveness_score: meta?.liveness_score ?? null,
      spoof_risk: meta?.spoof_risk ?? null,
      quality_score: meta?.quality_score ?? null,
      assigned_agency: assignedAgency,
      disposition_action:
        meta?.disposition_action ||
        (data.status === 'submitted'
          ? 'Menunggu tindak lanjut posko'
          : data.status === 'verified'
          ? 'Telah diverifikasi posko'
          : data.status === 'in_progress'
          ? 'Petugas ditugaskan ke lokasi'
          : data.status === 'resolved'
          ? 'Penanganan selesai di lapangan'
          : data.status === 'under_review'
          ? 'Dalam peninjauan posko'
          : 'Laporan ditolak'),
      validity_breakdown: meta?.validity_breakdown || null,
    }

    const role = await getUserRole(request)
    const sanitized = sanitizeReportForRole(reportData, role)

    return NextResponse.json({ success: true, data: sanitized })
  } catch (error) {
    console.error('GET /api/reports/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil laporan.' }, { status: 500 })
  }
}

const VALID_STATUSES = [
  'submitted',
  'under_review',
  'verified',
  'investigating',
  'in_progress',
  'resolved',
  'rejected',
  'suspicious',
  'duplicate',
]

const VALID_VERIFICATION_STATUSES = [
  'pending',
  'submitted',
  'under_review',
  'verified',
  'rejected',
  'failed',
  'suspicious',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()

  if (!(await isRequestAuthorizedAdmin(request))) {
    return NextResponse.json(
      {
        error: 'Sesi kedaluwarsa atau tidak memiliki izin administrator.',
        detail: 'Diperlukan autentikasi administrator untuk memperbarui status laporan.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json(
        { error: 'ID laporan tidak valid.', code: 'INVALID_ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const allowedFields = ['status', 'urgency', 'credibility_score', 'verification_status', 'title', 'description']
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada field yang diperbarui.', code: 'NO_FIELDS' },
        { status: 400 }
      )
    }

    // Validate verification_status if provided
    if (updateData.verification_status !== undefined) {
      const verStatusStr = String(updateData.verification_status).toLowerCase().trim()
      if (!VALID_VERIFICATION_STATUSES.includes(verStatusStr)) {
        return NextResponse.json(
          {
            error: `Status verifikasi tidak valid: "${updateData.verification_status}".`,
            detail: `Status verifikasi yang diizinkan: ${VALID_VERIFICATION_STATUSES.join(', ')}`,
            code: 'INVALID_VERIFICATION_STATUS',
          },
          { status: 400 }
        )
      }
      updateData.verification_status = verStatusStr

      // If status not explicitly provided, synchronize status
      if (updateData.status === undefined) {
        if (verStatusStr === 'verified') updateData.status = 'verified'
        else if (verStatusStr === 'rejected') updateData.status = 'rejected'
        else if (verStatusStr === 'under_review') updateData.status = 'under_review'
      }
    }

    // Validate status if provided
    if (updateData.status !== undefined) {
      const statusStr = String(updateData.status).toLowerCase().trim()
      if (!VALID_STATUSES.includes(statusStr)) {
        return NextResponse.json(
          {
            error: `Status laporan tidak valid: "${updateData.status}".`,
            detail: `Status yang diizinkan: ${VALID_STATUSES.join(', ')}`,
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        )
      }
      updateData.status = statusStr

      // Automatically synchronize verification status
      if (statusStr === 'verified' && updateData.verification_status === undefined) {
        updateData.verification_status = 'verified'
      } else if (statusStr === 'rejected' && updateData.verification_status === undefined) {
        updateData.verification_status = 'rejected'
      } else if (statusStr === 'under_review' && updateData.verification_status === undefined) {
        updateData.verification_status = 'under_review'
      } else if (statusStr === 'submitted' && updateData.verification_status === undefined) {
        updateData.verification_status = 'pending'
      }
    }

    updateData.updated_at = new Date().toISOString()
    const sanitizedId = id.length > 8 ? `${id.slice(0, 8)}...` : id
    const actionName = (updateData.status as string) || 'data_update'

    // Local Testing: If Supabase is not configured, update local file store
    if (!isSupabaseConfigured()) {
      const updated = localReportStore.update(id, updateData)
      if (!updated) {
        return NextResponse.json(
          { error: 'Laporan tidak ditemukan di penyimpanan lokal.', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: updated, is_local_store: true })
    }

    const supabase = await createAdminClient()

    // Helper: detect transient database network or timeout errors
    const isTransientError = (err: any) => {
      if (!err) return false
      const msg = (err.message || '').toLowerCase()
      const code = String(err.code || '')
      return (
        code === '57014' || // query_canceled
        code === '08006' || // connection_failure
        code === '08001' || // sqlclient_unable_to_establish_sqlconnection
        msg.includes('timeout') ||
        msg.includes('fetch failed') ||
        msg.includes('socket hang up') ||
        msg.includes('connection terminated') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504')
      )
    }

    let result = null
    let lastError = null

    // Safe retry loop (2 attempts with 250ms backoff for transient issues)
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (!res.error && res.data) {
        result = res
        break
      }

      lastError = res.error
      if (attempt < 2 && isTransientError(res.error)) {
        console.warn(`[REPORT_STATUS_UPDATE] Retrying after transient DB error [attempt ${attempt}]: ${res.error?.message || 'unknown'}`)
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }

    if (lastError || !result) {
      console.error(
        `[REPORT_STATUS_UPDATE_ERROR] ReportId=${sanitizedId} Action=${actionName} Code=${lastError?.code}: ${lastError?.message}`
      )

      // Always try local store fallback on ANY Supabase error
      const localUpdated = localReportStore.update(id, updateData)
      if (localUpdated) {
        console.log(`[REPORT_STATUS_UPDATE] Fallback to local store succeeded for ReportId=${sanitizedId}`)
        return NextResponse.json({ success: true, data: localUpdated, is_local_store: true })
      }

      // Check if report exists in database
      if (lastError?.code === 'PGRST116') {
        const { data: existing } = await supabase.from('reports').select('id').eq('id', id).maybeSingle()
        if (!existing) {
          return NextResponse.json(
            { error: 'Laporan tidak ditemukan di basis data.', code: 'NOT_FOUND' },
            { status: 404 }
          )
        }
        return NextResponse.json(
          { error: 'Pembaruan tidak dapat diterapkan. Status laporan mungkin telah diubah oleh operator lain.', code: 'CONFLICT' },
          { status: 409 }
        )
      }

      // PostgreSQL invalid UUID syntax — ID format mismatch
      if (lastError?.code === '22P02') {
        return NextResponse.json(
          {
            error: 'Format ID laporan tidak valid.',
            detail: 'ID laporan harus berupa UUID yang sesuai dengan basis data.',
            code: 'INVALID_ID',
          },
          { status: 400 }
        )
      }

      // Check constraint violation (e.g. status constraint or check condition)
      if (lastError?.code === '23514') {
        return NextResponse.json(
          {
            error: 'Nilai pembaruan melanggar batasan integritas basis data.',
            detail: lastError.message,
            code: 'CONSTRAINT_VIOLATION',
          },
          { status: 400 }
        )
      }

      // Permission denied
      if (lastError?.code === '42501') {
        return NextResponse.json(
          {
            error: 'Izin akses ditolak oleh kebijakan keamanan basis data.',
            detail: 'Kredensial administrator tidak memiliki wewenang untuk baris ini.',
            code: 'PERMISSION_DENIED',
          },
          { status: 403 }
        )
      }

      // Timeout
      if (lastError?.code === '57014' || (lastError?.message || '').toLowerCase().includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Koneksi ke basis data melebihi batas waktu (timeout). Silakan coba beberapa saat lagi.',
            code: 'TIMEOUT',
          },
          { status: 504 }
        )
      }

      // Schema cache or column mismatch error
      if (
        lastError?.code === 'PGRST204' ||
        (lastError?.message || '').toLowerCase().includes('schema cache') ||
        (lastError?.message || '').toLowerCase().includes('could not find the')
      ) {
        return NextResponse.json(
          {
            error: 'Skema basis data belum tersinkronisasi. Silakan coba sesaat lagi.',
            detail: lastError?.message || 'Skema basis data belum tersinkronisasi.',
            code: 'SCHEMA_CACHE_ERROR',
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        {
          error: 'Gagal memperbarui status laporan di basis data.',
          code: lastError?.code || 'DB_ERROR',
          detail: lastError?.message || 'Terjadi kendala internal pada layanan basis data.',
        },
        { status: 503 }
      )
    }

    console.log(
      `[REPORT_STATUS_UPDATE_SUCCESS] ReportId=${sanitizedId} Action=${actionName} Duration=${Date.now() - startTime}ms`
    )

    // Also update local store mirror if present
    localReportStore.update(id, updateData)

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('PATCH /api/reports/[id] unhandled exception:', error)
    return NextResponse.json(
      {
        error: 'Terjadi kesalahan internal server saat memproses pembaruan laporan.',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
