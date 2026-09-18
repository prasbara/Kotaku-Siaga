'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Report, ReportCategory, UrgencyLevel } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/types'
import { InteractiveMap } from '@/components/map/InteractiveMap'
import { ReportDetailPanel } from '@/components/map/ReportDetailPanel'
import { RefreshCw, Search, X, Wind, Video, CloudRain, Waves, Info, AlertCircle, BookOpen, ShieldAlert, Navigation, SlidersHorizontal, Map as MapIcon, Cloud, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PANTAUSEMAR_CCTV_POINTS, type CCTVPoint } from '@/lib/data/cctv-pantausemar'
import { CCTVDetailPanel } from '@/components/cctv/CCTVDetailPanel'
import { WeatherSummaryCard } from '@/components/map/WeatherSummaryCard'
import { WindyFloatingLegend } from '@/components/map/WindyFloatingLegend'
import { WeatherIntelligencePanel } from '@/components/weather/WeatherIntelligencePanel'
import { WeatherLayerSelector, type WeatherLayerKey } from '@/components/weather/WeatherLayerSelector'
import { SEMARANG_ZONES, type SemarangZoneId, determineZoneByCoordinates } from '@/lib/weather/weather-intelligence'
import type { RealWeatherData } from '@/app/api/weather/route'
import type { FloodEvent } from '@/types/flood-event'
import { FloodEventDetailModal } from '@/components/map/FloodEventDetailModal'
import { AreaResilienceInfoModal } from '@/components/education/AreaResilienceInfoModal'
import { PublicDisasterRiskWidget } from '@/components/public/PublicDisasterRiskWidget'
import { SafeRouteNavigator, type SafeRoutePreset, SEMARANG_SAFE_ROUTE_PRESETS } from '@/components/map/SafeRouteNavigator'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ReportCategory[]
const ALL_URGENCIES = Object.keys(URGENCY_LABELS) as UrgencyLevel[]

export type MapCanvasMode = WeatherLayerKey

