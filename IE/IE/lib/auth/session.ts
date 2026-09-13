import { NextRequest } from 'next/server'

// ============================================================
// KotaKu Siaga — Edge-Compatible Cryptographic Session Manager
// Uses Web Crypto API (supported natively in both Node.js & Edge Runtime)
// ============================================================

const SESSION_COOKIE_NAME = 'kotaku_admin_session'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const enc = new TextEncoder()

function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SEED_SECRET ||
    'kotaku-siaga-production-fallback-key-2026-secure-hmac-seed'
  )
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/**
 * Creates a cryptographically signed admin session token.
 * Format: admin:<timestamp>:<hmac>
 */
export async function createAdminSessionToken(): Promise<string> {
  const timestamp = Date.now().toString()
  const payload = `admin:${timestamp}`
  const key = await getHmacKey(getSessionSecret())
  const sigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const signature = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}:${signature}`
}

/**
 * Verifies that a session token is valid, untampered, and not expired.
 * Supports URL-encoded cookies as well.
 */
export async function verifyAdminSessionToken(token?: string | null): Promise<boolean> {
  if (!token || typeof token !== 'string') return false

  let raw = token
  try {
    raw = decodeURIComponent(token)
  } catch {
    raw = token
  }

  const parts = raw.split(':')
  if (parts.length !== 3) return false

  const [role, timestampStr, signature] = parts
  if (role !== 'admin') return false

  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return false

  // Check expiration (7 days)
  const now = Date.now()
  if (now < timestamp || now - timestamp > SESSION_MAX_AGE_MS) {
    return false
  }

  try {
    const key = await getHmacKey(getSessionSecret())
    const payload = `admin:${timestampStr}`
    const expectedSigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const expectedSig = Array.from(new Uint8Array(expectedSigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    if (signature.length !== expectedSig.length) return false
    let diff = 0
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

/**
 * Checks if a request has admin authorization via:
 * 1. Valid signed session cookie
 * 2. Authorization Bearer header matching INTERNAL_API_KEY, SEED_SECRET, or CRON_SECRET
 */
export async function isRequestAuthorizedAdmin(request: NextRequest | Request): Promise<boolean> {
  // 1. Check Bearer Token in Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    const validTokens = [
      process.env.INTERNAL_API_KEY,
      process.env.SEED_SECRET,
      process.env.CRON_SECRET,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ].filter(Boolean) as string[]

    for (const validToken of validTokens) {
      if (token.length === validToken.length) {
        let diff = 0
        for (let i = 0; i < token.length; i++) {
          diff |= token.charCodeAt(i) ^ validToken.charCodeAt(i)
        }
        if (diff === 0) return true
      }
    }
  }

  // 2. Check Cookie in NextRequest or standard Request
  let cookieVal: string | null = null
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    cookieVal = (request as NextRequest).cookies.get(SESSION_COOKIE_NAME)?.value || null
  }

  if (!cookieVal) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`))
      if (match && match[1]) {
        cookieVal = match[1]
      }
    }
  }

  if (cookieVal) {
    return await verifyAdminSessionToken(cookieVal)
  }

  return false
}
