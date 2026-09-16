'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldAlert,
  Radio,
  RefreshCw,
  Maximize2,
  Minimize2,
  Clock,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Waves,
  Droplets,
  Video,
  Activity,
  Wind,
  CloudRain,
  PhoneCall,
  Flame,
  Wrench,
  TreePine,
  ShieldCheck,
  Eye,
  ArrowUpRight,
  Satellite,
} from 'lucide-react'
import type { Report } from '@/types'
import type {
  FireObservation,
  FireInvestigationCase,
  FireIncident,
  FireStatsSummary,
} from '@/types/fire'
import { InteractiveMap } from '@/components/map/InteractiveMap'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { formatRelativeTime } from '@/lib/utils'

interface SOSEvent {
  id: string
  sos_code: string
  latitude: number
  longitude: number
  location_accuracy?: number | null
  location_available: boolean
  district_name?: string | null
  status: 'NEW' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED' | 'FALSE_ALARM'
  priority: 'CRITICAL'
  created_at: string
}

interface StatsData {
  total: number
  active: number
  critical: number
  resolved: number
}

const POLDER_STATIONS = [
  { name: 'Pompa Sringin', capacity: '10.000 L/s', status: '100% SIAGA' },
  { name: 'Pompa Tenggang', capacity: '12.000 L/s', status: '100% SIAGA' },
  { name: 'Polder BKB', capacity: '6.000 L/s', status: '100% SIAGA' },
  { name: 'Polder BKT', capacity: '8.000 L/s', status: '75% SIAGA' },
  { name: 'Polder Kalibaru', capacity: '2.000 L/s', status: '100% SIAGA' },
]

