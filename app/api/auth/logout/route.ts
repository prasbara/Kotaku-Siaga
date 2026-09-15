import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar.' })
  response.cookies.delete('kotaku_admin_session')
  return response
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  const response = NextResponse.redirect(url)
  response.cookies.delete('kotaku_admin_session')
  return response
}
