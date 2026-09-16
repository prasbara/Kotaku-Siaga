// ============================================================
// KotaKu Siaga — Image Validator & Perceptual Hashing Engine
// Uses 'sharp' for magic byte validation, EXIF metadata, and 64-bit dHash
// ============================================================

import crypto from 'crypto'
import sharp from 'sharp'
import type { ImageValidationResult } from './types'
import { extractAndValidateExifTimestamp, type ExifTimestampValidationResult } from './exif-validator'

// Allowed MIME types & file magic signatures
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export function checkMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime?: string } {
  if (!buffer || buffer.length < 12) {
    return { isValid: false }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: 'image/jpeg' }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMime: 'image/png' }
  }

  // WEBP: 'RIFF' .... 'WEBP'
  const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF'
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP'
  if (isRiff && isWebp) {
    return { isValid: true, detectedMime: 'image/webp' }
  }

  return { isValid: false }
}

/**
 * Computes a 64-bit difference hash (dHash) from an image buffer using sharp.
 * Resizes the image to 9x8 grayscale, then compares adjacent pixels.
 * Output is a 16-character hexadecimal string.
 */
export async function computeDHash(buffer: Buffer): Promise<string> {
  try {
    const rawPixels = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer()

    let binaryString = ''
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = rawPixels[row * 9 + col]
        const right = rawPixels[row * 9 + col + 1]
        binaryString += left > right ? '1' : '0'
      }
    }

    // Convert 64-bit binary string to 16-char hex
    let hex = ''
    for (let i = 0; i < 64; i += 4) {
      const nibble = binaryString.substring(i, i + 4)
      hex += parseInt(nibble, 2).toString(16)
    }

    return hex
  } catch (err) {
    console.warn('Gagal menghitung dHash, fallback ke SHA-256 slice:', err)
    return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16)
  }
}

/**
 * Calculates the Hamming distance between two hexadecimal hashes.
 */
export function calculateHammingDistance(hex1: string, hex2: string): number {
  if (!hex1 || !hex2) return 64
  let distance = 0
  const len = Math.min(hex1.length, hex2.length)
  for (let i = 0; i < len; i++) {
    const v1 = parseInt(hex1[i], 16)
    const v2 = parseInt(hex2[i], 16)
    let xor = v1 ^ v2
    while (xor > 0) {
      distance += xor & 1
      xor >>= 1
    }
  }
  return distance + Math.abs(hex1.length - hex2.length) * 4
}

/**
 * Inspects image buffer, validates magic bytes, computes dHash & SHA-256,
 * and extracts EXIF creation timestamp.
 */
export async function processAndValidateImage(
  buffer: Buffer,
  clientMimeType?: string
): Promise<{
  isValid: boolean
  mimeType: string
  sizeBytes: number
  sha256: string
  dhash: string
  photoTakenAt: string | null
  error?: string
}> {
  const sizeBytes = buffer.length
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      mimeType: clientMimeType || 'application/octet-stream',
      sizeBytes,
      sha256: '',
      dhash: '',
      photoTakenAt: null,
      error: `Ukuran file melebihi batas 5MB (${Math.round(sizeBytes / 1024 / 1024)}MB).`,
    }
  }

  const magicCheck = checkMagicBytes(buffer)
  if (!magicCheck.isValid) {
    return {
      isValid: false,
      mimeType: clientMimeType || 'application/octet-stream',
      sizeBytes,
      sha256: '',
      dhash: '',
      photoTakenAt: null,
      error: 'Format biner file bukan gambar valid (hanya JPEG, PNG, atau WebP yang didukung).',
    }
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
  const dhash = await computeDHash(buffer)

  // Extract EXIF timestamp and validate with 24-hour rule
  const exifValidation = await extractAndValidateExifTimestamp(buffer)

  return {
    isValid: true,
    mimeType: magicCheck.detectedMime || clientMimeType || 'image/jpeg',
    sizeBytes,
    sha256,
    dhash,
    photoTakenAt: exifValidation.capture_timestamp,
    exifValidation,
  }
}

/**
 * Checks for duplicate photos across existing reports.
 * A photo is considered duplicate if:
 * - Exact SHA-256 match
 * - OR perceptual dHash Hamming distance <= 8 (out of 64 bits)
 */
export function checkDuplicatePhoto(
  newHash: string | undefined,
  newDhash: string | undefined,
  existingReports: Array<{ id: string; report_code: string; photo_url?: string | null; verification_metadata?: any }>
): {
  duplicateDetected: boolean
  duplicateCount: number
  duplicateReportCodes: string[]
} {
  if (!newHash && !newDhash) {
    return { duplicateDetected: false, duplicateCount: 0, duplicateReportCodes: [] }
  }

  const matchedCodes = new Set<string>()

  for (const report of existingReports) {
    const meta = report.verification_metadata
    const existingSha = meta?.photo_hash
    const existingDhash = meta?.photo_dhash

    // 1. Exact SHA-256 match
    if (newHash && existingSha && newHash === existingSha) {
      matchedCodes.add(report.report_code || report.id)
      continue
    }

    // 2. Perceptual dHash match (Hamming distance <= 8)
    if (newDhash && existingDhash) {
      const distance = calculateHammingDistance(newDhash, existingDhash)
      if (distance <= 8) {
        matchedCodes.add(report.report_code || report.id)
      }
    }
  }

  const duplicateCount = matchedCodes.size
  return {
    duplicateDetected: duplicateCount > 0,
    duplicateCount,
    duplicateReportCodes: Array.from(matchedCodes),
  }
}
