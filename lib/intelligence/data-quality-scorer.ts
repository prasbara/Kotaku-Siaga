// ============================================================
// KotaKu Siaga — Data Quality & Integrity Scorer (Phase 6 & 29)
// Strictly Separated from Disaster Risk Score
// Formula: DataQuality = Freshness + Completeness + SourceReliability
//                      + SpatialValidity + TemporalValidity + Verification
// ============================================================

export type DataQualityGrade = 'HIGH' | 'MODERATE' | 'LIMITED' | 'POOR'

export interface DataQualityFactor {
  name: string
  key: string
  weight: number              // e.g. 0.25 (Sum equals 1.00)
  rawScore: number            // 0 - 100
  weightedContribution: number
  description: string
  status: 'OPTIMAL' | 'ACCEPTABLE' | 'DEGRADED' | 'CRITICAL_GAP'
}

export interface DataQualityInput {
  freshnessPercent: number          // 0-100 (Freshness of active telemetry)
  completenessPercent: number       // 0-100 (Presence of expected fields & sensor signals)
  sourceReliabilityPercent: number  // 0-100 (Historical uptime & failure rate)
  spatialValidityPercent: number    // 0-100 (GPS accuracy & geofence containment)
  temporalValidityPercent: number   // 0-100 (Timestamp sanity, non-future, non-stale)
  verificationCoveragePercent: number // 0-100 (Ratio of corroboration / verified evidence)
}

export interface DataQualityResult {
  overallScore: number              // 0.0 - 100.0
  grade: DataQualityGrade
  isSufficientForRiskScoring: boolean
  confidencePenaltyMultiplier: number // 0.2 to 1.0 (Down-scales risk confidence if data quality is low)
  factors: DataQualityFactor[]
  gaps: string[]
  explanation: string
}

export const DATA_QUALITY_WEIGHTS = {
  freshness: 0.25,
  completeness: 0.20,
  source_reliability: 0.20,
  spatial_validity: 0.15,
  temporal_validity: 0.10,
  verification_coverage: 0.10,
} as const

