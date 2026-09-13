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
} from 'lucide-react'
import Link from 'next/link'

export function CCTVMonitoringView() {
  const [selectedCCTV, setSelectedCCTV] = useState<CCTVPoint | null>(null)
  const [selectedFloodEvent, setSelectedFloodEvent] = useState<FloodEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'rob_banjir' | 'polder_sungai'>('all')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')

  // AI Flood Events & Health State
  const [floodEvents, setFloodEvents] = useState<FloodEvent[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState<string | null>(null)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

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

  // Trigger live AI YOLO Scan
  const handleTriggerScan = async (targetCamId?: string) => {
    setIsScanning(true)
    setScanMessage('Menghubungi CV Daemon & mengambil stream aktual...')
    try {
      const res = await fetch('/api/cctv/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: targetCamId, count: 3 }),
      })
      const data = await res.json()
      if (data.success) {
        setScanMessage(`Pemindaian selesai: ${data.scanned_count} kamera diproses.`)
        await fetchFloodEvents()
      } else {
        setScanMessage(`Gagal: ${data.error || 'Terjadi kesalahan'}`)
      }
    } catch (err: any) {
      setScanMessage(`Koneksi CV Service: ${err.message}`)
    } finally {
      setIsScanning(false)
      setTimeout(() => setScanMessage(null), 6000)
    }
  }

  const handleResolveEvent = async (eventId: string) => {
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
      console.error('Gagal meresolusi event:', err)
    }
  }

  // Event Categories
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

  // Format Duration since started_at
  const formatDuration = (startedAt: string) => {
    const diffMs = Math.max(0, Date.now() - new Date(startedAt).getTime())
    const mins = Math.floor(diffMs / 60000)
    const secs = Math.floor((diffMs % 60000) / 1000)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-bold px-2 py-0.5 rounded bg-secondary/10 border border-secondary/30">
              CIVIC VISION RADAR v1.1
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
              LIGHTWEIGHT CV &bull; VERCEL CPU-ONLY
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
              VERCEL CRON READY
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              Sumber: PantauSemar Pemkot Semarang (70 Titik)
            </span>
          </div>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
            Monitoring CCTV & Deteksi Banjir Visual
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Observasi visual otomatis berbasis Computer Vision CPU-only untuk mendeteksi genangan/banjir dari stream CCTV PantauSemar secara serverless.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleTriggerScan()}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Memindai...' : 'Scan AI Sekarang'}</span>
          </button>

          <Link
            href="/peta"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Buka di Peta</span>
          </Link>
        </div>
      </div>

      {/* Scan notification banner if active */}
      {scanMessage && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono text-cyan-300 flex items-center justify-between animate-fade-in">
          <span>{scanMessage}</span>
          <button onClick={() => setScanMessage(null)} className="text-cyan-400 hover:text-white text-xs">
            Tutup
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 20: ACTIVE FLOOD EVENTS PANEL & MONITORING METRICS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-red-400">
              ACTIVE FLOOD EVENTS ({activeEvents.length})
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-on-surface-variant">
            <span>Suspected: <b className="text-amber-400">{suspectedEvents.length}</b></span>
            <span>Resolved: <b className="text-emerald-400">{resolvedEvents.length}</b></span>
            <span>CCTV Online: <b className="text-secondary">70</b></span>
          </div>
        </div>

        {/* Active Flood Events Cards Grid */}
        {activeEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeEvents.map((ev) => (
              <div
                key={ev.event_id}
                className="p-4 rounded-xl bg-gradient-to-b from-red-950/40 via-surface-container-low to-surface-container-low border border-red-700/50 shadow-md flex flex-col justify-between group hover:border-red-500 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-red-300">
                      {ev.district_name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-red-600/30 text-red-300 border border-red-500/40">
                      FLOOD CONFIRMED
                    </span>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-on-surface-variant mb-3">
                    <div className="flex justify-between">
                      <span>CCTV:</span>
                      <span className="text-on-surface font-semibold">{ev.camera_code} ({ev.camera_name})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="text-emerald-400 font-bold">{(ev.model_confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Severity:</span>
                      <span className="text-amber-400 font-bold capitalize">{ev.estimated_visual_severity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Durasi:</span>
                      <span className="text-cyan-400 font-bold">{formatDuration(ev.started_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                  <button
                    onClick={() => setSelectedFloodEvent(ev)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 font-mono text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Evidence</span>
                  </button>

                  <Link
                    href="/peta"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-mono text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>View on Map</span>
                  </Link>

                  <button
                    onClick={() => handleResolveEvent(ev.event_id)}
                    className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/40 transition-colors"
                    title="Resolusi Event"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div>
                <p className="text-xs font-mono font-bold text-on-surface">
                  Tidak Ada Flood Event Aktif Terkonfirmasi
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  Kamera pemantauan genangan air PantauSemar berada dalam batas normal / belum memenuhi ambang persistensi konfirmasi.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTriggerScan()}
              className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-mono text-primary font-bold border border-outline-variant/30 shrink-0"
            >
              Uji Scan Sekarang
            </button>
          </div>
        )}

        {/* Suspected Events Row if any */}
        {suspectedEvents.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Indikasi Terdeteksi (Water/Flood Suspected — Menunggu Verifikasi Temporal)
              </span>
              <span className="text-[10px] font-mono text-amber-300/80">
                {suspectedEvents.length} Kamera
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {suspectedEvents.map((ev) => (
                <div
                  key={ev.event_id}
                  onClick={() => setSelectedFloodEvent(ev)}
                  className="p-2.5 rounded-lg bg-surface-container/60 border border-outline-variant/20 hover:border-amber-500/50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-on-surface font-headline block">
                      {ev.district_name} &bull; {ev.camera_name}
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant">
                      Conf: {(ev.model_confidence * 100).toFixed(0)}% &bull; {ev.estimated_visual_severity}
                    </span>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CCTV Monitoring Health Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <span className="text-[10px] font-mono text-on-surface-variant block mb-1">
              Status Monitoring CCTV
            </span>
            <span className="text-sm font-bold text-secondary font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              70 Titik Terhubung
            </span>
            <span className="text-[9px] text-on-surface-variant block mt-0.5">
              HLS Live Stream Aktif
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <span className="text-[10px] font-mono text-on-surface-variant block mb-1">
              Sampling Rate Adaptif
            </span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              10s Normal / 2s Suspect
            </span>
            <span className="text-[9px] text-on-surface-variant block mt-0.5">
              Configurable di CV Daemon
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <span className="text-[10px] font-mono text-on-surface-variant block mb-1">
              Aturan Metodologis
            </span>
            <span className="text-sm font-bold text-on-surface font-mono">
              Offline = UNKNOWN
            </span>
            <span className="text-[9px] text-on-surface-variant block mt-0.5">
              Bukan diasumsikan NO_FLOOD
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
            <span className="text-[10px] font-mono text-on-surface-variant block mb-1">
              In-App Notification
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              Aktif (No Telegram)
            </span>
            <span className="text-[9px] text-on-surface-variant block mt-0.5">
              Output database & EOC saja
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CCTV FILTER CONTROLS BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-surface-container-low p-3 sm:p-4 rounded-xl border border-outline-variant/30 shadow-sm mt-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-3 py-2 min-h-[38px] rounded-lg border font-mono transition-all flex items-center justify-center ${
              selectedCategory === 'all'
                ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
            }`}
          >
            Semua CCTV ({PANTAUSEMAR_CCTV_POINTS.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('rob_banjir')}
            className={`text-xs px-3 py-2 min-h-[38px] rounded-lg border font-mono transition-all flex items-center justify-center ${
              selectedCategory === 'rob_banjir'
                ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-sm'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
            }`}
          >
            🌊 Rawan Genangan ({genanganCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('polder_sungai')}
            className={`text-xs px-3 py-2 min-h-[38px] rounded-lg border font-mono transition-all flex items-center justify-center ${
              selectedCategory === 'polder_sungai'
                ? 'bg-secondary text-on-secondary border-secondary font-bold shadow-sm'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
            }`}
          >
            ⚙️ Pantau Pompa Air ({pompaCount})
          </button>
        </div>

        {/* District Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full lg:max-w-md min-w-0">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="h-10 px-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-xs font-mono text-on-surface focus:outline-none focus:border-primary min-w-[130px]"
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
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kamera, lokasi, atau OPD..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container border border-outline-variant/40 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-body"
            />
          </div>
        </div>
      </div>

      {/* CCTV Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCCTVs.map((cctv) => {
          const activeForCam = floodEvents.find(
            (e) => e.camera_id === cctv.id && e.status !== 'resolved'
          )

          return (
            <div
              key={cctv.id}
              className={`rounded-xl border bg-surface-container-low transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden group ${
                activeForCam
                  ? 'border-red-600/70 shadow-red-950/30'
                  : 'border-outline-variant/30 hover:border-primary/50'
              }`}
            >
              {/* Top Info */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                      cctv.category === 'rob_banjir'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-400/30'
                        : 'bg-secondary/10 text-secondary border-secondary/30'
                    }`}
                  >
                    {cctv.categoryLabel}
                  </span>
                  {activeForCam ? (
                    <span className="text-[10px] font-mono text-red-400 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                      BANJIR TERDETEKSI
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-secondary flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                      LIVE HLS
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {cctv.name}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">
                    Kec. {cctv.district} &bull; <span className="font-mono">{cctv.code}</span>
                  </p>
                </div>

                <div className="space-y-1 text-[10px] font-mono text-on-surface-variant/90 border-t border-outline-variant/20 pt-2">
                  <div className="flex items-center justify-between">
                    <span>OPD:</span>
                    <span className="text-on-surface font-semibold truncate max-w-[150px]">
                      {cctv.opd}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Koordinat:</span>
                    <span className="text-on-surface">
                      {cctv.latitude.toFixed(4)}, {cctv.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-4 py-3 bg-surface-container border-t border-outline-variant/20 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCCTV(cctv)}
                  className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] py-2 px-3 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase hover:brightness-110 transition-all shadow-sm"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Lihat Stream</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerScan(cctv.id)}
                  disabled={isScanning}
                  className="min-h-[40px] px-2.5 rounded-lg bg-surface-container-high text-xs font-mono font-bold text-cyan-400 hover:text-white hover:bg-surface-container-highest transition-colors"
                  title="Jalankan YOLO Inference pada kamera ini"
                >
                  Scan AI
                </button>

                <Link
                  href={`/peta`}
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                  title="Lihat titik di peta spasial"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {filteredCCTVs.length === 0 && (
        <div className="py-16 text-center text-on-surface-variant font-mono text-xs bg-surface-container-low rounded-xl border border-outline-variant/30">
          Tidak ada kamera CCTV yang cocok dengan filter atau kueri pencarian.
        </div>
      )}

      {/* Live HLS Video Stream Modal */}
      {selectedCCTV && (
        <CCTVDetailPanel
          cctv={selectedCCTV}
          onClose={() => setSelectedCCTV(null)}
        />
      )}

      {/* Flood Event Detail & Evidence Modal */}
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
          onResolve={handleResolveEvent}
        />
      )}
    </div>
  )
}
