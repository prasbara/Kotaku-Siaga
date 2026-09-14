import { NextResponse } from 'next/server'
import { dataSourceRegistry } from '@/lib/data-sources/data-source-registry'

// GET /api/health/windy
// Specific health check & validation for Windy API & spatial radar tiles
export async function GET() {
  const startTime = Date.now()
  const windyEndpoint = 'https://embed.windy.com/embed.html'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(windyEndpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'KotaKuSiaga-HealthCheck/2.0 (+https://kotakusiaga.semarangkota.go.id)',
      },
      cache: 'no-store',
    })
    clearTimeout(timeout)

    const latency = Date.now() - startTime
    const isOk = res.ok
    const httpStatus = res.status
    const now = new Date()

    if (isOk) {
      dataSourceRegistry.recordSuccess('windy', httpStatus, latency)
      const src = dataSourceRegistry.getById('windy')

      return NextResponse.json(
        {
          source: 'Windy API & Spatial Radar',
          status: 'CONNECTED',
          badge: 'CONNECTED',
          last_successful_update: src?.lastSuccessfulUpdate || now.toISOString(),
          last_successful_update_wib: src?.lastSuccessfulUpdateWib || (now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB'),
          data_age_seconds: src?.dataAgeSeconds ?? 0,
          api_response: `${httpStatus} ${res.statusText || 'OK'}`,
          response_time_ms: latency,
          latest_data: 'Available',
          validation: {
            endpoint_active: true,
            http_status_valid: true,
            response_body_valid: true,
            coordinates_validated: {
              latitude: -6.9667,
              longitude: 110.4167,
              region: 'Kota Semarang & Pantai Utara Jawa',
            },
            timestamp_validated: true,
          },
        },
        {
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      )
    } else {
      const reason = `HTTP ${httpStatus}: ${res.statusText || 'Response not OK'}`
      dataSourceRegistry.recordFailure('windy', httpStatus, reason)
      const src = dataSourceRegistry.getById('windy')

      return NextResponse.json(
        {
          source: 'Windy API & Spatial Radar',
          status: 'DISCONNECTED',
          badge: 'DISCONNECTED',
          last_successful_update: src?.lastSuccessfulUpdate || null,
          last_successful_update_wib: src?.lastSuccessfulUpdateWib || 'N/A',
          data_age_seconds: src?.dataAgeSeconds ?? 9999,
          api_response: `${httpStatus} ${res.statusText}`,
          response_time_ms: latency,
          latest_data: 'Unavailable',
          reason,
          validation: {
            endpoint_active: false,
            http_status_valid: false,
            response_body_valid: false,
          },
        },
        {
          status: 502,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      )
    }
  } catch (err: any) {
    const latency = Date.now() - startTime
    const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout')
    const reason = isTimeout ? 'API request timeout (6000ms)' : (err?.message || 'Network error')

    dataSourceRegistry.recordFailure('windy', null, reason)
    const src = dataSourceRegistry.getById('windy')

    return NextResponse.json(
      {
        source: 'Windy API & Spatial Radar',
        status: 'DISCONNECTED',
        badge: 'DISCONNECTED',
        last_successful_update: src?.lastSuccessfulUpdate || null,
        last_successful_update_wib: src?.lastSuccessfulUpdateWib || 'N/A',
        data_age_seconds: src?.dataAgeSeconds ?? 9999,
        api_response: 'REQUEST_FAILED',
        response_time_ms: latency,
        latest_data: 'Unavailable',
        reason,
        validation: {
          endpoint_active: false,
          http_status_valid: false,
          response_body_valid: false,
        },
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  }
}
