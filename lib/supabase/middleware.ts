import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyAdminSessionToken } from '@/lib/auth/session'
import { getSupabaseUrl, getSupabaseAnonKey } from './config'

export async function updateSession(request: NextRequest) {
  // If not visiting dashboard or command center, return immediately
  if (
    !request.nextUrl.pathname.startsWith('/dashboard') &&
    !request.nextUrl.pathname.startsWith('/command-center')
  ) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    let adminSession = false
    try {
      const adminSessionCookie = request.cookies.get('kotaku_admin_session')?.value
      adminSession = !!(await verifyAdminSessionToken(adminSessionCookie))
    } catch {
      adminSession = false
    }

    if (!supabaseUrl || !supabaseUrl.startsWith('http') || !supabaseAnonKey || supabaseAnonKey.includes('your_')) {
      if (!adminSession) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

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
              // Ignore cookie setting errors
            }
          },
        },
      }
    )

    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch {
      user = null
    }

    // Protect dashboard routes
    if (!adminSession && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  } catch (err) {
    console.error('Middleware updateSession error:', err)
  }

  return supabaseResponse
}
