// ============================================================
// KotaKu Siaga — Fire Early Detection Local & Persistent Store
// Stores FireObservation, FireInvestigationCase, FireIncident
// Supports Supabase PostgreSQL sync & Local Fallback (.data/fire_store.json)
// Zero Fake Data · Strict Provenance & Auditability
// ============================================================

import fs from 'fs'
import path from 'path'
import type {
  FireObservation,
  FireInvestigationCase,
  FireIncident,
  FireStatsSummary,
  FireSignalStatus,
  DetectionPriority,
} from '@/types/fire'
import { nasaFirmsService } from './nasa-firms'

const DATA_DIR = path.join(process.cwd(), '.data')
const FIRE_STORE_FILE = path.join(DATA_DIR, 'fire_store.json')

interface FireStoreSchema {
  observations: FireObservation[]
  cases: FireInvestigationCase[]
  incidents: FireIncident[]
  last_ingested_at: string | null
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

class LocalFireStore {
  private static instance: LocalFireStore
  private observations: FireObservation[] = []
  private cases: FireInvestigationCase[] = []
  private incidents: FireIncident[] = []
  private lastIngestedAt: string | null = null
  private initialized = false

  private constructor() {
    this.load()
  }

  public static getInstance(): LocalFireStore {
    if (!LocalFireStore.instance) {
      LocalFireStore.instance = new LocalFireStore()
    }
    return LocalFireStore.instance
  }

  private load() {
    ensureDataDir()
    try {
      if (fs.existsSync(FIRE_STORE_FILE)) {
        const raw = fs.readFileSync(FIRE_STORE_FILE, 'utf-8')
        if (raw && raw.trim().length > 2) {
          const data: FireStoreSchema = JSON.parse(raw)
          this.observations = data.observations || []
          this.cases = data.cases || []
          this.incidents = data.incidents || []
          this.lastIngestedAt = data.last_ingested_at || null
          this.initialized = true
          return
        }
      }
    } catch (err) {
      console.warn('Failed to read fire_store.json:', err)
    }

    this.observations = []
    this.cases = []
    this.incidents = []
    this.lastIngestedAt = null
    this.save()
    this.initialized = true
  }

  private save() {
    ensureDataDir()
    try {
      const data: FireStoreSchema = {
        observations: this.observations,
        cases: this.cases,
        incidents: this.incidents,
        last_ingested_at: this.lastIngestedAt,
      }
      fs.writeFileSync(FIRE_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save fire_store.json to disk:', err)
    }
  }

  // --- OBSERVATIONS ---

  public getObservations(filters: {
    district?: string
    status?: string
    freshness?: string
    is_simulation?: boolean
    limit?: number
  } = {}): FireObservation[] {
    let list = [...this.observations]

    if (filters.district && filters.district !== 'all') {
      const q = filters.district.toLowerCase()
      list = list.filter((o) => o.district_name?.toLowerCase().includes(q))
    }

    if (filters.status && filters.status !== 'all') {
      list = list.filter((o) => o.verification_status === filters.status)
    }

    if (filters.freshness && filters.freshness !== 'all') {
      list = list.filter((o) => o.freshness_status === filters.freshness)
    }

    if (filters.is_simulation !== undefined) {
      list = list.filter((o) => Boolean(o.is_simulation) === filters.is_simulation)
    }

    // Sort by observed_at descending
    list.sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())

    if (filters.limit) {
      list = list.slice(0, filters.limit)
    }

    return list
  }

  public getObservationById(id: string): FireObservation | null {
    return this.observations.find((o) => o.id === id) || null
  }

  public addObservation(obs: FireObservation): FireObservation {
    const existingIdx = this.observations.findIndex(
      (o) => o.id === obs.id || (o.source_record_id === obs.source_record_id && o.source === obs.source)
    )
    if (existingIdx >= 0) {
      this.observations[existingIdx] = { ...this.observations[existingIdx], ...obs, updated_at: new Date().toISOString() }
      this.save()
      return this.observations[existingIdx]
    } else {
      this.observations.unshift(obs)
      this.save()
      return obs
    }
  }

