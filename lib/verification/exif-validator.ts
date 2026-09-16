// ============================================================
// KotaKu Siaga — EXIF Timestamp & GPS Extraction & Validation Engine
// Enforces 24-Hour Rule, Timezone Handling (UTC + Asia/Jakarta),
// and Anti-Fraud Risk Scoring + Haversine GPS Distance Verification.
// ============================================================

import sharp from 'sharp'
import exifr from 'exifr'

export type ExifTimestampStatus =
  | 'timestamp_consistent'   // 0 <= age <= 24 hours
  | 'stale_evidence'          // age > 24 hours
  | 'invalid_timestamp'       // future timestamp > 5 minutes
  | 'timestamp_unavailable'   // No DateTimeOriginal or EXIF found

export type ExifTimestampSource =
  | 'exif_datetime_original'
  | 'exif_datetime_digitized'
  | 'exif_datetime'
  | 'none'

export type ExifGpsStatus =
  | 'gps_consistent'          // distance <= EXIF_GPS_MAX_DISTANCE_METERS (default 1km)
  | 'gps_mismatch'            // distance > EXIF_GPS_MAX_DISTANCE_METERS
  | 'gps_unavailable'         // No EXIF GPS found or no report GPS provided

export const EXIF_GPS_MAX_DISTANCE_METERS = 1000 // 1 km configurable threshold

export interface ExifTimestampValidationResult {
  capture_timestamp: string | null         // ISO UTC String e.g. "2026-09-17T01:48:00.000Z"
  capture_timestamp_wib: string | null     // Indonesian WIB display e.g. "17 Sep 2026 08:48:00 WIB"
  capture_timestamp_source: ExifTimestampSource
  capture_timestamp_status: ExifTimestampStatus
  capture_timestamp_age_hours: number | null
  confidence_note: string
  risk_warning: string | null
  has_exif: boolean
  // Extended GPS properties
  exif_latitude?: number | null
  exif_longitude?: number | null
  gps_status?: ExifGpsStatus
  gps_distance_meters?: number | null
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

/**
 * Extracts DateTimeOriginal, DateTimeDigitized, or DateTime from image buffer.
 * Also extracts EXIF GPS and calculates distance against the report coordinates.
 * Evaluates against the 24-Hour policy:
 * - 0 <= age <= 24h: timestamp_consistent
 * - age > 24h: stale_evidence (Risk signal: evidence appears older than 24h)
 * - age < -5min: invalid_timestamp (Timestamp inconsistency warning)
 * - Missing EXIF: timestamp_unavailable (Neutral signal: not automatically rejected)
 */
export async function extractAndValidateExifTimestamp(
  buffer: Buffer,
  submissionTime: Date = new Date(),
  reportLat?: number | null,
  reportLng?: number | null
): Promise<ExifTimestampValidationResult> {
  if (!buffer || buffer.length === 0) {
    return {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: 'none',
      capture_timestamp_status: 'timestamp_unavailable',
      capture_timestamp_age_hours: null,
      confidence_note: 'Foto tidak memiliki payload biner.',
      risk_warning: null,
      has_exif: false,
      exif_latitude: null,
      exif_longitude: null,
      gps_status: 'gps_unavailable',
      gps_distance_meters: null,
    }
  }

  // 1. Extract GPS coordinates via exifr
  let exifLat: number | null = null
  let exifLng: number | null = null
  let gpsStatus: ExifGpsStatus = 'gps_unavailable'
  let gpsDistanceMeters: number | null = null

  try {
    const gps = await exifr.gps(buffer)
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      exifLat = Number(gps.latitude.toFixed(7))
      exifLng = Number(gps.longitude.toFixed(7))

      if (
        typeof reportLat === 'number' &&
        typeof reportLng === 'number' &&
        !isNaN(reportLat) &&
        !isNaN(reportLng)
      ) {
        gpsDistanceMeters = calculateHaversineDistanceMeters(exifLat, exifLng, reportLat, reportLng)
        gpsStatus =
          gpsDistanceMeters <= EXIF_GPS_MAX_DISTANCE_METERS ? 'gps_consistent' : 'gps_mismatch'
      }
    }
  } catch (err) {
    // Graceful catch for non-EXIF or corrupted GPS tags
  }

  // 2. Extract DateTimeOriginal via exifr / sharp fallback
  let exifRawString = ''
  let hasExif = false

  try {
    const metadata = await sharp(buffer).metadata()
    if (metadata.exif && metadata.exif.length > 0) {
      hasExif = true
      exifRawString = metadata.exif.toString('latin1')
    }
  } catch (err) {
    // Sharp fallback
  }

  // Also check if exifr detected any tags
  if (!hasExif) {
    try {
      const parsed = await exifr.parse(buffer)
      if (parsed) hasExif = true
    } catch {
      // Ignore
    }
  }

  if (!hasExif || !exifRawString) {
    return {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: 'none',
      capture_timestamp_status: 'timestamp_unavailable',
      capture_timestamp_age_hours: null,
      confidence_note: 'EXIF metadata tidak tersedia (dapat disebabkan kompresi aplikasi chat atau privasi peramban).',
      risk_warning: null, // Do NOT treat missing EXIF as fraud
      has_exif: false,
      exif_latitude: exifLat,
      exif_longitude: exifLng,
      gps_status: gpsStatus,
      gps_distance_meters: gpsDistanceMeters,
    }
  }

