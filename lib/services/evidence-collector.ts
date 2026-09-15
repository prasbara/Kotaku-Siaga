// ============================================================
// KotaKu Siaga — Evidence Collector Service
// Menghubungkan Citizen Report dengan CCTV Terdekat (radius 1.5km)
// CPU-Only · Vercel-Compatible · No Telegram · No Simulation
// ============================================================

import crypto from 'crypto'
import { PANTAUSEMAR_CCTV_POINTS, CCTVPoint } from '@/lib/data/cctv-pantausemar'
import { CCTVObservationRecord } from '@/lib/cv/types'

// ============================================================
// TYPES
// ============================================================

export interface NearbyCCTV {
  cctv: CCTVPoint
  distance_m: number
  bearing_deg: number
  direction_label: string
}

export interface CCTVEvidenceRecord {
  cctv_id: string
  cctv_code: string
  cctv_name: string
  cctv_district: string
  cctv_address: string
  stream_url: string
  latitude: number
  longitude: number
  distance_m: number
  bearing_deg: number
  direction_label: string
  cctv_status: 'online' | 'offline' | 'maintenance'
  // Snapshot metadata
  snapshot_url: string | null
  snapshot_captured_at: string | null // when OUR system captured it
  source_timestamp: string | null      // timestamp from CCTV stream metadata
  // CV observation (if available)
  latest_observation: CCTVObservationRecord | null
  flood_state: string | null
  visual_confidence: number | null
  // Integrity
  sha256_hash: string | null
  evidence_strength: EvidenceStrength
  // Timestamp correlation
  timestamp_delta_minutes: number | null
  timestamp_correlation: 'WITHIN_5MIN' | 'WITHIN_30MIN' | 'WITHIN_1HOUR' | 'STALE' | 'NO_DATA'
}

export interface EvidenceBundle {
  bundle_id: string
  report_id: string
  report_code: string
  report_lat: number
  report_lng: number
  report_submitted_at: string
  // CCTV Evidence
  nearby_cctv: CCTVEvidenceRecord[]
  total_cctv_searched: number
  radius_km: number
  // Summary
  supporting_cctv_count: number
  conflicting_cctv_count: number
  neutral_cctv_count: number
  offline_cctv_count: number
  evidence_strength_overall: EvidenceStrength
  operator_note: string
  // Integrity
  bundle_sha256: string
  created_at: string
  methodology_note: string
}

export type EvidenceStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'NEUTRAL' | 'CONFLICTING' | 'NO_DATA'

// ============================================================
// HAVERSINE DISTANCE CALCULATION
// ============================================================

export function haversineDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Bearing in degrees (0=N, 90=E, 180=S, 270=W)
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const dLon = toRad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

function bearingToLabel(deg: number): string {
  const dirs = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut']
  return dirs[Math.round(deg / 45) % 8]
}

// ============================================================
// TIMESTAMP CORRELATION
// ============================================================

function getTimestampCorrelation(
  reportAt: string,
  snapshotAt: string | null
): { label: CCTVEvidenceRecord['timestamp_correlation']; delta_minutes: number | null } {
  if (!snapshotAt) return { label: 'NO_DATA', delta_minutes: null }
  const delta = Math.abs(
    (new Date(snapshotAt).getTime() - new Date(reportAt).getTime()) / 60000
  )
  if (delta <= 5) return { label: 'WITHIN_5MIN', delta_minutes: Math.round(delta) }
  if (delta <= 30) return { label: 'WITHIN_30MIN', delta_minutes: Math.round(delta) }
  if (delta <= 60) return { label: 'WITHIN_1HOUR', delta_minutes: Math.round(delta) }
  return { label: 'STALE', delta_minutes: Math.round(delta) }
}

// ============================================================
// EVIDENCE STRENGTH EVALUATOR
// ============================================================

