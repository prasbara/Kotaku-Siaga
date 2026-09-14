import { NextRequest, NextResponse } from 'next/server'
import { dataSourceRegistry } from '@/lib/data-sources/data-source-registry'

// GET /api/health/data-sources
// Returns full registry of data sources, health metrics, outages, and charts data
export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')
  const sourceId = request.nextUrl.searchParams.get('sourceId')

  if (action === 'ping' && sourceId) {
    await dataSourceRegistry.pingSource(sourceId)
  } else if (action === 'ping_all') {
    await dataSourceRegistry.pingAllSources()
  }

  const sources = dataSourceRegistry.getAll()
  const outages = dataSourceRegistry.getOutages()

  const summary = {
    total: sources.length,
    connected: sources.filter((s) => s.status === 'CONNECTED').length,
    degraded: sources.filter((s) => s.status === 'DEGRADED').length,
    stale: sources.filter((s) => s.freshness === 'STALE' || s.freshness === 'VERY_STALE').length,
    disconnected: sources.filter((s) => s.status === 'DISCONNECTED' || s.status === 'ERROR').length,
    openOutages: outages.filter((o) => o.status === 'OPEN').length,
    overallHealthPercent: Number(
      (
        (sources.filter((s) => s.status === 'CONNECTED').length / (sources.length || 1)) *
        100
      ).toFixed(1)
    ),
  }

  return NextResponse.json(
    {
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      sources,
      outages,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}

// POST /api/health/data-sources
// Trigger live ping/re-check of all or single source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const sourceId = body.sourceId

    if (sourceId) {
      const updated = await dataSourceRegistry.pingSource(sourceId)
      return NextResponse.json({ success: true, updatedSource: updated })
    }

    const updatedAll = await dataSourceRegistry.pingAllSources()
    return NextResponse.json({ success: true, sources: updatedAll })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to ping sources' },
      { status: 500 }
    )
  }
}
