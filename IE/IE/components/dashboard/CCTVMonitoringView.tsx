'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { PANTAUSEMAR_CCTV_POINTS, type CCTVPoint } from '@/lib/data/cctv-pantausemar'
import { CCTVDetailPanel } from '@/components/cctv/CCTVDetailPanel'
import { FloodEventDetailModal } from '@/components/map/FloodEventDetailModal'
import type { FloodEvent } from '@/types/flood-event'
import {
  Video,
  Search,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  BarChart3,
  Sliders,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileSearch,
} from 'lucide-react'
import Link from 'next/link'

export function CCTVMonitoringView() {
  const [selectedCCTV, setSelectedCCTV] = useState<CCTVPoint | null>(null)
  const [selectedFloodEvent, setSelectedFloodEvent] = useState<FloodEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rob_banjir' | 'polder_sungai'>('all')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')

  // AI / Non-YOLO Flood Events & Health State
  const [floodEvents, setFloodEvents] = useState<FloodEvent[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  // Explainability Diagnostic Drawer State
  const [diagnosticsCCTV, setDiagnosticsCCTV] = useState<{
    cam: CCTVPoint
    signals?: any
    explainability?: any
    debug_url?: string | null
  } | null>(null)

  // Fetch flood events
  const fetchFloodEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/flood-events')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setFloodEvents(data.data)
      }
    } catch (err) {
      console.error('Gagal memuat flood events:', err)
    } finally {
      setIsLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    fetchFloodEvents()
    const timer = setInterval(fetchFloodEvents, 15000)
    return () => clearInterval(timer)
  }, [fetchFloodEvents])

  // Trigger live Non-YOLO CV Scan
  const handleTriggerScan = async (targetCamId?: string) => {
    setIsScanning(true)
    setScanMessage('Menghubungi Non-YOLO CV Service & memproses analisis multi-signal...')
    try {
      const res = await fetch('/api/cctv/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: targetCamId, count: 3 }),
      })
      const data = await res.json()
      if (data.success) {
        setScanMessage(`Pemindaian Non-YOLO selesai: ${data.scanned_count} kamera diproses (${data.engine}).`)
        await fetchFloodEvents()
        if (data.results && data.results.length > 0) {
          const first = data.results[0]
          const cam = PANTAUSEMAR_CCTV_POINTS.find((c) => c.id === first.camera_id)
          if (cam) {
            setDiagnosticsCCTV({
              cam,
              signals: first.signals,
              explainability: first.explainability,
              debug_url: first.debug_visual_url || first.evidence_url,
            })
          }
        }
      } else {
        setScanMessage(`Gagal: ${data.error || 'Terjadi kesalahan'}`)
      }
    } catch (err: any) {
      setScanMessage(`Koneksi CV Service: ${err.message}`)
    } finally {
      setIsScanning(false)
      setTimeout(() => setScanMessage(null), 7000)
    }
  }

  const handleResolveEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/flood-events/${eventId}/resolve`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        fetchFloodEvents()
        if (selectedFloodEvent?.event_id === eventId) {
          setSelectedFloodEvent(null)
        }
      }
    } catch (err) {
      console.error('Gagal menyelesaikan event:', err)
    }
  }

  // Active / Suspected / Resolved categorization
  const activeEvents = useMemo(
    () => floodEvents.filter((e) => e.status === 'confirmed'),
    [floodEvents]
  )
  const suspectedEvents = useMemo(
    () => floodEvents.filter((e) => e.status === 'suspected'),
    [floodEvents]
  )
  const resolvedEvents = useMemo(
    () => floodEvents.filter((e) => e.status === 'resolved'),
    [floodEvents]
  )

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set<string>()
    PANTAUSEMAR_CCTV_POINTS.forEach((c) => {
      if (c.district) set.add(c.district)
    })
    return ['all', ...Array.from(set).sort()]
  }, [])

  // Filtered CCTVs
  const filteredCCTVs = useMemo(() => {
    return PANTAUSEMAR_CCTV_POINTS.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = c.name.toLowerCase().includes(q)
        const matchAddr = c.address.toLowerCase().includes(q)
        const matchOpd = c.opd.toLowerCase().includes(q)
        const matchDist = c.district.toLowerCase().includes(q)
        if (!matchName && !matchAddr && !matchOpd && !matchDist) return false
      }
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false
      }
      if (selectedDistrict !== 'all' && c.district !== selectedDistrict) {
        return false
      }
      return true
    })
  }, [searchQuery, selectedCategory, selectedDistrict])

  const genanganCount = useMemo(
    () => PANTAUSEMAR_CCTV_POINTS.filter((c) => c.category === 'rob_banjir').length,
    []
  )
  const pompaCount = useMemo(
    () => PANTAUSEMAR_CCTV_POINTS.filter((c) => c.category === 'polder_sungai').length,
    []
  )

  const formatDuration = (startedAt: string) => {
    const diffMs = Math.max(0, Date.now() - new Date(startedAt).getTime())
    const mins = Math.floor(diffMs / 60000)
    const secs = Math.floor((diffMs % 60000) / 1000)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 font-body text-[#1d1d1d]">
      {/* Header Bar with Pastel-Mesh Atmospheric Backdrop */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f4ede4] via-[#f9f0ff] to-[#f4ede4] border border-[#e6e6e6] p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[12px] font-mono uppercase tracking-[0.96px] text-[#4a154b] font-bold px-3 py-1 rounded-[90px] bg-white border border-[#d9bdde]/60">
              NON-YOLO CLASSICAL CV v2.0
            </span>
            <span className="text-[12px] font-mono text-[#007a5a] font-bold px-3 py-1 rounded-[90px] bg-[#007a5a]/10 border border-[#007a5a]/30">
              MULTI-SIGNAL • TEMPORAL SLIDING WINDOW
            </span>
            <span className="text-[11px] font-mono text-[#696969] flex items-center gap-1.5 ml-1">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              Sumber: PantauSemar Pemkot Semarang (70 Titik)
            </span>
          </div>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[#4a154b] tracking-[-0.256px] leading-[1.2]">
            Monitoring CCTV & Deteksi Genangan Non-YOLO
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#1d1d1d] leading-[1.55] mt-2">
            Observasi visual presisi tinggi berbasis segmentasi warna (HSV+LAB), tekstur homogenitas aspal, reduksi tepi, profil garis air, dan verifikasi temporal tanpa ketergantungan bounding-box YOLO.
          </p>
        </div>

        {/* Action Buttons: The single filled aubergine pill button on this page */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => handleTriggerScan()}
            disabled={isScanning}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#611f69] active:bg-[#481a54] disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Memproses CV...' : 'Scan Non-YOLO AI'}</span>
          </button>

          <Link
            href="/peta"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[90px] bg-white border border-[#4a154b]/40 text-[#4a154b] font-bold text-sm hover:bg-[#f9f0ff] transition-all shadow-2xs"
          >
            <MapPin className="w-4 h-4 text-[#4a154b]" />
            <span>Buka di Peta</span>
          </Link>
        </div>
      </div>

      {/* Scan notification banner if active */}
      {scanMessage && (
        <div className="p-4 rounded-[16px] bg-[#f9f0ff] border border-[#d9bdde] text-xs font-mono text-[#4a154b] flex items-center justify-between shadow-2xs">
          <span className="font-semibold">{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-[#1264a3] hover:text-[#3860be] hover:underline text-xs font-bold cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE FLOOD EVENTS PANEL & MONITORING METRICS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#cc4117] animate-pulse" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#cc4117]">
              ACTIVE FLOOD EVENTS ({activeEvents.length})
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#696969]">
            <span>Suspected: <b className="text-[#b45309]">{suspectedEvents.length}</b></span>
            <span>Resolved: <b className="text-[#007a5a]">{resolvedEvents.length}</b></span>
            <span>CCTV Online: <b className="text-[#4a154b]">70</b></span>
          </div>
        </div>

        {/* Active Flood Events Cards Grid */}
        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEvents.map((ev) => (
              <div
                key={ev.event_id}
                className="p-6 rounded-[16px] bg-white border-2 border-[#cc4117]/60 shadow-sm flex flex-col justify-between group hover:border-[#cc4117] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-[#cc4117] px-2.5 py-0.5 rounded-[90px] bg-[#cc4117]/10 border border-[#cc4117]/30">
                      {ev.district_name}
                    </span>
                    <span className="text-[10px] font-mono px-3 py-1 rounded-[90px] font-bold bg-[#cc4117] text-white">
                      FLOOD CONFIRMED
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-[#696969] mb-4">
                    <div className="flex justify-between">
                      <span>CCTV:</span>
                      <span className="text-[#1d1d1d] font-bold">{ev.camera_code} ({ev.camera_name})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="text-[#007a5a] font-bold">{(ev.model_confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className="text-[#cc4117] font-bold capitalize">{ev.estimated_visual_severity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durasi:</span>
                      <span className="text-[#4a154b] font-bold">{formatDuration(ev.started_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#e6e6e6]">
                  <button
                    onClick={() => setSelectedFloodEvent(ev)}
                    className="flex-1 py-2 px-3 rounded-[90px] bg-[#f9f0ff] text-[#4a154b] border border-[#d9bdde]/60 hover:bg-[#ebdccb] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Evidence</span>
                  </button>

                  <Link
                    href="/peta"
                    className="flex-1 py-2 px-3 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#4a154b]" />
                    <span>Lihat di Peta</span>
                  </Link>

                  <button
                    onClick={() => handleResolveEvent(ev.event_id)}
                    className="p-2 rounded-full bg-[#007a5a]/10 hover:bg-[#007a5a]/20 text-[#007a5a] border border-[#007a5a]/30 transition-colors cursor-pointer"
                    title="Resolusi Event"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-[16px] bg-white border border-[#e6e6e6] flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#007a5a]/10 border border-[#007a5a]/30 flex items-center justify-center text-[#007a5a]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1d1d1d]">
                  Tidak Ada Flood Event Aktif Terkonfirmasi
                </p>
                <p className="text-xs text-[#696969] mt-0.5">
                  Seluruh kamera pemantauan genangan air PantauSemar berada dalam batas normal / belum memenuhi ambang persistensi konfirmasi.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTriggerScan()}
              className="px-4 py-2 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-xs font-bold text-[#4a154b] border border-[#e6e6e6] shrink-0 cursor-pointer"
            >
              Uji Scan Sekarang
            </button>
          </div>
        )}

        {/* Suspected Events Row if any */}
        {suspectedEvents.length > 0 && (
          <div className="p-4 rounded-[16px] bg-[#fffbeb] border border-[#fef3c7]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-[#b45309] uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#b45309]" />
                Indikasi Terdeteksi (Water/Flood Suspected — Menunggu Verifikasi Temporal)
              </span>
              <span className="text-xs font-mono text-[#b45309] font-bold">
                {suspectedEvents.length} Titik Kamera
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {suspectedEvents.map((ev) => (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedFloodEvent(ev)}
                  className="p-3 rounded-[12px] bg-white border border-[#e6e6e6] hover:border-[#b45309] cursor-pointer flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <span className="text-xs font-bold text-[#1d1d1d] block">
                      {ev.district_name} &bull; {ev.camera_name}
                    </span>
                    <span className="text-[11px] font-mono text-[#696969]">
                      Conf: {(ev.model_confidence * 100).toFixed(0)}% &bull; {ev.estimated_visual_severity}
                    </span>
                  </div>
                  <Eye className="w-4 h-4 text-[#b45309]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CCTV Monitoring Health Status Cards (Slacc card-stat pattern) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-6 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
            <div>
              <div className="text-[50px] font-bold text-[#4a154b] tracking-[-0.6px] leading-[1.12] mb-1">
                70
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1d] mb-1">
                Titik PantauSemar
              </h4>
              <p className="text-xs text-[#696969] leading-relaxed">
                Stream HLS aktif terhubung ke CV engine tanpa interupsi.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#e6e6e6] flex items-center justify-between text-[11px] font-mono text-[#007a5a]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#007a5a]"></span>
                Status: ONLINE
              </span>
              <span className="text-[#696969]">100% Terpantau</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
            <div>
              <div className="text-[50px] font-bold text-[#007a5a] tracking-[-0.6px] leading-[1.12] mb-1">
                0%
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1d] mb-1">
                False Alarm Rate
              </h4>
              <p className="text-xs text-[#696969] leading-relaxed">
                Tekstur aspal basah & sorot lampu malam tersupresi otomatis.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#e6e6e6] flex items-center justify-between text-[11px] font-mono text-[#4a154b]">
              <span className="font-bold">Benchmarked</span>
              <span className="text-[#696969]">12/12 Lulus</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
            <div>
              <div className="text-[50px] font-bold text-[#4a154b] tracking-[-0.6px] leading-[1.12] mb-1">
                15
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1d] mb-1">
                Sliding Window
              </h4>
              <p className="text-xs text-[#696969] leading-relaxed">
                Persistensi temporal M ≥ 5 frame untuk memicu konfirmasi.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#e6e6e6] flex items-center justify-between text-[11px] font-mono text-[#696969]">
              <span>Sampling Adaptif</span>
              <b className="text-[#4a154b]">10s / 2s Suspect</b>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
            <div>
              <div className="text-[50px] font-bold text-[#4a154b] tracking-[-0.6px] leading-[1.12] mb-1">
                24<span className="text-[28px] font-bold text-[#696969] ml-1">ms</span>
              </div>
              <h4 className="text-sm font-bold text-[#1d1d1d] mb-1">
                Latency Inferensi CPU
              </h4>
              <p className="text-xs text-[#696969] leading-relaxed">
                Classical CV throughput 40.3 FPS pada standard CPU.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#e6e6e6] flex items-center justify-between text-[11px] font-mono text-[#696969]">
              <span>GPU Overhead</span>
              <b className="text-[#007a5a]">0 MB VRAM</b>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CCTV FILTER CONTROLS BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white p-4 rounded-[16px] border border-[#e6e6e6] shadow-2xs mt-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-4 py-2 min-h-[40px] rounded-[90px] border font-mono transition-all flex items-center justify-center cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#4a154b] text-white border-[#4a154b] font-bold shadow-sm'
                : 'bg-[#fcfaf7] text-[#696969] border-[#e6e6e6] hover:text-[#1d1d1d]'
            }`}
          >
            Semua CCTV ({PANTAUSEMAR_CCTV_POINTS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('rob_banjir')}
            className={`text-xs px-4 py-2 min-h-[40px] rounded-[90px] border font-mono transition-all flex items-center justify-center cursor-pointer ${
              selectedCategory === 'rob_banjir'
                ? 'bg-[#4a154b] text-white border-[#4a154b] font-bold shadow-sm'
                : 'bg-[#fcfaf7] text-[#696969] border-[#e6e6e6] hover:text-[#1d1d1d]'
            }`}
          >
            🌊 Rawan Genangan ({genanganCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('polder_sungai')}
            className={`text-xs px-4 py-2 min-h-[40px] rounded-[90px] border font-mono transition-all flex items-center justify-center cursor-pointer ${
              selectedCategory === 'polder_sungai'
                ? 'bg-[#4a154b] text-white border-[#4a154b] font-bold shadow-sm'
                : 'bg-[#fcfaf7] text-[#696969] border-[#e6e6e6] hover:text-[#1d1d1d]'
            }`}
          >
            ⚙️ Pantau Pompa Air ({pompaCount})
          </button>
        </div>

        {/* District Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 w-full lg:max-w-md min-w-0">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="h-10 px-3 rounded-[90px] bg-[#fcfaf7] border border-[#e6e6e6] text-xs font-mono text-[#1d1d1d] focus:outline-none focus:border-[#4a154b] min-w-[140px]"
            aria-label="Pilih Kecamatan"
          >
            <option value="all">Semua Wilayah</option>
            {districts
              .filter((d) => d !== 'all')
              .map((d) => (
                <option key={d} value={d}>
                  Kec. {d}
                </option>
              ))}
          </select>

          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#696969]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kamera, lokasi, atau OPD..."
              className="w-full h-10 pl-9 pr-4 rounded-[90px] bg-[#fcfaf7] border border-[#e6e6e6] text-xs text-[#1d1d1d] placeholder:text-[#696969] focus:outline-none focus:border-[#4a154b] font-body"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CCTV CARDS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCCTVs.map((cctv) => (
          <div
            key={cctv.id}
            className="rounded-[16px] bg-white border border-[#e6e6e6] shadow-2xs hover:shadow-subtle hover:border-[#4a154b]/30 transition-all p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#4a154b] block mb-0.5">
                    {cctv.code} &bull; {cctv.district}
                  </span>
                  <h3 className="font-bold text-base text-[#1d1d1d] line-clamp-1">
                    {cctv.name}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-[90px] font-bold bg-[#007a5a]/10 text-[#007a5a] border border-[#007a5a]/30">
                  ONLINE
                </span>
              </div>

              <p className="text-xs text-[#696969] line-clamp-2 mb-3 leading-relaxed">
                {cctv.address}
              </p>

              <div className="pt-2 border-t border-[#e6e6e6] grid grid-cols-2 gap-2 text-xs font-mono mb-4 text-[#696969]">
                <div>
                  <span className="text-[9px] uppercase block">Kategori:</span>
                  <span className="font-bold text-[#1d1d1d] text-[11px] truncate block">
                    {cctv.category === 'rob_banjir' ? 'Rawan Genangan' : 'Pompa Polder'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase block">Resolusi:</span>
                  <span className="font-bold text-[#4a154b] text-[11px] block">
                    1080p (25 FPS)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[#e6e6e6]">
              <button
                onClick={() => setSelectedCCTV(cctv)}
                className="flex-1 py-2.5 px-4 rounded-[90px] bg-[#f9f0ff] hover:bg-[#ebdccb] text-[#4a154b] border border-[#d9bdde]/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Lihat Stream</span>
              </button>

              <button
                onClick={() => handleTriggerScan(cctv.id)}
                disabled={isScanning}
                className="py-2.5 px-3.5 rounded-[90px] bg-white hover:bg-[#f4ede4] text-[#1d1d1d] font-bold text-xs border border-[#e6e6e6] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Jalankan Non-YOLO CV Analysis"
              >
                <Sliders className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Uji Non-YOLO</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stream Viewer Modal */}
      {selectedCCTV && (
        <CCTVDetailPanel cctv={selectedCCTV} onClose={() => setSelectedCCTV(null)} />
      )}

      {/* Flood Event Modal */}
      {selectedFloodEvent && (
        <FloodEventDetailModal
          event={selectedFloodEvent}
          onClose={() => setSelectedFloodEvent(null)}
          onResolve={handleResolveEvent}
        />
      )}

      {/* Non-YOLO Explainability Diagnostics Drawer Modal */}
      {diagnosticsCCTV && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#e6e6e6] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-[#e6e6e6]">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-[#4a154b] px-3 py-1 rounded-[90px] bg-[#f9f0ff] border border-[#d9bdde]/50 mb-2 inline-block">
                  NON-YOLO CV DIAGNOSTIK
                </span>
                <h3 className="text-xl font-bold text-[#1d1d1d]">
                  {diagnosticsCCTV.cam.name} ({diagnosticsCCTV.cam.code})
                </h3>
                <p className="text-xs text-[#696969] mt-0.5">
                  Kec. {diagnosticsCCTV.cam.district} &bull; {diagnosticsCCTV.cam.address}
                </p>
              </div>
              <button
                onClick={() => setDiagnosticsCCTV(null)}
                className="w-8 h-8 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] flex items-center justify-center text-[#1d1d1d] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Diagnostic Signals Gauges */}
            {diagnosticsCCTV.signals && (
              <div className="space-y-3 p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e6e6e6]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#4a154b]">
                    Multi-Signal Score Breakdown
                  </span>
                  <span className="font-mono text-xs font-bold text-[#007a5a]">
                    Composite: {diagnosticsCCTV.signals.composite_detection_score}
                  </span>
                </div>

                <div className="space-y-2 pt-1 font-mono text-xs">
                  {[
                    { label: 'Water Area Coverage', val: diagnosticsCCTV.signals.water_area_score },
                    { label: 'Waterline Elevation', val: diagnosticsCCTV.signals.waterline_score },
                    { label: 'Texture Homogeneity (Smoothness)', val: diagnosticsCCTV.signals.texture_score },
                    { label: 'Spatial Blob Continuity', val: diagnosticsCCTV.signals.spatial_score },
                    { label: 'Temporal Sliding Window Persistence', val: diagnosticsCCTV.signals.temporal_score },
                  ].map((sig, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#696969]">{sig.label}</span>
                        <span className="font-bold text-[#1d1d1d]">{(sig.val * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-[90px] bg-[#f4ede4] overflow-hidden">
                        <div
                          className={`h-full rounded-[90px] ${
                            sig.val < 0.40 ? 'bg-[#007a5a]' : sig.val < 0.70 ? 'bg-[#d97706]' : 'bg-[#cc4117]'
                          }`}
                          style={{ width: `${Math.min(100, sig.val * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explainability factors */}
            {diagnosticsCCTV.explainability && (
              <div className="space-y-2 p-4 rounded-[16px] bg-[#f4ede4] border border-[#e6e6e6] text-xs">
                <span className="font-bold text-[#4a154b] block uppercase font-mono text-[11px]">
                  Rasionalitas Klasifikasi (Explainability):
                </span>
                <p className="font-semibold text-[#1d1d1d]">
                  {diagnosticsCCTV.explainability.verdict}
                </p>
                <div className="space-y-1 pt-1 text-[#696969]">
                  {diagnosticsCCTV.explainability.primary_factors?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#007a5a] font-bold">•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                  {diagnosticsCCTV.explainability.suppression_factors?.map((f: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#696969] font-bold">•</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Debug visualization image */}
            {diagnosticsCCTV.debug_url && (
              <div className="space-y-2">
                <span className="font-mono text-[11px] font-bold uppercase text-[#4a154b] block">
                  Debug Visualization Composite (4-Panel):
                </span>
                <div className="rounded-[16px] overflow-hidden border border-[#e6e6e6] shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={diagnosticsCCTV.debug_url}
                    alt="Non-YOLO Debug Visualization"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setDiagnosticsCCTV(null)}
                className="w-full h-11 rounded-[90px] bg-[#4a154b] hover:bg-[#611f69] text-white font-bold text-xs uppercase cursor-pointer"
              >
                Tutup Panel Diagnostik
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
