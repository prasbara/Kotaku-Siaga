import { NextRequest, NextResponse } from 'next/server'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server'

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Alamat email wajib diisi.' },
        { status: 400 }
      )
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Kode verifikasi OTP wajib dimasukkan.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const cleanToken = token.trim().replace(/\D/g, '')

    if (cleanToken.length < 6) {
      return NextResponse.json(
        { error: 'Kode verifikasi OTP harus terdiri dari minimal 6 digit angka.' },
        { status: 400 }
      )
    }

    const masked = maskEmail(normalizedEmail)
    console.log(`[OTP_VERIFY_STARTED] Verifying OTP token for ${masked}`)

    if (!isSupabaseConfigured()) {
      console.error('[OTP_VERIFY_FAILED] Supabase service credentials are not configured.')
      return NextResponse.json(
        {
          error: 'Layanan autentikasi Supabase belum terkonfigurasi.',
          code: 'AUTH_SERVICE_UNCONFIGURED',
        },
        { status: 503 }
      )
    }

    const supabase = await createClient()

    // 1. Primary verification attempt using standard Supabase email OTP
    let verifyResult = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type: 'email',
    })

    // 2. Fallback attempt for signup verification if type 'email' returned token error
    if (verifyResult.error && verifyResult.error.message.includes('Token has expired or is invalid')) {
      const signupFallback = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: cleanToken,
        type: 'signup',
      })
      if (!signupFallback.error) {
        verifyResult = signupFallback
      }
    }

    if (verifyResult.error) {
      console.warn(`[OTP_VERIFY_FAILED] Verification rejected for ${masked}:`, verifyResult.error.message)
      return NextResponse.json(
        {
          error: 'Kode verifikasi salah atau telah kedaluwarsa. Silakan periksa kembali email Anda atau minta kode baru.',
          code: 'INVALID_OR_EXPIRED_OTP',
        },
        { status: 400 }
      )
    }

    const { data } = verifyResult
    console.log(`[OTP_VERIFY_SUCCESS] User ${masked} successfully verified (UID: ${data.user?.id})`)

    if (data.session) {
      console.log(`[AUTH_SESSION_CREATED] Active Supabase Auth session established for ${masked}`)
    }

    return NextResponse.json({
      success: true,
      email_verified: true,
      email: normalizedEmail,
      user_id: data.user?.id,
      session_active: !!data.session,
    })
  } catch (err: any) {
    console.error('[OTP_VERIFY_FAILED] Internal exception:', err)
    return NextResponse.json(
      { error: 'Terjadi kendala sistem saat memverifikasi kode OTP.' },
      { status: 500 }
    )
  }
}
