import fs from 'fs'
import path from 'path'
import {
  FloodEvent,
  FloodSeverity,
  FloodEventStatus,
  ConfidenceCategory,
  EventTimelineItem,
  RawInferenceOutput,
  CCTVHealthInfo,
  CCTVHealthState,
  FloodStateMachineState,
} from '@/types/flood-event'
import { PANTAUSEMAR_CCTV_POINTS, CCTVPoint } from '@/lib/data/cctv-pantausemar'
import { FALLBACK_SEMARANG_REPORTS } from '@/lib/data/reports'
import { CCTVObservationRecord, CVAnalysisResult } from '@/lib/cv/types'

const DATA_DIR = path.join(process.cwd(), '.data')
const EVENTS_FILE = path.join(DATA_DIR, 'flood_events.json')
const HEALTH_FILE = path.join(DATA_DIR, 'cctv_health.json')
const OBSERVATIONS_FILE = path.join(DATA_DIR, 'cctv_observations.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Haversine distance in meters
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatWibTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' WIB'
}

class FloodEventManager {
  private events: Map<string, FloodEvent> = new Map()
  private cctvHealth: Map<string, CCTVHealthInfo> = new Map()
  private observations: CCTVObservationRecord[] = []
  private lastCheckedTimes: Map<string, number> = new Map()
  private initialized = false

  constructor() {
    this.init()
  }

  private init() {
    if (this.initialized) return
    ensureDataDir()

    // 1. Initialize CCTV Health from PANTAUSEMAR_CCTV_POINTS
    PANTAUSEMAR_CCTV_POINTS.forEach((c) => {
      this.cctvHealth.set(c.id, {
        camera_id: c.id,
        camera_code: c.code,
        camera_name: c.name,
        district: c.district,
        status: 'ONLINE',
        last_seen_at: new Date().toISOString(),
        consecutive_errors: 0,
        sampling_interval_sec: 10,
        current_state: 'NORMAL',
        last_confidence: 0,
      })
    })

    // 2. Load cached files if available
    if (fs.existsSync(EVENTS_FILE)) {
      try {
        const raw = fs.readFileSync(EVENTS_FILE, 'utf-8')
        const list: FloodEvent[] = JSON.parse(raw)
        list.forEach((ev) => this.events.set(ev.event_id, ev))
      } catch (e) {
        console.warn('Gagal memuat flood_events.json:', e)
      }
    }

    if (fs.existsSync(HEALTH_FILE)) {
      try {
        const raw = fs.readFileSync(HEALTH_FILE, 'utf-8')
        const list: CCTVHealthInfo[] = JSON.parse(raw)
        list.forEach((h) => {
          if (this.cctvHealth.has(h.camera_id)) {
            this.cctvHealth.set(h.camera_id, { ...this.cctvHealth.get(h.camera_id)!, ...h })
          }
        })
      } catch (e) {
        console.warn('Gagal memuat cctv_health.json:', e)
      }
    }

    if (fs.existsSync(OBSERVATIONS_FILE)) {
      try {
        const raw = fs.readFileSync(OBSERVATIONS_FILE, 'utf-8')
        this.observations = JSON.parse(raw)
      } catch (e) {
        console.warn('Gagal memuat cctv_observations.json:', e)
      }
    }

    this.initialized = true
  }

  private saveEvents() {
    try {
      ensureDataDir()
      const list = Array.from(this.events.values())
      fs.writeFileSync(EVENTS_FILE, JSON.stringify(list, null, 2), 'utf-8')
    } catch (e) {
      console.error('Gagal menyimpan flood_events.json:', e)
    }
  }

  private saveHealth() {
    try {
      ensureDataDir()
      const list = Array.from(this.cctvHealth.values())
      fs.writeFileSync(HEALTH_FILE, JSON.stringify(list, null, 2), 'utf-8')
    } catch (e) {
      console.error('Gagal menyimpan cctv_health.json:', e)
    }
  }

  private saveObservations() {
    try {
      ensureDataDir()
      fs.writeFileSync(
        OBSERVATIONS_FILE,
        JSON.stringify(this.observations.slice(-500), null, 2),
        'utf-8'
      )
    } catch (e) {
      console.error('Gagal menyimpan cctv_observations.json:', e)
    }
  }

  public getObservations(cameraId?: string, limit = 50): CCTVObservationRecord[] {
    this.init()
    let list = this.observations
    if (cameraId) {
      list = list.filter(
        (o) =>
          o.camera_id === cameraId ||
          o.camera_code.toLowerCase() === cameraId.toLowerCase()
      )
    }
    return list.slice(-limit).reverse()
  }

