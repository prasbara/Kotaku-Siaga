// ============================================================
// KotaKu Siaga — Fire Early Detection & Monitoring Data Models
// NASA FIRMS · SiPongi+ · SEMARISK · Multi-Source Correlation
// Zero Fake Claims · Strict Provenance · Early Detection Standard
// ============================================================

import type { Report } from './index'

export type FireSource =
  | 'NASA_FIRMS_VIIRS'
  | 'NASA_FIRMS_MODIS'
  | 'SIPONGI_KLHK'
  | 'SEMARISK_BPBD'
  | 'CITIZEN_REPORT'
  | 'CCTV_VERIFIED'

export type FireSignalStatus =
  | 'SIGNAL_DETECTED'
  | 'UNDER_REVIEW'
  | 'CORRELATED'
  | 'VERIFIED'
  | 'ACTIVE'
  | 'RESOLVED'
  | 'DISMISSED'

export type DetectionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface FireObservation {
  id: string
  source: FireSource
  source_record_id: string
  latitude: number
  longitude: number
  observed_at: string
  retrieved_at: string
  satellite: string
  instrument: string
  confidence: 'nominal' | 'low' | 'high' | number
  frp?: number // Fire Radiative Power (MW)
  day_night?: 'D' | 'N'
  brightness_temp_k?: number
  district_name?: string
  proximity_settlement_meters?: number
  freshness_status: 'FRESH' | 'AGING' | 'STALE' | 'EXPIRED'
  quality_status: 'HIGH' | 'MODERATE' | 'LIMITED'
  verification_status: FireSignalStatus
  is_simulation?: boolean
  created_at: string
  updated_at: string
}

export interface FireInvestigationCase {
  id: string
  case_code: string
  created_at: string
  updated_at: string
  district_name: string
  latitude: number
  longitude: number
  detection_priority: DetectionPriority
  status: 'NEW' | 'UNDER_REVIEW' | 'CORRELATED' | 'VERIFIED' | 'REJECTED' | 'RESOLVED' | 'DISMISSED'
  confidence_level: 'HIGH' | 'MODERATE' | 'LIMITED'
  signals: FireObservation[]
  citizen_reports: Report[]
  related_cctv_ids?: string[]
  correlation_reasons: string[]
  timeline: {
    time: string
    label: string
    actor: string
    details?: string
  }[]
  notes?: string
  verified_by?: string | null
  verified_at?: string | null
}

export interface FireIncident {
  id: string
  incident_code: string
  case_id?: string
  fire_type:
    | 'Building / Settlement'
    | 'Land / Vegetation'
    | 'Industrial / Warehouse'
    | 'Vehicle'
    | 'Public Facility'
    | 'Other / Unknown'
  district_name: string
  location_address?: string
  latitude: number
  longitude: number
  reported_at: string
  verified_at: string
  severity: 'kritis' | 'tinggi' | 'sedang' | 'rendah'
  verification_status: 'VERIFIED' | 'ACTIVE' | 'RESOLVED'
  source_lineage: string[]
  evidence_urls?: string[]
  last_updated: string
  notes?: string
}

export interface FireStatsSummary {
  total_signals_detected: number
  active_fire_signals: number
  signals_under_review: number
  correlated_cases_count: number
  verified_incidents_count: number
  last_data_update: string
  sources_health: {
    nasa_firms: { status: 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE'; last_update: string; latency_ms: number }
    sipongi_klhk: { status: 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE'; last_update: string }
    semarisk_bpbd: { status: 'CONNECTED' | 'DEGRADED' | 'UNAVAILABLE'; last_update: string }
    citizen_reports: { status: 'CONNECTED'; last_report_at: string | null }
  }
}
