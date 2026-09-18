import { NextRequest, NextResponse } from 'next/server'
import { isRequestAuthorizedAdmin } from '@/lib/auth/session'
import { getRecentSecurityLogs, getSecurityAlerts } from '@/lib/audit/security-logger'

export async function GET(request: NextRequest) {
  // Guard: strictly authorized operators/admins
  const isAuthorized = await isRequestAuthorizedAdmin(request)
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Akses ditolak: Hanya administrator atau operator yang dapat melihat log audit keamanan.' },
      { status: 401 }
    )
  }

  const { searchParams } = request.nextUrl
  const onlyAlerts = searchParams.get('alerts') === 'true'
  const limit = parseInt(searchParams.get('limit') || '50', 10)

  try {
    const logs = onlyAlerts
      ? await getSecurityAlerts(limit)
      : await getRecentSecurityLogs({ limit })

    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs,
    })
  } catch (err) {
    console.error('Failed to retrieve security audit logs:', err)
    return NextResponse.json(
      { error: 'Gagal mengambil log audit keamanan.' },
      { status: 500 }
    )
  }
}
