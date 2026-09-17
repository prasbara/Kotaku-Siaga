import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/verification/rate-limiter'
import { runVerificationPipeline } from '@/lib/verification/pipeline'
import { localReportStore } from '@/lib/services/local-report-store'
import { verifyTurnstileToken } from '@/lib/verification/turnstile'
import {
  calculateAbuseScore,
  processReportClustering,
} from '@/lib/verification/corroboration-engine'
import { getUserRole, sanitizeReportForRole } from '@/lib/auth/session'
import { processAndValidateImage } from '@/lib/verification/image-validator'
import { extractAndValidateExifTimestamp } from '@/lib/verification/exif-validator'
import { analyzeMultipleEvidencePhotos } from '@/lib/verification/evidence-analyzer'

// Helper to safely extract IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

// Normalize Indonesian phone number to +628...
function normalizeIndonesianPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, '')
  if (cleaned.startsWith('+62')) return cleaned
  if (cleaned.startsWith('62')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+62${cleaned.slice(1)}`
  return cleaned
}

// GET /api/reports — fetch reports with filters & role-based sanitization
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('q') || searchParams.get('search') || undefined
  const category = searchParams.get('category') || undefined
  const urgency = searchParams.get('urgency') || undefined
  const status = searchParams.get('status') || undefined
  const district = searchParams.get('district') || undefined
  const simulationParam = searchParams.get('simulation') ?? searchParams.get('is_simulation')
  const limit = parseInt(searchParams.get('limit') || '100')
  const page = parseInt(searchParams.get('page') || '0')

  const role = await getUserRole(request)

  // Local Testing Fallback: If Supabase is not configured
  if (!isSupabaseConfigured()) {
    const { data, count } = localReportStore.getAll({
      search,
      category,
      urgency,
      status,
      district,
      is_simulation: simulationParam !== null && simulationParam !== undefined ? simulationParam === 'true' : undefined,
      limit,
      page,
    })
    const sanitized = (data || []).map((r: any) => sanitizeReportForRole(r, role))
    return NextResponse.json({
      success: true,
      data: sanitized,
      count,
      page,
      limit,
      is_local_store: true,
    })
  }

  try {
    const supabase = await createAdminClient()
    let query = supabase
      .from('reports')
      .select('*, ai_analysis(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (category && category !== 'all') {
      if (category === 'kebakaran') {
        query = query.or('category.eq.kebakaran,category.eq.lainnya')
      } else {
        query = query.eq('category', category)
      }
    }
    if (urgency && urgency !== 'all') query = query.eq('urgency', urgency)
    if (status && status !== 'all') query = query.eq('status', status)
    if (district && district !== 'all') query = query.ilike('district_name', `%${district}%`)
    if (simulationParam !== null && simulationParam !== undefined) {
      query = query.eq('is_demo', simulationParam === 'true')
    }
    if (search && search.trim()) {
      query = query.or(
        `title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,district_name.ilike.%${search.trim()}%,report_code.ilike.%${search.trim()}%`
      )
    }

    const { data, error, count } = await query

    if (error) {
      console.error('GET /api/reports database error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed.', detail: error.message },
        { status: 503 }
      )
    }

    const mappedData = (data || []).map((report) => {
      const meta = report.verification_metadata
      const isFire = meta?.actual_category === 'kebakaran' || meta?.incident_details?.incident_type === 'kebakaran'

      const isCameraVerified = meta?.verification_method === 'camera_liveness' || Boolean(meta?.verification_photo_url)
      const isOtpVerified = Boolean(report.email_verified || meta?.email_verified)
      const verificationMethod = meta?.verification_method || (isCameraVerified ? 'camera_liveness' : isOtpVerified ? 'otp' : 'none')
      const verificationStatus = meta?.verification_status || (isCameraVerified || isOtpVerified ? 'verified' : 'pending')

      const assignedAgency =
        report.assigned_agency ||
        meta?.assigned_agency ||
        (isFire || report.category === 'kebakaran'
          ? 'Dinas Pemadam Kebakaran (Damkar)'
          : report.category === 'pohon_tumbang'
          ? 'Dinas Lingkungan Hidup (DLH)'
          : ['banjir', 'genangan', 'rob'].includes(report.category)
          ? 'BPBD & DPU Kota Semarang'
          : 'BPBD Kota Semarang')

      return {
        ...report,
        category: isFire ? 'kebakaran' : report.category,
        reporter_name: report.reporter_name || meta?.reporter_name || 'Pelapor Anonim',
        reporter_phone: report.reporter_phone || report.reporter_contact || meta?.reporter_phone || null,
        reporter_email: report.reporter_email || meta?.reporter_email || null,
        email_verified: report.email_verified ?? meta?.email_verified ?? false,
        verification_method: verificationMethod,
        verification_status: verificationStatus,
        verification_photo_url: meta?.verification_photo_url || null,
        verification_timestamp: meta?.verification_timestamp || report.created_at,
        liveness_score: meta?.liveness_score ?? null,
        spoof_risk: meta?.spoof_risk ?? null,
        quality_score: meta?.quality_score ?? null,
        assigned_agency: assignedAgency,
        disposition_action:
          meta?.disposition_action ||
          (report.status === 'submitted'
            ? 'Menunggu tindak lanjut posko'
            : report.status === 'verified'
            ? 'Telah diverifikasi posko'
            : report.status === 'in_progress'
            ? 'Petugas ditugaskan ke lokasi'
            : report.status === 'resolved'
            ? 'Penanganan selesai di lapangan'
            : report.status === 'under_review'
            ? 'Dalam peninjauan posko'
            : 'Laporan ditolak'),
        validity_breakdown: meta?.validity_breakdown || null,
        evidence_summary: meta?.evidence_summary || null,
        evidence_photos: meta?.evidence_photos || (report.photo_url ? [{ index: 1, photo_url: report.photo_url }] : []),
      }
    })

    const finalFiltered = category === 'kebakaran'
      ? mappedData.filter((r) => r.category === 'kebakaran')
      : mappedData

    const sanitizedData = finalFiltered.map((report) => sanitizeReportForRole(report, role))

    return NextResponse.json({
      success: true,
      data: sanitizedData,
      count: count ?? sanitizedData.length,
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Gagal mengambil laporan.' }, { status: 500 })
  }
}

// POST /api/reports — create citizen report with Turnstile, OTP verification, photo hash & clustering
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request)

    // 1. Rate Limiting Protection (Max 5 reports / IP / 15 min)
    const rateLimit = checkRateLimit(clientIp)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak laporan dikirim dalam waktu singkat. Silakan coba kembali beberapa saat lagi.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimit.resetInSeconds.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const {
      category,
      description,
      latitude,
      longitude,
      location_accuracy,
      urgency = 'sedang',
      reporter_name,
      reporter_email,
      reporter_phone,
      email_verified = false,
      turnstile_token,
      photo_url,
      photos,
      photo_taken_at,
      photo_dhash,
      photo_sha256,
      district_name,
      address,
      title,
      client_session_id,
      website, // Honeypot field
      company, // Honeypot field
      phone_number_confirm, // Honeypot field
      reported_at,
      incident_details,
      is_simulation,
      is_test_mode,
    } = body

    const isSimulationReport = Boolean(is_simulation || is_test_mode)

    // 2. Fundamental Input Validation
    if (!reporter_name || reporter_name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama pelapor wajib diisi (minimal 2 karakter).' }, { status: 400 })
    }

    if (!reporter_email || !reporter_email.includes('@')) {
      return NextResponse.json({ error: 'Alamat email pelapor valid wajib diisi.' }, { status: 400 })
    }

    if (!reporter_phone || reporter_phone.trim().length < 8) {
      return NextResponse.json({ error: 'Nomor HP pelapor wajib diisi untuk kontak darurat/petugas.' }, { status: 400 })
    }

    if (!category || !description) {
      return NextResponse.json({ error: 'Kategori dan deskripsi kejadian wajib diisi.' }, { status: 400 })
    }

    if (description.trim().length < 10) {
      return NextResponse.json(
        { error: 'Deskripsi kejadian terlalu singkat. Berikan rincian kondisi di lapangan.' },
        { status: 400 }
      )
    }

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Koordinat lokasi kejadian wajib tersedia.' }, { status: 400 })
    }

    // Numeric sanity check
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Nilai numerik koordinat lintang/bujur tidak valid.' }, { status: 400 })
    }

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return NextResponse.json({ error: 'Koordinat lintang/bujur di luar rentang bola bumi yang valid.' }, { status: 400 })
    }

    // Timestamp validation (anti-future & non-stale)
    if (reported_at) {
      const parsedTime = new Date(reported_at).getTime()
      if (isNaN(parsedTime)) {
        return NextResponse.json({ error: 'Format stempel waktu pelaporan (reported_at) tidak valid.' }, { status: 400 })
      }
      const now = Date.now()
      if (parsedTime > now + 5 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Stempel waktu laporan tidak valid (terdeteksi stempel waktu di masa depan).' },
          { status: 400 }
        )
      }
      if (parsedTime < now - 7 * 24 * 60 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Stempel waktu laporan terlalu lama (> 7 hari lalu). Gunakan waktu observasi terkini.' },
          { status: 400 }
        )
      }
    }

    // Flood-specific validation
    if (
      (category === 'banjir' || category === 'genangan') &&
      incident_details?.water_height_cm !== undefined &&
      incident_details?.water_height_cm !== null
    ) {
      const wh = Number(incident_details.water_height_cm)
      if (isNaN(wh) || wh < 0) {
        return NextResponse.json(
          { error: 'Ketinggian genangan air tidak boleh bernilai negatif atau bukan angka.' },
          { status: 400 }
        )
      }
      if (wh > 500) {
        return NextResponse.json(
          { error: 'Ketinggian genangan air di luar batas wajar pengamatan (maksimal 500 cm).' },
          { status: 400 }
        )
      }
    }

    // Fire-specific validation (strictly isolate water attributes)
    if (category === 'kebakaran' && incident_details) {
      incident_details.water_height_cm = null
    }

    // 2b. Multi-Photo Extraction & Validation (1 to 5 photos)
    const rawPhotos: string[] = Array.isArray(photos) && photos.length > 0
      ? photos.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
      : (photo_url && typeof photo_url === 'string' && photo_url.trim().length > 0 ? [photo_url] : [])

    if (rawPhotos.length === 0 && !photo_sha256) {
      return NextResponse.json(
        { error: 'Bukti foto kondisi lapangan wajib dilampirkan (minimal 1 foto, maksimal 5 foto).' },
        { status: 400 }
      )
    }

    if (rawPhotos.length > 5) {
      return NextResponse.json(
        { error: 'Jumlah bukti foto melebihi batas maksimal (maksimal 5 foto per laporan).' },
        { status: 400 }
      )
    }

    // 3. Turnstile Server-Side Validation
    const turnstileResult = await verifyTurnstileToken(turnstile_token, clientIp)
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || 'Verifikasi keamanan anti-bot gagal.' },
        { status: 403 }
      )
    }

    const normalizedPhone = normalizeIndonesianPhone(reporter_phone)
    const normalizedEmail = reporter_email.trim().toLowerCase()
    const clientIpHash = Buffer.from(clientIp).toString('base64').slice(0, 16)

    // 4. Verification Pipeline & Multi-Photo Evidence Analysis
    let recentReports: any[] = []
    let existingEvidenceHashes: Array<{ sha256: string; phash: string; report_code?: string }> = []

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: dbRecent } = await supabase
          .from('reports')
          .select('id, report_code, latitude, longitude, created_at, photo_url, category, verification_metadata')
          .gte('created_at', past24Hours)
          .limit(100)

        if (dbRecent && Array.isArray(dbRecent)) {
          recentReports = dbRecent.map((r: any) => ({
            ...r,
            category: r.verification_metadata?.actual_category || r.category,
          }))
        }

        const { data: recentEvidence } = await supabase
          .from('report_evidence')
          .select('sha256, phash, report_id, reports(report_code)')
          .order('created_at', { ascending: false })
          .limit(100)

        if (recentEvidence) {
          existingEvidenceHashes = recentEvidence.map((e: any) => ({
            sha256: e.sha256,
            phash: e.phash,
            report_code: e.reports?.report_code,
          }))
        }
      } catch (fetchErr) {
        console.warn('Could not fetch recent reports or evidence for corroboration:', fetchErr)
      }
    }

    // Run multi-layer photo analysis: SHA-256, pHash, EXIF timestamp, GPS consistency, and AI Vision
    const evidenceSummary = await analyzeMultipleEvidencePhotos({
      photos: rawPhotos,
      reportCode: `SMG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      category,
      description,
      latitude,
      longitude,
      submissionTime: reported_at ? new Date(reported_at) : new Date(),
      existingEvidenceHashes,
    })

    const primaryEvidence = evidenceSummary.evidenceList[0] || null
    const validatedPhotoSha256 = primaryEvidence?.sha256 || photo_sha256 || null
    const validatedPhotoDhash = primaryEvidence?.phash || photo_dhash || null
    const exifTimestampResult: any = primaryEvidence?.exif || {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: 'none',
      capture_timestamp_status: 'timestamp_unavailable',
      capture_timestamp_age_hours: null,
      risk_warning: null,
    }

    const verification = await runVerificationPipeline(
      {
        category,
        description,
        latitude,
        longitude,
        locationAccuracy: location_accuracy,
        reportedAt: reported_at,
        photoUrl: primaryEvidence?.photoUrl || photo_url || (rawPhotos[0] ?? null),
        photoTakenAt: exifTimestampResult?.capture_timestamp || photo_taken_at,
        photoDhash: validatedPhotoDhash,
        photoSha256: validatedPhotoSha256,
        website,
        company,
        phoneNumberConfirm: phone_number_confirm,
        ip: clientIp,
        districtName: district_name,
        address,
      },
      recentReports
    )

    // Update evidence storage paths with final report code
    evidenceSummary.evidenceList.forEach((e) => {
      e.storagePath = `evidence/${verification.reportCode}/${e.index}_${e.sha256.slice(0, 10)}.jpg`
    })

    // Merge multi-photo evidence summary into verification metadata
    verification.metadata.evidence_summary = {
      total_photos: evidenceSummary.totalPhotos,
      valid_photos: evidenceSummary.validPhotos,
      timestamp_consistent_count: evidenceSummary.timestampConsistentCount,
      gps_consistent_count: evidenceSummary.gpsConsistentCount,
      similar_evidence_count: evidenceSummary.similarEvidenceCount,
      ai_relevant_count: evidenceSummary.aiRelevantCount,
      overall_authenticity_score: evidenceSummary.overallAuthenticityScore,
      overall_verdict: evidenceSummary.overallVerdict,
      overall_recommendation: evidenceSummary.overallRecommendation,
    }
    verification.metadata.evidence_photos = evidenceSummary.evidenceList.map((e) => ({
      index: e.index,
      storage_path: e.storagePath,
      photo_url: e.photoUrl,
      mime_type: e.mimeType,
      file_size: e.fileSizeBytes,
      width: e.width,
      height: e.height,
      sha256: e.sha256,
      phash: e.phash,
      capture_timestamp: e.exif.capture_timestamp,
      capture_timestamp_wib: e.exif.capture_timestamp_wib,
      capture_timestamp_source: e.exif.capture_timestamp_source,
      capture_timestamp_status: e.exif.capture_timestamp_status,
      capture_timestamp_age_hours: e.exif.capture_timestamp_age_hours,
      exif_latitude: e.exif.exif_latitude,
      exif_longitude: e.exif.exif_longitude,
      gps_status: e.exif.gps_status,
      gps_distance_meters: e.exif.gps_distance_meters,
      ai_status: e.ai.status,
      ai_provider: e.ai.provider,
      ai_category: e.ai.detected_category,
      ai_confidence: e.ai.confidence,
      ai_anomaly_flags: e.ai.flags,
      ai_reason: e.ai.reason,
      verdict: e.verdict,
      evidence_score: e.evidenceScore,
      signals: e.signals,
    }))

    // Merge EXIF validation result into verification metadata
    if (exifTimestampResult) {
      verification.metadata.capture_timestamp = exifTimestampResult.capture_timestamp
      verification.metadata.capture_timestamp_wib = exifTimestampResult.capture_timestamp_wib
      verification.metadata.capture_timestamp_source = exifTimestampResult.capture_timestamp_source
      verification.metadata.capture_timestamp_status = exifTimestampResult.capture_timestamp_status
      verification.metadata.capture_timestamp_age_hours = exifTimestampResult.capture_timestamp_age_hours
      if (exifTimestampResult.risk_warning) {
        verification.metadata.warnings = [
          ...(verification.metadata.warnings || []),
          exifTimestampResult.risk_warning,
        ]
      }
    }

    // 5. Strict Semarang Geofencing & Anti-FakeGPS Enforcement
    if (verification.metadata.is_within_semarang === false) {
      return NextResponse.json(
        {
          error:
            'Laporan ditolak: Titik koordinat berada di luar wilayah administratif Kota Semarang. KotaKu Siaga secara khusus melayani pelaporan kebencanaan wilayah 16 Kecamatan Kota Semarang.',
          code: 'OUTSIDE_SEMARANG_BOUNDARY',
          nearest_district: verification.metadata.nearest_district,
        },
        { status: 422 }
      )
    }

    // 6. Abuse Score Calculation
    const abuseScore = calculateAbuseScore({
      honeypotTriggered: verification.metadata.honeypot_triggered,
      hasPhoto: Boolean(photo_url || photo_sha256),
      photoTimeMismatch: verification.metadata.warnings.some((w: string) => w.includes('Waktu foto')),
      isOutsideSemarang: !verification.metadata.is_within_semarang,
      duplicatePhotoCount: verification.metadata.duplicate_count,
      emailVerified: Boolean(email_verified),
    })

    const reportCode = verification.reportCode

    // 6. Multi-Report Clustering & Corroboration Processing
    const clusterResult = await processReportClustering({
      report_code: reportCode,
      category,
      latitude,
      longitude,
      reporterName: reporter_name,
      reporterEmail: normalizedEmail,
      reporterPhone: normalizedPhone,
      clientSessionId: client_session_id,
      clientIpHash,
      photoHash: photo_sha256 || photo_dhash,
      photoUrl: photo_url,
      districtName: district_name || verification.metadata.nearest_district,
      reportedAt: reported_at,
    })

    let determinedStatus = verification.status
    if (clusterResult.corroborationStatus === 'CONFIRMED_BY_CORROBORATION') {
      determinedStatus = 'verified'
    } else if (clusterResult.corroborationStatus === 'CORROBORATED') {
      determinedStatus = 'verified'
    }

    // 7. Verification Photo & Metadata Payload Hardening
    let safeVerificationPhotoUrl: string | null = null
    if (typeof body.verification_photo_url === 'string' && body.verification_photo_url.trim()) {
      const photoStr = body.verification_photo_url.trim()
      // Enforce data URI format or secure HTTPS URL and max 5MB payload
      if (
        photoStr.startsWith('data:image/jpeg;base64,') ||
        photoStr.startsWith('data:image/png;base64,') ||
        photoStr.startsWith('data:image/webp;base64,') ||
        (photoStr.startsWith('https://') && !photoStr.includes('<') && !photoStr.includes('>'))
      ) {
        if (photoStr.length < 5 * 1024 * 1024 * 1.37) {
          safeVerificationPhotoUrl = photoStr
        }
      }
    }

    const unifiedVerificationMetadata = {
      ...verification.metadata,
      actual_category: category,
      abuse_score: abuseScore,
      incident_cluster_id: clusterResult.clusterId,
      cluster_code: clusterResult.clusterCode,
      independent_reporter_count: clusterResult.independentReporterCount,
      incident_details: incident_details || null,
      is_simulation: isSimulationReport,
      reporter_email: normalizedEmail,
      reporter_phone: normalizedPhone,
      email_verified: Boolean(email_verified),
      turnstile_verified: true,
      verification_method:
        body.verification_method ||
        (safeVerificationPhotoUrl ? 'camera_liveness' : email_verified ? 'otp' : 'none'),
      verification_status:
        body.verification_status ||
        (safeVerificationPhotoUrl || email_verified ? 'verified' : 'pending'),
      verification_photo_url: safeVerificationPhotoUrl,
      verification_timestamp: body.verification_timestamp || new Date().toISOString(),
      liveness_score:
        typeof body.liveness_score === 'number'
          ? Math.max(0, Math.min(100, body.liveness_score))
          : null,
      spoof_risk:
        typeof body.spoof_risk === 'number'
          ? Math.max(0, Math.min(100, body.spoof_risk))
          : null,
      quality_score:
        typeof body.quality_score === 'number'
          ? Math.max(0, Math.min(100, body.quality_score))
          : null,
    }

    // 8. Save Report
    if (!isSupabaseConfigured()) {
      const createdLocal = localReportStore.create({
        report_code: reportCode,
        category,
        description,
        latitude,
        longitude,
        location_accuracy: verification.metadata.location_accuracy,
        urgency,
        status: determinedStatus,
        credibility_score: verification.credibilityScore,
        verification_metadata: unifiedVerificationMetadata,
        photo_url: primaryEvidence?.photoUrl || photo_url || (rawPhotos[0] ?? null),
        reporter_name,
        reporter_contact: normalizedPhone,
        is_demo: isSimulationReport,
        is_simulation: isSimulationReport,
        incident_details: incident_details || null,
        district_name: district_name || verification.metadata.nearest_district || 'Kota Semarang',
        address: address || null,
        title: title || description.slice(0, 40),
      })

      return NextResponse.json(
        {
          success: true,
          data: createdLocal,
          report_code: reportCode,
          cluster_code: clusterResult.clusterCode,
          independent_reporter_count: clusterResult.independentReporterCount,
          corroboration_status: clusterResult.corroborationStatus,
          credibility_score: verification.credibilityScore,
          status: determinedStatus,
          is_simulation: isSimulationReport,
          is_local_store: true,
        },
        { status: 201 }
      )
    }

    // Supabase Insert — Safe & backward-compatible payload with constraint fallback
    const supabase = await createAdminClient()
    const insertPayload: any = {
      report_code: reportCode,
      category,
      description,
      latitude,
      longitude,
      location_accuracy: verification.metadata.location_accuracy,
      urgency,
      status: determinedStatus,
      credibility_score: verification.credibilityScore,
      verification_metadata: unifiedVerificationMetadata,
      photo_url: primaryEvidence?.photoUrl || photo_url || (rawPhotos[0] ?? null),
      photo_hash: validatedPhotoSha256,
      photo_taken_at: exifTimestampResult?.capture_timestamp || photo_taken_at || null,
      reporter_name,
      reporter_contact: normalizedPhone,
      is_demo: isSimulationReport,
      district_name: district_name || verification.metadata.nearest_district || null,
      address: address || null,
      title: title || description.slice(0, 40),
    }

    let { data, error } = await supabase.from('reports').insert(insertPayload).select().single()

    // If schema constraint check fails for new categories like 'kebakaran', fallback to 'lainnya' with metadata
    if (error && error.message.includes('reports_category_check')) {
      console.warn('Postgres category constraint triggered. Falling back to category=lainnya with actual_category in metadata.')
      insertPayload.category = 'lainnya'
      const fallbackResult = await supabase.from('reports').insert(insertPayload).select().single()
      data = fallbackResult.data
      error = fallbackResult.error
      if (data) {
        data.category = category
      }
    }

    if (error) {
      console.error('POST /api/reports database insert error:', error.message)
      return NextResponse.json(
        { error: 'Gagal menyimpan laporan ke database.', detail: error.message },
        { status: 503 }
      )
    }

    // Insert individual evidence items into report_evidence table
    if (data?.id && evidenceSummary.evidenceList.length > 0) {
      try {
        const evidenceRows = evidenceSummary.evidenceList.map((item) => ({
          report_id: data.id,
          storage_path: item.storagePath,
          mime_type: item.mimeType,
          file_size: item.fileSizeBytes,
          width: item.width,
          height: item.height,
          sha256: item.sha256,
          phash: item.phash,
          phash_version: 'dhash_v1',
          capture_timestamp: item.exif.capture_timestamp,
          capture_timestamp_source: item.exif.capture_timestamp_source,
          capture_timestamp_status: item.exif.capture_timestamp_status,
          capture_timestamp_age_hours: item.exif.capture_timestamp_age_hours,
          exif_latitude: item.exif.exif_latitude,
          exif_longitude: item.exif.exif_longitude,
          gps_status: item.exif.gps_status,
          gps_distance_meters: item.exif.gps_distance_meters,
          ai_status: item.ai.status,
          ai_provider: item.ai.provider,
          ai_category: item.ai.detected_category,
          ai_confidence: item.ai.confidence,
          ai_anomaly_flags: item.ai.flags,
          verification_status: item.verdict,
        }))
        const { error: evInsertErr } = await supabase.from('report_evidence').insert(evidenceRows)
        if (evInsertErr) {
          console.warn('Could not insert report_evidence rows:', evInsertErr.message)
        }
      } catch (evErr: any) {
        console.warn('report_evidence insertion error (non-fatal):', evErr?.message || evErr)
      }
    }

    const returnedData = data
      ? {
          ...data,
          category: data.verification_metadata?.actual_category || data.category,
          incident_details: data.incident_details || data.verification_metadata?.incident_details || incident_details || null,
          is_simulation: isSimulationReport,
          verification_metadata: {
            ...(data.verification_metadata || {}),
            possible_duplicate: verification.metadata.possible_duplicate,
            duplicate_warning: verification.metadata.duplicate_warning,
            suspected_duplicate_of: verification.metadata.suspected_duplicate_of,
          },
        }
      : data

    return NextResponse.json(
      {
        success: true,
        data: sanitizeReportForRole(returnedData, 'public'),
        report_code: reportCode,
        cluster_code: clusterResult.clusterCode,
        independent_reporter_count: clusterResult.independentReporterCount,
        corroboration_status: clusterResult.corroborationStatus,
        credibility_score: verification.credibilityScore,
        status: determinedStatus,
        verification_summary: {
          score: verification.credibilityScore,
          confidence_level: verification.metadata.confidence_level,
          positive_evidence: verification.metadata.positive_evidence,
          warnings: verification.metadata.warnings,
          abuse_score: abuseScore,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json({ error: 'Gagal memproses laporan.' }, { status: 500 })
  }
}
