// ============================================================
// KotaKu Siaga — Multi-Layer Photo Authenticity & Evidence Engine
// Implements 1–5 photo processing, SHA-256, pHash, EXIF GPS & Timestamp,
// and AI Vision with multi-evidence cross-checking.
// ============================================================

import crypto from 'crypto'
import sharp from 'sharp'
import { checkMagicBytes, computeDHash, calculateHammingDistance } from './image-validator'
import {
  extractAndValidateExifTimestamp,
  type ExifTimestampValidationResult,
  EXIF_GPS_MAX_DISTANCE_METERS,
} from './exif-validator'
import { analyzeDisasterPhotoWithAi, type AiVisionResult } from './ai-vision-verifier'

export const PHASH_DISTANCE_THRESHOLD = 12 // Hamming distance <= 12 indicates high visual similarity

export interface SingleEvidenceAnalysis {
  index: number
  storagePath: string
  photoUrl: string
  mimeType: string
  fileSizeBytes: number
  width: number
  height: number
  sha256: string
  phash: string
  exif: ExifTimestampValidationResult
  ai: AiVisionResult
  isExactDuplicate: boolean
  isVisuallySimilar: boolean
  similarToReportCode?: string
  evidenceScore: number // 0 - 100
  verdict: 'consistent' | 'needs_review' | 'inconsistent'
  signals: {
    timestampBadge: string
    gpsBadge: string
    duplicateBadge: string
    aiBadge: string
  }
}

export interface MultiPhotoEvidenceSummary {
  totalPhotos: number
  validPhotos: number
  timestampConsistentCount: number
  gpsConsistentCount: number
  similarEvidenceCount: number
  aiRelevantCount: number
  overallAuthenticityScore: number // 0 - 100
  overallVerdict: 'consistent' | 'needs_review' | 'inconsistent'
  overallRecommendation: string
  evidenceList: SingleEvidenceAnalysis[]
}

/**
 * Parses image buffer from base64 data URL or standard base64 string.
 */
