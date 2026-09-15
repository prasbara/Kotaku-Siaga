// ============================================================
// KotaKu Siaga — Geospatial Enrichment & Spatial Analysis
// Study Area: Kota Semarang (-7.115 to -6.920 Lat, 110.270 to 110.500 Lng)
// Strict Coordinate Audit: MAPPABLE | INVALID | OUTSIDE_STUDY_AREA
// ============================================================

import { STUDY_AREA_CONFIG, SEMARANG_KECAMATAN } from '../ingestion/semarang-admin'
import type { AdministrativeArea } from '../ingestion/types'

export type SpatialStatus = 'MAPPABLE' | 'INVALID_COORDINATE' | 'MISSING_COORDINATE' | 'OUTSIDE_STUDY_AREA'

export interface SpatialAuditResult {
  status: SpatialStatus
  latitude: number | null
  longitude: number | null
  matched_area_id?: string
  matched_area_name?: string
  distance_to_center_km?: number
}

// Calculate Haversine distance in kilometers between two lat/lng coordinates
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Audit any record with coordinates against the Semarang study area
export function auditSpatialRecord(lat: unknown, lng: unknown): SpatialAuditResult {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { status: 'MISSING_COORDINATE', latitude: null, longitude: null }
  }

  const numLat = Number(lat)
  const numLng = Number(lng)

  if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return { status: 'INVALID_COORDINATE', latitude: null, longitude: null }
  }

  const { minLat, maxLat, minLng, maxLng } = STUDY_AREA_CONFIG.bbox
  const isInsideSemarang = numLat >= minLat && numLat <= maxLat && numLng >= minLng && numLng <= maxLng

  if (!isInsideSemarang) {
    return {
      status: 'OUTSIDE_STUDY_AREA',
      latitude: numLat,
      longitude: numLng,
    }
  }

  // Find nearest Kecamatan center in Semarang
  let closestKecamatan: AdministrativeArea = SEMARANG_KECAMATAN[0]
  let minDistance = Infinity

  for (const kec of SEMARANG_KECAMATAN) {
    const dist = calculateDistanceKm(numLat, numLng, kec.center_lat, kec.center_lng)
    if (dist < minDistance) {
      minDistance = dist
      closestKecamatan = kec
    }
  }

  return {
    status: 'MAPPABLE',
    latitude: numLat,
    longitude: numLng,
    matched_area_id: closestKecamatan.id,
    matched_area_name: closestKecamatan.name,
    distance_to_center_km: Math.round(minDistance * 100) / 100,
  }
}

// Hotspot cluster detection
export interface SpatialHotspot {
  area_id: string
  area_name: string
  center_lat: number
  center_lng: number
  report_count: number
  critical_count: number
  primary_issue: string
  hotspot_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export function detectHotspots(
  reports: Array<{ latitude: number; longitude: number; urgency: string; category: string }>
): SpatialHotspot[] {
  const areaClusters = new Map<
    string,
    {
      kec: AdministrativeArea
      reports: Array<{ urgency: string; category: string }>
    }
  >()

  // Initialize clusters for all 16 kecamatan
  SEMARANG_KECAMATAN.forEach((kec) => {
    areaClusters.set(kec.id, { kec, reports: [] })
  })

  // Assign each report to nearest area
  reports.forEach((rep) => {
    const audit = auditSpatialRecord(rep.latitude, rep.longitude)
    if (audit.status === 'MAPPABLE' && audit.matched_area_id) {
      const cluster = areaClusters.get(audit.matched_area_id)
      if (cluster) {
        cluster.reports.push({ urgency: rep.urgency, category: rep.category })
      }
    }
  })

  // Compute hotspot metrics
  const hotspots: SpatialHotspot[] = []

  areaClusters.forEach(({ kec, reports: repList }) => {
    const count = repList.length
    const critical = repList.filter((r) => r.urgency === 'kritis' || r.urgency === 'tinggi').length

    let severity: SpatialHotspot['hotspot_severity'] = 'LOW'
    if (count >= 15 || critical >= 8) severity = 'CRITICAL'
    else if (count >= 8 || critical >= 4) severity = 'HIGH'
    else if (count >= 3) severity = 'MEDIUM'

    // Determine primary category
    const catFreq: Record<string, number> = {}
    repList.forEach((r) => {
      catFreq[r.category] = (catFreq[r.category] || 0) + 1
    })
    const topCategory = Object.entries(catFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Lingkungan'

    hotspots.push({
      area_id: kec.id,
      area_name: kec.name,
      center_lat: kec.center_lat,
      center_lng: kec.center_lng,
      report_count: count,
      critical_count: critical,
      primary_issue: topCategory,
      hotspot_severity: severity,
    })
  })

  return hotspots.sort((a, b) => b.report_count - a.report_count)
}