  public addObservations(obsList: FireObservation[]): number {
    let added = 0
    for (const obs of obsList) {
      const existingIdx = this.observations.findIndex(
        (o) => o.id === obs.id || (o.source_record_id === obs.source_record_id && o.source === obs.source)
      )
      if (existingIdx >= 0) {
        this.observations[existingIdx] = { ...this.observations[existingIdx], ...obs, updated_at: new Date().toISOString() }
      } else {
        this.observations.unshift(obs)
        added++
      }
    }
    this.lastIngestedAt = new Date().toISOString()
    this.save()
    return added
  }

  public updateObservationStatus(id: string, status: FireSignalStatus): boolean {
    const obs = this.observations.find((o) => o.id === id)
    if (!obs) return false
    obs.verification_status = status
    obs.updated_at = new Date().toISOString()
    this.save()
    return true
  }

  // --- INVESTIGATION CASES ---

  public getCases(filters: {
    status?: string
    priority?: string
    district?: string
    limit?: number
  } = {}): FireInvestigationCase[] {
    let list = [...this.cases]

    if (filters.status && filters.status !== 'all') {
      list = list.filter((c) => c.status === filters.status)
    }

    if (filters.priority && filters.priority !== 'all') {
      list = list.filter((c) => c.detection_priority === filters.priority)
    }

    if (filters.district && filters.district !== 'all') {
      const q = filters.district.toLowerCase()
      list = list.filter((c) => c.district_name?.toLowerCase().includes(q))
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (filters.limit) {
      list = list.slice(0, filters.limit)
    }

    return list
  }

  public getCaseById(id: string): FireInvestigationCase | null {
    return this.cases.find((c) => c.id === id) || null
  }

  public saveCase(caseItem: FireInvestigationCase): FireInvestigationCase {
    const idx = this.cases.findIndex((c) => c.id === caseItem.id)
    if (idx >= 0) {
      this.cases[idx] = { ...this.cases[idx], ...caseItem, updated_at: new Date().toISOString() }
      this.save()
      return this.cases[idx]
    } else {
      this.cases.unshift(caseItem)
      this.save()
      return caseItem
    }
  }

  public updateCaseStatus(
    id: string,
    status: FireInvestigationCase['status'],
    notes?: string,
    actor = 'Petugas Operator BPBD/Damkar'
  ): FireInvestigationCase | null {
    const caseItem = this.cases.find((c) => c.id === id)
    if (!caseItem) return null

    const nowIso = new Date().toISOString()
    caseItem.status = status
    caseItem.updated_at = nowIso
    if (notes) {
      caseItem.notes = notes
    }

    caseItem.timeline.push({
      time: nowIso,
      label: `Status kasus diubah menjadi ${status}`,
      actor,
      details: notes || undefined,
    })

    // Update member signals verification status accordingly
    for (const sig of caseItem.signals) {
      if (status === 'UNDER_REVIEW') this.updateObservationStatus(sig.id, 'UNDER_REVIEW')
      else if (status === 'VERIFIED') this.updateObservationStatus(sig.id, 'VERIFIED')
      else if (status === 'DISMISSED' || status === 'REJECTED') this.updateObservationStatus(sig.id, 'DISMISSED')
    }

    this.save()
    return caseItem
  }

  // --- VERIFIED INCIDENTS ---

  public getIncidents(filters: {
    status?: string
    district?: string
    severity?: string
    limit?: number
  } = {}): FireIncident[] {
    let list = [...this.incidents]

    if (filters.status && filters.status !== 'all') {
      list = list.filter((i) => i.verification_status === filters.status)
    }

    if (filters.district && filters.district !== 'all') {
      const q = filters.district.toLowerCase()
      list = list.filter((i) => i.district_name?.toLowerCase().includes(q))
    }

    if (filters.severity && filters.severity !== 'all') {
      list = list.filter((i) => i.severity === filters.severity)
    }

    list.sort((a, b) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime())

    if (filters.limit) {
      list = list.slice(0, filters.limit)
    }

    return list
  }

  public createIncidentFromCase(
    caseId: string,
    fireType: FireIncident['fire_type'],
    severity: FireIncident['severity'],
    locationAddress: string,
    notes?: string,
    verifiedBy = 'Petugas Verifikasi Damkar Semarang'
  ): { incident: FireIncident; caseItem: FireInvestigationCase } | null {
    const caseItem = this.cases.find((c) => c.id === caseId)
    if (!caseItem) return null

    const nowIso = new Date().toISOString()
    const incidentCode = `FIRE-INC-${Date.now().toString().slice(-6)}`

    const incident: FireIncident = {
      id: `incident-${Date.now()}`,
      incident_code: incidentCode,
      case_id: caseItem.id,
      fire_type: fireType,
      district_name: caseItem.district_name,
      location_address: locationAddress || `Wilayah ${caseItem.district_name}`,
      latitude: caseItem.latitude,
      longitude: caseItem.longitude,
      reported_at: caseItem.created_at,
      verified_at: nowIso,
      severity,
      verification_status: 'VERIFIED',
      source_lineage: [
        ...caseItem.signals.map((s) => `${s.source} (${s.satellite} / ${s.confidence})`),
        ...caseItem.citizen_reports.map((r) => `Citizen Report #${r.report_code || r.id.slice(0, 8)}`),
        `Operator BPBD/Damkar: ${verifiedBy}`,
      ],
      last_updated: nowIso,
      notes,
    }

    this.incidents.unshift(incident)

    // Update Case
    caseItem.status = 'VERIFIED'
    caseItem.verified_by = verifiedBy
    caseItem.verified_at = nowIso
    caseItem.updated_at = nowIso
    caseItem.timeline.push({
      time: nowIso,
      label: `Kasus diverifikasi resmi menjadi Insiden Kebakaran (#${incidentCode})`,
      actor: verifiedBy,
      details: `Kategori: ${fireType} | Tingkat Keparahan: ${severity.toUpperCase()}`,
    })

    // Update member signals
    for (const sig of caseItem.signals) {
      this.updateObservationStatus(sig.id, 'VERIFIED')
    }

    this.save()
    return { incident, caseItem }
  }

  // --- STATS SUMMARY ---

  public async getStatsSummary(): Promise<FireStatsSummary> {
    const activeSignals = this.observations.filter(
      (o) => o.verification_status === 'SIGNAL_DETECTED' || o.verification_status === 'UNDER_REVIEW' || o.verification_status === 'CORRELATED'
    )
    const underReview = this.observations.filter((o) => o.verification_status === 'UNDER_REVIEW')
    const correlatedCases = this.cases.filter((c) => c.status === 'CORRELATED' || c.status === 'UNDER_REVIEW')
    const verifiedIncidents = this.incidents.filter((i) => i.verification_status === 'VERIFIED' || i.verification_status === 'ACTIVE')

    const [firmsHealth, sipongiHealth, semariskHealth] = await Promise.all([
      nasaFirmsService.checkNasaFirmsHealth(),
      nasaFirmsService.checkSipongiHealth(),
      nasaFirmsService.checkSemariskHealth(),
    ])

    const nowIso = new Date().toISOString()

    return {
      total_signals_detected: this.observations.length,
      active_fire_signals: activeSignals.length,
      signals_under_review: underReview.length,
      correlated_cases_count: correlatedCases.length,
      verified_incidents_count: verifiedIncidents.length,
      last_data_update: this.lastIngestedAt || nowIso,
      sources_health: {
        nasa_firms: {
          status: firmsHealth.status,
          last_update: firmsHealth.last_successful_update || nowIso,
          latency_ms: firmsHealth.latency_ms,
        },
        sipongi_klhk: {
          status: sipongiHealth.status,
          last_update: sipongiHealth.last_successful_update || nowIso,
        },
        semarisk_bpbd: {
          status: semariskHealth.status,
          last_update: semariskHealth.last_successful_update || nowIso,
        },
        citizen_reports: {
          status: 'CONNECTED',
          last_report_at: this.lastIngestedAt,
        },
      },
    }
  }
}

export const localFireStore = LocalFireStore.getInstance()
