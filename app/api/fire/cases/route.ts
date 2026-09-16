// ============================================================
// KotaKu Siaga — Fire Investigation Cases API Route
// GET: Fetch correlated investigation cases
// POST: Re-run correlation engine and return cases
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { localFireStore } from '@/lib/services/local-fire-store'
import { fireCorrelationEngine } from '@/lib/services/fire-correlation-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const district = searchParams.get('district') || undefined
    const limitStr = searchParams.get('limit')
    const limit = limitStr ? parseInt(limitStr, 10) : 50

    const cases = localFireStore.getCases({
      status,
      priority,
      district,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: cases,
      count: cases.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Error fetching fire investigation cases:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch fire investigation cases' },
      { status: 500 }
    )
  }
}

export async function POST(_req: NextRequest) {
  try {
    const result = await fireCorrelationEngine.executeCorrelation()
    const cases = localFireStore.getCases()

    return NextResponse.json({
      success: true,
      data: cases,
      processed_observations: result.processed_observations,
      generated_count: result.generated_cases.length,
      message: 'Fire correlation engine executed successfully.',
    })
  } catch (err: any) {
    console.error('Error executing fire correlation:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to execute fire correlation' },
      { status: 500 }
    )
  }
}
