import { NextRequest } from 'next/server'

// ============================================================
// KotaKu Siaga — Role-Based Access Control (RBAC) & Cryptographic Session Manager
// Roles: 'public' (Warga) | 'officer' (Petugas Lapangan) | 'admin' (Operator EOC)
// Enforces Section 1 & Section 13: Raw Data -> Admin -> Analysis -> Public-Safe -> Warga
// Uses Web Crypto API (Node.js & Edge Runtime compatible)
// ============================================================

export type UserRole = 'public' | 'officer' | 'admin'

export const SESSION_COOKIE_NAME = 'kotaku_admin_session'
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
 * Creates a cryptographically signed session token for a specific role.
 * Format: <role>:<timestamp>:<hmac>
 */
export async function createSessionToken(role: 'admin' | 'officer' = 'admin'): Promise<string> {
  const timestamp = Date.now().toString()
  const payload = `${role}:${timestamp}`
  const key = await getHmacKey(getSessionSecret())
  const sigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(payload))
  const signature = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}:${signature}`
}

/** Legacy alias */
export async function createAdminSessionToken(): Promise<string> {
  return createSessionToken('admin')
}

/**
 * Verifies that a session token is valid, untampered, and returns the verified role.
 */
export async function verifySessionToken(
  token?: string | null
): Promise<{ valid: boolean; role: UserRole }> {
  if (!token || typeof token !== 'string') {
    return { valid: false, role: 'public' }
  }

  let raw = token
  try {
    raw = decodeURIComponent(token)
  } catch {
    raw = token
  }

  const parts = raw.split(':')
  if (parts.length !== 3) {
    return { valid: false, role: 'public' }
  }

  const [role, timestampStr, signature] = parts
  if (role !== 'admin' && role !== 'officer') {
    return { valid: false, role: 'public' }
  }

  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) {
    return { valid: false, role: 'public' }
  }

  // Check expiration (7 days)
  const now = Date.now()
  if (now < timestamp || now - timestamp > SESSION_MAX_AGE_MS) {
    return { valid: false, role: 'public' }
  }

  try {
    const key = await getHmacKey(getSessionSecret())
    const payload = `${role}:${timestampStr}`
    const expectedSigBuf = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const expectedSig = Array.from(new Uint8Array(expectedSigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    if (signature.length !== expectedSig.length) return { valid: false, role: 'public' }
    let diff = 0
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i)
    }

    if (diff === 0) {
      return { valid: true, role: role as 'admin' | 'officer' }
    }
    return { valid: false, role: 'public' }
  } catch {
    return { valid: false, role: 'public' }
  }
}

/** Legacy alias */
export async function verifyAdminSessionToken(token?: string | null): Promise<boolean> {
  const result = await verifySessionToken(token)
  return result.valid && result.role === 'admin'
}

/**
 * Extracts and verifies the user's role from request cookies or Authorization Bearer header.
 */
export async function getUserRole(request: NextRequest | Request): Promise<UserRole> {
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
        if (diff === 0) return 'admin'
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
    const verified = await verifySessionToken(cookieVal)
    if (verified.valid) {
      return verified.role
    }
  }

  return 'public'
}

/** Checks if a request has admin authorization */
export async function isRequestAuthorizedAdmin(request: NextRequest | Request): Promise<boolean> {
  const role = await getUserRole(request)
  return role === 'admin'
}

/**
 * Strips confidential/operator-only data from citizen reports when served to PUBLIC role.
 * Removes honeypot flags, IP, phone, exact reporter emails, and internal moderation notes.
 */
export function sanitizeReportForRole(report: any, role: UserRole): any {
  if (role === 'admin' || role === 'officer') {
    return report // Full access for operators & field officers
  }

  // PUBLIC-SAFE SANITIZATION:
  const {
    website,
    company,
    phoneNumberConfirm,
    honeypot_triggered,
    client_ip,
    reporter_phone,
    reporter_email,
    internal_notes,
    raw_telemetry,
    ...publicFields
  } = report

  return {
    ...publicFields,
    // Mask citizen identifier for privacy
    reporter_name: publicFields.reporter_name
      ? `${publicFields.reporter_name.slice(0, 1)}***`
      : 'Warga Semarang',
  }
}

/**
 * Strips internal risk scoring weights, formulas, and sensor debug logs for public requests.
 */
export function sanitizeDisasterAssessmentForRole(assessment: any, role: UserRole): any {
  if (role === 'admin' || role === 'officer') {
    return assessment // Full analytical transparency for operators
  }

  // PUBLIC-SAFE INFORMATION (Requirement #1 & #12):
  return {
    areaId: assessment.areaId,
    areaName: assessment.areaName,
    currentRiskLevel: assessment.currentRiskLevel,
    riskScore: assessment.riskScore,
    simpleConfidence: assessment.simpleConfidence,
    rainfall: assessment.rainfallSummary,
    coastalRisk: assessment.coastalRiskSummary,
    recommendations: assessment.publicRecommendations,
    whySummary: assessment.whySummary,
    roadsToAvoid: assessment.roadsToAvoid,
    nearbyFacilities: assessment.nearbyFacilities,
    lastUpdate: assessment.lastUpdate,
    lastUpdateWib: assessment.lastUpdateWib,
  }
}