export default function PetaPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap' | 'both'>('markers')
  const [layerType, setLayerType] = useState<'all' | 'heatmap' | 'iot' | 'cctv'>('all')
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>(ALL_CATEGORIES)
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showLegend, setShowLegend] = useState(true)

  // Real Meteorological Weather Data State (Requirement #1 & #7)
  const [activeZone, setActiveZone] = useState<SemarangZoneId>('perkotaan')
  const [weather, setWeather] = useState<RealWeatherData | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(true)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showWindyLegend, setShowWindyLegend] = useState(true)
  const [windyFailed, setWindyFailed] = useState<boolean>(false)

  // Direct In-Map Mode & PantauSemar CCTV States
  const [mapCanvasMode, setMapCanvasMode] = useState<MapCanvasMode>('gis')
  const [showCCTV, setShowCCTV] = useState(true)
  const [cctvCategoryFilter, setCctvCategoryFilter] = useState<'all' | 'genangan' | 'pompa'>('all')
  const [selectedCCTV, setSelectedCCTV] = useState<CCTVPoint | null>(null)
  const [isMobileHudOpen, setIsMobileHudOpen] = useState(false)

  // AI Flood Events State
  const [floodEvents, setFloodEvents] = useState<FloodEvent[]>([])
  const [showFloodEvents, setShowFloodEvents] = useState(true)
  const [selectedFloodEvent, setSelectedFloodEvent] = useState<FloodEvent | null>(null)

  // Area Resilience Education Modal (Requirement #7)
  const [showAreaResilienceModal, setShowAreaResilienceModal] = useState<boolean>(false)
  const [inspectedAreaLocation, setInspectedAreaLocation] = useState<{
    lat: number
    lng: number
    name: string
  }>({ lat: -6.9932, lng: 110.4203, name: 'Pusat Kota Semarang' })

  // Public Disaster Intelligence Risk Modal (Requirement #1 & #12)
  const [showPublicRiskModal, setShowPublicRiskModal] = useState<boolean>(false)

  // Safe Route Flood-Avoidance Navigator State (Feature #4)
  const [activeSafeRoute, setActiveSafeRoute] = useState<SafeRoutePreset | null>(null)
  const [showSafeRoutePanel, setShowSafeRoutePanel] = useState<boolean>(false)

  // Fetch real weather telemetry with zone support
  const fetchWeather = useCallback(async (zoneId?: SemarangZoneId) => {
    setIsWeatherLoading(true)
    const targetZone = zoneId || activeZone
    try {
      const res = await fetch(`/api/weather?zone=${targetZone}`)
      const data = await res.json()
      setWeather(data)
    } catch (err) {
      console.error('Gagal mengambil telemetri cuaca:', err)
    } finally {
      setIsWeatherLoading(false)
    }
  }, [activeZone])

  const handleZoneChange = (z: SemarangZoneId) => {
    setActiveZone(z)
    fetchWeather(z)
  }

  // Open weather panel automatically if ?view=weather in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'weather') {
        setShowInfoModal(true)
      }
    }
  }, [])

  const [sosList, setSosList] = useState<any[]>([])
  const [clusters, setClusters] = useState<any[]>([])

  // Fetch verified reports
  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setReportsError(null)
    try {
      const res = await fetch('/api/reports?limit=200')
      const data = await res.json()
      if (res.ok && data.success) {
        setReports(data.data || [])
      } else {
        setReportsError(data.error || 'Gagal memuat laporan spasial.')
        setReports([])
      }
    } catch (err) {
      console.error('Gagal mengambil laporan:', err)
      setReportsError('Koneksi database/API terputus.')
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch active SOS signals
  const fetchSosList = useCallback(async () => {
    try {
      const res = await fetch('/api/sos?active_only=true')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        // Only display active SOS events on interactive map
        setSosList(data.data.filter((s: any) => s.status !== 'RESOLVED' && s.status !== 'FALSE_ALARM'))
      }
    } catch (err) {
      console.warn('Gagal mengambil SOS untuk peta:', err)
    }
  }, [])

  // Fetch incident clusters
  const fetchClusters = useCallback(async () => {
    try {
      const res = await fetch('/api/clusters')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setClusters(data.data)
      }
    } catch (err) {
      console.warn('Gagal mengambil klaster untuk peta:', err)
    }
  }, [])

  // Fetch AI flood events
  const fetchFloodEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/flood-events')
      const data = await res.json()
      if (data.success) {
        setFloodEvents(data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil flood events:', err)
    }
  }, [])

  const handleResolveFloodEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/flood-events/${eventId}/resolve`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        fetchFloodEvents()
        if (selectedFloodEvent?.event_id === eventId) {
          setSelectedFloodEvent(data.data)
        }
      }
    } catch (err) {
      console.error('Gagal menyelesaikan event:', err)
    }
  }

  useEffect(() => {
    fetchWeather()
    fetchReports()
    fetchFloodEvents()
    fetchSosList()
    fetchClusters()
  }, [fetchWeather, fetchReports, fetchFloodEvents, fetchSosList, fetchClusters])

  const handleGlobalRefresh = () => {
    fetchWeather()
    fetchReports()
    fetchFloodEvents()
    fetchSosList()
    fetchClusters()
  }

  const toggleCategory = (cat: ReportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const handleModeChange = (mode: MapCanvasMode) => {
    setMapCanvasMode(mode)
    if (mode !== 'gis') {
      setShowWindyLegend(true)
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const catMatch = selectedCategories.includes(r.category)
      const urgMatch = selectedUrgency === 'all' || r.urgency === selectedUrgency
      const searchMatch =
        !searchQuery ||
        (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.district_name && r.district_name.toLowerCase().includes(searchQuery.toLowerCase()))
      return catMatch && urgMatch && searchMatch
    })
  }, [reports, selectedCategories, selectedUrgency, searchQuery])

  const filteredCCTVs = useMemo(() => {
    if (!showCCTV) return []
    if (cctvCategoryFilter === 'all') return PANTAUSEMAR_CCTV_POINTS
    if (cctvCategoryFilter === 'genangan') return PANTAUSEMAR_CCTV_POINTS.filter((c) => c.category === 'rob_banjir')
    if (cctvCategoryFilter === 'pompa') return PANTAUSEMAR_CCTV_POINTS.filter((c) => c.category === 'polder_sungai')
    return PANTAUSEMAR_CCTV_POINTS
  }, [showCCTV, cctvCategoryFilter])

  const counts = useMemo(() => {
    return {
      all: reports.length,
      kritis: reports.filter((r) => r.urgency === 'kritis').length,
      tinggi: reports.filter((r) => r.urgency === 'tinggi').length,
      sedang: reports.filter((r) => r.urgency === 'sedang').length,
      rendah: reports.filter((r) => r.urgency === 'rendah').length,
    }
  }, [reports])

  return (
    <div className="relative flex flex-col w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] min-h-[480px] overflow-hidden bg-[#fdfbf9] text-[#1d1d1d]">
      {/* 1. TOP TELEMETRY RIBBON */}
      <div className="flex-shrink-0 w-full bg-white/95 backdrop-blur-md border-b border-[#e6e6e6] px-3 sm:px-6 py-2 flex items-center justify-between gap-2 z-30 shadow-subtle flex-wrap overflow-x-auto no-scrollbar">
        <WeatherSummaryCard
          weather={weather}
          isLoading={isWeatherLoading}
          onRefresh={fetchWeather}
        />

        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs flex-wrap ml-auto">
          {/* Progressive Weather Layer Selector (Requirement #8) */}
          <WeatherLayerSelector
            currentLayer={mapCanvasMode}
            onSelectLayer={handleModeChange}
            onOpenIntelligencePanel={() => setShowInfoModal(!showInfoModal)}
            isPanelOpen={showInfoModal}
          />

          {/* Direct 1-Click Toggle between GIS & Windy Radar */}
          {mapCanvasMode === 'gis' ? (
            <button
              onClick={() => handleModeChange('radar')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[90px] bg-[#1264a3] hover:bg-[#0e4e80] text-white text-xs font-bold transition-all shadow-xs min-h-[40px]"
              title="Buka Radar Presipitasi & Cuaca Windy Live"
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Radar Windy Live</span>
            </button>
          ) : (
            <button
              onClick={() => handleModeChange('gis')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[90px] bg-[#4a154b] hover:bg-[#3d113e] text-white text-xs font-bold transition-all shadow-xs min-h-[40px]"
              title="Kembali ke Peta Spasial GIS Semarang"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Kembali ke GIS</span>
            </button>
          )}

          {/* Safe Route Evacuation Navigator Toggle (Feature #4) */}
          <button
            onClick={() => {
              const nextState = !showSafeRoutePanel
              setShowSafeRoutePanel(nextState)
              if (nextState && !activeSafeRoute) {
                setActiveSafeRoute(SEMARANG_SAFE_ROUTE_PRESETS[0])
              }
            }}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-[90px] text-xs font-bold transition-all shadow-xs min-h-[40px]',
              showSafeRoutePanel
                ? 'bg-[#007a5a] text-white'
                : 'bg-[#e6f4ea] hover:bg-[#ceead6] border border-[#ceead6] text-[#007a5a]'
            )}
            title="Pencari Jalur Evakuasi Bebas Banjir"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Jalur Aman Banjir</span>
          </button>

          {/* Area Resilience Education Modal Toggle (Requirement #7) */}
          <button
            onClick={() => {
              if (selectedReport) {
                setInspectedAreaLocation({
                  lat: selectedReport.latitude || -6.9932,
                  lng: selectedReport.longitude || 110.4203,
                  name: selectedReport.district_name ? `Kec. ${selectedReport.district_name}` : 'Kawasan Laporan',
                })
              } else if (selectedCCTV) {
                setInspectedAreaLocation({
                  lat: selectedCCTV.latitude,
                  lng: selectedCCTV.longitude,
                  name: selectedCCTV.name,
                })
              }
              setShowAreaResilienceModal(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[90px] bg-[#f9f0ff] hover:bg-[#eddcf7] border border-[#eddcf7] text-[#4a154b] text-xs font-bold transition-all shadow-xs min-h-[40px]"
            title="Pelajari Mengapa Area Ini Berisiko & Profil Ketahanan"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#4a154b]" />
            <span className="hidden md:inline">Kajian Risiko Area</span>
          </button>

          {/* Public Disaster Intelligence Risk Modal Toggle (Requirement #1 & #12) */}
          <button
            onClick={() => setShowPublicRiskModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[90px] bg-[#4a154b] hover:bg-[#3d113e] text-white text-xs font-bold transition-all shadow-xs min-h-[40px]"
            title="Lihat Status Risiko & Rekomendasi Keselamatan Warga"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#f4ede4]" />
            <span className="hidden md:inline">Status Risiko Warga</span>
          </button>

          <button
            onClick={handleGlobalRefresh}
            className="p-2 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] transition-colors"
            title="Refresh Seluruh Data Spasial & Cuaca"
          >
            <RefreshCw className={cn('w-4 h-4', (isLoading || isWeatherLoading) && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 2. MAIN GIS WORKSPACE */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Reports error alert if any */}
        {reportsError && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-[#fef2f2] border border-[#fecaca] text-[#cc4117] px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{reportsError}</span>
            <button
              onClick={fetchReports}
              className="underline ml-2 hover:text-[#b03713]"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* MOBILE HUD TOGGLE BUTTON */}
        <div className="md:hidden absolute top-3 left-3 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMobileHudOpen(!isMobileHudOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[90px] bg-white/95 backdrop-blur-md border border-[#4a154b] text-[#4a154b] font-bold text-xs shadow-card"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span>{isMobileHudOpen ? 'Tutup Filter' : 'Filter & Lapisan'}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#4a154b] text-white text-[10px]">
              {filteredReports.length}
            </span>
          </button>
        </div>

        {/* FLOATING FILTER HUD (LEFT) */}
        <div
          className={cn(
            'absolute top-3 md:top-4 left-3 md:left-4 z-20 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-130px)] overflow-y-auto flex-col gap-3 pointer-events-none transition-all duration-200 pb-4',
            isMobileHudOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Search Box */}
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#e6e6e6] shadow-card pointer-events-auto flex flex-col gap-2.5">
            <div className="flex items-center justify-between md:hidden pb-1 border-b border-[#e6e6e6]">
              <span className="text-xs font-bold text-[#4a154b] uppercase">
                Filter & Lapisan
              </span>
              <button
                type="button"
                onClick={() => setIsMobileHudOpen(false)}
                className="p-1 rounded text-[#696969]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-[#fdfbf9] px-3 py-2 rounded-xl border border-[#e6e6e6]">
              <Search className="w-4 h-4 text-[#4a154b] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari jalan, kelurahan, Genuk..."
                className="bg-transparent text-[#1d1d1d] text-xs w-full focus:outline-none placeholder:text-[#696969]/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#696969] hover:text-[#1d1d1d]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* CCTV & Flood Toggle */}
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#e6e6e6] shadow-card pointer-events-auto flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-[#4a154b] tracking-wider">
                Lapisan Pantauan
              </span>
              <span className="text-[10px] text-[#696969] font-mono">
                {filteredCCTVs.length} CCTV
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCCTV(!showCCTV)}
                className={cn(
                  'flex-1 min-h-[36px] py-1 px-3 rounded-[90px] text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                  showCCTV
                    ? 'bg-[#4a154b] text-white shadow-sm'
                    : 'bg-[#f4ede4] text-[#1d1d1d]'
                )}
              >
                <Video className="w-3.5 h-3.5" />
                <span>CCTV ({filteredCCTVs.length})</span>
              </button>
            </div>
          </div>

          {/* Urgency Filter */}
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#e6e6e6] shadow-card pointer-events-auto flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase text-[#4a154b] tracking-wider">
              Urgensi Kejadian
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedUrgency('all')}
                className={cn(
                  'px-3 py-1 rounded-[90px] text-[11px] font-bold transition-all',
                  selectedUrgency === 'all'
                    ? 'bg-[#4a154b] text-white'
                    : 'bg-[#f4ede4] text-[#1d1d1d] hover:bg-[#e8ded2]'
                )}
              >
                Semua ({counts.all})
              </button>
              <button
                onClick={() => setSelectedUrgency('kritis')}
                className={cn(
                  'px-3 py-1 rounded-[90px] text-[11px] font-bold transition-all',
                  selectedUrgency === 'kritis'
                    ? 'bg-[#cc4117] text-white'
                    : 'bg-[#fef2f2] text-[#cc4117] hover:bg-[#fee2e2]'
                )}
              >
                Kritis ({counts.kritis})
              </button>
              <button
                onClick={() => setSelectedUrgency('tinggi')}
                className={cn(
                  'px-3 py-1 rounded-[90px] text-[11px] font-bold transition-all',
                  selectedUrgency === 'tinggi'
                    ? 'bg-[#d97706] text-white'
                    : 'bg-[#fffbeb] text-[#d97706] hover:bg-[#fef3c7]'
                )}
              >
                Tinggi ({counts.tinggi})
              </button>
              <button
                onClick={() => setSelectedUrgency('sedang')}
                className={cn(
                  'px-3 py-1 rounded-[90px] text-[11px] font-bold transition-all',
                  selectedUrgency === 'sedang'
                    ? 'bg-[#4a154b] text-white'
                    : 'bg-[#f9f0ff] text-[#4a154b] hover:bg-[#eddcf7]'
                )}
              >
                Sedang ({counts.sedang})
              </button>
            </div>
          </div>

          {/* Hazard Category Checkbox List */}
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#e6e6e6] shadow-card pointer-events-auto flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase text-[#4a154b] tracking-wider">
              Kategori Kejadian
            </span>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 text-xs">
              {ALL_CATEGORIES.map((cat) => {
                const isChecked = selectedCategories.includes(cat)
                const count = reports.filter((r) => r.category === cat).length
                return (
                  <label
                    key={cat}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#fdfbf9] cursor-pointer hover:bg-[#f4ede4] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat)}
                        className="accent-[#4a154b] rounded"
                      />
                      <span className="text-[#1d1d1d] text-xs truncate max-w-[170px] font-medium">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[#696969] font-bold">
                      {count}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* MAP CANVAS */}
        <div className="w-full h-full">
          {mapCanvasMode === 'gis' ? (
            <InteractiveMap
              reports={filteredReports}
              sosList={sosList}
              clusters={clusters}
              viewMode={viewMode}
              activeSafeRoute={activeSafeRoute}
              onReportClick={(r) => {
                setSelectedReport(r)
                setSelectedCCTV(null)
                setSelectedFloodEvent(null)
                const lat = r.latitude ?? r.lat
                const lon = r.longitude ?? r.lng
                if (lat && lon) {
                  const detectedZone = determineZoneByCoordinates(lat, lon)
                  setActiveZone(detectedZone)
                  fetchWeather(detectedZone)
                }
              }}
              selectedReport={selectedReport}
              cctvList={filteredCCTVs}
              showCCTV={showCCTV}
              onCCTVClick={(cctv) => {
                setSelectedCCTV(cctv)
                setSelectedReport(null)
                setSelectedFloodEvent(null)
                const detectedZone = determineZoneByCoordinates(cctv.latitude, cctv.longitude)
                setActiveZone(detectedZone)
                fetchWeather(detectedZone)
              }}
              floodEvents={floodEvents}
              showFloodEvents={showFloodEvents}
              onFloodEventClick={(ev) => {
                setSelectedFloodEvent(ev)
                setSelectedReport(null)
                setSelectedCCTV(null)
              }}
              height="100%"
            />
          ) : (
            <div className="relative w-full h-full bg-[#f4ede4]">
              {/* Floating Quick Mode Switcher Pill Bar for Windy */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border-2 border-[#4a154b]/30 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center gap-1.5 text-xs font-bold overflow-x-auto max-w-[calc(100vw-2rem)] no-scrollbar">
                <button
                  type="button"
                  onClick={() => handleModeChange('gis')}
                  className="px-3 py-1 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] flex items-center gap-1.5 shrink-0 font-bold"
                  title="Kembali ke Peta Spasial GIS Semarang"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Peta GIS</span>
                </button>
                <span className="text-[#e6e6e6]">|</span>
                <button
                  type="button"
                  onClick={() => handleModeChange('radar')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-all shrink-0 font-bold flex items-center gap-1.5',
                    mapCanvasMode === 'radar'
                      ? 'bg-[#1264a3] text-white shadow-xs'
                      : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
                  )}
                  title="Radar Presipitasi Hujan Doppler"
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Radar Hujan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('wind')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-all shrink-0 font-bold flex items-center gap-1.5',
                    mapCanvasMode === 'wind'
                      ? 'bg-[#4a154b] text-white shadow-xs'
                      : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
                  )}
                  title="Aliran Partikel Angin Permukaan (10m)"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Angin (ECMWF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('waves')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-all shrink-0 font-bold flex items-center gap-1.5',
                    mapCanvasMode === 'waves'
                      ? 'bg-[#0284c7] text-white shadow-xs'
                      : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
                  )}
                  title="Tinggi Gelombang Pesisir Laut Jawa"
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>Gelombang Laut</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('clouds')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-all shrink-0 font-bold flex items-center gap-1.5',
                    mapCanvasMode === 'clouds'
                      ? 'bg-[#4a154b] text-white shadow-xs'
                      : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
                  )}
                  title="Tutupan Awan Satelit"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Satelit Awan</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('pressure')}
                  className={cn(
                    'px-3 py-1 rounded-full transition-all shrink-0 font-bold flex items-center gap-1.5',
                    mapCanvasMode === 'pressure'
                      ? 'bg-[#4a154b] text-white shadow-xs'
                      : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
                  )}
                  title="Isobar Tekanan Permukaan Laut"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>Tekanan Udara</span>
                </button>
              </div>

              {windyFailed ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#f4ede4]">
                  <AlertCircle className="w-12 h-12 text-[#cc4117] mb-3" />
                  <h3 className="font-bold text-base text-[#1d1d1d]">
                    Windy data unavailable
                  </h3>
                  <p className="text-xs text-[#696969] max-w-md mt-1 mb-4">
                    Koneksi ke server satelit cuaca Windy mengalami kendala atau sedang dalam pemeliharaan. Sistem tidak menyajikan radar tiruan.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWindyFailed(false)
                      handleModeChange('gis')
                    }}
                    className="px-4 py-2 rounded-full bg-[#4a154b] text-white font-bold text-xs"
                  >
                    Kembali ke Peta Spasial GIS Semarang
                  </button>
                </div>
              ) : (
                <iframe
                  src={`https://embed.windy.com/embed.html?lat=-6.9667&lon=110.4167&zoom=11&level=surface&overlay=${mapCanvasMode}&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=-6.9667&detailLon=110.4167&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                  title="Windy Live Spatial Radar"
                  className="w-full h-full border-0"
                  onError={() => setWindyFailed(true)}
                />
              )}
            </div>
          )}
        </div>

        {/* GIS STATIC LEGEND (BOTTOM-LEFT WHEN IN GIS MODE) */}
        {showLegend && mapCanvasMode === 'gis' && (
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-[16px] border border-[#e6e6e6] shadow-card hidden md:flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-bold uppercase text-[#4a154b] tracking-wider">
                Legenda Simbolis Spasial
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-[#696969] hover:text-[#1d1d1d]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#cc4117]"></span>
                <span className="text-[#cc4117] font-bold">Kritis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]"></span>
                <span className="text-[#d97706] font-bold">Tinggi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4a154b]"></span>
                <span className="text-[#4a154b] font-bold">Sedang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#007a5a]"></span>
                <span className="text-[#007a5a] font-bold">Rendah</span>
              </div>
            </div>
          </div>
        )}

        {/* WINDY SPATIAL RADAR FLOATING LEGEND (WHEN IN WINDY WEATHER MODES) */}
        {showWindyLegend && mapCanvasMode !== 'gis' && (
          <WindyFloatingLegend
            mode={mapCanvasMode}
            weather={weather}
            onClose={() => setShowWindyLegend(false)}
          />
        )}

        {/* WEATHER INTELLIGENCE & RISK INDICATORS PANEL (Requirements #1-15) */}
        {showInfoModal && (
          <WeatherIntelligencePanel
            weather={weather}
            isLoading={isWeatherLoading}
            activeZone={activeZone}
            onZoneChange={handleZoneChange}
            onRefresh={() => fetchWeather(activeZone)}
            onClose={() => setShowInfoModal(false)}
          />
        )}

        {/* REPORT INSPECTION DRAWER */}
        {selectedReport && (
          <ReportDetailPanel
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        )}

        {/* CCTV LIVE STREAM PANEL */}
        {selectedCCTV && (
          <CCTVDetailPanel
            cctv={selectedCCTV}
            onClose={() => setSelectedCCTV(null)}
          />
        )}

        {/* FLOOD EVENT DETAIL MODAL */}
        {selectedFloodEvent && (
          <FloodEventDetailModal
            event={selectedFloodEvent}
            onClose={() => setSelectedFloodEvent(null)}
            onOpenCCTV={(camId) => {
              const found = PANTAUSEMAR_CCTV_POINTS.find((c) => c.id === camId)
              if (found) {
                setSelectedCCTV(found)
                setSelectedFloodEvent(null)
              }
            }}
            onResolve={handleResolveFloodEvent}
          />
        )}

        {/* AREA RESILIENCE INFO MODAL (Requirement #7) */}
        <AreaResilienceInfoModal
          isOpen={showAreaResilienceModal}
          onClose={() => setShowAreaResilienceModal(false)}
          latitude={inspectedAreaLocation.lat}
          longitude={inspectedAreaLocation.lng}
          areaName={inspectedAreaLocation.name}
          reportsCount={reports.length}
        />

        {/* SAFE ROUTE FLOOD-AVOIDANCE NAVIGATOR PANEL (Feature #4) */}
        {showSafeRoutePanel && (
          <div className="absolute top-3 md:top-4 right-3 md:right-4 z-20 w-84 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-130px)] overflow-y-auto animate-in slide-in-from-right-4 duration-200">
            <SafeRouteNavigator
              onSelectRoute={(route) => setActiveSafeRoute(route)}
              onClose={() => {
                setShowSafeRoutePanel(false)
                setActiveSafeRoute(null)
              }}
            />
          </div>
        )}

        {/* PUBLIC DISASTER RISK MODAL (Requirement #1 & #12) */}
        {showPublicRiskModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 relative">
              <button
                type="button"
                onClick={() => setShowPublicRiskModal(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] transition-colors"
                aria-label="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
              <PublicDisasterRiskWidget />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
