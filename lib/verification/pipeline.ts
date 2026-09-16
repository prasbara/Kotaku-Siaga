// ============================================================
// KotaKu Siaga — Verification Pipeline Orchestrator
// Coordinates honeypot, geolocation, image hashing, crowd corroboration,
// CCTV cross-referencing, weather correlation, and credibility scoring.
// ============================================================

import { validateGeolocation } from './geo-validator'
import { checkDuplicatePhoto } from './image-validator'
import { checkCrowdCorroboration } from './corroboration'
import { findNearestCCTV } from './cctv-corroborator'
import { checkWeatherCorroboration } from './weather-corroborator'
import { calculateCredibilityScore } from './credibility-scorer'
import type {
  VerificationPipelineInput,
  VerificationPipelineResult,
  VerificationMetadata,
} from './types'

export async function runVerificationPipeline(
  input: VerificationPipelineInput,
  existingReports: Array<{
    id: string
    report_code: string
    latitude: number
    longitude: number
    lat?: number
    lng?: number
    created_at: string
    photo_url?: string | null
    verification_metadata?: any
  }>
): Promise<VerificationPipelineResult> {
  const receivedAt = new Date().toISOString()
  const reportedAt = input.reportedAt || receivedAt

  // 1. Anti-Bot Honeypot Trap Check
  const honeypotTriggered = Boolean(
    (input.website && input.website.trim().length > 0) ||
    (input.company && input.company.trim().length > 0) ||
    (input.phoneNumberConfirm && input.phoneNumberConfirm.trim().length > 0)
  )

  // 2. Geolocation, Administrative Boundaries, & Anti-FakeGPS Check
  const geo = validateGeolocation(
    input.latitude,
    input.longitude,
    input.locationAccuracy,
    input.districtName
  )

  // 3. Image Duplicate & Timestamp Check
  const hasPhoto = Boolean(input.photoUrl || input.photoDhash || input.photoSha256)
  let photoTimeMismatch = false
  if (input.photoTakenAt) {
    const reportTime = new Date(reportedAt).getTime()
    const photoTime = new Date(input.photoTakenAt).getTime()
    // If photo is older than 24 hours or in the future > 1 hour
    const diffHours = (reportTime - photoTime) / (1000 * 60 * 60)
    if (diffHours > 24 || diffHours < -1) {
      photoTimeMismatch = true
    }
  }

  const dupCheck = checkDuplicatePhoto(
    input.photoSha256 || undefined,
    input.photoDhash || undefined,
    existingReports
  )

  const imageResult = {
    hasPhoto,
    isValid: hasPhoto,
    mimeType: hasPhoto ? 'image/jpeg' : undefined,
    sha256: input.photoSha256 || undefined,
    dhash: input.photoDhash || undefined,
    photoTakenAt: input.photoTakenAt || null,
    photoTimeMismatch,
    duplicateDetected: dupCheck.duplicateDetected,
    duplicateCount: dupCheck.duplicateCount,
    duplicateReportCodes: dupCheck.duplicateReportCodes,
  }

  // 4. Crowd Corroboration Check (radius <= 300m, time <= 30 min)
  const reportTimeMs = new Date(reportedAt).getTime()
  const crowd = checkCrowdCorroboration(
    input.latitude,
    input.longitude,
    reportTimeMs,
    existingReports,
    input.category
  )

  // 5. CCTV Cross-Reference (from 70 PantauSemar points)
  const cctv = findNearestCCTV(input.latitude, input.longitude)

  // 6. Weather Cross-Reference (Real Open-Meteo / BMKG)
  const weather = await checkWeatherCorroboration(
    input.category,
    input.latitude,
    input.longitude
  )

  // 7. Credibility Scoring & Explainable Evidence
  const scoring = calculateCredibilityScore({
    geo,
    image: imageResult,
    crowd,
    cctv,
    weather,
    honeypotTriggered,
  })

  // 8. Generate standard public ticket ID: SMG-2026-XXXXXX
  const year = new Date().getFullYear()
  const uniqueNum = Date.now().toString().slice(-6)
  const reportCode = `SMG-${year}-${uniqueNum}`

  // 9. Assemble comprehensive Verification Metadata
  const metadata: VerificationMetadata = {
    credibility_score: scoring.score,
    confidence_level: scoring.confidenceLevel,
    verification_status: scoring.status,
    location_accuracy: geo.accuracyMeters,
    location_grade: geo.accuracyGrade,
    nearest_district: geo.nearestDistrict,
    reported_at: reportedAt,
    received_at: receivedAt,
    photo_taken_at: input.photoTakenAt || null,
    photo_hash: input.photoSha256 || null,
    photo_dhash: input.photoDhash || null,
    duplicate_photo: dupCheck.duplicateDetected,
    duplicate_count: dupCheck.duplicateCount,
    duplicate_report_codes: dupCheck.duplicateReportCodes,
    corroboration_count: crowd.corroboratingCount,
    corroborating_report_codes: crowd.corroboratingReportCodes,
    possible_duplicate: crowd.possibleDuplicate,
    duplicate_warning: crowd.duplicateReason,
    suspected_duplicate_of: crowd.suspectedDuplicateCodes,
    nearest_cctv: cctv.nearestCctv
      ? {
          code: cctv.nearestCctv.code,
          name: cctv.nearestCctv.name,
          category: cctv.nearestCctv.category,
          district: cctv.nearestCctv.district,
          distance_meters: cctv.nearestCctv.distanceMeters,
          stream_url: cctv.nearestCctv.streamUrl,
        }
      : null,
    cctv_evidence: cctv.cctvEvidence,
    weather_evidence: weather.weatherEvidence,
    weather_snapshot: weather.weatherSnapshot
      ? {
          condition: weather.weatherSnapshot.condition,
          precipitation_mm: weather.weatherSnapshot.precipitationMm,
          temperature_c: weather.weatherSnapshot.temperatureC,
          wind_speed_kmh: weather.weatherSnapshot.windSpeedKmh,
          retrieved_at: weather.weatherSnapshot.retrievedAtWib,
        }
      : null,
    positive_evidence: scoring.positiveEvidence,
    warnings: scoring.warnings,
    honeypot_triggered: honeypotTriggered,
    rate_limit_flag: false,
    is_within_semarang: geo.isWithinSemarang,
    is_mock_spoofed: geo.isMockOrSpoofed,
    district_mismatch: geo.districtMismatch,
  }

  return {
    isBlocked: honeypotTriggered, // If honeypot is triggered, marked as blocked / suspicious
    blockReason: honeypotTriggered ? 'Bot signature detected via honeypot' : undefined,
    reportCode,
    status: scoring.status,
    credibilityScore: scoring.score,
    metadata,
    geo,
  } as any
}
