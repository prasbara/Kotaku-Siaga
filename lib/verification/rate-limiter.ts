// ============================================================
// KotaKu Siaga — Rate Limiter (In-Memory Sliding Window)
// Configuration: REPORT_RATE_LIMIT (default: 3)
//                REPORT_RATE_WINDOW (default: 900 seconds / 15 min)
// ============================================================

interface RateLimitRecord {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Periodic garbage collection every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const windowMs = (parseInt(process.env.REPORT_RATE_WINDOW || '900', 10) || 900) * 1000
    for (const [ip, record] of rateLimitStore.entries()) {
      const activeTimestamps = record.timestamps.filter((ts) => now - ts < windowMs)
      if (activeTimestamps.length === 0) {
        rateLimitStore.delete(ip)
      } else {
        record.timestamps = activeTimestamps
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  allowed: boolean
  currentCount: number
  maxLimit: number
  windowSeconds: number
  remaining: number
  resetInSeconds: number
}

export function checkRateLimit(clientIp: string): RateLimitResult {
  const maxLimit = parseInt(process.env.REPORT_RATE_LIMIT || '3', 10) || 3
  const windowSeconds = parseInt(process.env.REPORT_RATE_WINDOW || '900', 10) || 900
  const windowMs = windowSeconds * 1000
  const now = Date.now()

  const safeIp = clientIp?.trim() || '127.0.0.1'

  let record = rateLimitStore.get(safeIp)
  if (!record) {
    record = { timestamps: [] }
    rateLimitStore.set(safeIp, record)
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs)

  if (record.timestamps.length >= maxLimit) {
    const oldest = record.timestamps[0]
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))

    return {
      allowed: false,
      currentCount: record.timestamps.length,
      maxLimit,
      windowSeconds,
      remaining: 0,
      resetInSeconds,
    }
  }

  // Register current hit
  record.timestamps.push(now)

  return {
    allowed: true,
    currentCount: record.timestamps.length,
    maxLimit,
    windowSeconds,
    remaining: Math.max(0, maxLimit - record.timestamps.length),
    resetInSeconds: windowSeconds,
  }
}

// Reset rate limit for testing purposes
export function resetRateLimits(): void {
  rateLimitStore.clear()
}