function evaluateEvidenceStrength(
  obs: CCTVObservationRecord | null,
  cctv_status: string,
  timestamp_corr: CCTVEvidenceRecord['timestamp_correlation']
): EvidenceStrength {
  if (cctv_status === 'offline' || cctv_status === 'maintenance') return 'NO_DATA'
  if (!obs) return 'NEUTRAL'
  if (timestamp_corr === 'STALE') return 'WEAK'

  const state = obs.status
  const vc = obs.visual_score

  if (state === 'FLOOD_CONFIRMED') {
    if (timestamp_corr === 'WITHIN_5MIN' || timestamp_corr === 'WITHIN_30MIN') return 'STRONG'
    return 'MODERATE'
  }
  if (state === 'FLOOD_SUSPECTED' || state === 'WATER_SUSPECTED') {
    if (vc >= 0.6) return 'MODERATE'
    return 'WEAK'
  }
  if (state === 'NORMAL') {
    // CCTV normal sementara laporan banjir = potentially conflicting
    if (vc < 0.3 && (timestamp_corr === 'WITHIN_5MIN' || timestamp_corr === 'WITHIN_30MIN'))
      return 'CONFLICTING'
    return 'NEUTRAL'
  }
  return 'NEUTRAL'
}

// ============================================================
// SHA-256 INTEGRITY HASH
// ============================================================

export function computeSHA256(data: string | object): string {
  const input = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto.createHash('sha256').update(input).digest('hex')
}

// ============================================================
// FIND NEARBY CCTV (radius in meters)
// ============================================================

export function findNearbyCCTV(
  lat: number,
  lon: number,
  radiusMeters: number = 1500
): NearbyCCTV[] {
  return PANTAUSEMAR_CCTV_POINTS.map((cctv) => {
    const dist = haversineDistanceMeters(lat, lon, cctv.latitude, cctv.longitude)
    const bearing = calculateBearing(lat, lon, cctv.latitude, cctv.longitude)
    return {
      cctv,
      distance_m: Math.round(dist),
      bearing_deg: Math.round(bearing),
      direction_label: bearingToLabel(bearing),
    }
  })
    .filter((item) => item.distance_m <= radiusMeters)
    .sort((a, b) => a.distance_m - b.distance_m)
}

// ============================================================
// LOAD LATEST OBSERVATIONS PER CAMERA (serverless-safe)
// ============================================================

function loadLatestObservationsByCameraId(): Map<string, CCTVObservationRecord> {
  const map = new Map<string, CCTVObservationRecord>()
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const obsFile = path.join(process.cwd(), '.data', 'cctv_observations.json')
    if (!fs.existsSync(obsFile)) return map
    const raw = fs.readFileSync(obsFile, 'utf-8')
    const obs: CCTVObservationRecord[] = JSON.parse(raw)
    for (const o of obs) {
      const existing = map.get(o.camera_id)
      if (!existing || new Date(o.timestamp) > new Date(existing.timestamp)) {
        map.set(o.camera_id, o)
      }
    }
  } catch {
    // Observation cache unavailable — silent fail, no simulation
  }
  return map
}

// ============================================================
// COLLECT EVIDENCE BUNDLE
// ============================================================

