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

    if (category && category !== 'all') query = query.eq('category', category)
    if (urgency && urgency !== 'all') query = query.eq('urgency', urgency)
    if (status && status !== 'all') query = query.eq('status', status)
    if (district && district !== 'all') query = query.ilike('district_name', `%${district}%`)
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

    const sanitizedData = (data || []).map((report) => sanitizeReportForRole(report, role))

    return NextResponse.json({
      success: true,
      data: sanitizedData,
      count: count ?? (data ? data.length : 0),
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
    } = body

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

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return NextResponse.json({ error: 'Koordinat lintang/bujur tidak valid.' }, { status: 400 })
    }

    // Photo is mandatory for standard report
    if (!photo_url && !photo_sha256) {
      return NextResponse.json(
        { error: 'Foto bukti lapangan wajib dilampirkan untuk laporan warga standar.' },
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

    // 4. Verification Pipeline Execution
    let recentReports: any[] = []
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: dbRecent } = await supabase
          .from('reports')
          .select('id, report_code, latitude, longitude, created_at, photo_url, category')
          .gte('created_at', past24Hours)
          .limit(100)

        if (dbRecent && Array.isArray(dbRecent)) {
          recentReports = dbRecent
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
        photoTakenAt: photo_taken_at,
        photoDhash: photo_dhash,
        photoSha256: photo_sha256,
        website,
        company,
        phoneNumberConfirm: phone_number_confirm,
        ip: clientIp,
        districtName: district_name,
        address,
      },
      recentReports
    )

    // 5. Abuse Score Calculation
    const abuseScore = calculateAbuseScore({
      honeypotTriggered: verification.metadata.honeypot_triggered,
      hasPhoto: Boolean(photo_url || photo_sha256),
      photoTimeMismatch: verification.metadata.warnings.some((w: string) => w.includes('Waktu foto')),
      isOutsideSemarang: verification.metadata.warnings.some((w: string) => w.includes('di luar wilayah')),
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
        is_demo: false,
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
          is_local_store: true,
        },
        { status: 201 }
      )
    }

    // Supabase Insert
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reports')
      .insert({
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
          cluster_code: clusterResult.clusterCode,
          independent_reporter_count: clusterResult.independentReporterCount,
        },
        photo_url: photo_url || null,
        photo_hash: photo_sha256 || null,
        photo_taken_at: photo_taken_at || null,
        reporter_name,
        reporter_email: normalizedEmail,
        reporter_phone: normalizedPhone,
        email_verified: Boolean(email_verified),
        turnstile_verified: true,
        incident_cluster_id: clusterResult.clusterId,
        independent_reporter_count: clusterResult.independentReporterCount,
        abuse_score: abuseScore,
        district_name: district_name || verification.metadata.nearest_district || null,
        address: address || null,
        title: title || description.slice(0, 40),
      })
      .select()
      .single()

    if (error) {
      console.error('POST /api/reports database insert error:', error.message)
      return NextResponse.json(
        { error: 'Gagal menyimpan laporan ke database.', detail: error.message },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: sanitizeReportForRole(data, 'public'),
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
