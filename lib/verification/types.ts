// ============================================================
// KotaKu Siaga — Civic Radar v1.1 Verification System Types
// ============================================================

export type VerificationStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspicious'

export interface GeoValidationResult {
  isValid: boolean
  isWithinSemarang: boolean
  isMockOrSpoofed: boolean
  latitude: number
  longitude: number
  accuracyMeters: number | null
  accuracyGrade: 'normal' | 'needs_verification' | 'low_confidence'
  nearestDistrict: string | null
  distanceToDistrictKm: number | null
  districtMismatch: boolean
  warning?: string
}

export interface ImageValidationResult {
  hasPhoto: boolean
  isValid: boolean
  mimeType?: string
  sizeBytes?: number
  sha256?: string
  dhash?: string // 64-bit perceptual difference hash in hex
  photoTakenAt?: string | null
  photoTimeMismatch?: boolean
  duplicateDetected?: boolean
  duplicateCount?: number
  duplicateReportCodes?: string[]
  error?: string
  warning?: string
}

export interface CrowdCorroborationResult {
  corroborationFound: boolean
  corroboratingCount: number
  corroboratingReportCodes: string[]
  corroborationLevel: 'none' | 'signal' | 'strong'
}

export interface CCTVCorroborationResult {
  cctvEvidence: 'corroborated' | 'none_nearby' | 'unavailable'
  nearestCctv: {
    id: string
    code: string
    name: string
    category: string
    district: string
    distanceMeters: number
    streamUrl: string
  } | null
}

export interface WeatherCorroborationResult {
  weatherEvidence: 'positive' | 'neutral' | 'unknown'
  weatherSnapshot: {
    condition: string
    precipitationMm: number
    temperatureC: number
    windSpeedKmh: number
    floodRiskLevel: string
    retrievedAtWib: string
  } | null
}

export interface CredibilityScoreResult {
  score: number // Clamped 0-100
  baseScore: number
  positiveSignals: Array<{ description: string; points: number }>
  negativeSignals: Array<{ description: string; points: number }>
  status: VerificationStatus
  confidenceLevel: 'suspicious' | 'needs_verification' | 'high_confidence'
  positiveEvidence: string[]
  warnings: string[]
}

export interface VerificationMetadata {
  credibility_score: number
  confidence_level: 'suspicious' | 'needs_verification' | 'high_confidence'
  verification_status: VerificationStatus
  location_accuracy: number | null
  location_grade: 'normal' | 'needs_verification' | 'low_confidence'
  nearest_district: string | null
  reported_at: string
  received_at: string
  photo_taken_at: string | null
  photo_hash: string | null
  photo_dhash: string | null
  duplicate_photo: boolean
  duplicate_count: number
  duplicate_report_codes: string[]
  corroboration_count: number
  corroborating_report_codes: string[]
  nearest_cctv: {
    code: string
    name: string
    category: string
    district: string
    distance_meters: number
    stream_url: string
  } | null
  cctv_evidence: 'corroborated' | 'none_nearby' | 'unavailable'
  weather_evidence: 'positive' | 'neutral' | 'unknown'
  weather_snapshot: {
    condition: string
    precipitation_mm: number
    temperature_c: number
    wind_speed_kmh: number
    retrieved_at: string
  } | null
  positive_evidence: string[]
  warnings: string[]
  honeypot_triggered: boolean
  rate_limit_flag: boolean
  is_within_semarang?: boolean
  is_mock_spoofed?: boolean
  district_mismatch?: boolean
}

export interface VerificationPipelineInput {
  category: string
  description: string
  latitude: number
  longitude: number
  locationAccuracy?: number | null
  reportedAt?: string | null
  photoUrl?: string | null
  photoTakenAt?: string | null
  photoDhash?: string | null
  photoSha256?: string | null
  website?: string | null // Honeypot field
  company?: string | null // Honeypot field
  phoneNumberConfirm?: string | null // Honeypot field
  ip?: string
  districtName?: string | null
  address?: string | null
}

export interface VerificationPipelineResult {
  isBlocked: boolean
  blockReason?: string
  reportCode: string
  status: VerificationStatus
  credibilityScore: number
  metadata: VerificationMetadata
}
