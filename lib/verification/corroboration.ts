// ============================================================
// KotaKu Siaga — Crowd Corroboration Engine
// Correlates citizen reports within 300 meters and 30 minutes
// ============================================================

import { calculateDistanceMeters } from './geo-validator'
import type { CrowdCorroborationResult } from './types'

export const CORROBORATION_RADIUS_METERS = 300
export const CORROBORATION_TIME_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

// Helper to check category compatibility for duplicate / crowd clustering
function isCategorySimilar(cat1?: string, cat2?: string): boolean {
  if (!cat1 || !cat2) return true
  const c1 = cat1.toLowerCase().trim()
  const c2 = cat2.toLowerCase().trim()
  if (c1 === c2) return true

  const waterGroup = ['banjir', 'genangan', 'rob', 'drainase_tersumbat', 'inundation', 'flood']
  if (waterGroup.includes(c1) && waterGroup.includes(c2)) return true

  const fireGroup = ['kebakaran', 'fire']
  if (fireGroup.includes(c1) && fireGroup.includes(c2)) return true

  const treeGroup = ['pohon_tumbang', 'tree']
  if (treeGroup.includes(c1) && treeGroup.includes(c2)) return true

  return false
}

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
  const suspectedDuplicateCodes: string[] = []

  for (const report of existingReports) {
    const repLat = report.lat ?? report.latitude
    const repLng = report.lng ?? report.longitude
    if (typeof repLat !== 'number' || typeof repLng !== 'number') continue

    // Distance check
    const dist = calculateDistanceMeters(latitude, longitude, repLat, repLng)
    if (dist > CORROBORATION_RADIUS_METERS) continue

    // Time window check (Within 60 minutes for potential duplicate, 30 min for strict corroboration)
    const existingTimeMs = new Date(report.created_at).getTime()
    const diffMs = Math.abs(reportTimeMs - existingTimeMs)
    if (diffMs > 60 * 60 * 1000) continue

    const code = report.report_code || report.id

    if (diffMs <= CORROBORATION_TIME_WINDOW_MS) {
      matchedCodes.push(code)
    }

    if (isCategorySimilar(currentCategory, report.category)) {
      suspectedDuplicateCodes.push(code)
    }
  }

  const count = matchedCodes.length
  let level: 'none' | 'signal' | 'strong' = 'none'

  if (count >= 2) {
    level = 'strong'
  } else if (count === 1) {
    level = 'signal'
  }

  const isPossibleDuplicate = suspectedDuplicateCodes.length > 0

  return {
    corroborationFound: count > 0,
    corroboratingCount: count,
    corroboratingReportCodes: matchedCodes,
    corroborationLevel: level,
    possibleDuplicate: isPossibleDuplicate,
    duplicateReason: isPossibleDuplicate
      ? `Terdeteksi ${suspectedDuplicateCodes.length} laporan dengan kategori serupa dalam radius < 300m (< 60 menit lalu).`
      : undefined,
    suspectedDuplicateCodes: isPossibleDuplicate ? suspectedDuplicateCodes : undefined,
  }
}
