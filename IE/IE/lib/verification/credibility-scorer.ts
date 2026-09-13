// ============================================================
// KotaKu Siaga — Credibility Scoring Engine
// Deterministic, transparent, explainable scoring formula (0 - 100)
// ============================================================

import type {
  CredibilityScoreResult,
  GeoValidationResult,
  ImageValidationResult,
  CrowdCorroborationResult,
  CCTVCorroborationResult,
  WeatherCorroborationResult,
  VerificationStatus,
} from './types'

export interface ScorerInput {
  geo: GeoValidationResult
  image: ImageValidationResult
  crowd: CrowdCorroborationResult
  cctv: CCTVCorroborationResult
  weather: WeatherCorroborationResult
  honeypotTriggered: boolean
  rateLimitExceeded?: boolean
}

export function calculateCredibilityScore(input: ScorerInput): CredibilityScoreResult {
  const baseScore = 50
  let currentScore = baseScore

  const positiveSignals: Array<{ description: string; points: number }> = []
  const negativeSignals: Array<{ description: string; points: number }> = []
  const positiveEvidence: string[] = []
  const warnings: string[] = []

  // 1. Geolocation Signals
  if (input.geo.isValid && input.geo.isWithinSemarang) {
    positiveSignals.push({ description: 'GPS berada di wilayah administratif Semarang', points: 15 })
    positiveEvidence.push(`GPS valid di wilayah Kota Semarang (${input.geo.nearestDistrict || 'Semarang'})`)
    currentScore += 15
  } else {
    negativeSignals.push({ description: 'Koordinat di luar wilayah Kota Semarang', points: 15 })
    warnings.push('Koordinat berada di luar batas administratif Kota Semarang')
    currentScore -= 15
  }

  // GPS Accuracy
  if (input.geo.accuracyMeters !== null) {
    if (input.geo.accuracyGrade === 'normal') {
      positiveSignals.push({ description: `Akurasi GPS akurat (${Math.round(input.geo.accuracyMeters)}m)`, points: 10 })
      positiveEvidence.push(`Akurasi sinyal GPS tinggi (±${Math.round(input.geo.accuracyMeters)}m)`)
      currentScore += 10
    } else if (input.geo.accuracyGrade === 'low_confidence') {
      negativeSignals.push({ description: `Akurasi GPS rendah (>500m: ${Math.round(input.geo.accuracyMeters)}m)`, points: 10 })
      warnings.push(`Akurasi sinyal GPS rendah (±${Math.round(input.geo.accuracyMeters)}m)`)
      currentScore -= 10
    } else {
      // 100m - 500m: Neutral, but add informative warning
      warnings.push(`Akurasi sinyal GPS sedang (±${Math.round(input.geo.accuracyMeters)}m)`)
    }
  }

  // 2. Photo Signals
  if (input.image.hasPhoto) {
    if (input.image.isValid) {
      positiveSignals.push({ description: 'Lampiran foto asli terverifikasi biner', points: 15 })
      positiveEvidence.push(`Foto lapangan tersedia dan tervalidasi (${input.image.mimeType})`)
      currentScore += 15

      // Check Photo Timestamp consistency
      if (input.image.photoTimeMismatch) {
        negativeSignals.push({ description: 'Stempel waktu foto berbeda >24 jam dari waktu laporan', points: 15 })
        warnings.push('Metadata foto menunjukkan waktu pengambilan berbeda signifikan dari waktu laporan')
        currentScore -= 15
      } else if (input.image.photoTakenAt) {
        positiveSignals.push({ description: 'Stempel waktu foto konsisten dengan laporan', points: 10 })
        positiveEvidence.push('Waktu pengambilan foto selaras dengan laporan')
        currentScore += 10
      }
    } else {
      negativeSignals.push({ description: input.image.error || 'Format foto tidak valid', points: 10 })
      warnings.push(input.image.error || 'Format foto tidak valid')
      currentScore -= 10
    }
  }

  // 3. Duplicate Photo Check
  if (input.image.duplicateDetected) {
    negativeSignals.push({
      description: `Foto terdeteksi duplikat (${input.image.duplicateCount} kemiripan)`,
      points: 20,
    })
    warnings.push(
      `Foto terdeteksi duplikat / digunakan berulang pada ${input.image.duplicateCount} laporan sebelumnya (${input.image.duplicateReportCodes?.join(', ')})`
    )
    currentScore -= 20
  }

  // 4. Crowd Corroboration
  if (input.crowd.corroborationLevel === 'strong') {
    positiveSignals.push({
      description: `${input.crowd.corroboratingCount} laporan serupa di sekitar lokasi (≤300m / 30 mnt)`,
      points: 20,
    })
    positiveEvidence.push(
      `${input.crowd.corroboratingCount} laporan warga serupa terdeteksi di radius 300 meter dalam 30 menit terakhir`
    )
    currentScore += 20
  } else if (input.crowd.corroborationLevel === 'signal') {
    positiveSignals.push({
      description: '1 laporan serupa di sekitar lokasi (≤300m / 30 mnt)',
      points: 15,
    })
    positiveEvidence.push('Laporan lain terkonfirmasi di sekitar lokasi dalam radius 300 meter')
    currentScore += 15
  }

  // 5. CCTV Corroboration
  if (input.cctv.cctvEvidence === 'corroborated' && input.cctv.nearestCctv) {
    positiveSignals.push({
      description: `CCTV PantauSemar terhubung (${input.cctv.nearestCctv.name}, ${input.cctv.nearestCctv.distanceMeters}m)`,
      points: 15,
    })
    positiveEvidence.push(
      `Terkoneksi dengan CCTV PantauSemar terdekat: ${input.cctv.nearestCctv.name} (${input.cctv.nearestCctv.distanceMeters}m)`
    )
    currentScore += 15
  } else if (input.cctv.cctvEvidence === 'unavailable') {
    warnings.push('Data telemetri CCTV PantauSemar saat ini tidak dapat diakses (Unknown)')
  }

  // 6. Weather Corroboration
  if (input.weather.weatherEvidence === 'positive') {
    positiveSignals.push({
      description: `Observasi cuaca mendukung (${input.weather.weatherSnapshot?.condition || 'Hujan'})`,
      points: 10,
    })
    positiveEvidence.push(
      `Data observasi cuaca BMKG/Open-Meteo Semarang mengonfirmasi hujan/kondisi relevan (${input.weather.weatherSnapshot?.precipitationMm} mm/jam)`
    )
    currentScore += 10
  } else if (input.weather.weatherEvidence === 'unknown') {
    warnings.push('Observasi cuaca belum tersedia (Unknown)')
  }

  // 7. Anti-Bot / Honeypot Penalty
  if (input.honeypotTriggered) {
    negativeSignals.push({ description: 'Jebakan anti-bot (Honeypot) terpicu', points: 50 })
    warnings.push('Perilaku bot terdeteksi (Hidden Honeypot Field terisi)')
    currentScore = Math.min(currentScore - 50, 30) // Strictly cap at 30 to stay in suspicious tier (<40)
  }

  // 8. Rate Limit Penalty
  if (input.rateLimitExceeded) {
    negativeSignals.push({ description: 'Frekuensi pengiriman terlalu tinggi (Rate Limit)', points: 20 })
    warnings.push('Pengiriman laporan berulang dalam frekuensi singkat')
    currentScore -= 20
  }

  // Clamp final score 0-100
  const finalScore = Math.max(0, Math.min(100, Math.round(currentScore)))

  // Determine classification status
  let status: VerificationStatus = 'under_review'
  let confidenceLevel: 'suspicious' | 'needs_verification' | 'high_confidence' = 'needs_verification'

  if (input.honeypotTriggered || finalScore < 40) {
    status = 'suspicious'
    confidenceLevel = 'suspicious'
  } else if (finalScore >= 70) {
    status = 'submitted' // Accepted with high confidence, awaiting administrative final verification
    confidenceLevel = 'high_confidence'
  } else {
    status = 'under_review'
    confidenceLevel = 'needs_verification'
  }

  return {
    score: finalScore,
    baseScore,
    positiveSignals,
    negativeSignals,
    status,
    confidenceLevel,
    positiveEvidence,
    warnings,
  }
}
