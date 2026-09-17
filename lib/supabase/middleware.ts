import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyOperatorSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { getSupabaseUrl, getSupabaseAnonKey } from './config'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if route is protected (dashboard, command-center)
  const isProtectedRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/command-center' ||
    pathname.startsWith('/command-center/')

  if (!isProtectedRoute) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    // 1. Verify Cryptographic Operator Session (admin / officer)
    let hasValidOperatorSession = false
    try {
      const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
      if (sessionCookie) {
        const verified = await verifyOperatorSession(sessionCookie)
        hasValidOperatorSession = verified.valid
      }
    } catch {
      hasValidOperatorSession = false
    }

    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()
    const isSupabaseValid =
      !!supabaseUrl &&
      supabaseUrl.startsWith('http') &&
      !!supabaseAnonKey &&
      !supabaseAnonKey.includes('your_')

    // If Supabase is unconfigured, rely strictly on HMAC session cookie
    if (!isSupabaseValid) {
      if (!hasValidOperatorSession) {
        return createUnauthorizedRedirect(request)
      }
      addNoCacheHeaders(supabaseResponse)
      return supabaseResponse
    }

    // 2. Initialize Supabase SSR Client
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              )
              supabaseResponse = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              )
            } catch {
              // Server Component / Readonly
            }
          },
        },
      }
    )

    // 3. Verify Supabase User & Role
    let hasAuthorizedSupabaseUser = false
    try {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (user) {
        const role = user.user_metadata?.role || user.app_metadata?.role
        // Only admin or officer can access dashboard
        if (role === 'admin' || role === 'officer') {
          hasAuthorizedSupabaseUser = true
        }
      }
    } catch {
      hasAuthorizedSupabaseUser = false
    }

    // 4. Enforce Access Control: Either valid HMAC signed session OR authorized Supabase role
    if (!hasValidOperatorSession && !hasAuthorizedSupabaseUser) {
      return createUnauthorizedRedirect(request)
    }

    // 5. Anti-bfcache: Never cache protected administrative views in browser history
    addNoCacheHeaders(supabaseResponse)
    return supabaseResponse
  } catch (err) {
    console.error('Middleware updateSession error:', err)
    return createUnauthorizedRedirect(request)
  }
}

function createUnauthorizedRedirect(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  const redirectResponse = NextResponse.redirect(url)

  // Clear any potentially corrupted or expired session cookies
  redirectResponse.cookies.set(SESSION_COOKIE_NAME, '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  addNoCacheHeaders(redirectResponse)
  return redirectResponse
}

function addNoCacheHeaders(response: NextResponse) {
  response.headers.set(
    'Cache-Control',
    'private, no-cache, no-store, must-revalidate, max-age=0'
  )
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
}
