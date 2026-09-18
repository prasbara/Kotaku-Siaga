// ============================================================
// KotaKu Siaga — Fire Report Status Contract & Single Source of Truth
// Standardized active fire detection criteria:
// ACTIVE FIRE = valid report AND category is fire AND not rejected AND not resolved AND not cancelled
// ============================================================

import type { Report } from '@/types'
import type { FireInvestigationCase, FireObservation } from '@/types/fire'

export const INACTIVE_REPORT_STATUSES = new Set([
  'rejected',
  'resolved',
  'cancelled',
  'closed',
  'duplicate',
  'dismissed',
])

export const INACTIVE_VERIFICATION_STATUSES = new Set([
  'rejected',
  'failed',
])

export const ACTIVE_REPORT_STATUSES = new Set([
  'submitted',
  'under_review',
  'verified',
  'investigating',
  'in_progress',
  'pending',
])

export const INACTIVE_FIRE_CASE_STATUSES = new Set([
  'REJECTED',
  'RESOLVED',
  'DISMISSED',
])

export const ACTIVE_FIRE_CASE_STATUSES = new Set([
  'NEW',
  'UNDER_REVIEW',
  'CORRELATED',
  'VERIFIED',
])

export const INACTIVE_SIGNAL_STATUSES = new Set([
  'RESOLVED',
  'DISMISSED',
])

/**
 * Checks whether any disaster report is currently active (not rejected, resolved, or cancelled).
 */
export function isReportActive(report: Partial<Report> | null | undefined): boolean {
  if (!report) return false
  const status = (report.status || '').toLowerCase().trim()
  const verStatus = (report.verification_status || '').toLowerCase().trim()

  if (INACTIVE_REPORT_STATUSES.has(status)) return false
  if (INACTIVE_VERIFICATION_STATUSES.has(verStatus)) return false

  return ACTIVE_REPORT_STATUSES.has(status) || status === ''
}

/**
 * Checks whether a report is specifically an ACTIVE FIRE REPORT.
 * Returns true ONLY if:
 * 1. Category relates to fire (kebakaran or actual_category === 'kebakaran')
 * 2. Status is NOT rejected, resolved, cancelled, duplicate, or dismissed
 * 3. Verification status is NOT rejected or failed
 */
export function isActiveFireReport(report: Partial<Report> | null | undefined): boolean {
  if (!report) return false

  // Check category and metadata
  const cat = (report.category || '').toLowerCase()
  const meta = report.verification_metadata as Record<string, unknown> | undefined
  const actualCat = typeof meta?.actual_category === 'string' ? meta.actual_category.toLowerCase() : ''
  const incidentDetails =
    meta && typeof meta.incident_details === 'object' && meta.incident_details !== null
      ? (meta.incident_details as Record<string, unknown>)
      : undefined
  const incidentType =
    typeof incidentDetails?.incident_type === 'string'
      ? incidentDetails.incident_type.toLowerCase()
      : ''

  const isFireCategory =
    cat === 'kebakaran' ||
    actualCat === 'kebakaran' ||
    incidentType === 'kebakaran' ||
    (cat === 'lainnya' && (report.description?.toLowerCase().includes('kebakaran') || report.title?.toLowerCase().includes('kebakaran')))

  if (!isFireCategory) return false

  // Strict check on status and verification_status
  return isReportActive(report)
}

/**
 * Filters an array of reports to retain only active fire reports.
 */
export function filterActiveFireReports(reports: Report[]): Report[] {
  if (!Array.isArray(reports)) return []
  return reports.filter(isActiveFireReport)
}

/**
 * Checks whether a Fire Investigation Case is currently active.
 */
export function isFireCaseActive(caseItem: Partial<FireInvestigationCase> | null | undefined): boolean {
  if (!caseItem || !caseItem.status) return false
  return !INACTIVE_FIRE_CASE_STATUSES.has(caseItem.status)
}

/**
 * Checks whether a Fire Observation (NASA FIRMS / satellite) is active.
 */
export function isFireObservationActive(obs: Partial<FireObservation> | null | undefined): boolean {
  if (!obs || !obs.verification_status) return false
  return !INACTIVE_SIGNAL_STATUSES.has(obs.verification_status)
}
