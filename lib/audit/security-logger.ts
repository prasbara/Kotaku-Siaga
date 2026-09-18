// ============================================================
// KotaKu Siaga — Security Audit Logger & SOC Threat Detection
// Centralized security event pipeline for authentication,
// authorization denials, account locking, and anomaly alerts.
//
// STRICT POLICIES:
// 1. NEVER log plaintext passwords, session tokens, or API secrets.
// 2. Generic user-facing responses to prevent username enumeration.
// 3. Automated threat detection for repeated failures & critical accounts.
// ============================================================

import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import crypto from 'crypto'

export type SecurityEventType =
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_SUCCESS_AUTHORIZATION_DENIED'
  | 'AUTH_ACCOUNT_BLOCKED'
  | 'AUTH_RATE_LIMITED'

export type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SecurityEventPayload {
  event: SecurityEventType
  identifier: string // Sanitized username or email
  success: boolean
  reason?: string // invalid_credentials, user_not_found, insufficient_role_citizen, account_locked
  severity?: SecuritySeverity
  source_ip?: string
  user_agent?: string
  correlation_id?: string
  environment?: string
  metadata?: Record<string, unknown>
}

export interface SecurityAuditRecord extends SecurityEventPayload {
  id: string
  created_at: string
  alert_triggered: boolean
  alert_details?: {
    type: string
    message: string
    timestamp: string
    risk_level: SecuritySeverity
  }
}

// In-memory circular buffer for fast local querying & fallback resilience (last 150 events)
const inMemoryAuditLogs: SecurityAuditRecord[] = []
const MAX_IN_MEMORY_LOGS = 150

// Track recent failures for rate/brute force anomaly detection (keyed by identifier / IP)
interface FailureTracker {
  count: number
  firstFailure: number
  lastFailure: number
}
const failureTracker = new Map<string, FailureTracker>()
const BRUTE_FORCE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const BRUTE_FORCE_THRESHOLD = 3

// Privileged critical accounts requiring elevated monitoring
const PRIVILEGED_IDENTIFIERS = new Set([
  'operator.siaga',
  'operator.siaga@kotakusiaga.id',
  'petugas.soc',
  'petugas.soc@kotakusiaga.id',
  'admin@kotakusiaga.id',
  'admin',
])

/**
 * Sanitize an identifier: lowercase, trim, remove unexpected characters,
 * NEVER store passwords or secrets.
 */
export function sanitizeIdentifier(identifier: string): string {
  if (!identifier) return 'anonymous'
  return identifier
    .trim()
    .toLowerCase()
    .slice(0, 100)
    .replace(/[^\w.@+-]/g, '')
}

/**
 * Core security logging function.
 * Evaluates detection rules, emits SOC alerts, and records to both
 * PostgreSQL (security_audit_logs) and the in-memory fallback buffer.
 */
