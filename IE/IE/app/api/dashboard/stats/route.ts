import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { localReportStore } from '@/lib/services/local-report-store'

// GET /api/dashboard/stats — dashboard statistics
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const localStats = localReportStore.getStats()
    return NextResponse.json({
      success: true,
      ...localStats,
      is_local_store: true,
    })
  }

  try {
    const supabase = await createAdminClient()

    // PRODUCTION: showDemo defaults to false.
    // Demo data is only included when explicitly requested via ?demo=true AND only in non-production environments.
    const demoParam = request.nextUrl.searchParams.get('demo')
    const showDemo = demoParam === 'true' && process.env.NODE_ENV !== 'production'

    // Build base query
    let query = supabase.from('reports').select('*', { count: 'exact' })
    if (!showDemo) {
      // Production default: exclude demo data
      query = query.eq('is_demo', false)
    }

    const { data: reports, error } = await query

    if (error) {
      console.error('GET /api/dashboard/stats database error:', error.message)
      return NextResponse.json(
        { error: 'Database not configured or unavailable.', detail: error.message },
        { status: 503 }
      )
    }

    const all = reports || []

    const total = all.length
    const active = all.filter(r => !['resolved', 'rejected', 'duplicate'].includes(r.status)).length
    const critical = all.filter(r => r.urgency === 'kritis' || r.urgency === 'critical').length
    const resolved = all.filter(r => r.status === 'resolved').length

    // Category distribution
    const categoryCount: Record<string, number> = {}
    for (const r of all) {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1
    }

    // Urgency distribution
    const urgencyCount: Record<string, number> = {}
    for (const r of all) {
      urgencyCount[r.urgency] = (urgencyCount[r.urgency] || 0) + 1
    }

    // Status distribution
    const statusCount: Record<string, number> = {}
    for (const r of all) {
      statusCount[r.status] = (statusCount[r.status] || 0) + 1
    }

    // Trend last 30 days
    const trend: Record<string, { count: number; critical: number }> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      trend[key] = { count: 0, critical: 0 }
    }

    for (const r of all) {
      const key = (r.created_at || new Date().toISOString()).split('T')[0]
      if (trend[key]) {
        trend[key].count++
        if (r.urgency === 'kritis' || r.urgency === 'critical') trend[key].critical++
      }
    }

    const trendData = Object.entries(trend).map(([date, vals]) => ({
      date,
      count: vals.count,
      critical: vals.critical,
    }))

    return NextResponse.json({
      success: true,
      stats: { total, active, critical, resolved },
      categories: categoryCount,
      urgencies: urgencyCount,
      statuses: statusCount,
      trend: trendData,
      is_demo_included: showDemo,
    })
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error)
    // PRODUCTION: Do NOT return fake/fallback statistics on error.
    // Return explicit error so operators know the database is unavailable.
    return NextResponse.json(
      { error: 'Database not configured or unavailable.' },
      { status: 503 }
    )
  }
}
