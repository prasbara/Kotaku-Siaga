import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const identifier = (body.email || body.username || '').trim().toLowerCase()
    const password = body.password || ''

    // 1. Cek Kredensial Super Admin Khusus
    if (
      (identifier === 'admin' || identifier === 'admin@kotakusiaga.id') &&
      password === 'superadmin.'
    ) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: 'admin-super-001',
          name: 'Super Administrator',
          role: 'admin',
          email: 'admin@kotakusiaga.id',
        },
      })

      // Set cookie session admin (berlaku 7 hari)
      response.cookies.set('kotaku_admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })

      return response
    }

    // 2. Jika bukan admin built-in, coba Supabase Auth
    // PRODUCTION: Always attempt Supabase auth when credentials are provided.
    // If Supabase is not configured, auth will fail gracefully and return 401.
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      })
      if (!error && data?.user) {
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email,
            role: 'user',
            email: data.user.email,
          },
        })
      }
    } catch (authErr) {
      console.warn('Supabase auth attempt failed:', authErr)
    }

    return NextResponse.json(
      { error: 'Username/email atau password salah.' },
      { status: 401 }
    )
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem.' },
      { status: 500 }
    )
  }
}
