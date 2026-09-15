import fs from 'fs'
import path from 'path'

export interface SOSEventRecord {
  id: string
  sos_code: string
  latitude: number
  longitude: number
  location_accuracy?: number | null
  location_available: boolean
  district_name?: string | null
  client_session_id?: string | null
  client_ip_hash?: string | null
  status: 'NEW' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED' | 'FALSE_ALARM'
  priority: 'CRITICAL'
  reporter_name?: string | null
  reporter_phone?: string | null
  reporter_email?: string | null
  email_verified?: boolean
  description?: string | null
  photo_url?: string | null
  dispatched_at?: string | null
  resolved_at?: string | null
  admin_notes?: string | null
  created_at: string
  updated_at: string
}

const DATA_DIR = path.join(process.cwd(), '.data')
const SOS_FILE = path.join(DATA_DIR, 'sos_events.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

class LocalSOSStore {
  private sosList: SOSEventRecord[] = []
  private initialized = false

  constructor() {
    this.load()
  }

  private load() {
    ensureDataDir()
    try {
      if (fs.existsSync(SOS_FILE)) {
        const raw = fs.readFileSync(SOS_FILE, 'utf-8')
        if (raw && raw.trim().length > 2) {
          this.sosList = JSON.parse(raw)
          this.initialized = true
          return
        }
      }
    } catch (err) {
      console.warn('Failed to read sos_events.json:', err)
    }

    this.sosList = []
    this.save()
    this.initialized = true
  }

  private save() {
    ensureDataDir()
    try {
      fs.writeFileSync(SOS_FILE, JSON.stringify(this.sosList, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save sos_events to disk:', err)
    }
  }

  public getAll(): SOSEventRecord[] {
    return [...this.sosList]
  }

  public getById(id: string): SOSEventRecord | null {
    const item = this.sosList.find((s) => s.id === id || s.sos_code === id)
    return item || null
  }

  public create(data: Partial<SOSEventRecord>): SOSEventRecord {
    const year = new Date().getFullYear()
    const uniqueNum = Date.now().toString().slice(-6)
    const sosCode = data.sos_code || `SOS-${year}-${uniqueNum}`
    const now = new Date().toISOString()
    const id = data.id || `sos-local-${Date.now()}`

    const record: SOSEventRecord = {
      id,
      sos_code: sosCode,
      latitude: data.latitude ?? -6.9932,
      longitude: data.longitude ?? 110.4203,
      location_accuracy: data.location_accuracy ?? null,
      location_available: Boolean(data.location_available),
      district_name: data.district_name || 'Kota Semarang',
      client_session_id: data.client_session_id || `session-${Date.now()}`,
      client_ip_hash: data.client_ip_hash || '',
      status: (data.status as any) || 'NEW',
      priority: 'CRITICAL',
      reporter_name: data.reporter_name || null,
      reporter_phone: data.reporter_phone || null,
      reporter_email: data.reporter_email || null,
      email_verified: Boolean(data.email_verified),
      description: data.description || null,
      photo_url: data.photo_url || null,
      dispatched_at: data.dispatched_at || null,
      resolved_at: data.resolved_at || null,
      admin_notes: data.admin_notes || null,
      created_at: data.created_at || now,
      updated_at: now,
    }

    this.sosList.unshift(record)
    this.save()
    return record
  }

  public update(id: string, updates: Partial<SOSEventRecord>): SOSEventRecord | null {
    const index = this.sosList.findIndex((s) => s.id === id || s.sos_code === id)
    if (index === -1) {
      return null
    }

    const current = this.sosList[index]
    const now = new Date().toISOString()

    const updated: SOSEventRecord = {
      ...current,
      ...updates,
      updated_at: now,
    }

    if (updates.status === 'DISPATCHED' && !updated.dispatched_at) {
      updated.dispatched_at = now
    }
    if (updates.status === 'RESOLVED' && !updated.resolved_at) {
      updated.resolved_at = now
    }

    this.sosList[index] = updated
    this.save()
    return updated
  }
}

export const localSosStore = new LocalSOSStore()
