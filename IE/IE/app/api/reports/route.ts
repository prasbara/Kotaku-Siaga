import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/verification/rate-limiter'
import { runVerificationPipeline } from '@/lib/verification/pipeline'

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

// GET /api/reports — fetch reports with search, district, category, urgency, status filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('q') || searchParams.get('search')
    const category = searchParams.get('category')
    const urgency = searchParams.get('urgency')
    const status = searchParams.get('status')
    const district = searchParams.get('district')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '0')

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
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,district_name.ilike.%${search.trim()}%,report_code.ilike.%${search.trim()}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('GET /api/reports database error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed.', detail: error.message },
        { status: 503 }
      )
    }

    // Successful query — return real data (may be empty array if no reports yet)
    return NextResponse.json({
      success: true,
      data: data ?? [],
      count: count ?? (data ? data.length : 0),
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Gagal mengambil laporan.' }, { status: 500 })
  }
}

// POST /api/reports — create new citizen report with multi-layered verification and real DB corroboration
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Reports cannot be saved without a configured database.' },
      { status: 503 }
    )
  }

  try {
    const clientIp = getClientIp(request)

    // 1. Rate Limiting Protection (Default 3 reports / IP / 15 min)
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
      urgency,
      reporter_name,
      reporter_contact,
      photo_url,
      photo_taken_at,
      photo_dhash,
      photo_sha256,
      district_name,
      address,
      title,
      website, // Honeypot field
      company, // Honeypot field
      phone_number_confirm, // Honeypot field
      reported_at,
    } = body

    // 2. Fundamental Input Validation
    if (!category || !description || latitude === undefined || longitude === undefined || !urgency) {
      return NextResponse.json({ error: 'Data laporan tidak lengkap.' }, { status: 400 })
    }

    if (description.length > 2000) {
      return NextResponse.json({ error: 'Deskripsi terlalu panjang (max 2000 karakter).' }, { status: 400 })
    }

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return NextResponse.json({ error: 'Koordinat tidak valid.' }, { status: 400 })
    }

    // 3. Multi-Layered Verification Pipeline with Real Database Corroboration
    const supabase = await createAdminClient()
    let recentReports: Array<{
      id: string
      report_code: string
      latitude: number
      longitude: number
      created_at: string
      photo_url?: string | null
      category?: string
    }> = []

    try {
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

    const reportCode = verification.reportCode
    const determinedStatus = verification.status

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
        verification_metadata: verification.metadata,
        photo_url: photo_url || null,
        photo_hash: photo_sha256 || null,
        photo_taken_at: photo_taken_at || null,
        reporter_name: reporter_name || null,
        reporter_contact: reporter_contact || null,
        is_demo: false,
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
        data,
        report_code: reportCode,
        credibility_score: verification.credibilityScore,
        status: determinedStatus,
        verification_summary: {
          score: verification.credibilityScore,
          confidence_level: verification.metadata.confidence_level,
          positive_evidence: verification.metadata.positive_evidence,
          warnings: verification.metadata.warnings,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/reports error:', error)
    return NextResponse.json({ error: 'Gagal memproses laporan.' }, { status: 500 })
  }
}
