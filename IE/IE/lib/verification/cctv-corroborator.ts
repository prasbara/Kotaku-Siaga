// ============================================================
// KotaKu Siaga — CCTV Corroboration Engine
// Connects report coordinates to nearest PantauSemar CCTV point (70 real cameras)
// ============================================================

import { PANTAUSEMAR_CCTV_POINTS, type CCTVPoint } from '@/lib/data/cctv-pantausemar'
import { calculateDistanceMeters } from './geo-validator'
import type { CCTVCorroborationResult } from './types'

export const CCTV_MAX_CORROBORATION_RADIUS_METERS = 1000 // 1 km radius for visual context

export function findNearestCCTV(
  latitude: number,
  longitude: number
): CCTVCorroborationResult {
  if (!PANTAUSEMAR_CCTV_POINTS || PANTAUSEMAR_CCTV_POINTS.length === 0) {
    return {
      cctvEvidence: 'unavailable',
      nearestCctv: null,
    }
  }

  let closestCctv: CCTVPoint | null = null
  let minDistance = Infinity

  for (const cctv of PANTAUSEMAR_CCTV_POINTS) {
    const dist = calculateDistanceMeters(latitude, longitude, cctv.latitude, cctv.longitude)
    if (dist < minDistance) {
      minDistance = dist
      closestCctv = cctv
    }
  }

  if (!closestCctv || minDistance > CCTV_MAX_CORROBORATION_RADIUS_METERS) {
    return {
      cctvEvidence: 'none_nearby',
      nearestCctv: closestCctv
        ? {
            id: closestCctv.id,
            code: closestCctv.code,
            name: closestCctv.name,
            category: closestCctv.categoryLabel,
            district: closestCctv.district,
            distanceMeters: Math.round(minDistance),
            streamUrl: closestCctv.streamUrl,
          }
        : null,
    }
  }

  return {
    cctvEvidence: 'corroborated',
    nearestCctv: {
      id: closestCctv.id,
      code: closestCctv.code,
      name: closestCctv.name,
      category: closestCctv.categoryLabel,
      district: closestCctv.district,
      distanceMeters: Math.round(minDistance),
      streamUrl: closestCctv.streamUrl,
    },
  }
}