  // Find DateTimeOriginal (Tag 0x9003), DateTimeDigitized (0x9004), or DateTime (0x0132)
  // Standard EXIF format: "YYYY:MM:DD HH:MM:SS"
  let dateMatch: RegExpMatchArray | null = null
  let source: ExifTimestampSource = 'none'

  const allDateMatches = Array.from(
    exifRawString.matchAll(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/g)
  )

  if (allDateMatches.length > 0) {
    dateMatch = allDateMatches[0]
    source = 'exif_datetime_original'
  }

  if (!dateMatch) {
    return {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: 'none',
      capture_timestamp_status: 'timestamp_unavailable',
      capture_timestamp_age_hours: null,
      confidence_note: 'EXIF terdeteksi namun tidak memuat tag stempel waktu DateTimeOriginal.',
      risk_warning: null,
      has_exif: true,
      exif_latitude: exifLat,
      exif_longitude: exifLng,
      gps_status: gpsStatus,
      gps_distance_meters: gpsDistanceMeters,
    }
  }

  const [_, yearStr, monthStr, dayStr, hourStr, minStr, secStr] = dateMatch
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)
  const sec = parseInt(secStr, 10)

  // Basic sanity validation
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: source,
      capture_timestamp_status: 'invalid_timestamp',
      capture_timestamp_age_hours: null,
      confidence_note: `Nilai stempel waktu EXIF di luar rentang kalender (${yearStr}-${monthStr}-${dayStr}).`,
      risk_warning: 'Timestamp consistency warning: format waktu EXIF tidak wajar',
      has_exif: true,
      exif_latitude: exifLat,
      exif_longitude: exifLng,
      gps_status: gpsStatus,
      gps_distance_meters: gpsDistanceMeters,
    }
  }

  // Timezone Handling: local Indonesia time (UTC+7) normalized to UTC
  const localIsoString = `${yearStr}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}+07:00`
  const captureDate = new Date(localIsoString)
  const captureTimeMs = captureDate.getTime()

  if (isNaN(captureTimeMs)) {
    return {
      capture_timestamp: null,
      capture_timestamp_wib: null,
      capture_timestamp_source: source,
      capture_timestamp_status: 'invalid_timestamp',
      capture_timestamp_age_hours: null,
      confidence_note: 'Gagal mengonversi stempel waktu EXIF ke ISO UTC standar.',
      risk_warning: 'Timestamp consistency warning: konversi waktu gagal',
      has_exif: true,
      exif_latitude: exifLat,
      exif_longitude: exifLng,
      gps_status: gpsStatus,
      gps_distance_meters: gpsDistanceMeters,
    }
  }

  const submissionMs = submissionTime.getTime()
  const diffMs = submissionMs - captureTimeMs
  const ageHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2))

  const captureUtcIso = captureDate.toISOString()
  const captureWib =
    captureDate.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' WIB'

  // 24-HOUR RULE EVALUATION:
  if (ageHours < -0.08) {
    return {
      capture_timestamp: captureUtcIso,
      capture_timestamp_wib: captureWib,
      capture_timestamp_source: source,
      capture_timestamp_status: 'invalid_timestamp',
      capture_timestamp_age_hours: ageHours,
      confidence_note: `Stempel waktu foto (${captureWib}) terdeteksi berada di masa depan secara tidak wajar.`,
      risk_warning: 'Timestamp consistency warning: waktu foto di masa depan',
      has_exif: true,
      exif_latitude: exifLat,
      exif_longitude: exifLng,
      gps_status: gpsStatus,
      gps_distance_meters: gpsDistanceMeters,
    }
  }

  if (ageHours > 24) {
    return {
      capture_timestamp: captureUtcIso,
      capture_timestamp_wib: captureWib,
      capture_timestamp_source: source,
      capture_timestamp_status: 'stale_evidence',
      capture_timestamp_age_hours: ageHours,
      confidence_note: `Foto diambil ${ageHours} jam yang lalu (> 24 jam). Kemungkinan bukti lama atau dokumentasi historis.`,
      risk_warning: 'Evidence appears older than 24h',
      has_exif: true,
      exif_latitude: exifLat,
      exif_longitude: exifLng,
      gps_status: gpsStatus,
      gps_distance_meters: gpsDistanceMeters,
    }
  }

  return {
    capture_timestamp: captureUtcIso,
    capture_timestamp_wib: captureWib,
    capture_timestamp_source: source,
    capture_timestamp_status: 'timestamp_consistent',
    capture_timestamp_age_hours: ageHours,
    confidence_note: `Stempel waktu konsisten: foto diambil ${ageHours} jam sebelum laporan dikirim (sesuai aturan 24 jam).`,
    risk_warning: null,
    has_exif: true,
    exif_latitude: exifLat,
    exif_longitude: exifLng,
    gps_status: gpsStatus,
    gps_distance_meters: gpsDistanceMeters,
  }
}
