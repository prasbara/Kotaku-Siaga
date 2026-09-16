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

    // Photo is mandatory for standard report
    if (!photo_url && !photo_sha256) {
      return NextResponse.json(
        { error: 'Foto bukti lapangan wajib dilampirkan untuk laporan warga standar.' },
        { status: 400 }
      )
    }

    // 2b. Image MIME, Signature & EXIF 24-Hour Rule Validation
    let validatedPhotoSha256 = photo_sha256 || null
    let validatedPhotoDhash = photo_dhash || null
    let exifTimestampResult: any = {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: 'none',
      capture_timestamp_status: 'timestamp_unavailable',
      capture_timestamp_age_hours: null,
      risk_warning: null,
    }

    if (photo_url && typeof photo_url === 'string' && photo_url.startsWith('data:image/')) {
      try {
        const matches = photo_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
          const clientMime = matches[1]
          const imageBuffer = Buffer.from(matches[2], 'base64')
          const imgValidation = await processAndValidateImage(imageBuffer, clientMime)
          if (!imgValidation.isValid) {
            return NextResponse.json(
              { error: `Validasi file bukti gagal: ${imgValidation.error || 'Format gambar rusak'}` },
              { status: 400 }
            )
          }
          validatedPhotoSha256 = imgValidation.sha256
          validatedPhotoDhash = imgValidation.dhash
          if (imgValidation.exifValidation) {
            exifTimestampResult = imgValidation.exifValidation
          }
        }
      } catch (imgErr) {
        console.warn('Image EXIF/Signature parsing warning:', imgErr)
      }
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

    // 4. Verification Pipeline Execution
    let recentReports: any[] = []
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
      } catch (fetchErr) {
        console.warn('Could not fetch recent reports for corroboration:', fetchErr)
      }
    }

    const verification = await runVerificationPipeline(
      {
        category,
        description,
        latitude,
        longitude,
        locationAccuracy: location_accuracy,
        reportedAt: reported_at,
        photoUrl: photo_url,
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

    // 7. Save Report
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
        verification_metadata: {
          ...verification.metadata,
          abuse_score: abuseScore,
          incident_cluster_id: clusterResult.clusterId,
          cluster_code: clusterResult.clusterCode,
          independent_reporter_count: clusterResult.independentReporterCount,
        },
        photo_url: photo_url || null,
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
      verification_metadata: {
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
        verification_method: body.verification_method || (body.verification_photo_url ? 'camera_liveness' : email_verified ? 'otp' : 'none'),
        verification_status: body.verification_status || (body.verification_photo_url || email_verified ? 'verified' : 'pending'),
        verification_photo_url: body.verification_photo_url || null,
        verification_timestamp: body.verification_timestamp || new Date().toISOString(),
        liveness_score: typeof body.liveness_score === 'number' ? body.liveness_score : null,
        spoof_risk: typeof body.spoof_risk === 'number' ? body.spoof_risk : null,
        quality_score: typeof body.quality_score === 'number' ? body.quality_score : null,
      },
      photo_url: photo_url || null,
      photo_hash: photo_sha256 || null,
      photo_taken_at: photo_taken_at || null,
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
