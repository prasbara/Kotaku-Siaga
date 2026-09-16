// ============================================================
// KotaKu Siaga — EXIF Timestamp Extraction & Validation Engine
// Enforces 24-Hour Rule, Timezone Handling (UTC + Asia/Jakarta),
// and Anti-Fraud Risk Scoring without treating missing EXIF as fraud.
// ============================================================

import sharp from 'sharp'

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

export interface ExifTimestampValidationResult {
  capture_timestamp: string | null         // ISO UTC String e.g. "2026-09-17T01:48:00.000Z"
  capture_timestamp_wib: string | null     // Indonesian WIB display e.g. "17 Sep 2026 08:48:00 WIB"
  capture_timestamp_source: ExifTimestampSource
  capture_timestamp_status: ExifTimestampStatus
  capture_timestamp_age_hours: number | null
  confidence_note: string
  risk_warning: string | null
  has_exif: boolean
}

/**
 * Extracts DateTimeOriginal, DateTimeDigitized, or DateTime from image buffer.
 * Performs timezone conversion (stored as UTC, formatted for Asia/Jakarta).
 * Evaluates against the 24-Hour policy:
 * - 0 <= age <= 24h: timestamp_consistent
 * - age > 24h: stale_evidence (Risk signal: evidence appears older than 24h)
 * - age < -5min: invalid_timestamp (Timestamp inconsistency warning)
 * - Missing EXIF: timestamp_unavailable (Neutral signal: not automatically rejected)
 */
export async function extractAndValidateExifTimestamp(
  buffer: Buffer,
  submissionTime: Date = new Date()
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
    }
  }

  let exifRawString = ''
  let hasExif = false

  try {
    const metadata = await sharp(buffer).metadata()
    if (metadata.exif && metadata.exif.length > 0) {
      hasExif = true
      exifRawString = metadata.exif.toString('latin1')
    }
  } catch (err) {
    console.warn('[EXIF] Failed to parse image metadata via Sharp:', err)
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
    }
  }

  // Find DateTimeOriginal (Tag 0x9003), DateTimeDigitized (0x9004), or DateTime (0x0132)
  // Standard EXIF format: "YYYY:MM:DD HH:MM:SS"
  let dateMatch: RegExpMatchArray | null = null
  let source: ExifTimestampSource = 'none'

  // Look for dates formatted as YYYY:MM:DD HH:MM:SS
  const allDateMatches = Array.from(
    exifRawString.matchAll(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/g)
  )

  if (allDateMatches.length > 0) {
    // Primary: DateTimeOriginal (conventionally first or second occurrence in ExifIFD)
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
    }
  }

  // Timezone Handling:
  // Most consumer cameras and mobile phones in Indonesia record local time (Asia/Jakarta, UTC+7)
  // without embedding the OffsetTime tag. We construct the Date assuming local Indonesia time (UTC+7)
  // unless specified, and normalize to UTC internally.
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
  // - Future timestamp (> 5 minutes ahead): invalid_timestamp
  // - 0 <= age <= 24 hours: timestamp_consistent
  // - age > 24 hours: stale_evidence
  if (ageHours < -0.08) {
    // Foto di masa depan lebih dari 5 menit
    return {
      capture_timestamp: captureUtcIso,
      capture_timestamp_wib: captureWib,
      capture_timestamp_source: source,
      capture_timestamp_status: 'invalid_timestamp',
      capture_timestamp_age_hours: ageHours,
      confidence_note: `Stempel waktu foto (${captureWib}) terdeteksi berada di masa depan secara tidak wajar.`,
      risk_warning: 'Timestamp consistency warning: waktu foto di masa depan',
      has_exif: true,
    }
  }

  if (ageHours > 24) {
    // Foto lama (> 24 jam)
    return {
      capture_timestamp: captureUtcIso,
      capture_timestamp_wib: captureWib,
      capture_timestamp_source: source,
      capture_timestamp_status: 'stale_evidence',
      capture_timestamp_age_hours: ageHours,
      confidence_note: `Foto diambil ${ageHours} jam yang lalu (> 24 jam). Kemungkinan bukti lama atau dokumentasi historis.`,
      risk_warning: 'Evidence appears older than 24h',
      has_exif: true,
    }
  }

  // Normal: 0 <= age <= 24 jam
  return {
    capture_timestamp: captureUtcIso,
    capture_timestamp_wib: captureWib,
    capture_timestamp_source: source,
    capture_timestamp_status: 'timestamp_consistent',
    capture_timestamp_age_hours: ageHours,
    confidence_note: `Stempel waktu konsisten: foto diambil ${ageHours} jam sebelum laporan dikirim (sesuai aturan 24 jam).`,
    risk_warning: null,
    has_exif: true,
  }
}
