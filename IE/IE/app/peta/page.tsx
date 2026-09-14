'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Report, ReportCategory, UrgencyLevel } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/types'
import { InteractiveMap } from '@/components/map/InteractiveMap'
import { ReportDetailPanel } from '@/components/map/ReportDetailPanel'
import { RefreshCw, Search, X, Wind, Video, CloudRain, Waves, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PANTAUSEMAR_CCTV_POINTS, type CCTVPoint } from '@/lib/data/cctv-pantausemar'
import { CCTVDetailPanel } from '@/components/cctv/CCTVDetailPanel'
import { WeatherSummaryCard } from '@/components/map/WeatherSummaryCard'
import { WindyFloatingLegend } from '@/components/map/WindyFloatingLegend'
import { InformationCardModal } from '@/components/map/InformationCardModal'
import type { RealWeatherData } from '@/app/api/weather/route'
import type { FloodEvent } from '@/types/flood-event'
import { FloodEventDetailModal } from '@/components/map/FloodEventDetailModal'

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ReportCategory[]
const ALL_URGENCIES = Object.keys(URGENCY_LABELS) as UrgencyLevel[]

export type MapCanvasMode = 'gis' | 'wind' | 'radar' | 'waves'

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

  // Real Meteorological Weather Data State
  const [weather, setWeather] = useState<RealWeatherData | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(true)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showWindyLegend, setShowWindyLegend] = useState(true)

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

  // Fetch real weather telemetry
  const fetchWeather = useCallback(async () => {
    setIsWeatherLoading(true)
    try {
      const res = await fetch('/api/weather')
      const data = await res.json()
      setWeather(data)
    } catch (err) {
      console.error('Gagal mengambil telemetri cuaca:', err)
    } finally {
      setIsWeatherLoading(false)
    }
  }, [])

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
  }, [fetchWeather, fetchReports, fetchFloodEvents])

  const handleGlobalRefresh = () => {
    fetchWeather()
    fetchReports()
    fetchFloodEvents()
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
    <div className="relative flex flex-col w-full h-[calc(100vh-5rem)] min-h-[500px] overflow-hidden bg-[#fdfbf9] text-[#1d1d1d]">
      {/* 1. TOP TELEMETRY RIBBON */}
      <div className="flex-shrink-0 w-full bg-white/95 backdrop-blur-md border-b border-[#e6e6e6] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4 z-30 shadow-subtle flex-wrap">
        <WeatherSummaryCard
          weather={weather}
          isLoading={isWeatherLoading}
          onRefresh={fetchWeather}
        />

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap ml-auto">
          {/* Information Card Modal Toggle */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[90px] border text-xs font-bold transition-colors min-h-[40px]',
              showInfoModal
                ? 'bg-[#4a154b] text-white border-[#4a154b]'
                : 'bg-[#f4ede4] text-[#1d1d1d] border-[#e8ded2] hover:bg-[#e8ded2]'
            )}
            title="Buka Ringkasan Kondisi Terkini Aktual"
          >
            <Info className="w-3.5 h-3.5 text-[#4a154b]" />
            <span className="hidden sm:inline">Kondisi Terkini</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#f4ede4] p-1 rounded-[90px] border border-[#e8ded2]">
            <button
              onClick={() => handleModeChange('gis')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-[90px] text-[11px] font-bold uppercase transition-all',
                mapCanvasMode === 'gis'
                  ? 'bg-[#4a154b] text-white shadow-sm'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              )}
            >
              <span className="material-symbols-outlined text-[14px]">map</span>
              <span>GIS</span>
            </button>

            <button
              onClick={() => handleModeChange('wind')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-[90px] text-[11px] font-bold uppercase transition-all',
                mapCanvasMode === 'wind'
                  ? 'bg-[#4a154b] text-white shadow-sm'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              )}
            >
              <Wind className="w-3 h-3" />
              <span>Angin</span>
            </button>

            <button
              onClick={() => handleModeChange('radar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-[90px] text-[11px] font-bold uppercase transition-all',
                mapCanvasMode === 'radar'
                  ? 'bg-[#4a154b] text-white shadow-sm'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              )}
            >
              <CloudRain className="w-3 h-3" />
              <span>Hujan</span>
            </button>

            <button
              onClick={() => handleModeChange('waves')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-[90px] text-[11px] font-bold uppercase transition-all',
                mapCanvasMode === 'waves'
                  ? 'bg-[#4a154b] text-white shadow-sm'
                  : 'text-[#696969] hover:text-[#1d1d1d]'
              )}
            >
              <Waves className="w-3 h-3" />
              <span>Ombak</span>
            </button>
          </div>

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
            <span className="material-symbols-outlined text-[16px]">tune</span>
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
              viewMode={viewMode}
              onReportClick={(r) => {
                setSelectedReport(r)
                setSelectedCCTV(null)
                setSelectedFloodEvent(null)
              }}
              selectedReport={selectedReport}
              cctvList={filteredCCTVs}
              showCCTV={showCCTV}
              onCCTVClick={(cctv) => {
                setSelectedCCTV(cctv)
                setSelectedReport(null)
                setSelectedFloodEvent(null)
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
              <iframe
                src={`https://embed.windy.com/embed.html?lat=-6.96&lon=110.42&zoom=11&level=surface&overlay=${mapCanvasMode}&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=-6.96&detailLon=110.42&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                title="Windy Live Spatial Radar"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>

        {/* LEGEND (BOTTOM-LEFT) */}
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

        {/* INFORMATION CARD MODAL */}
        {showInfoModal && (
          <InformationCardModal
            weather={weather}
            cctvCount={PANTAUSEMAR_CCTV_POINTS.length}
            isLoading={isWeatherLoading}
            onRefresh={fetchWeather}
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
      </div>
    </div>
  )
}
