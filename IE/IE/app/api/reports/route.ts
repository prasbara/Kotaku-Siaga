import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/verification/rate-limiter'
import { runVerificationPipeline } from '@/lib/verification/pipeline'

// PRODUCTION: citizen reports come from the real database only.
// No hardcoded citizen reports are used as fallback data.

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

// GET /api/reports — fetch reports with filters
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const urgency = searchParams.get('urgency')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '0')

    const supabase = await createAdminClient()
    let query = supabase
      .from('reports')
      .select('*, ai_analysis(*)')
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1)

    if (category && category !== 'all') query = query.eq('category', category)
    if (urgency && urgency !== 'all') query = query.eq('urgency', urgency)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error, count } = await query

    if (error) {
      console.error('GET /api/reports database error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed.', detail: error.message },
        { status: 503 }
      )
    }

    // Successful query — return real data (may be empty array if no reports yet)
    return NextResponse.json({ success: true, data: data ?? [], count: count ?? 0 })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Gagal mengambil laporan.' }, { status: 500 })
  }
}

// POST /api/reports — create new citizen report with multi-layered verification
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

    // 3. Multi-Layered Verification Pipeline
    // PRODUCTION: Pass empty array — citizen corroboration uses only real DB reports via flood-event-manager
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
      [] // PRODUCTION: No hardcoded reports used for verification context
    )

    const reportCode = verification.reportCode
    const determinedStatus = verification.status

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
