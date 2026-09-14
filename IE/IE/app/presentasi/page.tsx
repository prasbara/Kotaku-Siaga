'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Maximize,
  CheckCircle2,
  ShieldAlert,
  Layers,
  Activity,
  ArrowLeft,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  Radio,
  Share2
} from 'lucide-react'

// Total presentation length in seconds (45-60s requirement: 56.0s)
const TOTAL_DURATION = 56.0

interface SceneMeta {
  id: number
  name: string
  title: string
  start: number
  end: number
  description: string
}

const SCENES: SceneMeta[] = [
  { id: 1, name: 'SCENE 1', title: 'Opening & Identity', start: 0.0, end: 6.0, description: 'Brand Identity & Introduction' },
  { id: 2, name: 'SCENE 2', title: 'The Problem', start: 6.0, end: 14.0, description: 'Fragmented Data to Centralized View' },
  { id: 3, name: 'SCENE 3', title: 'Data Ingestion', start: 14.0, end: 22.0, description: 'Multi-Source Government & Civic Streams' },
  { id: 4, name: 'SCENE 4', title: 'Intelligent Analysis', start: 22.0, end: 32.0, description: '5-Stage Classical CV & Sensor Pipeline' },
  { id: 5, name: 'SCENE 5', title: 'Map + CCTV Correlation', start: 32.0, end: 42.0, description: 'Spatial-Temporal Triangulation' },
  { id: 6, name: 'SCENE 6', title: 'Decision Support', start: 42.0, end: 52.0, description: 'Incident Lifecycle & Actionable Intelligence' },
  { id: 7, name: 'SCENE 7', title: 'Closing', start: 52.0, end: 56.0, description: 'Platform Mission: Monitor. Verify. Respond.' },
]