export async function collectEvidenceBundle(params: {
  report_id: string
  report_code: string
  report_lat: number
  report_lng: number
  report_submitted_at: string
  radius_km?: number
}): Promise<EvidenceBundle> {
  const { report_id, report_code, report_lat, report_lng, report_submitted_at } = params
  const radiusMeters = (params.radius_km ?? 1.5) * 1000

  const nearby = findNearbyCCTV(report_lat, report_lng, radiusMeters)
  const observationsMap = loadLatestObservationsByCameraId()

  let supporting = 0
  let conflicting = 0
  let neutral = 0
  let offline = 0

  const cctv_evidence: CCTVEvidenceRecord[] = nearby.map((nc) => {
    const obs = observationsMap.get(nc.cctv.id) ?? null
    const snapshotAt = obs?.timestamp ?? null
    const corr = getTimestampCorrelation(report_submitted_at, snapshotAt)
    const strength = evaluateEvidenceStrength(obs, nc.cctv.status, corr.label)

    if (nc.cctv.status === 'offline' || nc.cctv.status === 'maintenance') offline++
    else if (strength === 'STRONG' || strength === 'MODERATE') supporting++
    else if (strength === 'CONFLICTING') conflicting++
    else neutral++

    const integrityPayload = {
      cctv_id: nc.cctv.id,
      snapshot_captured_at: snapshotAt,
      visual_score: obs?.visual_score ?? null,
      status: obs?.status ?? null,
      report_code,
    }
    const sha256 = computeSHA256(integrityPayload)

    return {
      cctv_id: nc.cctv.id,
      cctv_code: nc.cctv.code,
      cctv_name: nc.cctv.name,
      cctv_district: nc.cctv.district,
      cctv_address: nc.cctv.address,
      stream_url: nc.cctv.streamUrl,
      latitude: nc.cctv.latitude,
      longitude: nc.cctv.longitude,
      distance_m: nc.distance_m,
      bearing_deg: nc.bearing_deg,
      direction_label: nc.direction_label,
      cctv_status: nc.cctv.status,
      snapshot_url: obs?.evidence_url ?? null,
      snapshot_captured_at: snapshotAt,
      source_timestamp: snapshotAt,
      latest_observation: obs,
      flood_state: obs?.status ?? null,
      visual_confidence: obs?.visual_score ?? null,
      sha256_hash: sha256,
      evidence_strength: strength,
      timestamp_delta_minutes: corr.delta_minutes,
      timestamp_correlation: corr.label,
    }
  })

  // Overall strength calculation
  let overall_strength: EvidenceStrength = 'NEUTRAL'
  if (cctv_evidence.length === 0) {
    overall_strength = 'NO_DATA'
  } else if (supporting >= 2) {
    overall_strength = 'STRONG'
  } else if (supporting >= 1 && conflicting === 0) {
    overall_strength = 'MODERATE'
  } else if (conflicting > supporting) {
    overall_strength = 'CONFLICTING'
  } else if (offline === cctv_evidence.length) {
    overall_strength = 'NO_DATA'
  } else {
    overall_strength = 'WEAK'
  }

  const operator_note = buildOperatorNote(
    overall_strength, supporting, conflicting, neutral, offline, cctv_evidence.length
  )

  const bundle: EvidenceBundle = {
    bundle_id: `EVD-${report_code}-${Date.now()}`,
    report_id,
    report_code,
    report_lat,
    report_lng,
    report_submitted_at,
    nearby_cctv: cctv_evidence,
    total_cctv_searched: PANTAUSEMAR_CCTV_POINTS.length,
    radius_km: radiusMeters / 1000,
    supporting_cctv_count: supporting,
    conflicting_cctv_count: conflicting,
    neutral_cctv_count: neutral,
    offline_cctv_count: offline,
    evidence_strength_overall: overall_strength,
    operator_note,
    bundle_sha256: '',
    created_at: new Date().toISOString(),
    methodology_note:
      'Evidence dikumpulkan dari CCTV PantauSemar Kota Semarang dalam radius 1.5km dari koordinat laporan. ' +
      'CCTV OFFLINE = UNKNOWN (bukan bukti tidak ada banjir). ' +
      'Watermark metadata menunjukkan waktu sistem menangkap data, bukan waktu kejadian. ' +
      'Sistem ini membantu operator memverifikasi laporan, bukan menggantikan keputusan manusia.',
  }

  bundle.bundle_sha256 = computeSHA256({
    bundle_id: bundle.bundle_id,
    report_code,
    cctv_count: cctv_evidence.length,
    overall_strength,
    created_at: bundle.created_at,
  })

  return bundle
}

// ============================================================
// OPERATOR NOTE GENERATOR
// ============================================================

function buildOperatorNote(
  strength: EvidenceStrength,
  supporting: number,
  conflicting: number,
  neutral: number,
  offline: number,
  total: number
): string {
  if (total === 0) {
    return 'Tidak ada CCTV PantauSemar dalam radius 1.5km dari lokasi laporan.'
  }
  const summary = `${total} CCTV ditemukan: ${supporting} mendukung, ${conflicting} bertentangan, ${neutral} netral, ${offline} offline.`
  switch (strength) {
    case 'STRONG':
      return `${summary} Beberapa CCTV mendeteksi genangan/banjir dalam rentang waktu yang berdekatan dengan laporan. Tingkat kepercayaan tinggi.`
    case 'MODERATE':
      return `${summary} Satu atau lebih CCTV menunjukkan indikasi genangan. Disarankan operator melakukan verifikasi lapangan.`
    case 'CONFLICTING':
      return `${summary} CCTV terdekat menunjukkan kondisi normal sementara laporan menyatakan banjir. Diperlukan verifikasi lapangan lebih lanjut.`
    case 'WEAK':
      return `${summary} Data CCTV tidak cukup konklusif. Observasi terakhir sudah terlalu lama atau tidak mencapai ambang batas deteksi.`
    case 'NO_DATA':
      return `${summary} Semua CCTV dalam radius sedang offline atau tidak ada data observasi. Tidak dapat dikonfirmasi atau dibantah secara visual.`
    default:
      return `${summary} Data CCTV tersedia namun tidak menunjukkan tanda-tanda genangan signifikan.`
  }
}
