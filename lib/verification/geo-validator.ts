// ============================================================
// KotaKu Siaga — Geolocation Validator
// Validates coordinates against Kota Semarang administrative bounds & accuracy
// ============================================================

import { STUDY_AREA_CONFIG, SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'
import type { GeoValidationResult } from './types'

// Haversine distance in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function validateGeolocation(
  latitude: number,
  longitude: number,
  accuracyMeters?: number | null
): GeoValidationResult {
  // 1. Basic coordinate sanity check
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return {
      isValid: false,
      isWithinSemarang: false,
      latitude: latitude || 0,
      longitude: longitude || 0,
      accuracyMeters: null,
      accuracyGrade: 'low_confidence',
      nearestDistrict: null,
      distanceToDistrictKm: null,
      warning: 'Nilai koordinat GPS di luar rentang bola bumi yang valid.',
    }
  }

  // 2. Semarang administrative bounding box (with 0.05 deg margin for border buffers)
  const bbox = STUDY_AREA_CONFIG.bbox
  const margin = 0.04
  const isWithinBbox =
    latitude >= bbox.minLat - margin &&
    latitude <= bbox.maxLat + margin &&
    longitude >= bbox.minLng - margin &&
    longitude <= bbox.maxLng + margin

  // 3. Find nearest Kecamatan center
  let nearestDistrict: string | null = null
  let minDistanceMeters = Infinity

  for (const kec of SEMARANG_KECAMATAN) {
    const dist = calculateDistanceMeters(latitude, longitude, kec.center_lat, kec.center_lng)
    if (dist < minDistanceMeters) {
      minDistanceMeters = dist
      nearestDistrict = kec.name
    }
  }

  // If closest district center is > 25km, point is outside metropolitan Semarang
  const isWithinSemarang = isWithinBbox && minDistanceMeters <= 25000

  // 4. Evaluate GPS accuracy
  let accuracyGrade: 'normal' | 'needs_verification' | 'low_confidence' = 'normal'
  let accuracyWarning: string | undefined

  if (accuracyMeters !== undefined && accuracyMeters !== null) {
    if (accuracyMeters <= 100) {
      accuracyGrade = 'normal'
    } else if (accuracyMeters <= 500) {
      accuracyGrade = 'needs_verification'
      accuracyWarning = `Akurasi sinyal GPS sedang (${Math.round(accuracyMeters)}m). Perlu verifikasi tambahan.`
    } else {
      accuracyGrade = 'low_confidence'
      accuracyWarning = `Akurasi sinyal GPS rendah (${Math.round(accuracyMeters)}m). Posisi mungkin mengalami deviasi.`
    }
  } else {
    // If not provided by client, neutral default
    accuracyGrade = 'normal'
  }

  let finalWarning = accuracyWarning
  if (!isWithinSemarang) {
    finalWarning = 'Koordinat berada di luar wilayah administratif Kota Semarang.'
  }

  return {
    isValid: true,
    isWithinSemarang,
    latitude,
    longitude,
    accuracyMeters: accuracyMeters ?? null,
    accuracyGrade,
    nearestDistrict,
    distanceToDistrictKm: Math.round((minDistanceMeters / 1000) * 10) / 10,
    warning: finalWarning,
  }
}
