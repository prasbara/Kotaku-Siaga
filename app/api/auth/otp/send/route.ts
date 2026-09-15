import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// Simple in-memory rate limiter for OTP requests (5 per 10 mins per email/IP)
const otpRateMap = new Map<string, { count: number; resetAt: number }>()

function checkOtpRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = otpRateMap.get(key)

  if (!entry || now > entry.resetAt) {
    otpRateMap.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }

  if (entry.count >= 5) {
    return false
  }

  entry.count += 1
  return true
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

    // Rate Limit by Email & IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1'
    const rateLimitKey = `${clientIp}:${normalizedEmail}`
    if (!checkOtpRateLimit(rateLimitKey)) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak permintaan OTP. Harap tunggu beberapa menit sebelum meminta kode baru.',
          code: 'OTP_RATE_LIMIT',
        },
        { status: 429 }
      )
    }

    if (!isSupabaseConfigured()) {
      // Local dev fallback if Supabase credentials not set
      console.log(`[DEV OTP] Generated simulated OTP for ${normalizedEmail}`)
      return NextResponse.json({
        success: true,
        message: 'Kode OTP telah dikirim ke email Anda (Mode Dev).',
        dev_note: 'Supabase credentials not configured in local environment.',
      })
    }

    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl}/laporan/baru?verified=true`,
      },
    })

    if (error) {
      console.error('[Supabase OTP Send Error]:', error.message)
      return NextResponse.json(
        {
          error: `Gagal mengirimkan kode OTP: ${error.message}`,
          code: 'SUPABASE_OTP_ERROR',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Kode OTP 6-digit telah dikirim ke email Anda. Periksa kotak masuk atau folder spam.',
    })
  } catch (err: any) {
    console.error('POST /api/auth/otp/send exception:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mengirimkan OTP.' },
      { status: 500 }
    )
  }
}
