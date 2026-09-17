import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

function clearAllAuthCookies(request: NextRequest, response: NextResponse) {
  // 1. Explicitly clear custom admin session cookie
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  // Also call delete for compatibility
  response.cookies.delete(SESSION_COOKIE_NAME)

  // 2. Scan and clear any Supabase session cookies (sb-*-auth-token, etc.)
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('auth-token') ||
      cookie.name.includes('supabase') ||
      cookie.name === 'kotaku_admin_session'
    ) {
      response.cookies.set(cookie.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      response.cookies.delete(cookie.name)
    }
  }

  // 3. Set anti-caching headers to defeat bfcache (Back/Forward Cache)
  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
}

export async function POST(request: NextRequest) {
  try {
    // Attempt Supabase server-side session invalidation
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch (sbErr) {
      // Gracefully continue even if Supabase client errors or is unconfigured
      console.warn('Supabase signOut notice:', sbErr)
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesi administrator berhasil diakhiri.',
      redirect: '/login?logout=success',
    })

    clearAllAuthCookies(request, response)
    return response
  } catch (err: any) {
    console.error('Logout error:', err)
    const fallbackRes = NextResponse.json(
      { success: false, error: 'Gagal mengakhiri sesi sepenuhnya, tetap diarahkan keluar.' },
      { status: 500 }
    )
    clearAllAuthCookies(request, fallbackRes)
    return fallbackRes
  }
}

export async function GET(request: NextRequest) {
  try {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignore
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('logout', 'success')
    const response = NextResponse.redirect(url)

    clearAllAuthCookies(request, response)
    return response
  } catch {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
}
