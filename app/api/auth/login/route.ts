import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionToken } from '@/lib/auth/session'
import {
  recordAuthFailure,
  recordAuthSuccess,
  recordAuthorizationDenied,
  recordAuthBlocked,
} from '@/lib/audit/security-logger'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const correlationId = request.headers.get('x-correlation-id') || undefined

  try {
    const body = await request.json()
    const rawIdentifier = (body.identifier || body.email || body.username || '').trim()
    const password = body.password || ''

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Username/email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    // Support both username (e.g. operator.siaga, petugas.soc, tester.civic) and email (e.g. name@domain.com)
    const email = rawIdentifier.includes('@')
      ? rawIdentifier.toLowerCase()
      : `${rawIdentifier.toLowerCase()}@kotakusiaga.id`

    // Authenticate via Supabase Auth
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Handle Authentication Failure (Case A: Invalid credentials, Case B: User not found, Case D: Account disabled)
    if (authError || !authData?.user) {
      const errMsg = (authError?.message || '').toLowerCase()
      
      // Case D: Account disabled / locked
      if (errMsg.includes('banned') || errMsg.includes('disabled') || errMsg.includes('locked')) {
        await recordAuthBlocked({
          identifier: rawIdentifier,
          source_ip: clientIp,
          user_agent: userAgent,
          correlation_id: correlationId,
          reason: 'account_locked_or_disabled',
        })
        return NextResponse.json(
          {
            success: false,
            error: 'Akun Anda telah dinonaktifkan atau dikunci. Hubungi administrator.',
            code: 'ACCOUNT_BLOCKED',
          },
          { status: 403 }
        )
      }

      // Case A & B: Generic authentication failure
      await recordAuthFailure({
        identifier: rawIdentifier,
        source_ip: clientIp,
        user_agent: userAgent,
        correlation_id: correlationId,
        reason: errMsg.includes('not found') ? 'user_not_found' : 'invalid_credentials',
      })

      // Strictly generic user-facing response to prevent user enumeration
      return NextResponse.json(
        {
          success: false,
          error: 'Username atau password tidak valid.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      )
    }

    const user = authData.user

    // Resolve user role: check profiles table first, fallback to user metadata
    let userRole = 'public'
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        userRole = 'admin'
      } else if (profile?.role === 'government' || profile?.role === 'officer') {
        userRole = 'officer'
      } else if (user.user_metadata?.role === 'admin') {
        userRole = 'admin'
      } else if (user.user_metadata?.role === 'officer') {
        userRole = 'officer'
      } else if (profile?.role === 'citizen') {
        userRole = 'citizen'
      }
    } catch {
      if (user.user_metadata?.role === 'admin') userRole = 'admin'
      else if (user.user_metadata?.role === 'officer') userRole = 'officer'
      else if (user.user_metadata?.role === 'citizen') userRole = 'citizen'
    }

    // Case C: Authentication Succeeded, but Role Lacks Authorization for Command Center
    if (userRole !== 'admin' && userRole !== 'officer') {
      await recordAuthorizationDenied({
        identifier: rawIdentifier,
        role: userRole,
        requiredRole: 'officer|admin',
        source_ip: clientIp,
        user_agent: userAgent,
        correlation_id: correlationId,
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Akun Anda terdaftar sebagai warga (citizen) dan tidak memiliki izin akses ke Pusat Kendali Operasi.',
          code: 'AUTHORIZATION_DENIED',
          role: userRole,
        },
        { status: 403 }
      )
    }

    // Case: Full Authentication & Authorization Success (admin / officer)
    await recordAuthSuccess({
      identifier: rawIdentifier,
      role: userRole,
      source_ip: clientIp,
      user_agent: userAgent,
      correlation_id: correlationId,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        role: userRole,
        email: user.email,
      },
    })

    // Issue secure signed session cookie for dashboard access
    const sessionToken = await createSessionToken(userRole)
    response.cookies.set('kotaku_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    )
  }
}
