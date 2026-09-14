'use client'

import { useEffect, useState, useRef } from 'react'
import type { CCTVPoint } from '@/lib/data/cctv-pantausemar'
import Hls from 'hls.js'
import {
  X,
  PhoneCall,
  MapPin,
  Maximize2,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Video,
  Radio
} from 'lucide-react'
import { WhyDidThisHappenCard } from '@/components/education/WhyDidThisHappenCard'
import { CCTVWeatherCorrelationCard } from '@/components/weather/CCTVWeatherCorrelationCard'

interface CCTVDetailPanelProps {
  cctv: CCTVPoint | null
  onClose: () => void
}

type StreamStatus = 'CONNECTING' | 'LIVE' | 'OFFLINE'

export function CCTVDetailPanel({ cctv, onClose }: CCTVDetailPanelProps) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('CONNECTING')
  const [lastChecked, setLastChecked] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [, setIsFullscreen] = useState<boolean>(false)
  const [reloadKey, setReloadKey] = useState<number>(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update clock & record checked time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      return (
        now.toLocaleTimeString('id-ID', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      )
    }
    setLastChecked(updateTime())
  }, [cctv?.streamUrl, reloadKey])

  // Real HLS Video Stream Mounting & State Detection (NO HARDCODED LIVE)
  useEffect(() => {
    if (!cctv?.streamUrl || !videoRef.current) return

    const video = videoRef.current
    let hls: Hls | null = null
    setStreamStatus('CONNECTING')

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 15,
        manifestLoadingTimeOut: 8000,
        levelLoadingTimeOut: 8000,
      })

      hls.loadSource(cctv.streamUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video
          .play()
          .then(() => {
            setIsPlaying(true)
            setStreamStatus('LIVE')
          })
          .catch(() => {
            // Autoplay policy or pause: stream is parsed and ready
            setStreamStatus('LIVE')
          })
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Network error or 404
              setStreamStatus('OFFLINE')
              hls?.destroy()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls?.recoverMediaError()
              break
            default:
              setStreamStatus('OFFLINE')
              hls?.destroy()
              break
          }
        }
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari / iOS)
      video.src = cctv.streamUrl
      video.addEventListener('loadedmetadata', () => {
        video
          .play()
          .then(() => {
            setIsPlaying(true)
            setStreamStatus('LIVE')
          })
          .catch(() => {
            setStreamStatus('LIVE')
          })
      })
      video.addEventListener('error', () => {
        setStreamStatus('OFFLINE')
      })
    } else {
      setStreamStatus('OFFLINE')
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [cctv?.streamUrl, reloadKey])

  if (!cctv) return null

  const togglePlay = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const handleRetry = () => {
    const now = new Date()
    setLastChecked(
      now.toLocaleTimeString('id-ID', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    )
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="absolute right-0 top-0 h-full w-full sm:w-[460px] max-w-full bg-surface-container-low/95 backdrop-blur-xl border-l border-outline-variant/30 flex flex-col z-30 font-body shadow-2xl animate-in slide-in-from-right duration-200">
      {/* 1. HEADER & FRAMING */}
      <div className="flex items-start justify-between p-4 border-b border-outline-variant/30 bg-surface-container shrink-0">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary/10 border border-secondary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              {cctv.code}
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant">
              Titik Pantauan Prioritas Genangan
            </span>
          </div>
          <h2 className="font-headline font-bold text-sm sm:text-base text-on-surface truncate">
            {cctv.name}
          </h2>
          <div className="text-[11px] text-on-surface-variant mt-0.5">
            {cctv.opd}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Honest Status Badge */}
          {streamStatus === 'LIVE' && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-secondary/15 text-secondary border border-secondary/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
              LIVE
            </span>
          )}
          {streamStatus === 'CONNECTING' && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-tertiary/15 text-tertiary border border-tertiary/30 flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              CONNECTING
            </span>
          )}
          {streamStatus === 'OFFLINE' && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-error/15 text-error border border-error/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              OFFLINE
            </span>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            aria-label="Tutup panel CCTV"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. DIRECT LIVE VIDEO STREAM PLAYER */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center shrink-0 border-b border-outline-variant/40 group"
      >
        {/* Real Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover bg-black cursor-pointer"
          playsInline
          autoPlay
          muted={isMuted}
          onClick={togglePlay}
        />

        {/* CONNECTING STATE OVERLAY */}
        {streamStatus === 'CONNECTING' && (
          <div className="absolute inset-0 bg-surface-container-lowest/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-[15] pointer-events-none">
            <div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
            <span className="font-mono text-[11px] text-secondary font-semibold tracking-wider animate-pulse">
              MEMERIKSA STREAM HLS...
            </span>
            <span className="text-[10px] text-on-surface-variant font-mono">
              Server: livepantau.semarangkota.go.id
            </span>
          </div>
        )}

        {/* OFFLINE STATE OVERLAY (HONEST FEEDBACK) */}
        {streamStatus === 'OFFLINE' && (
          <div className="absolute inset-0 bg-surface-container-lowest/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center gap-2 z-[15]">
            <AlertCircle className="w-8 h-8 text-error" />
            <div className="flex flex-col gap-0.5">
              <span className="font-headline font-bold text-xs text-on-surface uppercase tracking-wider">
                CCTV STREAM OFFLINE
              </span>
              <span className="text-[11px] text-on-surface-variant max-w-[300px]">
                Stream video tidak dapat diakses saat ini dari server PantauSemar (sesi dibatasi atau offline pemeliharaan).
              </span>
              <span className="text-[10px] font-mono text-on-surface-variant/80 mt-1">
                Last checked: {lastChecked}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-mono text-[11px] font-bold shadow hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Cek Ulang
              </button>
              <a
                href={cctv.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 font-mono text-[11px] transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-secondary" />
                Stream Raw (.m3u8)
              </a>
            </div>
          </div>
        )}

        {/* TOP OSD BAR */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none z-20">
          <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                streamStatus === 'LIVE'
                  ? 'bg-secondary animate-ping'
                  : streamStatus === 'CONNECTING'
                  ? 'bg-tertiary animate-pulse'
                  : 'bg-error'
              }`}
            ></span>
            <span
              className={`font-bold ${
                streamStatus === 'LIVE'
                  ? 'text-secondary'
                  : streamStatus === 'CONNECTING'
                  ? 'text-tertiary'
                  : 'text-error'
              }`}
            >
              {streamStatus}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-white/90">{cctv.code}</span>
          </div>

          <div className="bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-on-surface font-mono text-[10px]">
            {lastChecked}
          </div>
        </div>

        {/* BOTTOM OSD BAR (VISIBLE ONLY IN LIVE MODE) */}
        {streamStatus === 'LIVE' && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none z-20 group-hover:opacity-0 transition-opacity duration-200">
            <div className="bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-white/90 flex items-center gap-1">
              <Radio className="w-3 h-3 text-secondary" />
              <span>HLS STREAM AKTIF</span>
            </div>

            <div className="bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-secondary font-semibold">
              PANTAUSEMAR
            </div>
          </div>
        )}

        {/* PLAYER CONTROLS (VISIBLE ON HOVER) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5 z-30">
          <div className="w-full flex items-center justify-between bg-surface-container/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant/40 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="text-on-surface hover:text-primary transition-colors p-1"
                title={isPlaying ? 'Jeda Video' : 'Putar Video'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="text-on-surface hover:text-primary transition-colors p-1"
                title={isMuted ? 'Aktifkan Audio' : 'Bisukan Audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-tertiary" /> : <Volume2 className="w-4 h-4 text-secondary" />}
              </button>
              <button
                type="button"
                onClick={handleRetry}
                className="text-on-surface hover:text-primary transition-colors p-1"
                title="Muat Ulang Stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[10px] text-secondary font-bold ml-1">
                {cctv.resolution.includes('2K') ? '2K QHD' : '1080P FHD'}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-on-surface hover:text-primary transition-colors p-1"
              title="Layar Penuh Video"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. VERIFIED METADATA & ACTUAL INFORMATION CARD */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Actual Telemetry Card */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">
              INFORMASI TITIK PANTAUAN
            </span>
            <span className="font-mono text-[10px] text-secondary font-semibold">
              KOTA SEMARANG
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-on-surface-variant block text-[10px]">Klasifikasi Titik:</span>
              <span className="font-semibold text-on-surface">Titik Prioritas Genangan</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">OPD Pengelola:</span>
              <span className="font-semibold text-on-surface truncate block">{cctv.opd}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">Sumber Stream:</span>
              <span className="font-mono font-semibold text-primary">PantauSemar Diskominfo</span>
            </div>
            <div>
              <span className="text-on-surface-variant block text-[10px]">Pengecekan Terakhir:</span>
              <span className="font-mono font-semibold text-on-surface">{lastChecked}</span>
            </div>
          </div>
        </div>

        {/* Framing & Scope Note */}
        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase font-bold text-on-surface">
              Cakupan Data Titik Prioritas
            </span>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Menampilkan CCTV pada titik prioritas yang tersedia dari sumber PantauSemar (bukan seluruh cakupan Kota Semarang).
            </p>
          </div>
        </div>

        {/* Location & Physical Description */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2 text-on-surface-variant">
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-on-surface font-semibold block">
                Kecamatan {cctv.district}, Kota Semarang
              </span>
              <span className="text-[11px] text-on-surface-variant block mt-0.5">
                {cctv.address}
              </span>
              <span className="font-mono text-[10px] text-primary/80 block mt-1">
                Koordinat: {cctv.latitude.toFixed(5)}, {cctv.longitude.toFixed(5)}
              </span>
            </div>
          </div>
          <p className="text-xs text-on-surface leading-relaxed border-t border-outline-variant/20 pt-2">
            {cctv.description}
          </p>
        </div>

        {/* Environmental Telemetry & Weather Correlation (Requirement #11) */}
        <CCTVWeatherCorrelationCard
          cctv={cctv}
          cctvLastChecked={lastChecked}
        />

        {/* Education & Resilience Context (Requirement #7 & #9) */}
        <WhyDidThisHappenCard
          category="banjir"
          latitude={cctv.latitude}
          longitude={cctv.longitude}
          locationName={cctv.name}
        />

        {/* DIRECT ACTIONS */}
        <div className="flex flex-col gap-2 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <a
            href="tel:112"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-error-container/40 border border-error/50 text-error hover:bg-error-container font-mono text-xs font-bold uppercase transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Eskalasi Temuan ke BPBD 112
          </a>

          <a
            href={`https://www.google.com/maps?q=${cctv.latitude},${cctv.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-xs transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Buka Navigasi Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}
