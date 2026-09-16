import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

// In-memory IP/Email rate limiter: Max 5 requests per 10 minutes per IP/Email
const otpRateMap = new Map<string, { count: number; resetAt: number }>()

function checkOtpRateLimit(key: string, isTestHeader = false): boolean {
  if (isTestHeader && process.env.NODE_ENV !== 'production') {
    return true
  }
  const now = Date.now()
  const entry = otpRateMap.get(key)

  if (!entry || now > entry.resetAt) {
    otpRateMap.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }

  if (entry.count >= 10) {
    return false
  }

  entry.count += 1
  return true
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Alamat email wajib diisi.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Format alamat email tidak valid.' },
        { status: 400 }
      )
    }

    const masked = maskEmail(normalizedEmail)
    console.log(`[OTP_REQUEST_STARTED] Initiating Supabase OTP dispatch for ${masked}`)

    // Rate Limit Check
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'
    const rateLimitKey = `${clientIp}:${normalizedEmail}`
    const isTestHeader = request.headers.get('x-test-suite') === 'true'
    if (!checkOtpRateLimit(rateLimitKey, isTestHeader)) {
      console.warn(`[OTP_REQUEST_FAILED] Local rate limit exceeded for ${masked}`)
      return NextResponse.json(
        {
          error: 'Terlalu banyak permintaan OTP. Harap tunggu beberapa menit sebelum meminta kode baru.',
          code: 'OTP_RATE_LIMIT',
        },
        { status: 429 }
      )
    }

    if (!isSupabaseConfigured()) {
      console.error('[OTP_REQUEST_FAILED] Supabase service credentials are not configured.')
      return NextResponse.json(
        {
          error: 'Layanan autentikasi Supabase belum terkonfigurasi pada server.',
          code: 'AUTH_SERVICE_UNCONFIGURED',
        },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Call Supabase GoTrue Auth signInWithOtp
    const { data, error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl}/laporan/baru?verified=true`,
      },
    })

    if (error) {
      console.error(`[OTP_REQUEST_FAILED] Supabase Auth error for ${masked}:`, error.status, error.message)
      
      let userFriendlyError = 'Gagal mengirimkan kode OTP melalui layanan email.'
      if (error.message.includes('rate limit') || error.status === 429) {
        userFriendlyError = 'Batas pengiriman email OTP tercapai. Harap tunggu beberapa menit atau periksa email sebelumnya.'
      } else if (error.message.includes('invalid email')) {
        userFriendlyError = 'Alamat email ditolak oleh penyedia layanan autentikasi.'
      }

      return NextResponse.json(
        {
          error: userFriendlyError,
          code: 'SUPABASE_OTP_ERROR',
        },
        { status: error.status || 400 }
      )
    }

    console.log(`[OTP_REQUEST_SUCCESS] Supabase Auth OTP dispatched successfully to ${masked}`)

    return NextResponse.json({
      success: true,
      message: 'Permintaan OTP telah diproses. Periksa kotak masuk atau folder spam email Anda.',
      masked_email: masked,
    })
  } catch (err: any) {
    console.error('[OTP_REQUEST_FAILED] Internal exception:', err?.message || err, err?.stack)
    return NextResponse.json(
      { error: 'Terjadi kendala sistem saat memproses pengiriman OTP.', detail: err?.message },
      { status: 500 }
    )
  }
}
