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

// PRODUCTION: No dummy or mock reports are pre-seeded.
// Reports are solely created by actual citizen reports via API or Supabase.

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
      console.warn('Failed to read reports.json:', err)
    }

    // PRODUCTION: start with clean, empty database. Zero dummy reports.
    this.reports = []
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
    is_simulation?: boolean | string
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
    if (filters.is_simulation !== undefined) {
      const isSim = typeof filters.is_simulation === 'string' ? filters.is_simulation === 'true' : Boolean(filters.is_simulation)
      list = list.filter((r) => Boolean(r.is_simulation || r.is_demo) === isSim)
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

  public list(filters: any = {}): { data: Report[]; count: number } {
    return this.getAll(filters)
  }

  public getById(id: string): Report | null {
    const report = this.reports.find((r) => r.id === id || r.report_code === id)
    return report || null
  }

  public create(reportData: Partial<Report>): Report {
    const randomSuffix = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)
    const id = reportData.id || `rep-${Date.now()}-${randomSuffix}`
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
      is_demo: Boolean(reportData.is_demo || reportData.is_simulation),
      is_simulation: Boolean(reportData.is_simulation || reportData.is_demo),
      created_at: reportData.created_at || now,
      updated_at: reportData.updated_at || now,
      district_name: reportData.district_name || 'Kota Semarang',
      address: reportData.address || null,
      water_height_cm: ['banjir', 'genangan', 'rob', 'drainase_tersumbat'].includes(reportData.category as string) ? (reportData.water_height_cm ?? null) : null,
      incident_details: reportData.incident_details || null,
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

  public getStats(options: { is_simulation?: boolean } = {}) {
    let all = this.reports
    if (options.is_simulation !== undefined) {
      all = all.filter((r) => Boolean(r.is_simulation || r.is_demo) === options.is_simulation)
    }
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
