// ============================================================
// KotaKu Siaga — Crowd Corroboration Engine
// Correlates citizen reports within 300 meters and 30 minutes
// ============================================================

import { calculateDistanceMeters } from './geo-validator'
import type { CrowdCorroborationResult } from './types'

export const CORROBORATION_RADIUS_METERS = 300
export const CORROBORATION_TIME_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

export function checkCrowdCorroboration(
  latitude: number,
  longitude: number,
  reportTimeMs: number,
  existingReports: Array<{
    id: string
    report_code: string
    latitude: number
    longitude: number
    lat?: number
    lng?: number
    created_at: string
    category?: string
  }>,
  currentCategory?: string
): CrowdCorroborationResult {
  const matchedCodes: string[] = []

  for (const report of existingReports) {
    const repLat = report.lat ?? report.latitude
    const repLng = report.lng ?? report.longitude
    if (typeof repLat !== 'number' || typeof repLng !== 'number') continue

    // Distance check
    const dist = calculateDistanceMeters(latitude, longitude, repLat, repLng)
    if (dist > CORROBORATION_RADIUS_METERS) continue

    // Time window check
    const existingTimeMs = new Date(report.created_at).getTime()
    const diffMs = Math.abs(reportTimeMs - existingTimeMs)
    if (diffMs > CORROBORATION_TIME_WINDOW_MS) continue

    matchedCodes.push(report.report_code || report.id)
  }

  const count = matchedCodes.length
  let level: 'none' | 'signal' | 'strong' = 'none'

  if (count >= 2) {
    level = 'strong'
  } else if (count === 1) {
    level = 'signal'
  }

  return {
    corroborationFound: count > 0,
    corroboratingCount: count,
    corroboratingReportCodes: matchedCodes,
    corroborationLevel: level,
  }
}
