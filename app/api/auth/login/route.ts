import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSessionToken } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
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

    // Support both username (e.g. operator.siaga, petugas.soc) and email (e.g. name@domain.com)
    const email = rawIdentifier.includes('@')
      ? rawIdentifier.toLowerCase()
      : `${rawIdentifier.toLowerCase()}@kotakusiaga.id`

    // Authenticate via Supabase Auth
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Email/username atau password tidak valid.' },
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
      }
    } catch {
      if (user.user_metadata?.role === 'admin') userRole = 'admin'
      else if (user.user_metadata?.role === 'officer') userRole = 'officer'
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.user_metadata?.full_name || user.email,
        role: userRole,
        email: user.email,
      },
    })

    // If role is admin or officer, issue secure signed session cookie for dashboard access
    if (userRole === 'admin' || userRole === 'officer') {
      const sessionToken = await createSessionToken(userRole)
      response.cookies.set('kotaku_admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return response
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    )
  }
}
