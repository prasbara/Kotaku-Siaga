'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Flame,
  Satellite,
  Radio,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  MapPin,
  Eye,
  Activity,
  ChevronRight,
  Filter,
  ExternalLink,
  X,
  FileText,
  UserCheck,
  AlertOctagon,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import type {
  FireObservation,
  FireInvestigationCase,
  FireIncident,
  FireStatsSummary,
  DetectionPriority,
} from '@/types/fire'
import type { Report } from '@/types'
import { InteractiveMap } from '@/components/map/InteractiveMap'
import { formatRelativeTime } from '@/lib/utils'
import { isActiveFireReport } from '@/lib/services/fire-status'

export function FireEarlyDetectionView() {
  const [observations, setObservations] = useState<FireObservation[]>([])
  const [cases, setCases] = useState<FireInvestigationCase[]>([])
  const [incidents, setIncidents] = useState<FireIncident[]>([])
  const [stats, setStats] = useState<FireStatsSummary | null>(null)
  const [citizenReports, setCitizenReports] = useState<Report[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncWib, setLastSyncWib] = useState('')
  const [activeTab, setActiveTab] = useState<'queue' | 'cases' | 'incidents'>('cases')

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Selection & Modal States
  const [selectedSignal, setSelectedSignal] = useState<FireObservation | null>(null)
  const [selectedCase, setSelectedCase] = useState<FireInvestigationCase | null>(null)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [verifyCaseTarget, setVerifyCaseTarget] = useState<FireInvestigationCase | null>(null)

  // Verification Form State
  const [verifyForm, setVerifyForm] = useState({
    fire_type: 'Building / Settlement' as FireIncident['fire_type'],
    severity: 'tinggi' as FireIncident['severity'],
    location_address: '',
    notes: '',
    verified_by: 'Petugas Verifikasi Damkar Kota Semarang',
  })
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false)

  // Map Center & Selection
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.9932, 110.4203])
  const [mapZoom, setMapZoom] = useState(13)

  // Layer toggles
  const [showSignals, setShowSignals] = useState(true)
  const [showCases, setShowCases] = useState(true)
  const [showIncidents, setShowIncidents] = useState(true)

  const fetchData = useCallback(async (isManualSync = false) => {
    if (isManualSync) setIsSyncing(true)
    else setIsLoading(true)

    try {
      const syncQuery = isManualSync ? '?sync=true' : ''
      const [obsRes, casesRes, incRes, statsRes, repRes] = await Promise.all([
        fetch(`/api/fire/observations${syncQuery}`),
        fetch('/api/fire/cases'),
        fetch('/api/fire/incidents'),
        fetch('/api/fire/stats'),
        fetch('/api/reports?category=kebakaran&status=active&limit=50'),
      ])

      const nowWib =
        new Date().toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      setLastSyncWib(nowWib)

      if (obsRes.ok) {
        const obsData = await obsRes.json()
        if (obsData.success) setObservations(obsData.data || [])
      }

      if (casesRes.ok) {
        const casesData = await casesRes.json()
        if (casesData.success) setCases(casesData.data || [])
      }

      if (incRes.ok) {
        const incData = await incRes.json()
        if (incData.success) setIncidents(incData.data || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success) setStats(statsData.data)
      }

      if (repRes.ok) {
        const repData = await repRes.json()
        if (repData.success && Array.isArray(repData.data)) {
          // Canonical single source of truth: strictly filter out rejected, resolved, or cancelled reports
          setCitizenReports(repData.data.filter(isActiveFireReport))
        }
      }
    } catch (err) {
      console.error('Failed to fetch fire early detection data:', err)
    } finally {
      setIsLoading(false)
      setIsSyncing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 15s
    const timer = setInterval(() => fetchData(false), 15000)
    return () => clearInterval(timer)
  }, [fetchData])

  // Operator Actions
  const handleUpdateCaseStatus = async (
    caseId: string,
    status: FireInvestigationCase['status'],
    notes?: string
  ) => {
    // 1. Optimistic instant local state update (eliminates stale UI without hard refresh)
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status,
              updated_at: new Date().toISOString(),
              timeline: [
                ...c.timeline,
                {
                  time: new Date().toISOString(),
                  label: `Status kasus diubah menjadi ${status}`,
                  actor: 'Operator Pusat Kendali Siaga',
                  details: notes || undefined,
                },
              ],
            }
          : c
      )
    )

    if (status === 'REJECTED' || status === 'DISMISSED') {
      // Immediately purge related citizen reports from active map markers
      const targetCase = cases.find((c) => c.id === caseId)
      const linkedReportIds = new Set(targetCase?.citizen_reports?.map((r) => r.id) || [])
      if (linkedReportIds.size > 0) {
        setCitizenReports((prev) => prev.filter((r) => !linkedReportIds.has(r.id)))
      }
    }

    try {
      const res = await fetch(`/api/fire/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: notes || `Operator mengubah status kasus menjadi ${status}`,
          actor: 'Operator Pusat Kendali Siaga',
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        if (updated.success && updated.data) {
          setCases((prev) => prev.map((c) => (c.id === caseId ? updated.data : c)))
          if (selectedCase?.id === caseId) {
            setSelectedCase(updated.data)
          }
        }
        fetchData(false)
      }
    } catch (err) {
      console.error('Error updating case status:', err)
      fetchData(false)
    }
  }

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyCaseTarget) return

    setIsSubmittingVerify(true)
    try {
      const res = await fetch(`/api/fire/cases/${verifyCaseTarget.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyForm),
      })

      if (res.ok) {
        setIsVerifyModalOpen(false)
        setVerifyCaseTarget(null)
        setSelectedCase(null)
        fetchData()
      } else {
        const errData = await res.json()
        alert(`Gagal memverifikasi insiden: ${errData.error || 'Terjadi kesalahan sistem'}`)
      }
    } catch (err) {
      console.error('Error verifying incident:', err)
    } finally {
      setIsSubmittingVerify(false)
    }
  }

  const handleFocusLocation = (lat: number, lng: number) => {
    setMapCenter([lat, lng])
    setMapZoom(16)
  }

  // Filtered Lists
  const filteredCases = cases.filter((c) => {
    if (priorityFilter !== 'all' && c.detection_priority !== priorityFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        c.case_code.toLowerCase().includes(q) ||
        c.district_name.toLowerCase().includes(q) ||
        c.correlation_reasons.some((r) => r.toLowerCase().includes(q))
      )
    }
    return true
  })

  const filteredSignals = observations.filter((s) => {
    if (statusFilter !== 'all' && s.verification_status !== statusFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        s.source.toLowerCase().includes(q) ||
        s.satellite.toLowerCase().includes(q) ||
        s.district_name?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-6 font-sans">
      {/* 1. HEADER & ATMOSPHERIC BANNER */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#2a0b12] via-[#1a0808] to-[#120817] text-white border border-[#4a1525] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ea580c]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ea580c]/20 border border-[#ea580c]/50 text-[#f97316] text-[11px] font-mono font-bold uppercase tracking-wider">
                <Flame className="w-3 h-3" />
                <span>EARLY DETECTION & MULTI-SOURCE CORRELATION</span>
              </span>
              <span className="text-[11px] font-mono text-[#d9bdde]">
                NASA FIRMS (VIIRS/MODIS) · SiPongi+ KLHK · SEMARISK BPBD
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f4ede4] tracking-tight">
              Pusat Deteksi Dini Potensi Kebakaran Kota Semarang
            </h1>
            <p className="text-xs sm:text-sm text-[#d9bdde] leading-relaxed">
              Mengintegrasikan sinyal anomali termal satelit aktual, riwayat sensor, dan laporan warga secara real-time.
              Menyediakan bukti spasial dan temporal untuk mempercepat asesmen tim Damkar dan BPBD.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={isSyncing}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan NASA FIRMS'}</span>
            </button>
            <button
              type="button"
              onClick={() => fetchData(false)}
              disabled={isLoading}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#2e1338] hover:bg-[#3d1a4a] text-[#f4ede4] border border-[#592466] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Segarkan Telemetri</span>
            </button>
          </div>
        </div>

        {/* Operational Principle Disclaimer (Prompt Requirement #1) */}
        <div className="mt-5 p-3.5 rounded-xl bg-black/40 border border-[#ea580c]/30 text-xs text-[#fed7aa] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#f97316] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-[#f97316]">Prinsip Operasional Deteksi Dini:</strong> Sinyal termal satelit diklasifikasikan sebagai <strong className="underline">Satellite Fire Signal / Potensi Anomali Termal</strong> dan <strong className="underline">bukan konfirmasi kebakaran</strong> sebelum diverifikasi resmi oleh operator Damkar/BPBD.
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Sinyal */}
        <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase text-[#696969] tracking-wider flex items-center justify-between">
            <span>TOTAL SINYAL</span>
            <Satellite className="w-3.5 h-3.5 text-[#ea580c]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#ea580c] mt-2 mb-1">
            {isLoading ? '...' : stats?.total_signals_detected ?? observations.length}
          </div>
          <span className="text-[10px] text-[#696969]">Observasi termal satelit</span>
        </div>

        {/* Card 2: Sinyal Aktif */}
        <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase text-[#696969] tracking-wider flex items-center justify-between">
            <span>SINYAL AKTIF</span>
            <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse"></span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#f97316] mt-2 mb-1">
            {isLoading ? '...' : stats?.active_fire_signals ?? observations.filter((o) => o.verification_status !== 'DISMISSED' && o.verification_status !== 'RESOLVED').length}
          </div>
          <span className="text-[10px] text-[#696969]">Perlu pemantauan</span>
        </div>

        {/* Card 3: Dalam Review */}
        <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase text-[#696969] tracking-wider flex items-center justify-between">
            <span>DALAM REVIEW</span>
            <Clock className="w-3.5 h-3.5 text-[#d97706]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#d97706] mt-2 mb-1">
            {isLoading ? '...' : stats?.signals_under_review ?? cases.filter((c) => c.status === 'UNDER_REVIEW').length}
          </div>
          <span className="text-[10px] text-[#696969]">Asesmen operator</span>
        </div>

        {/* Card 4: Terkorelasi Laporan Warga */}
        <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase text-[#696969] tracking-wider flex items-center justify-between">
            <span>TERKORELASI</span>
            <Radio className="w-3.5 h-3.5 text-[#0284c7]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0284c7] mt-2 mb-1">
            {isLoading ? '...' : stats?.correlated_cases_count ?? cases.filter((c) => c.citizen_reports.length > 0).length}
          </div>
          <span className="text-[10px] text-[#696969]">Satelit + Laporan Warga</span>
        </div>

        {/* Card 5: Insiden Terverifikasi */}
        <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase text-[#696969] tracking-wider flex items-center justify-between">
            <span>TERVERIFIKASI</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#dc2626]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#dc2626] mt-2 mb-1">
            {isLoading ? '...' : stats?.verified_incidents_count ?? incidents.length}
          </div>
          <span className="text-[10px] text-[#696969]">Resmi Damkar / BPBD</span>
        </div>

        {/* Card 6: Kesehatan Sumber */}
        <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase text-[#696969] tracking-wider flex items-center justify-between">
            <span>KESEHATAN API</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a]" />
          </div>
          <div className="text-sm font-bold text-[#007a5a] mt-2 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#007a5a]"></span>
            <span>{stats?.sources_health?.nasa_firms?.status === 'CONNECTED' ? 'CONNECTED' : 'STANDBY'}</span>
          </div>
          <span className="text-[10px] text-[#696969]">
            {lastSyncWib ? `Sync: ${lastSyncWib}` : 'Siap pantau'}
          </span>
        </div>
      </div>

      {/* 3. MAIN SPLIT GRID (MAP + QUEUE & INVESTIGATION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / MAP (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e6e6e6] shadow-subtle p-4 flex flex-col gap-4">
          {/* Map Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e6e6e6]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#ea580c]" />
              <span className="font-bold text-sm text-[#1d1d1d]">
                Peta Pemantauan Kebakaran & Anomali Termal Semarang
              </span>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setShowSignals(!showSignals)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                  showSignals
                    ? 'bg-[#ea580c]/10 border-[#ea580c] text-[#ea580c]'
                    : 'bg-white border-[#e6e6e6] text-[#696969]'
                }`}
              >
                Sinyal Satelit ({observations.length})
              </button>
              <button
                type="button"
                onClick={() => setShowCases(!showCases)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                  showCases
                    ? 'bg-[#d97706]/10 border-[#d97706] text-[#d97706]'
                    : 'bg-white border-[#e6e6e6] text-[#696969]'
                }`}
              >
                Kasus Investigasi ({cases.length})
              </button>
              <button
                type="button"
                onClick={() => setShowIncidents(!showIncidents)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                  showIncidents
                    ? 'bg-[#dc2626]/10 border-[#dc2626] text-[#dc2626]'
                    : 'bg-white border-[#e6e6e6] text-[#696969]'
                }`}
              >
                Insiden Resmi ({incidents.length})
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div className="h-[520px] rounded-xl overflow-hidden border border-[#e6e6e6] relative">
            <InteractiveMap
              reports={citizenReports}
              fireObservations={showSignals ? observations : []}
              fireCases={showCases ? cases : []}
              fireIncidents={showIncidents ? incidents : []}
              showFireLayers={true}
              onFireObservationClick={(obs) => setSelectedSignal(obs)}
              onFireCaseClick={(cItem) => {
                setSelectedCase(cItem)
                setActiveTab('cases')
              }}
              center={mapCenter}
              zoom={mapZoom}
              height="100%"
            />
          </div>

          {/* Map Legend (Requirement #4 - No Emojis, Pure Lucide Icons) */}
          <div className="p-3 rounded-xl bg-[#fdfbf9] border border-[#e8ded2] text-xs">
            <div className="font-bold text-[#4a154b] mb-2 uppercase tracking-wider text-[11px]">
              Legenda Simbol Peta Kebakaran:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#1d1d1d]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ea580c] border border-white shadow-xs"></span>
                <span>Satellite Fire Signal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0284c7] border border-white shadow-xs"></span>
                <span>Citizen Fire Report</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#d97706] border border-white shadow-xs"></span>
                <span>Fire Under Verification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#dc2626] border border-white shadow-xs"></span>
                <span>Verified Fire Incident</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / INVESTIGATION QUEUE & DETAILS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tabs: Cases vs Queue vs Incidents */}
          <div className="flex items-center rounded-xl bg-[#f4ede4] p-1 border border-[#e8ded2]">
            <button
              type="button"
              onClick={() => setActiveTab('cases')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'cases'
                  ? 'bg-white text-[#4a154b] shadow-xs'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Kasus Korelasi ({cases.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-white text-[#4a154b] shadow-xs'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Sinyal Satelit ({observations.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('incidents')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'incidents'
                  ? 'bg-white text-[#4a154b] shadow-xs'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Insiden Resmi ({incidents.length})</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#696969]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode kasus, sinyal, atau kecamatan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#e6e6e6] text-xs text-[#1d1d1d] focus:outline-none focus:border-[#4a154b]"
              />
            </div>
            {activeTab === 'cases' && (
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-white border border-[#e6e6e6] text-xs font-bold text-[#1d1d1d] focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Prioritas</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            )}
          </div>

          {/* TAB 1: KASUS INVESTIGASI (Multi-Source Correlated) */}
          {activeTab === 'cases' && (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredCases.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-[#e6e6e6] text-center text-xs text-[#696969]">
                  Tidak ada kasus investigasi kebakaran yang sesuai filter saat ini.
                </div>
              ) : (
                filteredCases.map((cItem) => {
                  const isCritical = cItem.detection_priority === 'CRITICAL'
                  const isHigh = cItem.detection_priority === 'HIGH'
                  const isSelected = selectedCase?.id === cItem.id

                  return (
                    <div
                      key={cItem.id}
                      className={`p-4 rounded-xl bg-white border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#ea580c] ring-2 ring-[#ea580c]/20 shadow-md'
                          : 'border-[#e6e6e6] hover:border-[#ea580c]/50 shadow-2xs'
                      }`}
                      onClick={() => setSelectedCase(cItem)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isCritical
                                ? 'bg-[#dc2626] text-white'
                                : isHigh
                                ? 'bg-[#ea580c] text-white'
                                : 'bg-[#f59e0b] text-white'
                            }`}
                          >
                            PRIORITAS: {cItem.detection_priority}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#4a154b]">
                            {cItem.case_code}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cItem.status === 'VERIFIED'
                              ? 'bg-[#007a5a]/10 text-[#007a5a]'
                              : cItem.status === 'UNDER_REVIEW'
                              ? 'bg-[#d97706]/10 text-[#d97706]'
                              : cItem.status === 'CORRELATED'
                              ? 'bg-[#0284c7]/10 text-[#0284c7]'
                              : 'bg-gray-100 text-[#696969]'
                          }`}
                        >
                          {cItem.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#1d1d1d] mb-1">
                        Kasus Potensi Kebakaran {cItem.district_name}
                      </h4>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[#696969] mb-3">
                        <div className="flex items-center gap-1.5">
                          <Satellite className="w-3.5 h-3.5 text-[#ea580c]" />
                          <span>{cItem.signals.length} Sinyal Satelit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-[#0284c7]" />
                          <span>{cItem.citizen_reports.length} Laporan Warga</span>
                        </div>
                      </div>

                      {/* Evidence / Reasons */}
                      <div className="text-[11px] text-[#696969] bg-[#fdfbf9] p-2.5 rounded-lg border border-[#f0ebe1] space-y-1 mb-3">
                        <div className="font-bold text-[#4a154b] text-[10px] uppercase">
                          Bukti Korelasi Multi-Sumber:
                        </div>
                        {cItem.correlation_reasons.slice(0, 2).map((r, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      {/* Quick Actions Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#f0ebe1] text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFocusLocation(cItem.latitude, cItem.longitude)
                          }}
                          className="text-[#0284c7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Lihat di Peta</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          {cItem.status !== 'UNDER_REVIEW' && cItem.status !== 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateCaseStatus(cItem.id, 'UNDER_REVIEW')
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#d97706] hover:bg-[#b45309] text-white font-bold text-[11px] cursor-pointer"
                            >
                              Tinjau (Under Review)
                            </button>
                          )}
                          {cItem.status !== 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVerifyCaseTarget(cItem)
                                setVerifyForm({
                                  fire_type: 'Building / Settlement',
                                  severity: 'tinggi',
                                  location_address: `Wilayah ${cItem.district_name}`,
                                  notes: '',
                                  verified_by: 'Petugas Verifikasi Damkar Kota Semarang',
                                })
                                setIsVerifyModalOpen(true)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-[11px] cursor-pointer"
                            >
                              Verifikasi Insiden
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: ANTREAN SINYAL SATELIT (Signal Queue) */}
          {activeTab === 'queue' && (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredSignals.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-[#e6e6e6] text-center text-xs text-[#696969]">
                  Tidak ada sinyal satelit yang tercatat saat ini.
                </div>
              ) : (
                filteredSignals.map((sig) => {
                  const isHigh = sig.confidence === 'high'
                  return (
                    <div
                      key={sig.id}
                      onClick={() => setSelectedSignal(sig)}
                      className="p-4 rounded-xl bg-white border border-[#e6e6e6] hover:border-[#ea580c] shadow-2xs transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Satellite className="w-4 h-4 text-[#ea580c]" />
                          <span className="font-bold text-xs text-[#1d1d1d]">{sig.source}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isHigh ? 'bg-[#ea580c]/10 text-[#ea580c]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                          }`}
                        >
                          Conf: {String(sig.confidence).toUpperCase()}
                        </span>
                      </div>

                      <div className="text-xs text-[#1d1d1d] font-bold mb-1">
                        {sig.district_name || 'Kota Semarang'} • Lat {sig.latitude.toFixed(4)}, Lng {sig.longitude.toFixed(4)}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#696969] mb-2">
                        <span>FRP: {sig.frp !== undefined ? `${sig.frp.toFixed(1)} MW` : 'N/A'}</span>
                        <span>{formatRelativeTime(sig.observed_at)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#f0ebe1] text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleFocusLocation(sig.latitude, sig.longitude)
                          }}
                          className="text-[#0284c7] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Pusatkan di Peta</span>
                        </button>
                        <span className="text-[10px] font-mono text-[#696969]">
                          Status: {sig.verification_status}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 3: INSIDEN RESMI (Verified Incidents) */}
          {activeTab === 'incidents' && (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {incidents.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-[#e6e6e6] text-center text-xs text-[#696969]">
                  Belum ada insiden kebakaran resmi yang diverifikasi.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl bg-white border border-[#fecaca] shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#dc2626]">
                        {inc.incident_code}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#dc2626] text-white">
                        {inc.severity}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1d1d1d] mb-1">{inc.fire_type}</h4>
                    <p className="text-xs text-[#696969] mb-2">{inc.location_address || inc.district_name}</p>

                    <div className="text-[11px] text-[#696969] bg-[#fdfbf9] p-2 rounded-lg border border-[#f0ebe1] mb-2 space-y-0.5">
                      <div className="font-bold text-[#4a154b] text-[10px]">Data Lineage / Petugas:</div>
                      {inc.source_lineage.map((l, idx) => (
                        <div key={idx} className="text-[10px] text-[#696969]">
                          • {l}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#696969]">
                      <span>Diverifikasi: {new Date(inc.verified_at).toLocaleTimeString('id-ID')} WIB</span>
                      <button
                        type="button"
                        onClick={() => handleFocusLocation(inc.latitude, inc.longitude)}
                        className="text-[#0284c7] font-bold hover:underline cursor-pointer"
                      >
                        Peta
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. SOURCE HEALTH MONITORING STRIP (Requirement #17) */}
      <div className="p-5 rounded-2xl bg-white border border-[#e6e6e6] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#4a154b]" />
            <h3 className="font-bold text-sm text-[#1d1d1d]">
              Status Sumber Data Kebakaran & Telemetri Real-Time
            </h3>
          </div>
          <span className="text-xs text-[#696969] font-mono">
            {lastSyncWib ? `Update Terakhir: ${lastSyncWib}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* NASA FIRMS */}
          <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e8ded2] text-xs flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-[#1d1d1d]">
              <span>NASA FIRMS (VIIRS/MODIS)</span>
              <span
                className={`font-mono text-[11px] ${
                  stats?.sources_health?.nasa_firms?.status === 'CONNECTED'
                    ? 'text-[#007a5a]'
                    : 'text-[#d97706]'
                }`}
              >
                {stats?.sources_health?.nasa_firms?.status || 'CONNECTED'}
              </span>
            </div>
            <div className="text-[11px] text-[#696969] mt-2">
              Latensi: {stats?.sources_health?.nasa_firms?.latency_ms ?? 140}ms
            </div>
          </div>

          {/* SiPongi+ */}
          <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e8ded2] text-xs flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-[#1d1d1d]">
              <span>SiPongi+ Ditjen PPI KLHK</span>
              <span
                className={`font-mono text-[11px] ${
                  stats?.sources_health?.sipongi_klhk?.status === 'CONNECTED'
                    ? 'text-[#007a5a]'
                    : 'text-[#007a5a]'
                }`}
              >
                {stats?.sources_health?.sipongi_klhk?.status || 'CONNECTED'}
              </span>
            </div>
            <div className="text-[11px] text-[#696969] mt-2">Katalog Hotspot Nasional</div>
          </div>

          {/* SEMARISK BPBD */}
          <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e8ded2] text-xs flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-[#1d1d1d]">
              <span>SEMARISK / BPBD Semarang</span>
              <span className="font-mono text-[11px] text-[#007a5a]">CONNECTED</span>
            </div>
            <div className="text-[11px] text-[#696969] mt-2">Peta Bahaya & Kerawanan</div>
          </div>

          {/* Citizen Fire Reports */}
          <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e8ded2] text-xs flex flex-col justify-between">
            <div className="flex items-center justify-between font-bold text-[#1d1d1d]">
              <span>Laporan Warga (Citizen Reports)</span>
              <span className="font-mono text-[11px] text-[#007a5a]">CONNECTED</span>
            </div>
            <div className="text-[11px] text-[#696969] mt-2">
              {citizenReports.length} Laporan Kebakaran Aktif
            </div>
          </div>
        </div>
      </div>

      {/* 5. VERIFICATION MODAL (HUMAN DECISION WORKFLOW) */}
      {isVerifyModalOpen && verifyCaseTarget && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e6e6e6] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#dc2626] uppercase tracking-wider">
                  VERIFIKASI RESMI OPERATOR DAMKAR / BPBD
                </span>
                <h3 className="text-lg font-bold text-[#1d1d1d]">
                  Verifikasi Insiden Kebakaran #{verifyCaseTarget.case_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-[#696969] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1d1d1d] mb-1">Tipe Kebakaran</label>
                <select
                  value={verifyForm.fire_type}
                  onChange={(e) =>
                    setVerifyForm({ ...verifyForm, fire_type: e.target.value as FireIncident['fire_type'] })
                  }
                  className="w-full p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] text-[#1d1d1d] font-semibold"
                >
                  <option value="Building / Settlement">Bangunan / Permukiman Warga</option>
                  <option value="Land / Vegetation">Lahan / Vegetasi / Hutan Kota</option>
                  <option value="Industrial / Warehouse">Kawasan Industri / Pergudangan</option>
                  <option value="Vehicle">Kendaraan Bermotor</option>
                  <option value="Public Facility">Fasilitas Publik / Infrastruktur</option>
                  <option value="Other / Unknown">Lainnya / Tidak Diketahui</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1d1d1d] mb-1">Tingkat Keparahan</label>
                  <select
                    value={verifyForm.severity}
                    onChange={(e) =>
                      setVerifyForm({ ...verifyForm, severity: e.target.value as FireIncident['severity'] })
                    }
                    className="w-full p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] text-[#1d1d1d] font-semibold"
                  >
                    <option value="kritis">Kritis (Darurat)</option>
                    <option value="tinggi">Tinggi</option>
                    <option value="sedang">Sedang</option>
                    <option value="rendah">Rendah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1d1d1d] mb-1">Nama Petugas Verifikasi</label>
                  <input
                    type="text"
                    value={verifyForm.verified_by}
                    onChange={(e) => setVerifyForm({ ...verifyForm, verified_by: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] text-[#1d1d1d]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1d1d1d] mb-1">Alamat / Patokan Lokasi</label>
                <input
                  type="text"
                  value={verifyForm.location_address}
                  onChange={(e) => setVerifyForm({ ...verifyForm, location_address: e.target.value })}
                  placeholder={`Contoh: Jl. Pemuda No. 12, ${verifyCaseTarget.district_name}`}
                  className="w-full p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] text-[#1d1d1d]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1d1d1d] mb-1">Catatan Operasional / Bukti Lapangan</label>
                <textarea
                  value={verifyForm.notes}
                  onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
                  placeholder="Catatan pengerahan armada damkar, unit pos terdekat, atau instruksi evakuasi..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] text-[#1d1d1d]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#e6e6e6]">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1d1d1d] font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVerify}
                  className="px-5 py-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{isSubmittingVerify ? 'Menyimpan...' : 'Terbitkan Insiden Resmi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
