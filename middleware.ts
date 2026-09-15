import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (error) {
    console.error('Middleware caught error, gracefully bypassing:', error)
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match dashboard protected routes, command center, and auth routes.
     * Prevents running heavyweight auth middleware on public static/CDN assets.
     */
    '/dashboard/:path*',
    '/command-center',
    '/command-center/:path*',
  ],
}
