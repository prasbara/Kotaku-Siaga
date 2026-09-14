import { NextRequest, NextResponse } from 'next/server'
import {
  getOpenRouterTelemetry,
  testOpenRouterConnection,
  OPENROUTER_KEYS_POOL,
} from '@/lib/ai/openrouter'
import { dataSourceRegistry } from '@/lib/data-sources/data-source-registry'

// GET /api/health/ai
// Real-time telemetry, multi-key status, latency, token usage, and outage state for OpenRouter AI
export async function GET(request: NextRequest) {
  const shouldTest = request.nextUrl.searchParams.get('test') === 'true'

  if (shouldTest) {
    const testResult = await testOpenRouterConnection()
    if (testResult.success) {
      dataSourceRegistry.recordSuccess('openrouter_ai', 200, testResult.latencyMs)
    } else {
      dataSourceRegistry.recordFailure('openrouter_ai', 503, testResult.message)
    }
  }

  const telemetry = getOpenRouterTelemetry()

  // Honest status
  const isAvailable = telemetry.status === 'CONNECTED' || telemetry.status === 'DEGRADED'

  const payload = {
    provider: telemetry.provider,
    status: telemetry.status,
    badge: isAvailable ? 'CONNECTED' : 'UNAVAILABLE',
    model: telemetry.model,
    active_key: {
      index: telemetry.activeKeyIndex + 1,
      total_keys: OPENROUTER_KEYS_POOL.length,
      masked: telemetry.activeKeyMasked,
      is_primary: telemetry.activeKeyIndex === 0,
    },
    keys_pool: telemetry.keysStatus.map((k) => ({
      key_number: k.index + 1,
      label: k.isPrimary ? 'Primary Key' : `Fallback Key #${k.index}`,
      masked: k.masked,
      status: k.lastTestedStatus,
    })),
    last_request: telemetry.lastRequestAt,
    last_successful_response: telemetry.lastSuccessfulResponseAt,
    latency_seconds: Number((telemetry.latencyMs / 1000).toFixed(2)),
    latency_ms: telemetry.latencyMs,
    requests_today: telemetry.requestsToday,
    failed_requests: telemetry.failedRequests,
    failure_rate: telemetry.failureRate,
    token_usage: telemetry.tokenUsage,
    estimated_cost_usd: `$${telemetry.estimatedCostUsd.toFixed(4)}`,
    last_error: telemetry.lastError,
  }

  return NextResponse.json(payload, {
    status: isAvailable ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