export async function logSecurityEvent(payload: SecurityEventPayload): Promise<SecurityAuditRecord> {
  const eventId = crypto.randomUUID()
  const timestamp = new Date().toISOString()
  const env = payload.environment || process.env.NODE_ENV || 'production'
  const sanitizedId = sanitizeIdentifier(payload.identifier)
  const clientIp = payload.source_ip || 'unknown'
  const isPrivileged = PRIVILEGED_IDENTIFIERS.has(sanitizedId)

  // 1. Evaluate Severity & Threat Rules
  let severity: SecuritySeverity = payload.severity || 'LOW'
  let alertTriggered = false
  let alertDetails: SecurityAuditRecord['alert_details'] = undefined

  if (payload.event === 'AUTH_LOGIN_FAILED') {
    // Elevate severity if targeting privileged administrative/operator accounts
    if (isPrivileged) {
      severity = 'HIGH'
      alertTriggered = true
      alertDetails = {
        type: 'PRIVILEGED_ACCOUNT_AUTH_FAILURE',
        message: `Percobaan login gagal terdeteksi pada akun operasional kritis (${sanitizedId}) dari IP ${clientIp}.`,
        timestamp,
        risk_level: 'HIGH',
      }
    } else {
      severity = 'MEDIUM'
    }

    // Check brute-force pattern across IP and Identifier
    const trackingKey = `${clientIp}:${sanitizedId}`
    const now = Date.now()
    const currentTracker = failureTracker.get(trackingKey) || {
      count: 0,
      firstFailure: now,
      lastFailure: now,
    }

    if (now - currentTracker.firstFailure > BRUTE_FORCE_WINDOW_MS) {
      currentTracker.count = 1
      currentTracker.firstFailure = now
    } else {
      currentTracker.count += 1
    }
    currentTracker.lastFailure = now
    failureTracker.set(trackingKey, currentTracker)

    if (currentTracker.count >= BRUTE_FORCE_THRESHOLD) {
      severity = 'CRITICAL'
      alertTriggered = true
      alertDetails = {
        type: 'BRUTE_FORCE_ANOMALY_DETECTED',
        message: `Terdeteksi ${currentTracker.count} kali percobaan login gagal beruntun dalam 5 menit dari IP ${clientIp} untuk akun ${sanitizedId}.`,
        timestamp,
        risk_level: 'CRITICAL',
      }
    }
  } else if (payload.event === 'AUTH_ACCOUNT_BLOCKED') {
    severity = 'HIGH'
    alertTriggered = true
    alertDetails = {
      type: 'BLOCKED_ACCOUNT_ACCESS_ATTEMPT',
      message: `Percobaan login pada akun yang dinonaktifkan/dikunci: ${sanitizedId}`,
      timestamp,
      risk_level: 'HIGH',
    }
  } else if (payload.event === 'AUTH_SUCCESS_AUTHORIZATION_DENIED') {
    // Case C: Authenticated, but role does not possess operator dashboard access
    severity = 'LOW'
  }

  // Strip any accidental password or sensitive fields from metadata
  const safeMetadata: Record<string, unknown> = {}
  if (payload.metadata) {
    for (const [key, value] of Object.entries(payload.metadata)) {
      if (
        !key.toLowerCase().includes('pass') &&
        !key.toLowerCase().includes('secret') &&
        !key.toLowerCase().includes('token') &&
        !key.toLowerCase().includes('key')
      ) {
        safeMetadata[key] = value
      }
    }
  }

  const record: SecurityAuditRecord = {
    id: eventId,
    event: payload.event,
    identifier: sanitizedId,
    success: payload.success,
    reason: payload.reason || (payload.success ? 'success' : 'invalid_credentials'),
    severity,
    source_ip: clientIp,
    user_agent: payload.user_agent ? payload.user_agent.slice(0, 255) : undefined,
    correlation_id: payload.correlation_id || crypto.randomUUID().slice(0, 12),
    environment: env,
    alert_triggered: alertTriggered,
    alert_details: alertDetails,
    metadata: safeMetadata,
    created_at: timestamp,
  }

  // 2. Append to In-Memory Ring Buffer
  inMemoryAuditLogs.unshift(record)
  if (inMemoryAuditLogs.length > MAX_IN_MEMORY_LOGS) {
    inMemoryAuditLogs.pop()
  }

  // 3. Structured Standard Logging (Audit-friendly format)
  console.log(
    `[SECURITY_AUDIT] ${record.event} id=${record.identifier} ip=${record.source_ip} severity=${record.severity} alert=${record.alert_triggered} reason=${record.reason}`
  )

  // 4. Asynchronously Persist to Supabase Database (if configured)
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      const { error } = await supabase.from('security_audit_logs').insert({
        id: record.id,
        event: record.event,
        identifier: record.identifier,
        success: record.success,
        reason: record.reason,
        severity: record.severity,
        source_ip: record.source_ip,
        user_agent: record.user_agent,
        correlation_id: record.correlation_id,
        environment: record.environment,
        alert_triggered: record.alert_triggered,
        alert_details: record.alert_details ? JSON.stringify(record.alert_details) : null,
        metadata: record.metadata,
        created_at: record.created_at,
      })
      if (error) {
        console.warn('[SECURITY_AUDIT] Failed to persist to database:', error.message)
      }
    } catch (dbErr) {
      console.warn('[SECURITY_AUDIT] Database log exception (in-memory buffer preserved):', dbErr)
    }
  }

  return record
}

/**
 * Convenience helper for recording an authentication failure (Case A, B).
 */
