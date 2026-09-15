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
  accuracyMeters?: number | null,
  declaredDistrictName?: string | null
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
      isMockOrSpoofed: false,
      latitude: latitude || 0,
      longitude: longitude || 0,
      accuracyMeters: null,
      accuracyGrade: 'low_confidence',
      nearestDistrict: null,
      distanceToDistrictKm: null,
      districtMismatch: false,
      warning: 'Nilai koordinat GPS di luar rentang bola bumi yang valid.',
    }
  }

  // 2. Anti-FakeGPS Heuristic Signatures
  let isMockOrSpoofed = false
  const mockWarnings: string[] = []

  // Check A: Zero-accuracy anomaly (Emulators and low-grade mock apps often output exactly 0.0 accuracy)
  if (accuracyMeters === 0) {
    isMockOrSpoofed = true
    mockWarnings.push('Indikasi anomali sensor GPS (akurasi 0m terdeteksi sebagai artefak mock provider).')
  }

  // Check B: Exact duplicate of default offshore / null island / national capital coordinate mock
  if (
    (Math.abs(latitude - (-6.2088)) < 0.001 && Math.abs(longitude - 106.8456) < 0.001) || // Jakarta default
    (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) // Null Island
  ) {
    isMockOrSpoofed = true
    mockWarnings.push('Koordinat terdeteksi menggunakan lokasi default simulator.')
  }

  // 3. Semarang administrative bounding box (lat: -7.12 to -6.90, lng: 110.25 to 110.55)
  const bbox = STUDY_AREA_CONFIG.bbox
  const margin = 0.035 // ~3.8 km buffer for administrative border areas
  const isWithinBbox =
    latitude >= bbox.minLat - margin &&
    latitude <= bbox.maxLat + margin &&
    longitude >= bbox.minLng - margin &&
    longitude <= bbox.maxLng + margin

  // 4. Find nearest Kecamatan center & calculate distance
  let nearestDistrict: string | null = null
  let minDistanceMeters = Infinity

  for (const kec of SEMARANG_KECAMATAN) {
    const dist = calculateDistanceMeters(latitude, longitude, kec.center_lat, kec.center_lng)
    if (dist < minDistanceMeters) {
      minDistanceMeters = dist
      nearestDistrict = kec.name
    }
  }

  // Max distance to closest kecamatan centroid in Semarang territory is <= 18 km
  const isWithinSemarang = isWithinBbox && minDistanceMeters <= 18000

  // 5. Cross-Check Declared District vs Geocoded Nearest District
  let districtMismatch = false
  if (declaredDistrictName && nearestDistrict) {
    const declaredNorm = declaredDistrictName.toLowerCase().replace(/kecamatan\s*/g, '').trim()
    const nearestNorm = nearestDistrict.toLowerCase().replace(/kecamatan\s*/g, '').trim()
    
    // If declared district is far from GPS coordinates (> 12km away)
    const targetKec = SEMARANG_KECAMATAN.find(
      (k) => k.name.toLowerCase().includes(declaredNorm) || declaredNorm.includes(k.name.toLowerCase())
    )
    if (targetKec) {
      const distanceToDeclared = calculateDistanceMeters(latitude, longitude, targetKec.center_lat, targetKec.center_lng)
      if (distanceToDeclared > 12000 && !declaredNorm.includes(nearestNorm)) {
        districtMismatch = true
        mockWarnings.push(`Ketidaksesuaian lokasi: Kecamatan yang dipilih (${declaredDistrictName}) berjarak ${(distanceToDeclared / 1000).toFixed(1)} km dari koordinat GPS (${nearestDistrict}).`)
      }
    }
  }

  // 6. Evaluate GPS accuracy grade
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
  }

  let finalWarning = accuracyWarning
  if (mockWarnings.length > 0) {
    finalWarning = mockWarnings.join(' ')
  } else if (!isWithinSemarang) {
    finalWarning = 'Koordinat berada di luar wilayah administratif Kota Semarang.'
  }

  return {
    isValid: true,
    isWithinSemarang,
    isMockOrSpoofed,
    latitude,
    longitude,
    accuracyMeters: accuracyMeters ?? null,
    accuracyGrade,
    nearestDistrict,
    distanceToDistrictKm: Math.round((minDistanceMeters / 1000) * 10) / 10,
    districtMismatch,
    warning: finalWarning,
  }
}
