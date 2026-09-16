// ============================================================
// KotaKu Siaga — Type Definitions
// ============================================================

export type ReportCategory =
  | 'banjir'
  | 'genangan'
  | 'drainase_tersumbat'
  | 'sampah_menumpuk'
  | 'infrastruktur_hijau'
  | 'pohon_tumbang'
  | 'longsor'
  | 'kebakaran'
  | 'lainnya'

export type UrgencyLevel = 'rendah' | 'sedang' | 'tinggi' | 'kritis'

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'investigating'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'suspicious'
  | 'duplicate'

// Structured Dynamic Incident Data Models
export type FireCondition =
  | 'api_terlihat'
  | 'asap_terlihat'
  | 'api_dan_asap'
  | 'dugaan_kebakaran'
  | 'kebakaran_padam'
  | 'tidak_diketahui'

export type FireLocationSubtype =
  | 'rumah_permukiman'
  | 'gedung_bertingkat'
  | 'kendaraan'
  | 'lahan_vegetasi'
  | 'industri_pabrik'
  | 'fasilitas_umum'
  | 'area_komersial'
  | 'lainnya'

export type FireSpreadCondition =
  | 'terlokalisasi'
  | 'mulai_menyebar'
  | 'meluas'
  | 'tidak_diketahui'

export type SmokeIntensity =
  | 'tidak_terlihat'
  | 'tipis'
  | 'sedang'
  | 'tebal'
  | 'tidak_diketahui'

export type CasualtyPotential =
  | 'tidak_diketahui'
  | 'tidak_ada_korban'
  | 'orang_terjebak'
  | 'ada_korban'
  | 'butuh_evakuasi'

export type AdditionalHazard =
  | 'listrik'
  | 'lpg_gas'
  | 'bahan_kimia'
  | 'bahan_mudah_terbakar'
  | 'kendaraan'
  | 'bangunan_runtuh'
  | 'ledakan'
  | 'tidak_diketahui'

export interface FireIncidentDetails {
  incident_type: 'kebakaran'
  fire_condition: FireCondition
  location_subtype: FireLocationSubtype
  spread_condition: FireSpreadCondition
  smoke_intensity: SmokeIntensity
  casualty_potential: CasualtyPotential
  additional_hazards: AdditionalHazard[]
  estimated_area_m2?: number | null
}

export interface FloodIncidentDetails {
  incident_type: 'banjir' | 'genangan'
  water_height_cm?: number | null
  water_depth_label?: string | null
  flow_speed?: 'tenang' | 'mengalir_pelan' | 'deras' | 'sangat_deras'
  road_access?: 'bisa_dilewati' | 'roda_dua_mogok' | 'terputus_total'
  home_impact?: 'tidak_masuk' | 'halaman_pekarangan' | 'dalam_rumah'
  inundation_duration_hours?: number | null
}

export interface TreeIncidentDetails {
  incident_type: 'pohon_tumbang'
  tree_size?: 'kecil' | 'sedang' | 'besar'
  road_blocked?: 'sebagian' | 'total' | 'tidak_menghalangi'
  electrical_wires_impacted?: boolean
  building_threat?: boolean
  casualties?: boolean
}

export interface LandslideIncidentDetails {
  incident_type: 'longsor'
  material_condition?: 'tanah_basah' | 'batu_bongkahan' | 'pohon_dan_lumpur'
  road_blocked?: 'sebagian' | 'total' | 'tidak_menghalangi'
  settlement_threat?: boolean
}

export type IncidentDetails =
  | FireIncidentDetails
  | FloodIncidentDetails
  | TreeIncidentDetails
  | LandslideIncidentDetails
  | Record<string, any>