export async function recordAuthFailure(params: {
  identifier: string
  source_ip?: string
  user_agent?: string
  correlation_id?: string
  reason?: 'invalid_credentials' | 'user_not_found' | 'rate_limited'
}): Promise<SecurityAuditRecord> {
  return logSecurityEvent({
    event: 'AUTH_LOGIN_FAILED',
    identifier: params.identifier,
    success: false,
    reason: params.reason || 'invalid_credentials',
    source_ip: params.source_ip,
    user_agent: params.user_agent,
    correlation_id: params.correlation_id,
  })
}

/**
 * Convenience helper for recording successful authentication.
 */
export async function recordAuthSuccess(params: {
  identifier: string
  role: string
  source_ip?: string
  user_agent?: string
  correlation_id?: string
}): Promise<SecurityAuditRecord> {
  // Clear brute force tracker on successful authentication
  const sanitizedId = sanitizeIdentifier(params.identifier)
  const clientIp = params.source_ip || 'unknown'
  failureTracker.delete(`${clientIp}:${sanitizedId}`)

  return logSecurityEvent({
    event: 'AUTH_LOGIN_SUCCESS',
    identifier: params.identifier,
    success: true,
    reason: 'valid_credentials',
    severity: 'LOW',
    source_ip: params.source_ip,
    user_agent: params.user_agent,
    correlation_id: params.correlation_id,
    metadata: { role: params.role },
  })
}

/**
 * Convenience helper for recording authorization denial (Case C: valid credentials but insufficient role).
 */
export async function recordAuthorizationDenied(params: {
  identifier: string
  role: string
  requiredRole: string
  source_ip?: string
  user_agent?: string
  correlation_id?: string
}): Promise<SecurityAuditRecord> {
  return logSecurityEvent({
    event: 'AUTH_SUCCESS_AUTHORIZATION_DENIED',
    identifier: params.identifier,
    success: true, // Authentication passed!
    reason: 'insufficient_role_for_command_center',
    severity: 'LOW',
    source_ip: params.source_ip,
    user_agent: params.user_agent,
    correlation_id: params.correlation_id,
    metadata: {
      user_role: params.role,
      required_role: params.requiredRole,
    },
  })
}

/**
 * Convenience helper for recording blocked/locked account attempt (Case D).
 */
export async function recordAuthBlocked(params: {
  identifier: string
  source_ip?: string
  user_agent?: string
  correlation_id?: string
  reason?: string
}): Promise<SecurityAuditRecord> {
  return logSecurityEvent({
    event: 'AUTH_ACCOUNT_BLOCKED',
    identifier: params.identifier,
    success: false,
    reason: params.reason || 'account_disabled_or_banned',
    severity: 'HIGH',
    source_ip: params.source_ip,
    user_agent: params.user_agent,
    correlation_id: params.correlation_id,
  })
}

/**
 * Retrieve recent security logs with optional filtering.
 */
export async function getRecentSecurityLogs(options: {
  limit?: number
  event?: SecurityEventType
  identifier?: string
  onlyAlerts?: boolean
} = {}): Promise<SecurityAuditRecord[]> {
  const limit = options.limit || 50

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (options.event) query = query.eq('event', options.event)
      if (options.identifier) query = query.eq('identifier', sanitizeIdentifier(options.identifier))
      if (options.onlyAlerts) query = query.eq('alert_triggered', true)

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as SecurityAuditRecord[]
      }
    } catch (err) {
      console.warn('Failed to query DB security logs, using memory buffer:', err)
    }
  }

  // In-memory fallback
  let results = [...inMemoryAuditLogs]
  if (options.event) results = results.filter((r) => r.event === options.event)
  if (options.identifier) {
    const id = sanitizeIdentifier(options.identifier)
    results = results.filter((r) => r.identifier === id)
  }
  if (options.onlyAlerts) results = results.filter((r) => r.alert_triggered)

  return results.slice(0, limit)
}

/**
 * Retrieve active security alerts for the SOC dashboard.
 */
export async function getSecurityAlerts(limit = 20): Promise<SecurityAuditRecord[]> {
  return getRecentSecurityLogs({ limit, onlyAlerts: true })
}