export function calculateDataQuality(input: DataQualityInput): DataQualityResult {
  const clamp = (val: number) => Math.max(0, Math.min(100, isNaN(val) ? 0 : val))

  const fFresh = clamp(input.freshnessPercent)
  const fComp = clamp(input.completenessPercent)
  const fRel = clamp(input.sourceReliabilityPercent)
  const fSpat = clamp(input.spatialValidityPercent)
  const fTemp = clamp(input.temporalValidityPercent)
  const fVer = clamp(input.verificationCoveragePercent)

  const cFresh = fFresh * DATA_QUALITY_WEIGHTS.freshness
  const cComp = fComp * DATA_QUALITY_WEIGHTS.completeness
  const cRel = fRel * DATA_QUALITY_WEIGHTS.source_reliability
  const cSpat = fSpat * DATA_QUALITY_WEIGHTS.spatial_validity
  const cTemp = fTemp * DATA_QUALITY_WEIGHTS.temporal_validity
  const cVer = fVer * DATA_QUALITY_WEIGHTS.verification_coverage

  const overallScore = Math.round((cFresh + cComp + cRel + cSpat + cTemp + cVer) * 10) / 10

  let grade: DataQualityGrade
  let confidencePenaltyMultiplier = 1.0

  if (overallScore >= 80.0) {
    grade = 'HIGH'
    confidencePenaltyMultiplier = 1.0
  } else if (overallScore >= 60.0) {
    grade = 'MODERATE'
    confidencePenaltyMultiplier = 0.85
  } else if (overallScore >= 40.0) {
    grade = 'LIMITED'
    confidencePenaltyMultiplier = 0.60
  } else {
    grade = 'POOR'
    confidencePenaltyMultiplier = 0.35
  }

  const isSufficientForRiskScoring = overallScore >= 35.0

  const gaps: string[] = []
  if (fFresh < 50) gaps.push('Telemetri cuaca / sensor mengalami keterlambatan pembaruan (stale data).')
  if (fComp < 50) gaps.push('Kelengkapan atribut data telemetri tidak lengkap.')
  if (fRel < 60) gaps.push('Tingkat kegagalan koneksi endpoint sumber data melebihi ambang batas toleransi.')
  if (fSpat < 70) gaps.push('Akurasi koordinat GPS laporan warga rendah atau mendekati batas luar wilayah.')
  if (fTemp < 80) gaps.push('Terdapat anomali stempel waktu pada aliran data pengamatan.')
  if (fVer < 40) gaps.push('Sebagian besar laporan pengamatan belum terkonfirmasi oleh sumber independen / CCTV.')

  const getStatus = (val: number): DataQualityFactor['status'] => {
    if (val >= 80) return 'OPTIMAL'
    if (val >= 60) return 'ACCEPTABLE'
    if (val >= 40) return 'DEGRADED'
    return 'CRITICAL_GAP'
  }

  const factors: DataQualityFactor[] = [
    {
      name: 'Kesegaran Data (Freshness)',
      key: 'freshness',
      weight: DATA_QUALITY_WEIGHTS.freshness,
      rawScore: fFresh,
      weightedContribution: Math.round(cFresh * 10) / 10,
      description: 'Waktu jeda antara stempel waktu observasi sumber dengan waktu sistem saat ini.',
      status: getStatus(fFresh),
    },
    {
      name: 'Kelengkapan Atribut (Completeness)',
      key: 'completeness',
      weight: DATA_QUALITY_WEIGHTS.completeness,
      rawScore: fComp,
      weightedContribution: Math.round(cComp * 10) / 10,
      description: 'Ketersediaan seluruh field penting telemetri dan metadata bukti visual.',
      status: getStatus(fComp),
    },
    {
      name: 'Keandalan Sumber (Source Reliability)',
      key: 'source_reliability',
      weight: DATA_QUALITY_WEIGHTS.source_reliability,
      rawScore: fRel,
      weightedContribution: Math.round(cRel * 10) / 10,
      description: 'Stabilitas koneksi, ketiadaan pemalsuan, dan rekam jejak uptime endpoint resmi.',
      status: getStatus(fRel),
    },
    {
      name: 'Validitas Spasial (Spatial Validity)',
      key: 'spatial_validity',
      weight: DATA_QUALITY_WEIGHTS.spatial_validity,
      rawScore: fSpat,
      weightedContribution: Math.round(cSpat * 10) / 10,
      description: 'Verifikasi geofencing 16 Kecamatan Semarang & proteksi terhadap anomali Mock GPS.',
      status: getStatus(fSpat),
    },
    {
      name: 'Validitas Temporal (Temporal Validity)',
      key: 'temporal_validity',
      weight: DATA_QUALITY_WEIGHTS.temporal_validity,
      rawScore: fTemp,
      weightedContribution: Math.round(cTemp * 10) / 10,
      description: 'Konsistensi stempel waktu pelaporan, ketiadaan stempel masa depan / kadaluarsa.',
      status: getStatus(fTemp),
    },
    {
      name: 'Cakupan Verifikasi (Verification Coverage)',
      key: 'verification_coverage',
      weight: DATA_QUALITY_WEIGHTS.verification_coverage,
      rawScore: fVer,
      weightedContribution: Math.round(cVer * 10) / 10,
      description: 'Rasio kejadian yang telah dikonfirmasi silang via CCTV PantauSemar / multi-pelapor.',
      status: getStatus(fVer),
    },
  ]

  let explanation = `Kualitas data dinilai ${grade} (${overallScore.toFixed(1)}/100).`
  if (gaps.length > 0) {
    explanation += ` Terdapat ${gaps.length} catatan kualitas: ${gaps[0]}`
  } else {
    explanation += ' Seluruh parameter telemetri dan laporan memenuhi standar integritas tinggi.'
  }

  return {
    overallScore,
    grade,
    isSufficientForRiskScoring,
    confidencePenaltyMultiplier,
    factors,
    gaps,
    explanation,
  }
}