export interface Report {
  id: string
  report_code: string
  category: ReportCategory
  description: string
  latitude: number
  longitude: number
  lat?: number
  lng?: number
  urgency: UrgencyLevel
  status: ReportStatus
  photo_url?: string | null
  reporter_name?: string | null
  reporter_contact?: string | null
  reporter_id?: string | null
  is_demo: boolean
  is_simulation?: boolean
  created_at: string
  updated_at: string
  title?: string | null
  district_name?: string | null
  address?: string | null
  water_height_cm?: number | null
  incident_details?: IncidentDetails | null
  credibility_score?: number | null
  location_accuracy?: number | null
  verification_metadata?: any | null
  reporter_email?: string | null
  reporter_phone?: string | null
  email_verified?: boolean | null
  turnstile_verified?: boolean | null
  incident_cluster_id?: string | null
  independent_reporter_count?: number | null
  corroboration_count?: number | null
  abuse_score?: number | null
  event_type?: string | null
  client_session_id?: string | null
  client_ip_hash?: string | null
  // Joined fields
  ai_analysis?: AIAnalysis | null
}

export interface AIAnalysis {
  id: string
  report_id: string
  original_category: string
  ai_category: string
  ai_confidence: number
  severity: string
  summary: string
  recommended_action: string
  model_name: string
  created_at: string
}

export interface Area {
  id: string
  name: string
  latitude?: number | null
  longitude?: number | null
  population_density: number
  environmental_vulnerability: number
}

export interface PriorityScore {
  id: string
  area_id: string
  report_frequency: number
  urgency_score: number
  population_density_score: number
  vulnerability_score: number
  priority_score: number
  created_at: string
  // Joined
  area?: Area
}

export interface EducationalContent {
  id: string
  category: string
  title: string
  content: string
  created_at: string
}

// ============================================================
// AI Response Types
// ============================================================

export interface AIReportAnalysis {
  classification: string
  severity: string
  confidence: number
  summary: string
  recommended_action: string
  requires_verification: boolean
}

export interface AIAggregateAnalysis {
  area_assessment: string
  main_issue: string
  recommended_intervention: string
  confidence: number
}

export interface AIChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

// ============================================================
// Form Types
// ============================================================

export interface ReportFormData {
  category: ReportCategory
  description: string
  latitude: number | null
  longitude: number | null
  urgency: UrgencyLevel
  reporter_name?: string
  reporter_contact?: string
  photo?: File | null
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardStats {
  total_reports: number
  active_reports: number
  critical_reports: number
  resolved_reports: number
  avg_response_hours: number
  top_area: string
}

export interface ReportTrend {
  date: string
  count: number
  critical: number
}

export interface CategoryDistribution {
  category: string
  label: string
  count: number
  percentage: number
}

export interface StatusDistribution {
  status: ReportStatus
  label: string
  count: number
}

// ============================================================
// Map Types
// ============================================================

export interface MapFilters {
  categories: ReportCategory[]
  urgencies: UrgencyLevel[]
  statuses: ReportStatus[]
}

export interface MapViewMode {
  type: 'markers' | 'heatmap' | 'both'
}

// ============================================================
// Labels & Config
// ============================================================

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  banjir: 'Banjir Rob',
  genangan: 'Genangan Air Hujan',
  kebakaran: 'Kebakaran',
  drainase_tersumbat: 'Drainase Tersumbat',
  sampah_menumpuk: 'Sampah Menumpuk',
  infrastruktur_hijau: 'Infrastruktur Hijau Rusak',
  pohon_tumbang: 'Pohon Tumbang',
  longsor: 'Longsor / Rekahan',
  lainnya: 'Lainnya',
}

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Menunggu Verifikasi',
  under_review: 'Sedang Ditinjau',
  verified: 'Terverifikasi',
  investigating: 'Dalam Investigasi',
  in_progress: 'Dalam Penanganan',
  resolved: 'Selesai',
  rejected: 'Ditolak',
  suspicious: 'Mencurigakan / Spam',
  duplicate: 'Duplikat',
}

export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  rendah: '#22c55e',
  sedang: '#f59e0b',
  tinggi: '#f97316',
  kritis: '#dc2626',
}

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  banjir: 'waves',
  genangan: 'droplets',
  kebakaran: 'flame',
  drainase_tersumbat: 'wrench',
  sampah_menumpuk: 'trash-2',
  infrastruktur_hijau: 'leaf',
  pohon_tumbang: 'trees',
  longsor: 'mountain',
  lainnya: 'map-pin',
}
