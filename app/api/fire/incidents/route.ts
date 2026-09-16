// ============================================================
// KotaKu Siaga — Verified Fire Incidents API Route
// GET: Fetch verified fire incidents for command center & maps
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { localFireStore } from '@/lib/services/local-fire-store'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const district = searchParams.get('district') || undefined
    const severity = searchParams.get('severity') || undefined
    const limitStr = searchParams.get('limit')
    const limit = limitStr ? parseInt(limitStr, 10) : 50

    const incidents = localFireStore.getIncidents({
      status,
      district,
      severity,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: incidents,
      count: incidents.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Error fetching fire incidents:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch fire incidents' },
      { status: 500 }
    )
  }
}
