// ============================================================
// KotaKu Siaga — Fire Early Detection Stats Summary API Route
// GET: Real-time telemetry, source health, and case counts
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { localFireStore } from '@/lib/services/local-fire-store'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const stats = await localFireStore.getStatsSummary()

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Error fetching fire stats summary:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch fire stats summary' },
      { status: 500 }
    )
  }
}