  public recordObservation(obs: CCTVObservationRecord) {
    this.init()
    this.observations.push(obs)
    if (this.observations.length > 1000) {
      this.observations = this.observations.slice(-800)
    }
    this.saveObservations()
  }

  /**
   * Section 10: Adaptive priority-based batch selector for Vercel Cron
   */
  public selectBatchForAnalysis(batchSize = 6): CCTVPoint[] {
    this.init()
    const now = Date.now()

    const scored = PANTAUSEMAR_CCTV_POINTS.map((cam) => {
      const health = this.cctvHealth.get(cam.id)
      const lastCheck = this.lastCheckedTimes.get(cam.id) || 0
      const minutesAgo = (now - lastCheck) / 60000

      let priorityScore = minutesAgo
      // Priority 1: Cameras with active suspicion (check immediately every 1-2 mins)
      if (
        health?.current_state === 'WATER_SUSPECTED' ||
        health?.current_state === 'FLOOD_SUSPECTED'
      ) {
        priorityScore += 1000
      }
      // Priority 2: Rawan Genangan Air (14 high-risk locations)
      if (cam.category === 'rob_banjir') {
        priorityScore += 500
      }

      return { cam, score: priorityScore }
    })

    scored.sort((a, b) => b.score - a.score)
    const selected = scored.slice(0, batchSize).map((s) => s.cam)
    selected.forEach((c) => this.lastCheckedTimes.set(c.id, now))
    return selected
  }

