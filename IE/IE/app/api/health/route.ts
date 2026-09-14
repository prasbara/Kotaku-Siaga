import { NextRequest, NextResponse } from 'next/server'
import { dataSourceRegistry } from '@/lib/data-sources/data-source-registry'

// GET /api/health
// General system health & high-level data sources connectivity check
export async function GET(request: NextRequest) {
  const shouldPing = request.nextUrl.searchParams.get('ping') === 'true'

  if (shouldPing) {
    await dataSourceRegistry.pingAllSources()
  }

  const allSources = dataSourceRegistry.getAll()
  const sourcesMap: Record<string, { status: string; last_update: string | null; age_seconds: number }> = {}

  let hasDisconnected = false
  let hasDegraded = false

  for (const src of allSources) {
    sourcesMap[src.id] = {
      status: src.status.toLowerCase(),
      last_update: src.lastSuccessfulUpdate,
      age_seconds: src.dataAgeSeconds,
    }

    if (src.status === 'DISCONNECTED' || src.status === 'ERROR') {
      hasDisconnected = true
    } else if (src.status === 'DEGRADED' || src.freshness === 'STALE' || src.freshness === 'VERY_STALE') {
      hasDegraded = true
    }
  }

  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = hasDisconnected
    ? 'degraded'
    : hasDegraded
    ? 'degraded'
    : 'healthy'

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      timestamp_wib:
        new Date().toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB',
      environment: process.env.NODE_ENV || 'production',
      data_mode: 'PRODUCTION_DATA_ONLY',
      uptime_seconds: Math.round(process.uptime()),
      memory_usage: {
        rss_mb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
      },
      sources: sourcesMap,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