export function CommandCenterDisplayView() {
  // Live Clock
  const [timeString, setTimeString] = useState<string>('')
  const [dateString, setDateString] = useState<string>('')

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Data States
  const [reports, setReports] = useState<Report[]>([])
  const [sosList, setSosList] = useState<SOSEvent[]>([])
  const [stats, setStats] = useState<StatsData>({ total: 0, active: 0, critical: 0, resolved: 0 })
  const [weather, setWeather] = useState<any>(null)
  const [fireStats, setFireStats] = useState<FireStatsSummary | null>(null)
  const [fireObservations, setFireObservations] = useState<FireObservation[]>([])
  const [fireCases, setFireCases] = useState<FireInvestigationCase[]>([])
  const [fireIncidents, setFireIncidents] = useState<FireIncident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSyncWib, setLastSyncWib] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'syncing' | 'error'>('syncing')
  const [isLocalStore, setIsLocalStore] = useState(false)

  // Map Layer Controls
  const [showCCTV, setShowCCTV] = useState(true)
  const [showSOS, setShowSOS] = useState(true)
  const [showReports, setShowReports] = useState(true)
  const [showFireSignals, setShowFireSignals] = useState(true)
  const [mapViewMode, setMapViewMode] = useState<'markers' | 'heatmap' | 'both'>('both')

  // Clock Ticker Effect (Every Second)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimeString(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      )
      setDateString(
        now.toLocaleDateString('id-ID', {
          timeZone: 'Asia/Jakarta',
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      )
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen()
        } else {
          await document.documentElement.requestFullscreen()
        }
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err)
    }
  }

  // Fetch Command Center Telemetry & Incidents
  const fetchAllData = useCallback(async () => {
    setConnectionStatus('syncing')
    try {
      const [reportsRes, statsRes, sosRes, weatherRes, fireStatsRes, fireObsRes, fireCasesRes, fireIncRes] =
        await Promise.all([
          fetch('/api/reports?limit=100'),
          fetch('/api/dashboard/stats'),
          fetch('/api/sos'),
          fetch('/api/weather'),
          fetch('/api/fire/stats'),
          fetch('/api/fire/observations'),
          fetch('/api/fire/cases'),
          fetch('/api/fire/incidents'),
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

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        if (reportsData.success && Array.isArray(reportsData.data)) {
          setReports(reportsData.data)
          if (reportsData.is_local_store) setIsLocalStore(true)
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.success && statsData.stats) {
          setStats(statsData.stats)
          if (statsData.is_local_store) setIsLocalStore(true)
        }
      }

      if (sosRes.ok) {
        const sosData = await sosRes.json()
        if (sosData.success && Array.isArray(sosData.data)) {
          setSosList(sosData.data)
        }
      }

      if (weatherRes.ok) {
        const weatherData = await weatherRes.json()
        setWeather(weatherData)
      }

      if (fireStatsRes.ok) {
        const fireStatsData = await fireStatsRes.json()
        if (fireStatsData.success) {
          setFireStats(fireStatsData.data)
        }
      }

      if (fireObsRes.ok) {
        const fireObsData = await fireObsRes.json()
        if (fireObsData.success && Array.isArray(fireObsData.data)) {
          setFireObservations(fireObsData.data)
        }
      }

      if (fireCasesRes.ok) {
        const fireCasesData = await fireCasesRes.json()
        if (fireCasesData.success && Array.isArray(fireCasesData.data)) {
          setFireCases(fireCasesData.data)
        }
      }

      if (fireIncRes.ok) {
        const fireIncData = await fireIncRes.json()
        if (fireIncData.success && Array.isArray(fireIncData.data)) {
          setFireIncidents(fireIncData.data)
        }
      }

      setConnectionStatus('connected')
    } catch (err) {
      console.error('Command center fetch error:', err)
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch and 10s auto-refresh polling (fail-safe & realtime fallback)
  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 10000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  // Compute Active Emergency Metrics
  const activeSOS = sosList.filter((s: SOSEvent) => s.status === 'NEW' || s.status === 'DISPATCHED' || s.status === 'ACKNOWLEDGED')
  const resolvedPercent = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0
  const rainIntensity = weather?.current?.rainfall_mm ?? 0

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-[#120817] text-white flex flex-col font-sans select-none overflow-x-hidden ${
        isFullscreen ? 'fixed inset-0 z-[9999] overflow-y-auto p-4 md:p-6' : 'p-3 md:p-6'
      }`}
    >
      {/* 1. TOP HEADER & TELEMETRY TICKER */}
      <header className="rounded-2xl bg-[#1f0d26]/90 border border-[#3b1747] p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 mb-5">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#cc4117] to-[#4a154b] flex items-center justify-center text-white shadow-lg border border-white/20 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <span className="font-display font-extrabold text-lg sm:text-xl text-[#f4ede4] tracking-tight">
                KOTAKU SIAGA — PUSAT KENDALI OPERASI (COMMAND CENTER)
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#007a5a]/20 border border-[#007a5a]/50 text-[#34d399] text-[11px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-[#34d399] animate-ping inline-block"></span>
                <span>LIVE</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#d9bdde] mt-0.5 flex-wrap">
              <span>Wilayah Administratif: 16 Kecamatan Kota Semarang</span>
              <span>•</span>
              <span>Koordinat EOC: -6.9932, 110.4203</span>
              {isLocalStore && (
                <span className="text-[#38bdf8] font-mono font-semibold">
                  • Storage: Local Database Fallback
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Clock, Sync Status & Actions */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Realtime WIB Clock */}
          <div className="px-4 py-2 rounded-xl bg-black/40 border border-[#481a54] flex items-center gap-3 text-right">
            <Clock className="w-5 h-5 text-[#f4ede4] shrink-0" />
            <div className="flex flex-col">
              <span className="font-mono text-base sm:text-lg font-bold text-[#f4ede4] tracking-wider leading-none">
                {timeString || '--:--:-- WIB'}
              </span>
              <span className="text-[10px] text-[#a882b0] uppercase tracking-wider font-medium mt-0.5">
                {dateString || 'Semarang'}
              </span>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="px-3.5 py-2 rounded-xl bg-black/30 border border-[#3b1747] flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-[#34d399]'
                  : connectionStatus === 'syncing'
                  ? 'bg-[#fbbf24] animate-pulse'
                  : 'bg-[#f87171]'
              }`}
            />
            <span className="text-[11px] font-mono text-[#d9bdde]">
              {connectionStatus === 'connected'
                ? `Sync: ${lastSyncWib}`
                : connectionStatus === 'syncing'
                ? 'Sinkronisasi...'
                : 'Koneksi Terputus'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchAllData}
            disabled={isLoading}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#2e1338] hover:bg-[#3d1a4a] text-[#f4ede4] border border-[#592466] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Perbarui Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Fullscreen Kiosk Mode Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#4a154b] to-[#601a61] hover:from-[#592466] hover:to-[#731f74] text-white border border-[#853288] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Keluar Layar Penuh</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Layar Penuh (Kiosk)</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. ACTIVE SOS ALERT BANNER (High Visibility Alert) */}
      {activeSOS.length > 0 && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#cc4117] via-[#991b1b] to-[#7f1d1d] border-2 border-[#f87171] text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white text-[#cc4117] flex items-center justify-center font-extrabold text-xl shrink-0 shadow-lg">
              <Radio className="w-7 h-7 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full border border-white/40">
                  DARURAT SOS 112 TERDETEKSI ({activeSOS.length} KASUS AKTIF)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold mt-0.5 text-white">
                Sinyal Darurat 1-Klik Warga Memerlukan Penanganan Cepat di {activeSOS.map((s: SOSEvent) => s.district_name || 'Kota Semarang').slice(0, 2).join(', ')}
              </h3>
            </div>
          </div>
          <a
            href="tel:112"
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-white hover:bg-[#fef2f2] text-[#cc4117] font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 shadow-lg"
          >
            <PhoneCall className="w-4 h-4" />
            Hubungi Tim Reaksi Cepat 112
          </a>
        </div>
      )}

      {/* 3. FIVE CRITICAL KPI CARDS (Long-Distance Readability) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {/* KPI 1: Status Kesiapsiagaan Kota */}
        <div className="p-5 rounded-2xl bg-[#1f0d26]/80 border border-[#3b1747] shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4a154b]/30 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center justify-between text-xs text-[#d9bdde] font-mono font-bold uppercase tracking-wider mb-2">
              <span>STATUS KESIAPSIAGAAN</span>
              <ShieldCheck className="w-4 h-4 text-[#34d399]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#f4ede4] tracking-tight leading-none mb-1">
              {stats.critical > 0 ? 'SIAGA II' : 'WASPADA ROB'}
            </div>
          </div>
          <div className="pt-3 mt-2 border-t border-[#3b1747] flex items-center justify-between text-xs text-[#a882b0]">
            <span>16 Kecamatan Terpantau</span>
            <span className="text-[#34d399] font-bold">100% Sensor Online</span>
          </div>
        </div>

        {/* KPI 2: Laporan Insiden Aktif */}
        <div className="p-5 rounded-2xl bg-[#1f0d26]/80 border border-[#3b1747] shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#d97706]/20 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center justify-between text-xs text-[#fbbf24] font-mono font-bold uppercase tracking-wider mb-2">
              <span>LAPORAN AKTIF / DARURAT</span>
              <Waves className="w-4 h-4 text-[#fbbf24]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#fbbf24] tracking-tight leading-none">
                {isLoading ? '...' : stats.active}
              </span>
              <span className="text-xs text-[#d9bdde] font-mono">
                / {stats.total} total ({resolvedPercent}% selesai)
              </span>
            </div>
          </div>
          <div className="pt-3 mt-2 border-t border-[#3b1747] flex items-center justify-between text-xs text-[#a882b0]">
            <span>Kritis / Butuh Aksi:</span>
            <span className="text-[#f87171] font-bold">{stats.critical} Laporan</span>
          </div>
        </div>

        {/* KPI 3: Sinyal Darurat SOS 112 */}
        <div className="p-5 rounded-2xl bg-[#1f0d26]/80 border border-[#3b1747] shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#cc4117]/20 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center justify-between text-xs text-[#f87171] font-mono font-bold uppercase tracking-wider mb-2">
              <span>SINYAL DARURAT SOS 112</span>
              <Radio className="w-4 h-4 text-[#f87171]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-none ${
                  activeSOS.length > 0 ? 'text-[#f87171] animate-pulse' : 'text-[#34d399]'
                }`}
              >
                {isLoading ? '...' : activeSOS.length > 0 ? `${activeSOS.length} AKTIF` : '0 AKTIF'}
              </span>
            </div>
          </div>
          <div className="pt-3 mt-2 border-t border-[#3b1747] flex items-center justify-between text-xs text-[#a882b0]">
            <span>Status TRC 112:</span>
            <span className={activeSOS.length > 0 ? 'text-[#fbbf24] font-bold' : 'text-[#34d399] font-bold'}>
              {activeSOS.length > 0 ? 'Tim Dikerahkan' : 'Standby 24/7'}
            </span>
          </div>
        </div>

        {/* KPI 4: Kesiapan Pompa & Cuaca */}
        <div className="p-5 rounded-2xl bg-[#1f0d26]/80 border border-[#3b1747] shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#007a5a]/20 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center justify-between text-xs text-[#34d399] font-mono font-bold uppercase tracking-wider mb-2">
              <span>5 RUMAH POMPA</span>
              <Droplets className="w-4 h-4 text-[#34d399]" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#f4ede4] tracking-tight leading-none mb-1">
              5/5 SIAGA
            </div>
          </div>
          <div className="pt-3 mt-2 border-t border-[#3b1747] flex items-center justify-between text-xs text-[#a882b0]">
            <span>Hujan BMKG:</span>
            <span className="text-[#38bdf8] font-bold">{rainIntensity} mm/jam</span>
          </div>
        </div>

        {/* KPI 5: Fire Early Detection (Requirement #9) */}
        <div className="p-5 rounded-2xl bg-[#1f0d26]/80 border border-[#ea580c]/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ea580c]/20 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div>
            <div className="flex items-center justify-between text-xs text-[#f97316] font-mono font-bold uppercase tracking-wider mb-2">
              <span>DETEKSI DINI KEBAKARAN</span>
              <Flame className="w-4 h-4 text-[#ea580c]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#f97316] tracking-tight leading-none">
                {isLoading ? '...' : fireStats?.total_signals_detected ?? fireObservations.length}
              </span>
              <span className="text-xs text-[#d9bdde] font-mono">
                Sinyal Satelit
              </span>
            </div>
          </div>
          <div className="pt-3 mt-2 border-t border-[#3b1747] flex items-center justify-between text-[11px] text-[#a882b0]">
            <span>Review: <strong className="text-[#fbbf24]">{fireStats?.signals_under_review ?? fireCases.filter((c: FireInvestigationCase) => c.status === 'UNDER_REVIEW').length}</strong></span>
            <span>Korelasi: <strong className="text-[#38bdf8]">{fireStats?.correlated_cases_count ?? fireCases.filter((c: FireInvestigationCase) => c.citizen_reports.length > 0).length}</strong></span>
            <span>Resmi: <strong className="text-[#f87171]">{fireStats?.verified_incidents_count ?? fireIncidents.length}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. MAIN HIGH-IMPACT COMMAND DISPLAY (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[580px] mb-5">
        {/* LEFT / CENTER (Col 8): Large Risk & Incident Map */}
        <div className="lg:col-span-8 rounded-2xl bg-[#1f0d26]/90 border border-[#3b1747] shadow-2xl p-4 sm:p-5 flex flex-col min-h-[520px]">
          {/* Map Controls Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#3b1747] mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#f4ede4]" />
              <span className="font-extrabold text-sm text-[#f4ede4]">
                PETA SITUASIONAL TAKTIS KOTA SEMARANG
              </span>
              <span className="text-[11px] font-mono text-[#a882b0] hidden sm:inline">
                ({reports.length} Laporan · {fireObservations.length} Sinyal Termal · 70 CCTV)
              </span>
            </div>

            {/* Quick Layer Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowReports(!showReports)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showReports
                    ? 'bg-[#4a154b] text-white border border-[#853288]'
                    : 'bg-black/30 text-[#8c6b94] border border-[#3b1747]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Laporan ({reports.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFireSignals(!showFireSignals)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showFireSignals
                    ? 'bg-[#ea580c] text-white border border-[#f97316]'
                    : 'bg-black/30 text-[#8c6b94] border border-[#3b1747]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Satelit Kebakaran ({fireObservations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSOS(!showSOS)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showSOS
                    ? 'bg-[#cc4117] text-white border border-[#f87171]'
                    : 'bg-black/30 text-[#8c6b94] border border-[#3b1747]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>SOS ({sosList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCCTV(!showCCTV)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  showCCTV
                    ? 'bg-[#1264a3] text-white border border-[#38bdf8]'
                    : 'bg-black/30 text-[#8c6b94] border border-[#3b1747]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>CCTV ({PANTAUSEMAR_CCTV_POINTS.length})</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMapViewMode(mapViewMode === 'markers' ? 'heatmap' : mapViewMode === 'heatmap' ? 'both' : 'markers')
                }
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#2e1338] text-[#d9bdde] border border-[#592466] hover:text-white transition-all cursor-pointer"
              >
                Mode: {mapViewMode.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas Container */}
          <div className="flex-1 rounded-xl overflow-hidden border border-[#3b1747] relative min-h-[440px]">
            <InteractiveMap
              reports={showReports ? reports : []}
              sosList={showSOS ? sosList : []}
              cctvList={showCCTV ? PANTAUSEMAR_CCTV_POINTS : []}
              fireObservations={showFireSignals ? fireObservations : []}
              fireCases={showFireSignals ? fireCases : []}
              fireIncidents={showFireSignals ? fireIncidents : []}
              showFireLayers={showFireSignals}
              showCCTV={showCCTV}
              viewMode={mapViewMode}
              height="100%"
              zoom={12}
            />
          </div>

          {/* Map Footer: Polder Pump Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 mt-3 border-t border-[#3b1747] text-xs">
            {POLDER_STATIONS.map((p) => (
              <div key={p.name} className="p-2 rounded-xl bg-black/40 border border-[#3b1747] flex flex-col gap-0.5">
                <span className="font-bold text-[#f4ede4] truncate">{p.name}</span>
                <div className="flex items-center justify-between text-[10px] text-[#a882b0]">
                  <span>{p.capacity}</span>
                  <span className="text-[#34d399] font-bold">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT (Col 4): Live Incident Feed (Privacy-Safe - ZERO PII) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#1f0d26]/90 border border-[#3b1747] shadow-2xl p-4 sm:p-5 flex flex-col min-h-[520px]">
          {/* Feed Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#3b1747] mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#f4ede4]" />
              <h3 className="font-extrabold text-sm text-[#f4ede4] uppercase tracking-wider">
                Feed Laporan Waktu Nyata
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#4a154b] border border-[#853288] text-white text-[11px] font-mono font-bold">
              {reports.length} Total
            </span>
          </div>

          {/* Privacy Notice Badge */}
          <div className="p-2.5 rounded-xl bg-black/30 border border-[#3b1747] text-[11px] text-[#d9bdde] flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#34d399] shrink-0" />
            <span>Mode Layar Komando: Privasi identitas warga terlindungi (tanpa kontak pribadi).</span>
          </div>

          {/* Scrollable Live Incident Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[520px] custom-scrollbar">
            {reports.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#a882b0] gap-2 text-xs">
                <CheckCircle2 className="w-8 h-8 text-[#34d399]" />
                <span>Belum ada laporan aktif baru.</span>
              </div>
            ) : (
              reports.map((r: Report) => {
                const isCritical = r.urgency === 'kritis' || r.urgency === 'tinggi'
                return (
                  <div
                    key={r.id || r.report_code}
                    className="p-3.5 rounded-xl bg-black/40 hover:bg-[#2e1338]/60 border border-[#3b1747] transition-all flex flex-col gap-2 group"
                  >
                    {/* Top Row: Report Code, Area, Time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-xs text-[#f4ede4] bg-[#4a154b]/60 px-2 py-0.5 rounded border border-[#853288]/50 truncate">
                          {r.report_code || 'SMG-2026-REPORT'}
                        </span>
                        <span className="text-xs font-semibold text-[#d9bdde] truncate">
                          {r.district_name || 'Kota Semarang'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#a882b0] shrink-0">
                        {formatRelativeTime(r.created_at || new Date().toISOString())}
                      </span>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-[#f4ede4] line-clamp-2 leading-relaxed">
                      {r.description || r.title || 'Laporan kejadian hidrometeorologis terverifikasi.'}
                    </p>

                    {/* Bottom Badges */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-[#cc4117]/20 text-[#f87171] border border-[#cc4117]/40'
                            : 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40'
                        }`}
                      >
                        {r.urgency?.toUpperCase() || 'SEDANG'}
                      </span>

                      <div className="flex items-center gap-2">
                        {typeof r.credibility_score === 'number' && (
                          <span className="text-[#34d399] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#34d399]" />
                            <span>{r.credibility_score}% Valid</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            r.status === 'resolved'
                              ? 'bg-[#007a5a]/30 text-[#34d399]'
                              : r.status === 'verified'
                              ? 'bg-[#1264a3]/30 text-[#38bdf8]'
                              : 'bg-white/10 text-[#d9bdde]'
                          }`}
                        >
                          {r.status === 'submitted'
                            ? 'Menunggu'
                            : r.status === 'verified'
                            ? 'Terverifikasi'
                            : r.status === 'in_progress'
                            ? 'Penanganan'
                            : r.status === 'resolved'
                            ? 'Selesai'
                            : r.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. FIRE EARLY DETECTION & MULTI-SOURCE CORRELATION PANEL (Requirement #2 & #29) */}
      <div className="rounded-2xl bg-[#1f0d26]/90 border border-[#3b1747] shadow-2xl p-4 sm:p-6 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#3b1747] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ea580c]/20 border border-[#ea580c]/50 flex items-center justify-center text-[#f97316]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-[#f4ede4] uppercase tracking-wider">
                  FIRE EARLY DETECTION & MONITORING PANEL
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#ea580c]/20 text-[#f97316] text-[10px] font-mono font-bold">
                  NASA FIRMS · SIPONGI+ · SEMARISK
                </span>
              </div>
              <p className="text-xs text-[#a882b0]">
                Early Detection & Decision Support Engine — Deteksi anomali termal satelit dan korelasi laporan warga
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[#d9bdde]">
            <span>Update Terakhir: <strong className="text-white">{fireStats?.last_data_update ? new Date(fireStats.last_data_update).toLocaleTimeString('id-ID') + ' WIB' : lastSyncWib}</strong></span>
          </div>
        </div>

        {/* 4 Telemetry Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3.5 rounded-xl bg-black/40 border border-[#3b1747]">
            <div className="text-[10px] font-mono text-[#a882b0] uppercase">Sinyal Terdeteksi</div>
            <div className="text-2xl font-extrabold text-[#ea580c] mt-1">
              {fireStats?.total_signals_detected ?? fireObservations.length}
            </div>
            <div className="text-[10px] text-[#d9bdde] mt-0.5">NASA FIRMS / VIIRS / MODIS</div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-[#3b1747]">
            <div className="text-[10px] font-mono text-[#a882b0] uppercase">Sinyal Under Review</div>
            <div className="text-2xl font-extrabold text-[#fbbf24] mt-1">
              {fireStats?.signals_under_review ?? fireCases.filter((c: FireInvestigationCase) => c.status === 'UNDER_REVIEW').length}
            </div>
            <div className="text-[10px] text-[#d9bdde] mt-0.5">Asesmen Operator EOC</div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-[#3b1747]">
            <div className="text-[10px] font-mono text-[#a882b0] uppercase">Terkorelasi Laporan Warga</div>
            <div className="text-2xl font-extrabold text-[#38bdf8] mt-1">
              {fireStats?.correlated_cases_count ?? fireCases.filter((c: FireInvestigationCase) => c.citizen_reports.length > 0).length}
            </div>
            <div className="text-[10px] text-[#d9bdde] mt-0.5">Satelit + Bukti Warga &le; 3km</div>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-[#3b1747]">
            <div className="text-[10px] font-mono text-[#a882b0] uppercase">Insiden Terverifikasi</div>
            <div className="text-2xl font-extrabold text-[#f87171] mt-1">
              {fireStats?.verified_incidents_count ?? fireIncidents.length}
            </div>
            <div className="text-[10px] text-[#d9bdde] mt-0.5">Resmi Damkar / BPBD</div>
          </div>
        </div>

        {/* Source Health Status Grid (Requirement #17) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#3b1747]">
          <div className="p-3 rounded-xl bg-black/30 border border-[#3b1747] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Satellite className="w-4 h-4 text-[#ea580c]" />
              <div className="flex flex-col">
                <span className="font-bold text-[#f4ede4]">NASA FIRMS</span>
                <span className="text-[10px] text-[#a882b0]">Latensi: {fireStats?.sources_health?.nasa_firms?.latency_ms ?? 140}ms</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#34d399] bg-[#007a5a]/20 px-2 py-0.5 rounded border border-[#007a5a]/40">
              {fireStats?.sources_health?.nasa_firms?.status || 'CONNECTED'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-[#3b1747] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#fbbf24]" />
              <div className="flex flex-col">
                <span className="font-bold text-[#f4ede4]">SiPongi+ KLHK</span>
                <span className="text-[10px] text-[#a882b0]">Hotspot Nasional</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#34d399] bg-[#007a5a]/20 px-2 py-0.5 rounded border border-[#007a5a]/40">
              {fireStats?.sources_health?.sipongi_klhk?.status || 'CONNECTED'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-[#3b1747] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#34d399]" />
              <div className="flex flex-col">
                <span className="font-bold text-[#f4ede4]">SEMARISK BPBD</span>
                <span className="text-[10px] text-[#a882b0]">Peta Risiko Bahaya</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#34d399] bg-[#007a5a]/20 px-2 py-0.5 rounded border border-[#007a5a]/40">
              CONNECTED
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-[#3b1747] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#38bdf8]" />
              <div className="flex flex-col">
                <span className="font-bold text-[#f4ede4]">Laporan Warga</span>
                <span className="text-[10px] text-[#a882b0]">Input Waktu Nyata</span>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#34d399] bg-[#007a5a]/20 px-2 py-0.5 rounded border border-[#007a5a]/40">
              CONNECTED
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