  public getAllEvents(filter?: { status?: FloodEventStatus; district?: string }): FloodEvent[] {
    this.init()
    let list = Array.from(this.events.values())

    if (filter?.status) {
      list = list.filter((e) => e.status === filter.status)
    }
    if (filter?.district && filter.district !== 'all') {
      list = list.filter(
        (e) => e.district_name.toLowerCase() === filter.district?.toLowerCase()
      )
    }

    return list.sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )
  }

  public getEventById(idOrEventId: string): FloodEvent | null {
    this.init()
    for (const ev of this.events.values()) {
      if (ev.id === idOrEventId || ev.event_id === idOrEventId) {
        return ev
      }
    }
    return null
  }

  public getActiveEventForCamera(cameraId: string): FloodEvent | null {
    this.init()
    for (const ev of this.events.values()) {
      if (ev.camera_id === cameraId && ev.status !== 'resolved') {
        return ev
      }
    }
    return null
  }

  public getAllCCTVHealth(): CCTVHealthInfo[] {
    this.init()
    return Array.from(this.cctvHealth.values())
  }

  public updateCCTVHealth(
    cameraId: string,
    status: CCTVHealthState,
    state?: FloodStateMachineState,
    confidence?: number,
    frameUrl?: string
  ): CCTVHealthInfo | null {
    this.init()
    const current = this.cctvHealth.get(cameraId)
    if (!current) return null

    const updated: CCTVHealthInfo = {
      ...current,
      status,
      last_seen_at: status === 'ONLINE' ? new Date().toISOString() : current.last_seen_at,
      current_state: state || current.current_state,
      last_confidence: confidence !== undefined ? confidence : current.last_confidence,
      last_frame_url: frameUrl || current.last_frame_url,
      consecutive_errors: status === 'ONLINE' ? 0 : current.consecutive_errors + 1,
      sampling_interval_sec:
        state === 'FLOOD_CONFIRMED' || state === 'FLOOD_SUSPECTED' || state === 'WATER_SUSPECTED'
          ? 2
          : 10,
    }

    this.cctvHealth.set(cameraId, updated)
    this.saveHealth()
    return updated
  }

  /**
   * Process lightweight CV Analysis Result from Vercel Serverless engine
   */
  public async processAnalysisResult(result: CVAnalysisResult): Promise<{
    event: FloodEvent | null
    isNewEvent: boolean
    health: CCTVHealthInfo | null
    observation: CCTVObservationRecord
  }> {
    const nowIso = new Date().toISOString()
    const obsRecord: CCTVObservationRecord = {
      id: `obs-${Date.now()}-${result.camera_code}`,
      camera_id: result.camera_id,
      camera_code: result.camera_code,
      timestamp: nowIso,
      visual_score: result.visual_confidence,
      water_region_score: result.water_region_score,
      road_coverage_score: result.road_coverage_score,
      temporal_score: result.temporal_score,
      status: result.state,
      estimated_visual_severity: result.estimated_visual_severity,
      evidence_url: result.evidence_url,
      created_at: nowIso,
    }
    this.recordObservation(obsRecord)

    const raw: RawInferenceOutput = {
      camera_id: result.camera_id,
      timestamp: nowIso,
      cctv_status: result.cctv_status,
      state: result.state,
      flood_confidence: result.visual_confidence,
      estimated_visual_severity: result.estimated_visual_severity,
      detections: result.detected_features.map((f) => ({
        class: f,
        confidence: result.visual_confidence,
        bbox: [0, 0, 0, 0],
      })),
      frame_url: result.evidence_url || undefined,
      processing_time_ms: result.processing_time_ms,
    }

    const res = await this.processInference(raw)
    return {
      ...res,
      observation: obsRecord,
    }
  }

  /**
   * Process raw inference output from YOLO or CV engine
   */
  public async processInference(raw: RawInferenceOutput): Promise<{
    event: FloodEvent | null
    isNewEvent: boolean
    health: CCTVHealthInfo | null
  }> {
    this.init()
    const cctv = PANTAUSEMAR_CCTV_POINTS.find((c) => c.id === raw.camera_id)
    if (!cctv) {
      console.warn(`Camera ID tidak dikenal: ${raw.camera_id}`)
      return { event: null, isNewEvent: false, health: null }
    }

    // 1. Update CCTV health
    const health = this.updateCCTVHealth(
      raw.camera_id,
      raw.cctv_status,
      raw.state,
      raw.flood_confidence,
      raw.frame_url
    )

    // Methodological rule: If CCTV is offline, status is UNKNOWN, not NO_FLOOD
    if (raw.cctv_status !== 'ONLINE') {
      return { event: null, isNewEvent: false, health }
    }

    // 2. Check state machine
    if (raw.state === 'NORMAL' || raw.state === 'WATER_SUSPECTED') {
      // If there was an active event and condition is now normalized, it might transition to resolved
      const existingActive = this.getActiveEventForCamera(raw.camera_id)
      if (existingActive && raw.state === 'NORMAL') {
        // Timeline note
        existingActive.timeline.push({
          timestamp: new Date().toISOString(),
          time_wib: formatWibTime(),
          message: 'Kondisi air surut / jalan kering terpantau normal.',
          state: 'NORMAL',
          confidence: raw.flood_confidence,
        })
        this.saveEvents()
      }
      return { event: null, isNewEvent: false, health }
    }

    // 3. At FLOOD_SUSPECTED or FLOOD_CONFIRMED:
    // Event Deduplication check
    let targetEvent: FloodEvent
    const activeExisting = this.getActiveEventForCamera(raw.camera_id)
    const isNew = !activeExisting

    const now = new Date()
    const nowIso = now.toISOString()
    const timeWib = formatWibTime(now)

    if (isNew) {
      // Create new event
      const countIndex = this.events.size + 1
      const eventId = `SMG-FLD-2026-${String(countIndex).padStart(4, '0')}`

      const eventStatus: FloodEventStatus =
        raw.state === 'FLOOD_CONFIRMED' ? 'confirmed' : 'suspected'

      const timeline: EventTimelineItem[] = [
        {
          timestamp: nowIso,
          time_wib: timeWib,
          message: `Deteksi awal: indikasi visual ${raw.estimated_visual_severity.toUpperCase()} oleh YOLO (${(raw.flood_confidence * 100).toFixed(0)}%).`,
          state: raw.state,
          confidence: raw.flood_confidence,
          severity: raw.estimated_visual_severity,
        },
      ]

      if (raw.state === 'FLOOD_CONFIRMED') {
        timeline.push({
          timestamp: nowIso,
          time_wib: timeWib,
          message: 'FLOOD CONFIRMED: Deteksi konsisten memenuhi ambang batas waktu dan keyakinan.',
          state: 'FLOOD_CONFIRMED',
          confidence: raw.flood_confidence,
          severity: raw.estimated_visual_severity,
        })
      }

      targetEvent = {
        id: `ev-${Date.now()}-${raw.camera_id}`,
        event_id: eventId,
        camera_id: raw.camera_id,
        camera_code: cctv.code,
        camera_name: cctv.name,
        district_name: cctv.district,
        address: cctv.address,
        stream_url: cctv.streamUrl,
        latitude: cctv.latitude,
        longitude: cctv.longitude,
        started_at: nowIso,
        resolved_at: null,
        status: eventStatus,
        state: raw.state,
        severity: raw.estimated_visual_severity,
        estimated_visual_severity: raw.estimated_visual_severity,
        // RC-2 FIX: model_confidence = visual water evidence score (NOT generic YOLO object conf)
        // event_confidence starts at visual_confidence only — corroboration calculated separately
        model_confidence: raw.flood_confidence,
        event_confidence: raw.flood_confidence, // will be recalculated in corroborateEvent
        confidence_category: this.categorizeConfidence(raw.flood_confidence),
        corroboration_score: 0,
        citizen_corroboration: false,
        citizen_reports_count: 0,
        weather_corroboration: 'unknown',
        nearby_cctv_corroboration: false,
        nearby_cctv_count: 0,
        evidence_url: raw.frame_url || null,
        timeline,
        created_at: nowIso,
        updated_at: nowIso,
      }

      this.events.set(targetEvent.event_id, targetEvent)
    } else {
      // Deduplicated: Update existing event
      targetEvent = activeExisting
      targetEvent.updated_at = nowIso
      targetEvent.model_confidence = raw.flood_confidence
      targetEvent.evidence_url = raw.frame_url || targetEvent.evidence_url
      targetEvent.estimated_visual_severity = raw.estimated_visual_severity
      targetEvent.severity = raw.estimated_visual_severity

      // If state escalated to confirmed
      if (targetEvent.status === 'suspected' && raw.state === 'FLOOD_CONFIRMED') {
        targetEvent.status = 'confirmed'
        targetEvent.state = 'FLOOD_CONFIRMED'
        targetEvent.timeline.push({
          timestamp: nowIso,
          time_wib: timeWib,
          message: `FLOOD CONFIRMED: Dikonfirmasi setelah verifikasi temporal ${(raw.flood_confidence * 100).toFixed(0)}%.`,
          state: 'FLOOD_CONFIRMED',
          confidence: raw.flood_confidence,
          severity: raw.estimated_visual_severity,
        })
      } else {
        // Append routine detection log (throttle to 1 per 30s)
        const lastTimeline = targetEvent.timeline[targetEvent.timeline.length - 1]
        const lastTime = lastTimeline ? new Date(lastTimeline.timestamp).getTime() : 0
        if (now.getTime() - lastTime > 30000) {
          targetEvent.timeline.push({
            timestamp: nowIso,
            time_wib: timeWib,
            message: `Kondisi genangan bertahan: keyakinan model ${(raw.flood_confidence * 100).toFixed(0)}%.`,
            state: raw.state,
            confidence: raw.flood_confidence,
            severity: raw.estimated_visual_severity,
          })
        }
      }
    }

    // 4. Run Multi-Source Corroboration
    await this.corroborateEvent(targetEvent, cctv)

    this.saveEvents()
    return { event: targetEvent, isNewEvent: isNew, health }
  }

  /**
   * Multi-Source Corroboration Engine
   */
  private async corroborateEvent(event: FloodEvent, cctv: CCTVPoint) {
    const now = new Date()

    // ─── CORROBORATION GATING (Section 23) ─────────────────────────────────────
    // Corroboration is ONLY allowed if visual water evidence already exists.
    // Citizen reports + weather CANNOT create flood evidence from zero.
    // model_confidence = 0 means NO visual evidence → event_confidence = 0
    if (event.model_confidence <= 0) {
      // RC-3 FIX: No visual evidence → corroboration cannot inflate event_confidence
      event.event_confidence = 0
      event.corroboration_score = 0
      event.confidence_category = 'LOW'
      event.weather_condition_notes =
        'Visual evidence tidak ada — corroboration tidak dapat mengkonfirmasi banjir.'
      return
    }

    // A. Citizen reports within 650m (CORROBORATION ONLY, not primary evidence)
    // RC-6 FIX: Correct operator precedence in filter
    const nearbyReports = FALLBACK_SEMARANG_REPORTS.filter((r) => {
      const rLat = r.latitude ?? 0
      const rLng = r.longitude ?? 0
      if (!rLat || !rLng) return false
      const dist = calculateDistanceMeters(cctv.latitude, cctv.longitude, rLat, rLng)
      const isNearby = dist <= 650
      const isFloodReport = r.category === 'banjir' || r.category === 'genangan'
      return isNearby && isFloodReport // RC-6: Parentheses correct now
    })

    const hasCitizenCorroboration = nearbyReports.length > 0
    if (hasCitizenCorroboration && !event.citizen_corroboration) {
      event.citizen_corroboration = true
      event.citizen_reports_count = nearbyReports.length
      event.timeline.push({
        timestamp: now.toISOString(),
        time_wib: formatWibTime(now),
        message: `Korelasi Warga: ${nearbyReports.length} laporan dalam radius 650m (CORROBORATION, bukan bukti visual primer).`,
        state: event.state,
        corroboration_notes: `${nearbyReports.length} laporan genangan/banjir aktif dalam radius.`,
      })
    } else {
      event.citizen_reports_count = nearbyReports.length
    }

    // B. Nearby CCTVs with active flood events within 1.5km
    const nearbyActiveCCTVs = Array.from(this.events.values()).filter((other) => {
      if (other.event_id === event.event_id || other.status === 'resolved') return false
      // Only count CCTVs that also have visual evidence (model_confidence > 0)
      if (other.model_confidence <= 0) return false
      const dist = calculateDistanceMeters(cctv.latitude, cctv.longitude, other.latitude, other.longitude)
      return dist <= 1500
    })

    const hasNearbyCCTV = nearbyActiveCCTVs.length > 0
    if (hasNearbyCCTV && !event.nearby_cctv_corroboration) {
      event.nearby_cctv_corroboration = true
      event.nearby_cctv_count = nearbyActiveCCTVs.length
      event.timeline.push({
        timestamp: now.toISOString(),
        time_wib: formatWibTime(now),
        message: `Korelasi Multi-CCTV: ${nearbyActiveCCTVs.length} kamera sekitar (${nearbyActiveCCTVs.map(c => c.camera_code).join(', ')}) juga mendeteksi indikasi genangan.`,
        state: event.state,
      })
    } else {
      event.nearby_cctv_count = nearbyActiveCCTVs.length
    }

    // C. Weather Corroboration (Section 13 — weather is CONTEXT, not primary)
    // RC-5 FIX: Never hardcode weather to 'true'. Set to 'unknown' until real API responds.
    // Real weather fetch would go here (BMKG API, etc.)
    // For now we set unknown as the honest default.
    if (event.weather_corroboration !== 'true') {
      event.weather_corroboration = 'unknown'
      event.weather_condition_notes = 'Data cuaca tidak tersedia saat ini (status UNKNOWN).'
    }

    // D. Composite Event Confidence — HIERARCHICAL GATING (Section 15, 22, 23)
    //
    // SECTION 22: event_confidence = 0 if visual evidence = 0
    // SECTION 23: Corroboration allowed only AFTER visual evidence confirmed
    // SECTION 37: Evidence hierarchy — visual > temporal > nearby CCTV > citizen > weather
    //
    // Formula uses visual evidence as the GATE.
    // Corroboration can only ADD to existing visual evidence, not create it.
    const visualScore = event.model_confidence // water evidence score (0..1)
    const temporalScore = event.state === 'FLOOD_CONFIRMED'
      ? 0.85
      : event.state === 'FLOOD_SUSPECTED'
      ? 0.55
      : 0.30

    // Corroboration scores (max combined contribution: 0.30)
    const citizenScore = Math.min(1.0, event.citizen_reports_count * 0.30)
    const nearbyScore = event.nearby_cctv_corroboration ? 0.80 : 0.20
    const weatherScore = event.weather_corroboration === 'true' ? 0.70 : 0.30

    // HIERARCHICAL formula:
    // Visual evidence = 60% weight (gate)
    // Temporal persistence = 25% weight
    // Corroboration (citizen + nearby + weather) = 15% weight TOTAL
    const corroborationComponent = (0.40 * citizenScore + 0.35 * nearbyScore + 0.25 * weatherScore)
    const composite =
      0.60 * visualScore +
      0.25 * temporalScore +
      0.15 * corroborationComponent

    event.corroboration_score = Number(
      (0.15 * corroborationComponent).toFixed(3)
    )
    event.event_confidence = Number(Math.min(0.95, composite).toFixed(3))
    event.confidence_category = this.categorizeConfidence(event.event_confidence)
  }

  public resolveEvent(eventId: string, reason = 'Verifikasi lapangan: surut terkendali'): FloodEvent | null {
    this.init()
    const event = this.getEventById(eventId)
    if (!event) return null

    const now = new Date()
    event.status = 'resolved'
    event.state = 'FLOOD_RESOLVED'
    event.resolved_at = now.toISOString()
    event.updated_at = now.toISOString()
    event.timeline.push({
      timestamp: now.toISOString(),
      time_wib: formatWibTime(now),
      message: `FLOOD RESOLVED: ${reason}`,
      state: 'FLOOD_RESOLVED',
    })

    // Update CCTV health
    this.updateCCTVHealth(event.camera_id, 'ONLINE', 'NORMAL', 0)

    this.saveEvents()
    return event
  }

  private categorizeConfidence(score: number): ConfidenceCategory {
    if (score >= 0.75) return 'HIGH'
    if (score >= 0.50) return 'MEDIUM'
    return 'LOW'
  }
}

export const floodEventManager = new FloodEventManager()