export function extractBufferFromDataUrl(dataUrlOrBase64: string): { buffer: Buffer; mime: string } {
  if (dataUrlOrBase64.startsWith('data:')) {
    const parts = dataUrlOrBase64.split(',')
    const mimeMatch = parts[0].match(/:(.*?);/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    const buffer = Buffer.from(parts[1] || '', 'base64')
    return { buffer, mime }
  }
  const buffer = Buffer.from(dataUrlOrBase64, 'base64')
  return { buffer, mime: 'image/jpeg' }
}

/**
 * Analyzes a batch of 1 to 5 photos submitted by citizen.
 */
export async function analyzeMultipleEvidencePhotos(params: {
  photos: string[] // Base64 data URLs
  reportCode: string
  category: string
  description: string
  latitude: number
  longitude: number
  submissionTime?: Date
  existingEvidenceHashes?: Array<{ sha256: string; phash: string; report_code?: string }>
}): Promise<MultiPhotoEvidenceSummary> {
  const {
    photos,
    reportCode,
    category,
    description,
    latitude,
    longitude,
    submissionTime = new Date(),
    existingEvidenceHashes = [],
  } = params

  const evidenceList: SingleEvidenceAnalysis[] = []

  // Track hashes within the current submission to detect intra-report duplicates
  const batchSha256s = new Set<string>()
  const batchPHashes: string[] = []

  for (let i = 0; i < photos.length; i++) {
    const photoData = photos[i]
    const { buffer, mime: clientMime } = extractBufferFromDataUrl(photoData)

    // 1. Validate File Size
    const fileSizeBytes = buffer.length
    if (fileSizeBytes === 0 || fileSizeBytes > 10 * 1024 * 1024) {
      continue // Skip corrupt / oversize
    }

    // 2. Validate Magic Bytes
    const magic = checkMagicBytes(buffer)
    const detectedMime = magic.isValid ? magic.detectedMime || clientMime : clientMime

    // 3. Inspect dimensions via sharp
    let width = 800
    let height = 600
    try {
      const meta = await sharp(buffer).metadata()
      width = meta.width || 800
      height = meta.height || 600
    } catch {
      // Keep defaults
    }

    // 4. SHA-256 Hash
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')

    // 5. pHash (Perceptual 64-bit dHash)
    const phash = await computeDHash(buffer)

    // Check exact duplicate
    const isExactDuplicate =
      batchSha256s.has(sha256) ||
      existingEvidenceHashes.some((e) => e.sha256.toLowerCase() === sha256.toLowerCase())

    batchSha256s.add(sha256)

    // Check visual similarity via pHash
    let isVisuallySimilar = false
    let similarToReportCode: string | undefined

    for (const bPhash of batchPHashes) {
      if (calculateHammingDistance(phash, bPhash) <= PHASH_DISTANCE_THRESHOLD) {
        isVisuallySimilar = true
        break
      }
    }

    if (!isVisuallySimilar) {
      for (const ex of existingEvidenceHashes) {
        if (ex.phash && calculateHammingDistance(phash, ex.phash) <= PHASH_DISTANCE_THRESHOLD) {
          isVisuallySimilar = true
          similarToReportCode = ex.report_code
          break
        }
      }
    }

    batchPHashes.push(phash)

    // 6. EXIF Validation (Timestamp 24h rule & GPS Distance)
    const exif = await extractAndValidateExifTimestamp(buffer, submissionTime, latitude, longitude)

    // 7. AI Vision Analysis (Disaster scene & category verification)
    const ai = await analyzeDisasterPhotoWithAi(buffer, category, description)

    // 8. Evidence Score Calculation:
    // Formula: (AI confidence * 0.5) + (EXIF timestamp points * 30) + (GPS match points * 20)
    let exifPoints = 0
    if (exif.capture_timestamp_status === 'timestamp_consistent') {
      exifPoints = 30
    } else if (exif.capture_timestamp_status === 'timestamp_unavailable') {
      exifPoints = 15 // Neutral
    } else if (exif.capture_timestamp_status === 'stale_evidence') {
      exifPoints = 10 // Risk signal
    } else {
      exifPoints = 0
    }

    let gpsPoints = 0
    if (exif.gps_status === 'gps_consistent') {
      gpsPoints = 20
    } else if (exif.gps_status === 'gps_unavailable') {
      gpsPoints = 12 // Neutral
    } else {
      gpsPoints = 0 // Mismatch
    }

    const aiPoints = (ai.confidence || 70) * 0.5
    const rawScore = Math.round(aiPoints + exifPoints + gpsPoints)
    const evidenceScore = Math.min(Math.max(rawScore, 10), 100)

    let verdict: 'consistent' | 'needs_review' | 'inconsistent' = 'needs_review'
    if (evidenceScore >= 70 && !isExactDuplicate) {
      verdict = 'consistent'
    } else if (evidenceScore < 40 || isExactDuplicate) {
      verdict = 'inconsistent'
    } else {
      verdict = 'needs_review'
    }

    // Badges for Admin UI
    const timestampBadge =
      exif.capture_timestamp_status === 'timestamp_consistent'
        ? '✓ Timestamp konsisten (≤24 jam)'
        : exif.capture_timestamp_status === 'stale_evidence'
        ? `⚠ Bukti lama (${exif.capture_timestamp_age_hours}h lalu)`
        : exif.capture_timestamp_status === 'invalid_timestamp'
        ? '⚠ Waktu EXIF tidak wajar'
        : 'EXIF timestamp tidak tersedia'

    const gpsBadge =
      exif.gps_status === 'gps_consistent'
        ? `✓ GPS cocok (jarak ${exif.gps_distance_meters}m)`
        : exif.gps_status === 'gps_mismatch'
        ? `⚠ GPS berbeda lokasi (${exif.gps_distance_meters}m)`
        : 'GPS foto tidak tersedia'

    const duplicateBadge = isExactDuplicate
      ? '⚠ Duplikat identik (SHA-256)'
      : isVisuallySimilar
      ? '⚠ Kemiripan visual terdeteksi (pHash)'
      : '✓ Foto unik'

    const aiBadge =
      ai.status === 'analyzed'
        ? `✓ AI Vision: ${ai.detected_category} (${ai.confidence}%)`
        : 'AI Vision: Verifikasi lokal aktif'

    evidenceList.push({
      index: i + 1,
      storagePath: `evidence/${reportCode}/${i + 1}_${sha256.slice(0, 10)}.jpg`,
      photoUrl: photoData,
      mimeType: detectedMime,
      fileSizeBytes,
      width,
      height,
      sha256,
      phash,
      exif,
      ai,
      isExactDuplicate,
      isVisuallySimilar,
      similarToReportCode,
      evidenceScore,
      verdict,
      signals: {
        timestampBadge,
        gpsBadge,
        duplicateBadge,
        aiBadge,
      },
    })
  }

  // Calculate Report-Level Aggregate Summary
  const totalPhotos = evidenceList.length
  const timestampConsistentCount = evidenceList.filter(
    (e) => e.exif.capture_timestamp_status === 'timestamp_consistent'
  ).length
  const gpsConsistentCount = evidenceList.filter((e) => e.exif.gps_status === 'gps_consistent').length
  const similarEvidenceCount = evidenceList.filter((e) => e.isVisuallySimilar || e.isExactDuplicate).length
  const aiRelevantCount = evidenceList.filter((e) => e.ai.is_disaster).length

  const avgScore =
    totalPhotos > 0
      ? Math.round(evidenceList.reduce((acc, curr) => acc + curr.evidenceScore, 0) / totalPhotos)
      : 70

  let overallVerdict: 'consistent' | 'needs_review' | 'inconsistent' = 'needs_review'
  let overallRecommendation = 'Memerlukan peninjauan manual petugas operasional posko.'

  if (avgScore >= 70 && similarEvidenceCount === 0) {
    overallVerdict = 'consistent'
    overallRecommendation = 'Sinyal bukti konsisten. Disarankan dapat diproses verifikasi posko.'
  } else if (avgScore < 40 || similarEvidenceCount >= totalPhotos) {
    overallVerdict = 'inconsistent'
    overallRecommendation = 'Terdeteksi indikasi anomali bukti atau duplikasi tinggi. Periksa cermat.'
  }

  return {
    totalPhotos,
    validPhotos: totalPhotos,
    timestampConsistentCount,
    gpsConsistentCount,
    similarEvidenceCount,
    aiRelevantCount,
    overallAuthenticityScore: avgScore,
    overallVerdict,
    overallRecommendation,
    evidenceList,
  }
}