export default function PresentationPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingProgress, setRecordingProgress] = useState<number>(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('Siap diputar')

  // Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const droneOsc1Ref = useRef<OscillatorNode | null>(null)
  const droneOsc2Ref = useRef<OscillatorNode | null>(null)

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Animation Frame and Time Tracking
  const animFrameRef = useRef<number>(0)
  const lastTimestampRef = useRef<number>(0)
  const currentTimeRef = useRef<number>(0)
  const isPlayingRef = useRef<boolean>(false)

  // Loaded Assets
  const assetsRef = useRef<{
    supriyadiImg: HTMLImageElement | null
    kaligaweImg: HTMLImageElement | null
  }>({ supriyadiImg: null, kaligaweImg: null })

  // Initialize Assets
  useEffect(() => {
    const img1 = new Image()
    img1.src = '/evidence/flood_414_321_1789291801.jpg'
    img1.onload = () => { assetsRef.current.supriyadiImg = img1 }

    const img2 = new Image()
    img2.src = '/images/cctv-kaligawe-preview.jpg'
    img2.onload = () => { assetsRef.current.kaligaweImg = img2 }
  }, [])

  // Audio Synthesizer setup (subtle high-tech ambient tone)
  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      const master = ctx.createGain()
      master.gain.value = isMuted ? 0 : 0.25
      master.connect(ctx.destination)
      masterGainRef.current = master

      // Ambient warm drone 1 (D2 = 73.42Hz)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sawtooth'
      osc1.frequency.setValueAtTime(73.42, ctx.currentTime)

      const filter1 = ctx.createBiquadFilter()
      filter1.type = 'lowpass'
      filter1.frequency.setValueAtTime(220, ctx.currentTime)

      const gain1 = ctx.createGain()
      gain1.gain.value = 0.15
      osc1.connect(filter1).connect(gain1).connect(master)
      osc1.start()
      droneOsc1Ref.current = osc1

      // Ambient warm drone 2 (A2 = 110Hz)
      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(110.0, ctx.currentTime)

      const gain2 = ctx.createGain()
      gain2.gain.value = 0.1
      osc2.connect(gain2).connect(master)
      osc2.start()
      droneOsc2Ref.current = osc2
    } catch {
      // AudioContext may be restricted by browser policy
    }
  }, [isMuted])

  // Play subtle cue sound
  const playCueSound = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.12) => {
    if (!audioCtxRef.current || isMuted) return
    try {
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
      osc.connect(gain).connect(masterGainRef.current || ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // ignore
    }
  }, [isMuted])

  // Toggle Mute
  const handleToggleMute = () => {
    initAudio()
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(nextMuted ? 0 : 0.25, audioCtxRef.current.currentTime)
    }
  }

  // Easing functions
  const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)

  // ============================================================
  // RENDER ENGINE (1920 x 1080 Native Canvas)
  // ============================================================
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const W = 1920
    const H = 1080
    ctx.clearRect(0, 0, W, H)

    // Global Base Background - Deep luxury aubergine
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100)
    bgGrad.addColorStop(0, '#360f38')
    bgGrad.addColorStop(0.65, '#220824')
    bgGrad.addColorStop(1, '#130315')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Subtle atmospheric grid
    ctx.strokeStyle = 'rgba(244, 237, 228, 0.03)'
    ctx.lineWidth = 1
    const gridSize = 64
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    // Top Right Telemetry
    ctx.fillStyle = 'rgba(244, 237, 228, 0.45)'
    ctx.font = '500 13px "Inter", sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`KOTAKU SIAGA — CIVIC RADAR v2.0 | SEC: ${t.toFixed(2)}s / ${TOTAL_DURATION}s | SEMARANG, ID`, W - 48, 42)

    // Top Left System Dot
    ctx.fillStyle = '#007a5a'
    ctx.beginPath()
    ctx.arc(52, 38, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(244, 237, 228, 0.8)'
    ctx.font = '600 13px "Inter", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('LIVE CIVIC INTELLIGENCE ENGINE', 66, 42)

    // -------------------------------------------------------------
    // SCENE 1: OPENING & IDENTITY (0.0s - 6.0s)
    // -------------------------------------------------------------
    if (t >= 0.0 && t < 6.0) {
      const p = t / 6.0
      const fade = p < 0.2 ? p / 0.2 : p > 0.85 ? (1.0 - p) / 0.15 : 1.0
      const zoom = 0.95 + 0.08 * easeInOutCubic(p)

      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, fade))
      ctx.translate(W / 2, H / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-W / 2, -H / 2)

      // Central Ambient Halo
      const halo = ctx.createRadialGradient(W / 2, H / 2 - 40, 20, W / 2, H / 2 - 40, 420)
      halo.addColorStop(0, 'rgba(128, 40, 133, 0.35)')
      halo.addColorStop(0.5, 'rgba(74, 21, 75, 0.18)')
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, W, H)

      // Logo Icon Box
      const boxSize = 104
      const boxX = W / 2 - boxSize / 2
      const boxY = H / 2 - 190

      ctx.fillStyle = '#4a154b'
      ctx.strokeStyle = 'rgba(237, 220, 247, 0.35)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 28)
      ctx.fill()
      ctx.stroke()

      // Shield graphic
      ctx.fillStyle = '#f4ede4'
      ctx.beginPath()
      ctx.moveTo(W / 2, boxY + 26)
      ctx.lineTo(W / 2 + 24, boxY + 36)
      ctx.lineTo(W / 2 + 24, boxY + 60)
      ctx.quadraticCurveTo(W / 2 + 20, boxY + 80, W / 2, boxY + 88)
      ctx.quadraticCurveTo(W / 2 - 20, boxY + 80, W / 2 - 24, boxY + 60)
      ctx.lineTo(W / 2 - 24, boxY + 36)
      ctx.closePath()
      ctx.fill()

      // Inner shield detail
      ctx.fillStyle = '#4a154b'
      ctx.beginPath()
      ctx.arc(W / 2, boxY + 54, 8, 0, Math.PI * 2)
      ctx.fill()

      // Active pulse dot on logo
      ctx.fillStyle = '#007a5a'
      ctx.beginPath()
      ctx.arc(W / 2 + 36, boxY + 22, 6, 0, Math.PI * 2)
      ctx.fill()

      // Main Brand Title
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 78px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('KotaKu Siaga', W / 2, H / 2 - 20)

      // Subtitle
      ctx.fillStyle = '#eddcf7'
      ctx.font = '500 24px "Inter", sans-serif'
      ctx.fillText('Real-Time Monitoring & Intelligent Decision Support', W / 2, H / 2 + 36)

      // Tagline Chips
      const chipY = H / 2 + 96
      const chips = ['PEMERINTAH KOTA SEMARANG', 'PANTAUSEMAR CCTV (70 TITIK)', 'CIVIC DISASTER RESILIENCE']
      let totalW = 0
      chips.forEach((c) => { totalW += c.length * 9.5 + 44 })
      let curX = W / 2 - totalW / 2

      chips.forEach((chip) => {
        const cW = chip.length * 9.5 + 32
        ctx.fillStyle = 'rgba(74, 21, 75, 0.45)'
        ctx.strokeStyle = 'rgba(237, 220, 247, 0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(curX, chipY, cW, 36, 99)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#f4ede4'
        ctx.font = '600 12px "Inter", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(chip, curX + cW / 2, chipY + 22)
        curX += cW + 12
      })

      ctx.restore()
    }

    // -------------------------------------------------------------
    // SCENE 2: THE PROBLEM (6.0s - 14.0s)
    // -------------------------------------------------------------
    if (t >= 6.0 && t < 14.0) {
      const p = (t - 6.0) / 8.0
      const isChaosPhase = p < 0.55
      const settleProgress = isChaosPhase ? 0 : easeInOutCubic((p - 0.55) / 0.45)

      // Title header
      ctx.fillStyle = '#eddcf7'
      ctx.font = '700 38px "Inter", sans-serif'
      ctx.textAlign = 'center'
      if (isChaosPhase) {
        ctx.fillText('From fragmented data...', W / 2, 130)
        ctx.fillStyle = 'rgba(244, 237, 228, 0.6)'
        ctx.font = '400 18px "Inter", sans-serif'
        ctx.fillText('Manual verification is slow, isolated, and overwhelmed by conflicting streams', W / 2, 170)
      } else {
        ctx.fillText('...to one intelligent view.', W / 2, 130)
        ctx.fillStyle = '#007a5a'
        ctx.font = '600 18px "Inter", sans-serif'
        ctx.fillText('Unified spatial-temporal correlation brings order and clarity', W / 2, 170)
      }

      // 5 Disjointed / Fusing Cards
      const cards = [
        {
          title: 'LAPORAN WARGA (UNVERIFIED)',
          desc: 'Genangan setinggi 40cm di Jl. Supriyadi',
          meta: 'Koordinat: -7.0056, 110.4543 | Waktu: 14:24 WIB',
          color: '#cc4117',
          chaosX: 280,
          chaosY: 280,
          chaosRot: -0.09,
          targetX: 320,
          targetY: 340,
        },
        {
          title: 'PANTAUSEMAR CCTV FEED',
          desc: 'Kamera Supriyadi PS-GEN-321 (1080p FHD)',
          meta: 'Status: Online | 70 Kamera tersebar tanpa AI',
          color: '#d97706',
          chaosX: 1380,
          chaosY: 310,
          chaosRot: 0.08,
          targetX: 740,
          targetY: 340,
        },
        {
          title: 'BMKG STASIUN MARITIM',
          desc: 'Curah Hujan Ekstrem 65mm / Jam',
          meta: 'Stasiun Maritim Tanjung Emas | Pasang Rob +60cm',
          color: '#1264a3',
          chaosX: 360,
          chaosY: 690,
          chaosRot: 0.06,
          targetX: 1160,
          targetY: 340,
        },
        {
          title: 'TELEMETRI RUMAH POMPA',
          desc: 'Polder Tenggang & Sringin Aktif 100%',
          meta: 'Debit: 12.000 L/dtk | Resiko Meluap: Tinggi',
          color: '#4a154b',
          chaosX: 1420,
          chaosY: 670,
          chaosRot: -0.07,
          targetX: 530,
          targetY: 570,
        },
        {
          title: 'JARINGAN DRAINASE OSM',
          desc: 'Topologi Saluran Primer Kali Tenggang',
          meta: 'Elevasi: 2.1m DPL | Aliran Menuju Laut Jawa',
          color: '#007a5a',
          chaosX: 860,
          chaosY: 820,
          chaosRot: 0.04,
          targetX: 950,
          targetY: 570,
        },
      ]

      cards.forEach((card, idx) => {
        const curX = card.chaosX + (card.targetX - card.chaosX) * settleProgress
        const curY = card.chaosY + (card.targetY - card.chaosY) * settleProgress
        const curRot = card.chaosRot * (1 - settleProgress)

        ctx.save()
        ctx.translate(curX, curY)
        ctx.rotate(curRot)

        const cardW = 380
        const cardH = 180

        // Card Container
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = settleProgress > 0.5 ? 'rgba(74, 21, 75, 0.4)' : 'rgba(230, 230, 230, 0.8)'
        ctx.lineWidth = 1.5
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        ctx.shadowBlur = 24
        ctx.beginPath()
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 16)
        ctx.fill()
        ctx.stroke()
        ctx.shadowBlur = 0

        // Left Accent Bar
        ctx.fillStyle = card.color
        ctx.beginPath()
        ctx.roundRect(-cardW / 2, -cardH / 2, 8, cardH, [16, 0, 0, 16])
        ctx.fill()

        // Card Content
        ctx.fillStyle = card.color
        ctx.font = '700 12px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(card.title, -cardW / 2 + 24, -cardH / 2 + 34)

        ctx.fillStyle = '#1d1d1d'
        ctx.font = '700 17px "Inter", sans-serif'
        ctx.fillText(card.desc, -cardW / 2 + 24, -cardH / 2 + 70)

        ctx.fillStyle = '#696969'
        ctx.font = '400 13px "Inter", sans-serif'
        ctx.fillText(card.meta, -cardW / 2 + 24, -cardH / 2 + 104)

        // Status Badge
        const badgeText = isChaosPhase ? 'DISCONNECTED' : 'SYNCHRONIZED'
        const badgeColor = isChaosPhase ? '#cc4117' : '#007a5a'
        ctx.fillStyle = isChaosPhase ? '#fdf0ec' : '#ebf7f3'
        ctx.beginPath()
        ctx.roundRect(-cardW / 2 + 24, -cardH / 2 + 124, 130, 26, 6)
        ctx.fill()

        ctx.fillStyle = badgeColor
        ctx.font = '700 11px "Inter", sans-serif'
        ctx.fillText(badgeText, -cardW / 2 + 38, -cardH / 2 + 141)

        ctx.restore()
      })
    }

    // -------------------------------------------------------------
    // SCENE 3: DATA INGESTION (14.0s - 22.0s)
    // -------------------------------------------------------------
    if (t >= 14.0 && t < 22.0) {
      const p = (t - 14.0) / 8.0

      // Header
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 36px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Multi-Source Data Ingestion Core', W / 2, 120)

      ctx.fillStyle = '#eddcf7'
      ctx.font = '400 17px "Inter", sans-serif'
      ctx.fillText('Synchronizing civic participation, real-time public CCTV, and government sensor APIs', W / 2, 160)

      // Central Core Node
      const coreX = W / 2
      const coreY = 560
      const coreRadius = 110

      // Core Outer Rings
      ctx.strokeStyle = 'rgba(237, 220, 247, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(coreX, coreY, coreRadius + 40, 0, Math.PI * 2)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(74, 21, 75, 0.6)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(coreX, coreY, coreRadius + 20, p * Math.PI * 2, p * Math.PI * 2 + Math.PI * 1.5)
      ctx.stroke()

      // Core Fill
      const coreGrad = ctx.createRadialGradient(coreX, coreY, 10, coreX, coreY, coreRadius)
      coreGrad.addColorStop(0, '#611f69')
      coreGrad.addColorStop(0.8, '#4a154b')
      coreGrad.addColorStop(1, '#2d082f')
      ctx.fillStyle = coreGrad
      ctx.beginPath()
      ctx.arc(coreX, coreY, coreRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#eddcf7'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '700 18px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('KOTAKU SIAGA', coreX, coreY - 14)
      ctx.font = '500 13px "Inter", sans-serif'
      ctx.fillStyle = '#f4ede4'
      ctx.fillText('INGESTION HUB', coreX, coreY + 10)
      ctx.font = '700 12px "Inter", sans-serif'
      ctx.fillStyle = '#007a5a'
      ctx.fillText('● 70 STREAMS LIVE', coreX, coreY + 34)

      // 4 Ingestion Source Nodes
      const sources = [
        { name: 'LAPORAN WARGA', sub: 'Geotagged + Foto + Timestamp', icon: '📱', x: 260, y: 340, color: '#cc4117' },
        { name: 'CCTV PANTAUSEMAR', sub: '70 Titik HLS Live Stream', icon: '📹', x: 260, y: 720, color: '#d97706' },
        { name: 'BMKG CUACA & HUJAN', sub: 'Radar Presipitasi & Pasang Laut', icon: '⛈️', x: 1660, y: 340, color: '#1264a3' },
        { name: 'JARINGAN DRAINASE OSM', sub: 'Topologi Saluran & Sungai', icon: '🗺️', x: 1660, y: 720, color: '#007a5a' },
      ]

      sources.forEach((src, idx) => {
        // Conduit Path
        ctx.strokeStyle = 'rgba(237, 220, 247, 0.25)'
        ctx.lineWidth = 2
        ctx.setLineDash([6, 6])
        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.bezierCurveTo(
          (src.x + coreX) / 2, src.y,
          (src.x + coreX) / 2, coreY,
          coreX, coreY
        )
        ctx.stroke()
        ctx.setLineDash([])

        // Moving Data Packets along conduits
        const packetT = ((p * 3 + idx * 0.25) % 1)
        const px = Math.pow(1 - packetT, 3) * src.x +
          3 * Math.pow(1 - packetT, 2) * packetT * ((src.x + coreX) / 2) +
          3 * (1 - packetT) * Math.pow(packetT, 2) * ((src.x + coreX) / 2) +
          Math.pow(packetT, 3) * coreX
        const py = Math.pow(1 - packetT, 3) * src.y +
          3 * Math.pow(1 - packetT, 2) * packetT * src.y +
          3 * (1 - packetT) * Math.pow(packetT, 2) * coreY +
          Math.pow(packetT, 3) * coreY

        ctx.fillStyle = src.color
        ctx.shadowColor = src.color
        ctx.shadowBlur = 14
        ctx.beginPath()
        ctx.arc(px, py, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Source Box
        const bW = 320
        const bH = 110
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = src.color
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(src.x - bW / 2, src.y - bH / 2, bW, bH, 16)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = src.color
        ctx.font = '700 15px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(src.name, src.x - bW / 2 + 24, src.y - bH / 2 + 38)

        ctx.fillStyle = '#696969'
        ctx.font = '400 13px "Inter", sans-serif'
        ctx.fillText(src.sub, src.x - bW / 2 + 24, src.y - bH / 2 + 68)

        // Latency chip
        ctx.fillStyle = '#ebf7f3'
        ctx.beginPath()
        ctx.roundRect(src.x + bW / 2 - 92, src.y - bH / 2 + 16, 76, 22, 6)
        ctx.fill()
        ctx.fillStyle = '#007a5a'
        ctx.font = '700 10px "Inter", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('LAT: 42ms', src.x + bW / 2 - 54, src.y - bH / 2 + 31)
      })

      // Bottom Status Strip
      ctx.fillStyle = 'rgba(74, 21, 75, 0.4)'
      ctx.strokeStyle = 'rgba(237, 220, 247, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(W / 2 - 420, 920, 840, 50, 99)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#f4ede4'
      ctx.font = '500 15px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('STATUS: Automated continuous pipeline connected to official PantauSemar Semarang HLS endpoints', W / 2, 951)
    }

    // -------------------------------------------------------------
    // SCENE 4: INTELLIGENT ANALYSIS (22.0s - 32.0s)
    // -------------------------------------------------------------
    if (t >= 22.0 && t < 32.0) {
      const p = (t - 22.0) / 10.0

      // Header
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 36px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Intelligent Verification & Analysis Pipeline', W / 2, 110)

      ctx.fillStyle = '#eddcf7'
      ctx.font = '400 16px "Inter", sans-serif'
      ctx.fillText('Multi-signal classical computer vision and spatial correlation without black-box hallucination', W / 2, 150)

      // 5-Stage Sequential Pipeline Bar
      const steps = [
        { num: '01', title: 'INCOMING REPORT', desc: 'Jl. Supriyadi, 40cm', status: p > 0.15 ? 'ACCEPTED' : 'WAITING' },
        { num: '02', title: 'LOCATION VALIDATION', desc: 'BBox Semarang & Saluran', status: p > 0.35 ? 'MATCH' : 'WAITING' },
        { num: '03', title: 'TIMESTAMP VERIFICATION', desc: 'BMKG Hujan ±3 min', status: p > 0.55 ? 'SYNCED' : 'WAITING' },
        { num: '04', title: 'CCTV CORRELATION', desc: 'PS-GEN-321 (140m)', status: p > 0.75 ? 'ALIGNED' : 'WAITING' },
        { num: '05', title: 'EVENT VERIFICATION', desc: 'Klasifikasi Resiko Kritis', status: p > 0.90 ? 'VERIFIED' : 'EVALUATING' },
      ]

      const stepW = 310
      const totalStepsW = steps.length * stepW + (steps.length - 1) * 24
      const startX = W / 2 - totalStepsW / 2

      steps.forEach((st, i) => {
        const sx = startX + i * (stepW + 24)
        const sy = 210
        const isActive = (i === 0 && p >= 0.1) ||
          (i === 1 && p >= 0.3) ||
          (i === 2 && p >= 0.5) ||
          (i === 3 && p >= 0.7) ||
          (i === 4 && p >= 0.88)

        // Connector Arrow
        if (i < steps.length - 1) {
          ctx.strokeStyle = isActive ? '#007a5a' : 'rgba(237, 220, 247, 0.2)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(sx + stepW, sy + 70)
          ctx.lineTo(sx + stepW + 24, sy + 70)
          ctx.stroke()
        }

        // Step Box
        ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.08)'
        ctx.strokeStyle = isActive ? '#4a154b' : 'rgba(237, 220, 247, 0.15)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(sx, sy, stepW, 140, 16)
        ctx.fill()
        ctx.stroke()

        // Step Number & Status
        ctx.fillStyle = isActive ? '#4a154b' : '#eddcf7'
        ctx.font = '700 13px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`STAGE ${st.num}`, sx + 20, sy + 34)

        ctx.fillStyle = isActive ? (st.status === 'VERIFIED' ? '#007a5a' : '#1264a3') : '#696969'
        ctx.font = '700 11px "Inter", sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(st.status, sx + stepW - 20, sy + 34)

        // Step Title & Desc
        ctx.fillStyle = isActive ? '#1d1d1d' : '#f4ede4'
        ctx.font = '700 15px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(st.title, sx + 20, sy + 72)

        ctx.fillStyle = isActive ? '#696969' : 'rgba(244, 237, 228, 0.6)'
        ctx.font = '400 13px "Inter", sans-serif'
        ctx.fillText(st.desc, sx + 20, sy + 104)
      })

      // Central Diagnostic & Confidence Section
      const diagY = 400
      const diagW = 1000
      const diagX = W / 2 - diagW / 2

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = 'rgba(74, 21, 75, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(diagX, diagY, diagW, 460, 24)
      ctx.fill()
      ctx.stroke()

      // Diagnostic Title Header
      ctx.fillStyle = '#4a154b'
      ctx.font = '700 20px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('EVALUASI MULTI-SINYAL TITIK RAWAN GENANGAN SUPRIYADI', diagX + 36, diagY + 54)

      ctx.fillStyle = '#696969'
      ctx.font = '400 14px "Inter", sans-serif'
      ctx.fillText('Camera Code: PS-GEN-321 | Kelurahan Kalicari, Kec. Pedurungan', diagX + 36, diagY + 84)

      // Left: 3 Signal Validation Bars
      const signals = [
        { name: '1. Deteksi Tekstur & Pantulan Air (Non-YOLO CV)', val: p > 0.4 ? 0.92 : p * 2.3, label: '92%' },
        { name: '2. Sinkronisasi Curah Hujan BMKG (65mm/jam)', val: p > 0.6 ? 0.88 : p * 1.4, label: '88%' },
        { name: '3. Kedekatan Radius Saluran Kali Tenggang (140m)', val: p > 0.8 ? 0.95 : p * 1.1, label: '95%' },
      ]

      signals.forEach((sig, sidx) => {
        const sy = diagY + 140 + sidx * 78
        ctx.fillStyle = '#1d1d1d'
        ctx.font = '600 15px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(sig.name, diagX + 36, sy)

        // Progress Track
        const trackW = 540
        ctx.fillStyle = '#f0f0f0'
        ctx.beginPath()
        ctx.roundRect(diagX + 36, sy + 14, trackW, 14, 7)
        ctx.fill()

        // Progress Bar
        const fillW = Math.max(10, Math.min(trackW, trackW * sig.val))
        ctx.fillStyle = sidx === 0 ? '#4a154b' : sidx === 1 ? '#1264a3' : '#007a5a'
        ctx.beginPath()
        ctx.roundRect(diagX + 36, sy + 14, fillW, 14, 7)
        ctx.fill()

        ctx.fillStyle = '#1d1d1d'
        ctx.font = '700 14px "Inter", sans-serif'
        ctx.fillText(sig.label, diagX + 36 + trackW + 16, sy + 27)
      })

      // Right: Confidence Gauge & Decision Status
      const gaugeX = diagX + 780
      const gaugeY = diagY + 230
      const scoreVal = p > 0.88 ? 89.4 : Math.min(89.4, p * 105)

      // Gauge Circular Arc
      ctx.strokeStyle = '#e6e6e6'
      ctx.lineWidth = 16
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.arc(gaugeX, gaugeY, 80, Math.PI * 0.8, Math.PI * 2.2)
      ctx.stroke()

      const gaugeFillEnd = Math.PI * 0.8 + (Math.PI * 1.4) * (scoreVal / 100)
      ctx.strokeStyle = scoreVal > 75 ? '#007a5a' : '#d97706'
      ctx.beginPath()
      ctx.arc(gaugeX, gaugeY, 80, Math.PI * 0.8, gaugeFillEnd)
      ctx.stroke()

      ctx.fillStyle = '#1d1d1d'
      ctx.font = '700 36px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${scoreVal.toFixed(1)}%`, gaugeX, gaugeY + 12)

      ctx.fillStyle = '#696969'
      ctx.font = '600 12px "Inter", sans-serif'
      ctx.fillText('CONFIDENCE SCORE', gaugeX, gaugeY + 38)

      // Verification Result Badge
      const isVerified = p > 0.85
      const badgeY = diagY + 350
      ctx.fillStyle = isVerified ? '#ebf7f3' : '#fef3c7'
      ctx.strokeStyle = isVerified ? '#007a5a' : '#d97706'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(diagX + 36, badgeY, diagW - 72, 74, 16)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = isVerified ? '#007a5a' : '#d97706'
      ctx.font = '700 18px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(isVerified ? '✓ STATUS: TERVERIFIKASI (PRIORITAS TINGGI)' : '⏳ STATUS: EVALUASI SEDANG BERLANGSUNG...', diagX + 64, badgeY + 44)

      ctx.fillStyle = '#696969'
      ctx.font = '400 13px "Inter", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('Bantuan keputusan operator — Tanpa klaim 100% otonom mutlak', diagX + diagW - 64, badgeY + 44)
    }

    // -------------------------------------------------------------
    // SCENE 5: MAP + CCTV CORRELATION (32.0s - 42.0s)
    // -------------------------------------------------------------
    if (t >= 32.0 && t < 42.0) {
      const p = (t - 32.0) / 10.0

      // Simulated Map Canvas (Semarang City grid representation)
      const mapX = 60
      const mapY = 100
      const mapW = 1800
      const mapH = 880

      ctx.save()
      ctx.beginPath()
      ctx.roundRect(mapX, mapY, mapW, mapH, 24)
      ctx.clip()

      // Map Background - Dark styled cartography
      ctx.fillStyle = '#1e1a22'
      ctx.fillRect(mapX, mapY, mapW, mapH)

      // Shoreline (Laut Jawa)
      ctx.fillStyle = '#14202b'
      ctx.beginPath()
      ctx.moveTo(mapX, mapY)
      ctx.lineTo(mapX + mapW, mapY)
      ctx.lineTo(mapX + mapW, mapY + 220)
      ctx.bezierCurveTo(mapX + 1200, mapY + 260, mapX + 600, mapY + 180, mapX, mapY + 240)
      ctx.closePath()
      ctx.fill()

      // Shoreline Label
      ctx.fillStyle = 'rgba(18, 100, 163, 0.5)'
      ctx.font = '700 18px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('LAUT JAWA (PESISIR SEMARANG)', mapX + mapW / 2, mapY + 100)

      // Major Rivers (BKB, BKT, Kali Tenggang)
      ctx.strokeStyle = '#1264a3'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      // Banjir Kanal Barat
      ctx.beginPath()
      ctx.moveTo(mapX + 420, mapY + 220)
      ctx.lineTo(mapX + 480, mapY + mapH)
      ctx.stroke()
      // Banjir Kanal Timur
      ctx.beginPath()
      ctx.moveTo(mapX + 1100, mapY + 240)
      ctx.lineTo(mapX + 1020, mapY + mapH)
      ctx.stroke()
      // Kali Tenggang
      ctx.beginPath()
      ctx.moveTo(mapX + 1380, mapY + 230)
      ctx.lineTo(mapX + 1320, mapY + mapH)
      ctx.stroke()

      // Major Arterials (Kaligawe, Majapahit, Supriyadi)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.lineWidth = 6
      // Jl. Kaligawe
      ctx.beginPath()
      ctx.moveTo(mapX, mapY + 310)
      ctx.lineTo(mapX + mapW, mapY + 290)
      ctx.stroke()
      // Jl. Majapahit
      ctx.beginPath()
      ctx.moveTo(mapX + 400, mapY + 760)
      ctx.lineTo(mapX + mapW, mapY + 680)
      ctx.stroke()
      // Jl. Supriyadi
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.moveTo(mapX + 1280, mapY + 540)
      ctx.lineTo(mapX + 1240, mapY + 880)
      ctx.stroke()

      // Street Labels
      ctx.fillStyle = 'rgba(244, 237, 228, 0.4)'
      ctx.font = '600 13px "Inter", sans-serif'
      ctx.fillText('JL. KALIGAWE RAYA', mapX + 500, mapY + 298)
      ctx.fillText('JL. BRIGJEN SUDIARTO (MAJAPAHIT)', mapX + 700, mapY + 748)
      ctx.fillText('JL. SUPRIYADI', mapX + 1300, mapY + 660)

      // Other CCTV Nodes across Semarang (Dots)
      const cctvNodes = [
        { name: 'Simpang Lima', x: mapX + 760, y: mapY + 600 },
        { name: 'Tugu Muda', x: mapX + 560, y: mapY + 560 },
        { name: 'Kaligawe Genuk', x: mapX + 1440, y: mapY + 310 },
        { name: 'Peterongan', x: mapX + 880, y: mapY + 660 },
        { name: 'Tlogosari', x: mapX + 1180, y: mapY + 480 },
        { name: 'Polder BKT', x: mapX + 1040, y: mapY + 360 },
      ]

      cctvNodes.forEach((node) => {
        ctx.fillStyle = 'rgba(0, 122, 90, 0.8)'
        ctx.beginPath()
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(244, 237, 228, 0.5)'
        ctx.font = '500 11px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(node.name, node.x + 12, node.y + 4)
      })

      // Active Correlation Focus: Supriyadi
      const incidentX = mapX + 1260
      const incidentY = mapY + 680

      const cctvX = mapX + 1235
      const cctvY = mapY + 620

      // Radar Pulse from Incident Marker
      const radarRadius = ((p * 4) % 1) * 220
      ctx.strokeStyle = `rgba(204, 65, 23, ${1 - ((p * 4) % 1)})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(incidentX, incidentY, radarRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Search Radius Boundary (500m)
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)'
      ctx.setLineDash([8, 8])
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(incidentX, incidentY, 160, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Correlation Vector (Incident <-> CCTV)
      ctx.strokeStyle = '#007a5a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(incidentX, incidentY)
      ctx.lineTo(cctvX, cctvY)
      ctx.stroke()

      // Distance chip along vector
      ctx.fillStyle = '#4a154b'
      ctx.beginPath()
      ctx.roundRect((incidentX + cctvX) / 2 - 40, (incidentY + cctvY) / 2 - 14, 80, 26, 6)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 11px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('140m JARAK', (incidentX + cctvX) / 2, (incidentY + cctvY) / 2 + 3)

      // CCTV Marker
      ctx.fillStyle = '#007a5a'
      ctx.beginPath()
      ctx.arc(cctvX, cctvY, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '700 12px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📷', cctvX, cctvY + 4)

      // Incident Marker (Red)
      ctx.fillStyle = '#cc4117'
      ctx.beginPath()
      ctx.arc(incidentX, incidentY, 16, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '700 14px "Inter", sans-serif'
      ctx.fillText('!', incidentX, incidentY + 5)

      // Floating Live CCTV Inspection Modal (Left Side)
      const modalW = 540
      const modalH = 480
      const modalX = mapX + 48
      const modalY = mapY + 48

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)'
      ctx.strokeStyle = '#4a154b'
      ctx.lineWidth = 2
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
      ctx.shadowBlur = 30
      ctx.beginPath()
      ctx.roundRect(modalX, modalY, modalW, modalH, 20)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      // Modal Header
      ctx.fillStyle = '#4a154b'
      ctx.font = '700 18px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('PANTAUSEMAR LIVE CCTV INSPECTION', modalX + 24, modalY + 38)

      ctx.fillStyle = '#007a5a'
      ctx.font = '700 12px "Inter", sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText('● LIVE STREAM FHD', modalX + modalW - 24, modalY + 38)

      // CCTV Frame Viewport (Using real camera snapshot if loaded)
      const feedX = modalX + 24
      const feedY = modalY + 58
      const feedW = modalW - 48
      const feedH = 240

      if (assetsRef.current.supriyadiImg) {
        ctx.drawImage(assetsRef.current.supriyadiImg, feedX, feedY, feedW, feedH)
      } else {
        ctx.fillStyle = '#222'
        ctx.fillRect(feedX, feedY, feedW, feedH)
        ctx.fillStyle = '#888'
        ctx.font = '500 14px "Inter", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('CCTV STREAM FEED (PS-GEN-321)', feedX + feedW / 2, feedY + feedH / 2)
      }

      // Detection Box Overlay on CCTV feed
      ctx.strokeStyle = '#007a5a'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(feedX + 40, feedY + 70, feedW - 80, feedH - 90)
      ctx.setLineDash([])

      ctx.fillStyle = 'rgba(0, 122, 90, 0.85)'
      ctx.fillRect(feedX + 40, feedY + 48, 170, 22)
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 11px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('WATER LEVEL: ~38.5 CM', feedX + 48, feedY + 63)

      // Metadata Grid under Feed
      const metaY = feedY + feedH + 24
      ctx.fillStyle = '#1d1d1d'
      ctx.font = '700 15px "Inter", sans-serif'
      ctx.fillText('SUPRIYADI (Pedurungan)', modalX + 24, metaY)

      ctx.fillStyle = '#696969'
      ctx.font = '400 13px "Inter", sans-serif'
      ctx.fillText('Diskominfo Kota Semarang | 1080p FHD 25 FPS', modalX + 24, metaY + 22)

      // Relational Telemetry Triangulation
      const relY = metaY + 54
      ctx.fillStyle = '#f9f0ff'
      ctx.beginPath()
      ctx.roundRect(modalX + 24, relY, modalW - 48, 64, 12)
      ctx.fill()

      ctx.fillStyle = '#4a154b'
      ctx.font = '700 12px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('INCIDENT ↕ LOCATION ↕ NEARBY CCTV ↕ TIMESTAMP', modalX + modalW / 2, relY + 26)

      ctx.fillStyle = '#696969'
      ctx.font = '500 12px "Inter", sans-serif'
      ctx.fillText('Supriyadi ↔ -7.0057, 110.4544 ↔ PS-GEN-321 ↔ 14:28:10 WIB', modalX + modalW / 2, relY + 48)

      ctx.restore()
    }

    // -------------------------------------------------------------
    // SCENE 6: DECISION SUPPORT (42.0s - 52.0s)
    // -------------------------------------------------------------
    if (t >= 42.0 && t < 52.0) {
      const p = (t - 42.0) / 10.0

      // Dashboard Header
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 36px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Executive Command & Decision Support Center', W / 2, 110)

      ctx.fillStyle = '#eddcf7'
      ctx.font = '400 16px "Inter", sans-serif'
      ctx.fillText('Empowering city operators with verifiable intelligence and coordinated multi-agency response', W / 2, 150)

      // 4 Metric KPI Cards
      const metrics = [
        { title: 'ACTIVE INCIDENTS', val: '14', sub: 'Terpantau Real-Time', color: '#cc4117' },
        { title: 'VERIFIED REPORTS', val: '42', sub: '+12 Valid Hari Ini', color: '#007a5a' },
        { title: 'CCTV MONITORED', val: '70', sub: 'PantauSemar 100% Aktif', color: '#1264a3' },
        { title: 'POLDER STATIONS', val: '5/5', sub: 'Sringin & Tenggang Beroperasi', color: '#4a154b' },
      ]

      const mCardW = 420
      const mStartX = W / 2 - (4 * mCardW + 3 * 24) / 2
      metrics.forEach((m, idx) => {
        const mx = mStartX + idx * (mCardW + 24)
        const my = 200

        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = 'rgba(230, 230, 230, 0.8)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.roundRect(mx, my, mCardW, 140, 16)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = m.color
        ctx.font = '700 12px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(m.title, mx + 24, my + 36)

        ctx.fillStyle = '#1d1d1d'
        ctx.font = '700 42px "Inter", sans-serif'
        ctx.fillText(m.val, mx + 24, my + 88)

        ctx.fillStyle = '#696969'
        ctx.font = '400 13px "Inter", sans-serif'
        ctx.fillText(m.sub, mx + 24, my + 118)
      })

      // Incident State Lifecycle Progression
      const lifeY = 380
      const lifeW = 1752
      const lifeX = W / 2 - lifeW / 2

      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = 'rgba(74, 21, 75, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(lifeX, lifeY, lifeW, 200, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#4a154b'
      ctx.font = '700 18px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('PROSES STATUS INSIDEN: JL. SUPRIYADI (PEDURUNGAN)', lifeX + 36, lifeY + 42)

      const stages = [
        { label: 'REPORTED', sub: 'Laporan Diterima (14:24)', activeAt: 0.1 },
        { label: 'ANALYZING', sub: 'Korelasi CCTV (14:25)', activeAt: 0.35 },
        { label: 'VERIFIED', sub: 'Tervalidasi 89.4% (14:26)', activeAt: 0.6 },
        { label: 'RESPONSE DISPATCHED', sub: 'Tim Reaksi Cepat Bergerak (14:28)', activeAt: 0.85 },
      ]

      const stW = 360
      const stStartX = lifeX + 60
      stages.forEach((st, sidx) => {
        const sx = stStartX + sidx * (stW + 40)
        const sy = lifeY + 80
        const isPassed = p >= st.activeAt

        // Step Box
        ctx.fillStyle = isPassed ? (sidx === 3 ? '#ebf7f3' : '#f9f0ff') : '#f8f8f8'
        ctx.strokeStyle = isPassed ? (sidx === 3 ? '#007a5a' : '#4a154b') : '#e6e6e6'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(sx, sy, stW, 80, 12)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = isPassed ? (sidx === 3 ? '#007a5a' : '#4a154b') : '#999'
        ctx.font = '700 15px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`${isPassed ? '✓ ' : ''}${st.label}`, sx + 20, sy + 34)

        ctx.fillStyle = '#696969'
        ctx.font = '400 13px "Inter", sans-serif'
        ctx.fillText(st.sub, sx + 20, sy + 58)

        // Arrow between stages
        if (sidx < stages.length - 1) {
          ctx.fillStyle = isPassed ? '#4a154b' : '#ccc'
          ctx.font = '700 20px "Inter", sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('➔', sx + stW + 20, sy + 46)
        }
      })

      // Actionable Decision Dispatch Card
      const actY = 610
      const actW = 1752
      const actX = W / 2 - actW / 2

      ctx.fillStyle = '#fdf9ff'
      ctx.strokeStyle = '#4a154b'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(actX, actY, actW, 330, 20)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#4a154b'
      ctx.font = '700 20px "Inter", sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('REKOMENDASI AKSI & DISPOSISI OPERASIONAL KOTA', actX + 36, actY + 48)

      // 3 Action Columns
      const actions = [
        {
          agency: 'BPBD KOTA SEMARANG',
          title: 'Aktivasi Posko Darurat Pedurungan',
          desc: 'Evakuasi warga rentan dan pemasangan rambu peringatan genangan di titik Supriyadi.',
          status: 'TERKIRIM (DISPATCHED)',
          color: '#cc4117'
        },
        {
          agency: 'DPUPR KOTA SEMARANG',
          title: 'Operasional Pompa Mobile & Polder',
          desc: 'Pengalihan debit air menuju Polder Tenggang dan pembukaan pintu saluran sekunder.',
          status: 'SEDANG BERJALAN',
          color: '#1264a3'
        },
        {
          agency: 'DISHUB KOTA SEMARANG',
          title: 'Manajemen Lalu Lintas Terpadu',
          desc: 'Pengalihan arus kendaraan dari arah Jl. Majapahit menuju koridor bebas genangan.',
          status: 'TERJADWAL',
          color: '#007a5a'
        },
      ]

      const aW = (actW - 72 - 48) / 3
      actions.forEach((act, aidx) => {
        const ax = actX + 36 + aidx * (aW + 24)
        const ay = actY + 84

        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = 'rgba(74, 21, 75, 0.2)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.roundRect(ax, ay, aW, 210, 16)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = act.color
        ctx.font = '700 12px "Inter", sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(act.agency, ax + 20, ay + 34)

        ctx.fillStyle = '#1d1d1d'
        ctx.font = '700 16px "Inter", sans-serif'
        ctx.fillText(act.title, ax + 20, ay + 68)

        ctx.fillStyle = '#696969'
        ctx.font = '400 13px "Inter", sans-serif'
        // Wrap text
        ctx.fillText(act.desc.slice(0, 42), ax + 20, ay + 104)
        ctx.fillText(act.desc.slice(42), ax + 20, ay + 124)

        // Status badge
        ctx.fillStyle = '#f0f0f0'
        ctx.beginPath()
        ctx.roundRect(ax + 20, ay + 154, 180, 28, 6)
        ctx.fill()
        ctx.fillStyle = act.color
        ctx.font = '700 11px "Inter", sans-serif'
        ctx.fillText(`● ${act.status}`, ax + 32, ay + 172)
      })
    }

    // -------------------------------------------------------------
    // SCENE 7: CLOSING & CALL TO ACTION (52.0s - 56.0s)
    // -------------------------------------------------------------
    if (t >= 52.0 && t <= 56.0) {
      const p = (t - 52.0) / 4.0
      const fadeOut = p > 0.85 ? (1.0 - p) / 0.15 : 1.0

      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, fadeOut))

      // Central Backdrop Glow
      const endGlow = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 600)
      endGlow.addColorStop(0, 'rgba(128, 40, 133, 0.4)')
      endGlow.addColorStop(0.6, 'rgba(74, 21, 75, 0.2)')
      endGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = endGlow
      ctx.fillRect(0, 0, W, H)

      // Emblem
      const embSize = 96
      ctx.fillStyle = '#4a154b'
      ctx.strokeStyle = '#eddcf7'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(W / 2 - embSize / 2, H / 2 - 180, embSize, embSize, 24)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#007a5a'
      ctx.beginPath()
      ctx.arc(W / 2, H / 2 - 132, 16, 0, Math.PI * 2)
      ctx.fill()

      // Brand Title
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 72px "Inter", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('KotaKu Siaga', W / 2, H / 2 - 20)

      // Primary Purpose
      ctx.fillStyle = '#eddcf7'
      ctx.font = '500 24px "Inter", sans-serif'
      ctx.fillText('"Turning real-world events into actionable intelligence."', W / 2, H / 2 + 36)

      // Signature Three Words
      ctx.fillStyle = '#ffffff'
      ctx.font = '800 32px "Inter", sans-serif'
      ctx.fillText('Monitor.   Verify.   Respond.', W / 2, H / 2 + 100)

      // Footer Badges
      ctx.fillStyle = 'rgba(244, 237, 228, 0.5)'
      ctx.font = '500 14px "Inter", sans-serif'
      ctx.fillText('KotaKu Siaga Platform • Inovasi Teknologi Tanggap Iklim Kota Semarang', W / 2, H / 2 + 170)

      ctx.restore()
    }
  }, [])

  // Animation Loop
  useEffect(() => {
    let animationId: number

    const tick = (timestamp: number) => {
      if (!lastTimestampRef.current) lastTimestampRef.current = timestamp
      const delta = (timestamp - lastTimestampRef.current) / 1000
      lastTimestampRef.current = timestamp

      if (isPlayingRef.current) {
        currentTimeRef.current += delta
        if (currentTimeRef.current >= TOTAL_DURATION) {
          currentTimeRef.current = TOTAL_DURATION
          isPlayingRef.current = false
          setIsPlaying(false)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
          }
        }
        setCurrentTime(currentTimeRef.current)
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          drawFrame(ctx, currentTimeRef.current)
        }
      }

      animationId = requestAnimationFrame(tick)
    }

    animationId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationId)
  }, [drawFrame])

  // Play / Pause Handlers
  const handlePlayPause = () => {
    initAudio()
    const nextState = !isPlaying
    isPlayingRef.current = nextState
    setIsPlaying(nextState)
    lastTimestampRef.current = performance.now()
    playCueSound(520, 'sine', 0.1)
  }

  const handleRestart = () => {
    initAudio()
    currentTimeRef.current = 0
    setCurrentTime(0)
    isPlayingRef.current = true
    setIsPlaying(true)
    lastTimestampRef.current = performance.now()
    playCueSound(660, 'sine', 0.15)
  }

  const handleSeek = (timeSec: number) => {
    currentTimeRef.current = Math.max(0, Math.min(TOTAL_DURATION, timeSec))
    setCurrentTime(currentTimeRef.current)
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) drawFrame(ctx, currentTimeRef.current)
    }
  }

  // Automatic High-Def Video Recorder using MediaRecorder
  const startRecording = async () => {
    if (!canvasRef.current) return
    initAudio()

    try {
      setIsRecording(true)
      setStatusMessage('Perekaman 1080p 60FPS dimulai...')
      recordedChunksRef.current = []

      // 60 FPS stream directly from high-resolution canvas
      const stream = canvasRef.current.captureStream(60)

      // Add audio track if audioCtx exists
      if (audioCtxRef.current && masterGainRef.current) {
        const dest = audioCtxRef.current.createMediaStreamDestination()
        masterGainRef.current.connect(dest)
        const audioTrack = dest.stream.getAudioTracks()[0]
        if (audioTrack) stream.addTrack(audioTrack)
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high-quality
      })

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        setIsRecording(false)
        setStatusMessage('Perekaman selesai! Siap diunduh.')

        // Automatically upload to server save endpoint
        try {
          const formData = new FormData()
          formData.append('video', blob, 'kotaku-siaga-presentation.webm')
          formData.append('filename', 'kotaku-siaga-presentation.webm')
          await fetch('/api/video/save', { method: 'POST', body: formData })
          setStatusMessage('Video tersimpan di server & siap diunduh!')
        } catch {
          // ignore error
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000)

      // Restart timeline from 0 and play
      currentTimeRef.current = 0
      setCurrentTime(0)
      isPlayingRef.current = true
      setIsPlaying(true)
      lastTimestampRef.current = performance.now()
    } catch (err: any) {
      setIsRecording(false)
      setStatusMessage(`Gagal merekam: ${err?.message || 'Error'}`)
    }
  }

  // Stop recording manually
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  // Auto trigger if URL contains ?record=1 or ?autoplay=1
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('record') === '1') {
      const t = setTimeout(() => {
        startRecording()
      }, 1200)
      return () => clearTimeout(t)
    } else if (params.get('autoplay') === '1') {
      const t = setTimeout(() => {
        handlePlayPause()
      }, 600)
      return () => clearTimeout(t)
    }
  }, [])

  // Find Current Active Scene
  const currentScene = SCENES.find((s) => currentTime >= s.start && currentTime < s.end) || SCENES[SCENES.length - 1]

  return (
    <div className="min-h-screen bg-[#130315] text-[#f4ede4] flex flex-col items-center select-none font-sans">
      {/* Top Navigation Bar */}
      <header className="w-full h-16 border-b border-[#360f38] bg-[#1f0621]/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#eddcf7] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#360f38] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal
          </Link>
          <div className="h-4 w-px bg-[#360f38]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4a154b] flex items-center justify-center text-white font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-[#eddcf7]" />
            </div>
            <span className="font-bold text-white tracking-tight">KotaKu Siaga</span>
            <span className="text-[11px] bg-[#360f38] text-[#eddcf7] px-2 py-0.5 rounded-full font-semibold">
              Opening Presentation Video Engine
            </span>
          </div>
        </div>

        {/* Status Chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-[#2b0b2c] border border-[#4a154b] px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse" />
            <span className="text-[#eddcf7]">{statusMessage}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-[#2b0b2c] hover:bg-[#360f38] border border-[#4a154b] text-[#eddcf7] transition-colors"
            title={isMuted ? 'Aktifkan Audio Ambient' : 'Matikan Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#007a5a]" />}
          </button>

          {/* Download Video Button */}
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download="kotaku-siaga-presentation.webm"
              className="flex items-center gap-2 text-xs font-bold bg-[#007a5a] hover:bg-[#008f6b] text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Unduh Video (1080p WebM)
            </a>
          ) : (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-[#cc4117] text-white animate-pulse'
                  : 'bg-[#4a154b] hover:bg-[#611f69] text-white border border-[#eddcf7]/30'
              }`}
            >
              <Camera className="w-4 h-4" />
              {isRecording ? 'Hentikan Perekaman' : 'Rekam Video 1080p'}
            </button>
          )}
        </div>
      </header>

      {/* Main Canvas Viewport Area */}
      <main className="flex-1 w-full max-w-[1440px] flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-[#360f38] shadow-[0_20px_60px_rgba(0,0,0,0.7)] bg-black">
          {/* 1920 x 1080 High-Res Native Canvas */}
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handlePlayPause}
          />

          {/* Overlay Big Play Button if paused at start */}
          {!isPlaying && currentTime < 0.2 && (
            <div
              onClick={handlePlayPause}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center cursor-pointer group"
            >
              <div className="w-24 h-24 rounded-full bg-[#4a154b]/90 group-hover:bg-[#611f69] border border-[#eddcf7]/40 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                <Play className="w-10 h-10 text-white fill-white translate-x-1" />
              </div>
              <p className="mt-4 text-sm font-semibold text-white tracking-wide">
                Klik untuk Memulai Presentasi (56 Detik)
              </p>
            </div>
          )}

          {/* Recording Badge */}
          {isRecording && (
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white" />
              REC • 1080p 60 FPS
            </div>
          )}
        </div>

        {/* Timeline & Control Deck */}
        <div className="w-full mt-5 bg-[#1f0621]/90 border border-[#360f38] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
          {/* Progress Slider */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#eddcf7] w-12 text-right">
              {currentTime.toFixed(1)}s
            </span>
            <div className="relative flex-1 group">
              <input
                type="range"
                min={0}
                max={TOTAL_DURATION}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#360f38] rounded-lg appearance-none cursor-pointer accent-[#eddcf7]"
              />
              {/* Scene Milestone Dots */}
              {SCENES.map((scene) => (
                <div
                  key={scene.id}
                  style={{ left: `${(scene.start / TOTAL_DURATION) * 100}%` }}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#eddcf7]/40 pointer-events-none"
                />
              ))}
            </div>
            <span className="text-xs font-mono text-[#eddcf7]/60 w-12">
              {TOTAL_DURATION.toFixed(1)}s
            </span>
          </div>

          {/* Controls Bar & Scene Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayPause}
                className="w-11 h-11 rounded-xl bg-[#4a154b] hover:bg-[#611f69] text-white flex items-center justify-center transition-colors shadow-md"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white translate-x-0.5" />}
              </button>
              <button
                onClick={handleRestart}
                className="p-2.5 rounded-xl bg-[#2b0b2c] hover:bg-[#360f38] text-[#eddcf7] border border-[#4a154b] transition-colors"
                title="Ulangi dari Awal"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="ml-2 flex flex-col">
                <span className="text-xs font-bold text-white">
                  {currentScene.name} : {currentScene.title}
                </span>
                <span className="text-[11px] text-[#eddcf7]/60">
                  {currentScene.description}
                </span>
              </div>
            </div>

            {/* Quick Scene Jump Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {SCENES.map((s) => {
                const isCurrent = currentTime >= s.start && currentTime < s.end
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSeek(s.start)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isCurrent
                        ? 'bg-[#eddcf7] text-[#4a154b] shadow-sm font-bold scale-105'
                        : 'bg-[#2b0b2c] hover:bg-[#360f38] text-[#eddcf7]/80'
                    }`}
                  >
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Narrative Context Guide for Presenter */}
        <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#1a051c] border border-[#360f38]/60">
            <h4 className="text-xs font-bold text-[#eddcf7] uppercase tracking-wider mb-1">
              1. Storytelling Alur Sistem
            </h4>
            <p className="text-xs text-[#eddcf7]/70 leading-relaxed">
              Video menjelaskan masalah fragmentasi data, integrasi 70 titik CCTV PantauSemar, pipa validasi multi-sinyal, hingga rekomendasi respon cepat BPBD & DPUPR.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1a051c] border border-[#360f38]/60">
            <h4 className="text-xs font-bold text-[#eddcf7] uppercase tracking-wider mb-1">
              2. Standar Presentasi Kampus / Profesional
            </h4>
            <p className="text-xs text-[#eddcf7]/70 leading-relaxed">
              Desain konsisten dengan tema Aubergine `#4a154b` dan Cream `#f4ede4`. Tanpa efek glitch murahan atau template SaaS generik.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1a051c] border border-[#360f38]/60">
            <h4 className="text-xs font-bold text-[#eddcf7] uppercase tracking-wider mb-1">
              3. Ekspor & Pemutaran Video
            </h4>
            <p className="text-xs text-[#eddcf7]/70 leading-relaxed">
              Gunakan tombol <strong>Rekam Video 1080p</strong> untuk mengekspor rekaman WebM/MP4 resolusi tinggi, atau putar langsung dalam mode fullscreen saat presentasi.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
