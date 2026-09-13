'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Report, ReportCategory, UrgencyLevel } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/types'
import { InteractiveMap } from '@/components/map/InteractiveMap'
import { ReportDetailPanel } from '@/components/map/ReportDetailPanel'
import { RefreshCw, Search, X, Wind, Video, CloudRain, Waves, Info } from 'lucide-react'
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
    try {
      const res = await fetch('/api/reports?limit=200')
      const data = await res.json()
      if (data.success) {
        setReports(data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil laporan:', err)
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
    fetchReports()
    fetchWeather()
    fetchFloodEvents()
    const weatherTimer = setInterval(fetchWeather, 60000)
    const floodTimer = setInterval(fetchFloodEvents, 15000)
    return () => {
      clearInterval(weatherTimer)
      clearInterval(floodTimer)
    }
  }, [fetchReports, fetchWeather, fetchFloodEvents])

  // Reset legend when switching Windy modes
  const handleModeChange = (mode: MapCanvasMode) => {
    setMapCanvasMode(mode)
    if (mode !== 'gis') {
      setShowWindyLegend(true)
    }
  }

  const filteredReports = useMemo(() => {
    let filtered = reports

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (r) =>
          (r.title && r.title.toLowerCase().includes(q)) ||
          (r.district_name && r.district_name.toLowerCase().includes(q)) ||
          (r.address && r.address.toLowerCase().includes(q)) ||
          (r.description && r.description.toLowerCase().includes(q))
      )
    }

    // Urgency filter
    if (selectedUrgency !== 'all') {
      filtered = filtered.filter((r) => r.urgency === selectedUrgency)
    }

    // Category filter
    if (selectedCategories.length < ALL_CATEGORIES.length) {
      filtered = filtered.filter((r) => selectedCategories.includes(r.category as ReportCategory))
    }

    return filtered
  }, [reports, searchQuery, selectedUrgency, selectedCategories])

  const filteredCCTVs = useMemo(() => {
    if (cctvCategoryFilter === 'genangan') {
      return PANTAUSEMAR_CCTV_POINTS.filter(
        (c) => c.category === 'rob_banjir' || c.categoryLabel === 'Rawan Genangan Air'
      )
    }
    if (cctvCategoryFilter === 'pompa') {
      return PANTAUSEMAR_CCTV_POINTS.filter(
        (c) => c.category === 'polder_sungai' || c.categoryLabel === 'Pantau Pompa Air'
      )
    }
    return PANTAUSEMAR_CCTV_POINTS
  }, [cctvCategoryFilter])

  const toggleCategory = (cat: ReportCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat))
      }
    } else {
      setSelectedCategories([...selectedCategories, cat])
    }
  }

  const counts = {
    all: reports.length,
    kritis: reports.filter((r) => r.urgency === 'kritis').length,
    tinggi: reports.filter((r) => r.urgency === 'tinggi').length,
    sedang: reports.filter((r) => r.urgency === 'sedang').length,
    rendah: reports.filter((r) => r.urgency === 'rendah').length,
  }

  const handleGlobalRefresh = () => {
    fetchReports()
    fetchWeather()
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] h-[calc(100dvh-80px)] bg-surface-container-lowest overflow-hidden relative">
      {/* 1. TOP COMMAND & REAL TELEMETRY BAR (NO FAKE METRICS) */}
      <div className="w-full bg-surface-container-low border-b border-outline-variant/30 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 shadow-md z-20 shrink-0">
        {/* Real Meteorological Telemetry (Progressive Disclosure) */}
        <WeatherSummaryCard
          weather={weather}
          isLoading={isWeatherLoading}
          onRefresh={fetchWeather}
        />

        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] flex-wrap ml-auto">
          {/* Information Card Modal Toggle */}
          <button
            onClick={() => setShowInfoModal(!showInfoModal)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors min-h-[36px] sm:min-h-0',
              showInfoModal
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface border-outline-variant/40 hover:bg-surface-container-high'
            )}
            title="Buka Ringkasan Kondisi Terkini Aktual"
          >
            <Info className="w-3.5 h-3.5 text-secondary" />
            <span className="hidden sm:inline">Kondisi Terkini</span>
          </button>

          {/* Direct In-Map Basemap & Radar Mode Switcher */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/40">
            <button
              onClick={() => handleModeChange('gis')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all',
                mapCanvasMode === 'gis'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
              title="Peta Spasial GIS & Titik Pantauan Kota"
            >
              <span className="material-symbols-outlined text-[13px]">map</span>
              <span>GIS</span>
            </button>

            <button
              onClick={() => handleModeChange('wind')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all',
                mapCanvasMode === 'wind'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
              title="Radar Aliran Partikel Angin Live (Windy)"
            >
              <Wind className="w-3 h-3" />
              <span>Angin</span>
            </button>

            <button
              onClick={() => handleModeChange('radar')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all',
                mapCanvasMode === 'radar'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
              title="Radar Awan & Hujan Live (Windy)"
            >
              <CloudRain className="w-3 h-3" />
              <span>Hujan</span>
            </button>

            <button
              onClick={() => handleModeChange('waves')}
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-all',
                mapCanvasMode === 'waves'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
              title="Radar Gelombang Ombak Pasut Laut Jawa (Windy)"
            >
              <Waves className="w-3 h-3" />
              <span>Ombak</span>
            </button>
          </div>

          <button
            onClick={handleGlobalRefresh}
            className="p-1.5 rounded bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant/30 transition-colors ml-0.5"
            title="Refresh Seluruh Data Spasial & Cuaca"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', (isLoading || isWeatherLoading) && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 2. MAIN GIS WORKSPACE */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* MOBILE HUD TOGGLE BUTTON (Allows citizen on small screen to hide/show HUD and see map) */}
        <div className="md:hidden absolute top-3 left-3 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMobileHudOpen(!isMobileHudOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low/95 backdrop-blur-md border border-primary/40 text-primary font-mono text-xs font-bold shadow-xl hover:bg-surface-container transition-all"
            aria-label={isMobileHudOpen ? 'Tutup filter peta' : 'Buka filter & lapisan peta'}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>{isMobileHudOpen ? 'Tutup Filter' : 'Filter & Lapisan'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-primary text-on-primary text-[10px]">
              {filteredReports.length}
            </span>
          </button>
        </div>

        {/* FLOATING TACTICAL FILTER HUD (LEFT) */}
        <div
          className={cn(
            'absolute top-3 md:top-4 left-3 md:left-4 z-20 w-80 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-130px)] overflow-y-auto flex-col gap-2.5 pointer-events-none transition-all duration-200 pb-4',
            isMobileHudOpen ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Search & District Navigator */}
          <div className="bg-surface-container-low/95 backdrop-blur-xl p-3 rounded-xl border border-outline-variant/40 shadow-2xl pointer-events-auto flex flex-col gap-2.5">
            <div className="flex items-center justify-between md:hidden pb-1.5 border-b border-outline-variant/20">
              <span className="font-mono text-xs font-bold text-primary uppercase">
                Filter & Lapisan Spasial
              </span>
              <button
                type="button"
                onClick={() => setIsMobileHudOpen(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
                aria-label="Tutup filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30">
              <Search className="w-4 h-4 text-primary shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Jl, Kelurahan, mis: Genuk, Kaligawe..."
                className="bg-transparent text-on-surface text-xs w-full focus:outline-none placeholder:text-on-surface-variant/60 font-body"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle View Layers & Honest CCTV Framing */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                onClick={() => {
                  setLayerType('all')
                  setViewMode('markers')
                }}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all',
                  layerType === 'all'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                )}
              >
                <span className="material-symbols-outlined text-[15px]">scatter_plot</span>
                Laporan Warga ({reports.length})
              </button>

              <button
                onClick={() => {
                  setLayerType('heatmap')
                  setViewMode('heatmap')
                }}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-mono text-[11px] font-bold transition-all',
                  layerType === 'heatmap'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                )}
              >
                <span className="material-symbols-outlined text-[15px]">blur_on</span>
                Heatmap Risiko
              </button>

              {/* CCTV PANTAUSEMAR 70 TITIK FRAMING */}
              <button
                onClick={() => setShowCCTV(!showCCTV)}
                className={cn(
                  'col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all text-center',
                  showCCTV
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                )}
                title="Menampilkan CCTV pada titik prioritas yang tersedia dari sumber PantauSemar (70 Titik)"
              >
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span>CCTV PantauSemar ({filteredCCTVs.length} Titik Live)</span>
              </button>

              {/* DETEKSI BANJIR AI LAYER */}
              <button
                onClick={() => setShowFloodEvents(!showFloodEvents)}
                className={cn(
                  'col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all text-center',
                  showFloodEvents
                    ? 'bg-error/20 text-error border border-error/50 shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                )}
                title="Deteksi Visual Genangan/Banjir Otomatis Berbasis YOLO dari CCTV PantauSemar"
              >
                <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                <span>Deteksi Banjir AI ({floodEvents.filter(e => e.status !== 'resolved').length} Aktif)</span>
              </button>
            </div>

            {showCCTV && (
              <div className="flex items-center gap-1 pt-1">
                <button
                  onClick={() => setCctvCategoryFilter('all')}
                  className={cn(
                    'flex-1 py-1 px-1 rounded text-[10px] font-mono font-bold transition-all text-center',
                    cctvCategoryFilter === 'all'
                      ? 'bg-secondary/20 text-secondary border border-secondary/40'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  Semua (70)
                </button>
                <button
                  onClick={() => setCctvCategoryFilter('genangan')}
                  className={cn(
                    'flex-1 py-1 px-1 rounded text-[10px] font-mono font-bold transition-all text-center',
                    cctvCategoryFilter === 'genangan'
                      ? 'bg-secondary/20 text-secondary border border-secondary/40'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  Genangan (14)
                </button>
                <button
                  onClick={() => setCctvCategoryFilter('pompa')}
                  className={cn(
                    'flex-1 py-1 px-1 rounded text-[10px] font-mono font-bold transition-all text-center',
                    cctvCategoryFilter === 'pompa'
                      ? 'bg-secondary/20 text-secondary border border-secondary/40'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  Pompa (56)
                </button>
              </div>
            )}

            <div className="text-[9px] font-mono text-on-surface-variant/80 px-1 leading-tight">
              Menampilkan {filteredCCTVs.length} CCTV aktual dari Diskominfo PantauSemar (Rawan Genangan & Pompa Air).
            </div>
          </div>

          {/* Urgency Filter Pills */}
          <div className="bg-surface-container-low/95 backdrop-blur-xl p-3 rounded-xl border border-outline-variant/40 shadow-2xl pointer-events-auto flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
                Level Urgensi
              </span>
              <span className="font-mono text-[10px] text-primary uppercase font-bold">
                {selectedUrgency.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedUrgency('all')}
                className={cn(
                  'px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all',
                  selectedUrgency === 'all'
                    ? 'bg-surface-container-highest text-on-surface border border-primary/40'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                )}
              >
                ALL
              </button>
              <button
                onClick={() => setSelectedUrgency('kritis')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all',
                  selectedUrgency === 'kritis'
                    ? 'bg-error text-on-error'
                    : 'bg-surface-container text-error hover:bg-error/20'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                Kritis ({counts.kritis})
              </button>
              <button
                onClick={() => setSelectedUrgency('tinggi')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all',
                  selectedUrgency === 'tinggi'
                    ? 'bg-tertiary text-on-tertiary'
                    : 'bg-surface-container text-tertiary hover:bg-tertiary/20'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Tinggi ({counts.tinggi})
              </button>
              <button
                onClick={() => setSelectedUrgency('sedang')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all',
                  selectedUrgency === 'sedang'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-primary hover:bg-primary/20'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Sedang ({counts.sedang})
              </button>
              <button
                onClick={() => setSelectedUrgency('rendah')}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] font-bold transition-all',
                  selectedUrgency === 'rendah'
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container text-secondary hover:bg-secondary/20'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Rendah ({counts.rendah})
              </button>
            </div>
          </div>

          {/* Hazard Category Checkbox List */}
          <div className="bg-surface-container-low/95 backdrop-blur-xl p-3 rounded-xl border border-outline-variant/40 shadow-2xl pointer-events-auto flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold">
              Kategori Kejadian
            </span>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 text-xs">
              {ALL_CATEGORIES.map((cat) => {
                const isChecked = selectedCategories.includes(cat)
                const count = reports.filter((r) => r.category === cat).length
                return (
                  <label
                    key={cat}
                    className="flex items-center justify-between px-2 py-1 rounded bg-surface-container/70 cursor-pointer hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(cat)}
                        className="accent-primary rounded"
                      />
                      <span className="text-on-surface text-[11px] truncate max-w-[170px]">
                        {CATEGORY_LABELS[cat] || cat}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant font-semibold">
                      {count}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* MAP CANVAS (SWITCHABLE: TACTICAL LEAFLET GIS OR DIRECT LIVE WINDY RADAR) */}
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
            <div className="relative w-full h-full bg-[#070e1b]">
              <iframe
                src={`https://embed.windy.com/embed.html?lat=-6.96&lon=110.42&zoom=11&level=surface&overlay=${mapCanvasMode}&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=-6.96&detailLon=110.42&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`}
                title="Windy Live Spatial Radar"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>

        {/* WINDY CONTEXTUAL FLOATING LEGEND (Follows active layer: wind, radar, or waves) */}
        {showWindyLegend && mapCanvasMode !== 'gis' && (
          <WindyFloatingLegend
            mode={mapCanvasMode}
            weather={weather}
            onClose={() => setShowWindyLegend(false)}
          />
        )}

        {/* MAP LEGEND (BOTTOM-LEFT) — SHOWN IN GIS MODE */}
        {showLegend && mapCanvasMode === 'gis' && (
          <div className="absolute bottom-4 left-4 z-20 bg-surface-container-low/95 backdrop-blur-md p-3 rounded-xl border border-outline-variant/40 shadow-xl hidden md:flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">
                Legenda Simbolis Spasial
              </span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error shadow-[0_0_8px_#EF4444]"></span>
                <span className="text-error font-semibold">Kritis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                <span className="text-tertiary font-semibold">Tinggi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span className="text-primary font-semibold">Sedang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="text-secondary font-semibold">Rendah</span>
              </div>
              <div className="flex items-center gap-1.5 pl-2 border-l border-outline-variant/30">
                <span className="w-2.5 h-2.5 rounded-full border border-secondary bg-surface-container shadow-[0_0_6px_#4edea3]"></span>
                <span className="text-secondary font-semibold">CCTV PantauSemar ({filteredCCTVs.length})</span>
              </div>
            </div>
          </div>
        )}

        {/* INFORMATION CARD MODAL (Summary of Real Conditions) */}
        {showInfoModal && (
          <InformationCardModal
            weather={weather}
            cctvCount={PANTAUSEMAR_CCTV_POINTS.length}
            isLoading={isWeatherLoading}
            onRefresh={fetchWeather}
            onClose={() => setShowInfoModal(false)}
          />
        )}

        {/* SLIDE-OUT REPORT INSPECTION DRAWER */}
        {selectedReport && (
          <ReportDetailPanel
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
          />
        )}

        {/* SLIDE-OUT CCTV PANTAUSEMAR LIVE STREAM PANEL */}
        {selectedCCTV && (
          <CCTVDetailPanel
            cctv={selectedCCTV}
            onClose={() => setSelectedCCTV(null)}
          />
        )}

        {/* FLOOD EVENT DETAIL MODAL (AI CCTV EVIDENCE & TIMELINE) */}
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
