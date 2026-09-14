import fs from 'fs'
import path from 'path'
import type { Report, ReportCategory, UrgencyLevel, ReportStatus } from '@/types'

const DATA_DIR = path.join(process.cwd(), '.data')
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Initial realistic seed reports for Kota Semarang
const INITIAL_SEMAPHORE_REPORTS: Report[] = [
  {
    id: 'rep-smg-001',
    report_code: 'SMG-2026-001',
    category: 'banjir',
    title: 'Genangan Air di Bawah Underpass Kaligawe KM 4',
    description: 'Air limpasan hujan dan rob setinggi 35 cm menggenangi lajur lambat underpass Kaligawe. Lalu lintas tersendat, butuh pompa portabel.',
    latitude: -6.9542,
    longitude: 110.4721,
    lat: -6.9542,
    lng: 110.4721,
    urgency: 'tinggi',
    status: 'in_progress',
    photo_url: '/evidence/flood_414_321_1789291801.jpg',
    reporter_name: 'Warga Pedurungan',
    reporter_contact: '081234567890',
    is_demo: false,
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    district_name: 'Genuk',
    address: 'Jl. Raya Kaligawe KM 4, Genuk, Kota Semarang',
    water_height_cm: 35,
    credibility_score: 92,
    location_accuracy: 8,
    verification_metadata: {
      confidence_level: 'TINGGI',
      nearest_district: 'Genuk',
      water_detected: true,
      corroborated: true,
      positive_evidence: ['Lokasi GPS konsisten dalam radius banjir rob Genuk', 'Foto bukti menampilkan air di badan jalan', 'Curah hujan BMKG mendukung laporan'],
      warnings: [],
    },
    ai_analysis: {
      id: 'ai-001',
      report_id: 'rep-smg-001',
      original_category: 'banjir',
      ai_category: 'banjir',
      ai_confidence: 0.92,
      severity: 'tinggi',
      summary: 'Genangan air rob di Underpass Kaligawe, membatasi akses kendaraan roda dua.',
      recommended_action: 'Aktivasi unit pompa polder Sringin dan penempatan rambu peringatan.',
      model_name: 'KotaKu-Verification-Engine',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'rep-smg-002',
    report_code: 'SMG-2026-002',
    category: 'banjir',
    title: 'Luapan Air Pasang Rob di Kawasan Pelabuhan Tanjung Emas',
    description: 'Air laut meluap melebihi bibir dermaga hingga setinggi lutut orang dewasa (55-60 cm). Akses menuju pos 4 terhambat.',
    latitude: -6.9554,
    longitude: 110.4182,
    lat: -6.9554,
    lng: 110.4182,
    urgency: 'kritis',
    status: 'verified',
    photo_url: '/evidence/flood_414_321_1789291950.jpg',
    reporter_name: 'Petugas Pelabuhan',
    reporter_contact: '082198765432',
    is_demo: false,
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    district_name: 'Semarang Utara',
    address: 'Kawasan Pelabuhan Tanjung Emas, Semarang Utara',
    water_height_cm: 60,
    credibility_score: 96,
    location_accuracy: 5,
    verification_metadata: {
      confidence_level: 'SANGAT_TINGGI',
      nearest_district: 'Semarang Utara',
      water_detected: true,
      corroborated: true,
      positive_evidence: ['Tinggi pasang Tanjung Emas > +90 cm MSL', 'Validasi visual CCTV pelabuhan terkonfirmasi'],
      warnings: [],
    },
    ai_analysis: {
      id: 'ai-002',
      report_id: 'rep-smg-002',
      original_category: 'banjir',
      ai_category: 'banjir',
      ai_confidence: 0.96,
      severity: 'kritis',
      summary: 'Limpasan pasang rob maksimum di area pesisir Semarang Utara.',
      recommended_action: 'Pengoperasian tanggul darurat dan evakuasi pekerja pergudangan.',
      model_name: 'KotaKu-Verification-Engine',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'rep-smg-003',
    report_code: 'SMG-2026-003',
    category: 'genangan',
    title: 'Antrean Air di Simpang Supriyadi',
    description: 'Genangan setinggi mata kaki (15-20 cm) di depan deretan pertokoan Supriyadi akibat limpasan hujan deras.',
    latitude: -7.0056,
    longitude: 110.4543,
    lat: -7.0056,
    lng: 110.4543,
    urgency: 'sedang',
    status: 'submitted',
    photo_url: '/evidence/flood_414_321_1789291955.jpg',
    reporter_name: 'Budi Santoso',
    reporter_contact: '081344556677',
    is_demo: false,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    district_name: 'Pedurungan',
    address: 'Jl. Supriyadi, Kec. Pedurungan, Kota Semarang',
    water_height_cm: 20,
    credibility_score: 86,
    location_accuracy: 10,
    verification_metadata: {
      confidence_level: 'SEDANG',
      nearest_district: 'Pedurungan',
      water_detected: true,
      corroborated: false,
      positive_evidence: ['Kamera PantauSemar Supriyadi mendeteksi area basah'],
      warnings: ['Menunggu konfirmasi lapangan petugas'],
    },
  },
  {
    id: 'rep-smg-004',
    report_code: 'SMG-2026-004',
    category: 'drainase_tersumbat',
    title: 'Saluran Drainase Tersumbat Sampah Plastik di Barito',
    description: 'Inlet gorong-gorong tersumbat sedimentasi lumpur dan sampah di dekat jembatan Barito, menghambat aliran air ke kali.',
    latitude: -6.9742,
    longitude: 110.4350,
    lat: -6.9742,
    lng: 110.4350,
    urgency: 'rendah',
    status: 'resolved',
    photo_url: null,
    reporter_name: 'Siti Aminah',
    reporter_contact: null,
    is_demo: false,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    district_name: 'Semarang Timur',
    address: 'Jl. Barito, Semarang Timur',
    water_height_cm: 10,
    credibility_score: 88,
    location_accuracy: 12,
    verification_metadata: {
      confidence_level: 'TERVERIFIKASI',
      nearest_district: 'Semarang Timur',
      positive_evidence: ['Pembersihan saluran selesai dilaksanakan Dinas PU'],
      warnings: [],
    },
  },
  {
    id: 'rep-smg-005',
    report_code: 'SMG-2026-005',
    category: 'pohon_tumbang',
    title: 'Dahan Pohon Tumbang Menutup Sebagian Akses Jalan',
    description: 'Dahan pohon trembesi patah diterpa angin kencang, menimpa pembatas jalan dan kabel fiber optik.',
    latitude: -6.9850,
    longitude: 110.4420,
    lat: -6.9850,
    lng: 110.4420,
    urgency: 'sedang',
    status: 'verified',
    photo_url: null,
    reporter_name: 'Rudi Hartono',
    reporter_contact: '085612345678',
    is_demo: false,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    district_name: 'Gayamsari',
    address: 'Jl. Majapahit, Kec. Gayamsari',
    water_height_cm: 0,
    credibility_score: 90,
    location_accuracy: 15,
    verification_metadata: {
      confidence_level: 'TINGGI',
      nearest_district: 'Gayamsari',
      positive_evidence: ['Laporan telah diverifikasi oleh tim Disperkim'],
      warnings: [],
    },
  },
  {
    id: 'rep-smg-006',
    report_code: 'SMG-2026-006',
    category: 'longsor',
    title: 'Retakan Tanah di Lereng Pemukiman Gombel Lama',
    description: 'Ditemukan retakan tanah sepanjang 4 meter di talud pembatas lereng setelah hujan lebat semalaman. Perlu inspeksi teknis.',
    latitude: -7.0250,
    longitude: 110.4280,
    lat: -7.0250,
    lng: 110.4280,
    urgency: 'tinggi',
    status: 'in_progress',
    photo_url: null,
    reporter_name: 'Agus Pramono',
    reporter_contact: '087799887766',
    is_demo: false,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    district_name: 'Candisari',
    address: 'Kawasan Perbukitan Gombel Lama, Kec. Candisari',
    water_height_cm: 0,
    credibility_score: 94,
    location_accuracy: 7,
    verification_metadata: {
      confidence_level: 'TINGGI',
      nearest_district: 'Candisari',
      positive_evidence: ['Kondisi topografi kemiringan lereng > 30% mendukung potensi rayapan'],
      warnings: [],
    },
  },
]

class LocalReportStore {
  private reports: Report[] = []
  private initialized = false

  constructor() {
    this.load()
  }

  private load() {
    ensureDataDir()
    try {
      if (fs.existsSync(REPORTS_FILE)) {
        const raw = fs.readFileSync(REPORTS_FILE, 'utf-8')
        if (raw && raw.trim().length > 2) {
          this.reports = JSON.parse(raw)
          this.initialized = true
          return
        }
      }
    } catch (err) {
      console.warn('Failed to read reports.json, initializing with default seed:', err)
    }

    // Seed defaults if file doesn't exist
    this.reports = [...INITIAL_SEMAPHORE_REPORTS]
    this.save()
    this.initialized = true
  }

  private save() {
    ensureDataDir()
    try {
      fs.writeFileSync(REPORTS_FILE, JSON.stringify(this.reports, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save reports to disk:', err)
    }
  }

  public getAll(filters: {
    search?: string
    category?: string
    urgency?: string
    status?: string
    district?: string
    page?: number
    limit?: number
  } = {}): { data: Report[]; count: number } {
    let list = [...this.reports]

    if (filters.category && filters.category !== 'all') {
      list = list.filter((r) => r.category === filters.category)
    }
    if (filters.urgency && filters.urgency !== 'all') {
      list = list.filter((r) => r.urgency === filters.urgency)
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter((r) => r.status === filters.status)
    }
    if (filters.district && filters.district !== 'all') {
      const distLower = filters.district.toLowerCase()
      list = list.filter((r) => r.district_name?.toLowerCase().includes(distLower))
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.district_name?.toLowerCase().includes(q) ||
          r.report_code?.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q)
      )
    }

    const totalCount = list.length
    const page = filters.page || 0
    const limit = filters.limit || 100
    const paginated = list.slice(page * limit, (page + 1) * limit)

    return { data: paginated, count: totalCount }
  }

  public getById(id: string): Report | null {
    const report = this.reports.find((r) => r.id === id || r.report_code === id)
    return report || null
  }

  public create(reportData: Partial<Report>): Report {
    const id = reportData.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const now = new Date().toISOString()
    const reportCode = reportData.report_code || `SMG-${new Date().getFullYear()}-${String(this.reports.length + 1).padStart(3, '0')}`

    const newReport: Report = {
      id,
      report_code: reportCode,
      category: reportData.category || 'genangan',
      title: reportData.title || reportData.description?.slice(0, 40) || 'Laporan Warga',
      description: reportData.description || '',
      latitude: reportData.latitude || -6.9932,
      longitude: reportData.longitude || 110.4203,
      lat: reportData.latitude || -6.9932,
      lng: reportData.longitude || 110.4203,
      urgency: reportData.urgency || 'sedang',
      status: reportData.status || 'submitted',
      photo_url: reportData.photo_url || null,
      reporter_name: reportData.reporter_name || null,
      reporter_contact: reportData.reporter_contact || null,
      is_demo: false,
      created_at: reportData.created_at || now,
      updated_at: reportData.updated_at || now,
      district_name: reportData.district_name || 'Kota Semarang',
      address: reportData.address || null,
      water_height_cm: reportData.water_height_cm ?? null,
      credibility_score: reportData.credibility_score ?? 85,
      location_accuracy: reportData.location_accuracy ?? 10,
      verification_metadata: reportData.verification_metadata || null,
      ai_analysis: reportData.ai_analysis || null,
    }

    this.reports.unshift(newReport)
    this.save()
    return newReport
  }

  public update(id: string, updates: Partial<Report>): Report | null {
    const index = this.reports.findIndex((r) => r.id === id || r.report_code === id)
    if (index === -1) return null

    this.reports[index] = {
      ...this.reports[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.save()
    return this.reports[index]
  }

  public getStats() {
    const all = this.reports
    const total = all.length
    const active = all.filter((r) => !['resolved', 'rejected', 'duplicate'].includes(r.status)).length
    const critical = all.filter((r) => r.urgency === 'kritis' || (r.urgency as string) === 'critical').length
    const resolved = all.filter((r) => r.status === 'resolved').length

    const categoryCount: Record<string, number> = {}
    for (const r of all) {
      categoryCount[r.category] = (categoryCount[r.category] || 0) + 1
    }

    const urgencyCount: Record<string, number> = {}
    for (const r of all) {
      urgencyCount[r.urgency] = (urgencyCount[r.urgency] || 0) + 1
    }

    const statusCount: Record<string, number> = {}
    for (const r of all) {
      statusCount[r.status] = (statusCount[r.status] || 0) + 1
    }

    // 30-day trend
    const trend: Record<string, { count: number; critical: number }> = {}
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      trend[key] = { count: 0, critical: 0 }
    }

    for (const r of all) {
      const key = (r.created_at || new Date().toISOString()).split('T')[0]
      if (trend[key]) {
        trend[key].count++
        if (r.urgency === 'kritis' || (r.urgency as string) === 'critical') {
          trend[key].critical++
        }
      }
    }

    const trendData = Object.entries(trend).map(([date, vals]) => ({
      date,
      count: vals.count,
      critical: vals.critical,
    }))

    return {
      stats: { total, active, critical, resolved },
      categories: categoryCount,
      urgencies: urgencyCount,
      statuses: statusCount,
      trend: trendData,
    }
  }
}

export const localReportStore = new LocalReportStore()
