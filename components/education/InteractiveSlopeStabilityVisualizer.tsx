'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Mountain,
  Play,
  Pause,
  RotateCcw,
  Info,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Activity,
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'

export interface SlopeStageData {
  hours: number
  stageName: string
  soilState: string
  soilMoisturePct: number
  porePressureU: number // kPa
  effectiveStress: number // kPa
  shearStrength: number // kPa
  drivingStress: number // kPa
  safetyFactor: number // FS = shearStrength / drivingStress
  riskLevel: 'Rendah' | 'Aman Terkendali' | 'Waspada' | 'Kritis Bahaya'
  riskColor: string
  massLoadStatus: string
  massLoadPct: number
  desc: string
  scientificMechanism: string
}

const SLOPE_STAGES: SlopeStageData[] = [
  {
    hours: 0,
    stageName: 'KONDISI ALAMI',
    soilState: 'Kadar Air Alami (30%)',
    soilMoisturePct: 30,
    porePressureU: 0.1,
    effectiveStress: 145,
    shearStrength: 98,
    drivingStress: 42,
    safetyFactor: 2.33,
    riskLevel: 'Rendah',
    riskColor: '#007a5a',
    massLoadStatus: 'Beban Alami (Ringan)',
    massLoadPct: 25,
    desc: 'Kohesi antar butiran tanah lempung sangat kuat. Rongga pori sebagian besar terisi udara. Jalinan akar vegetasi mengikat lapisan tanah atas dengan batuan dasar secara optimal.',
    scientificMechanism: 'Tegangan efektif tinggi (σ\' = σ - u ≈ σ). Kekuatan geser tanah jauh melampaui gaya dorong gravitasi (FS > 2.0).',
  },
  {
    hours: 3,
    stageName: 'INFILTRASI AWAL',
    soilState: 'Kadar Air Meningkat (50%)',
    soilMoisturePct: 50,
    porePressureU: 8.5,
    effectiveStress: 132,
    shearStrength: 84,
    drivingStress: 55,
    safetyFactor: 1.53,
    riskLevel: 'Aman Terkendali',
    riskColor: '#007a5a',
    massLoadStatus: 'Beban Bertambah (Sedang)',
    massLoadPct: 50,
    desc: 'Air hujan mulai meresap ke dalam lapisan pori tanah atas. Berat volume tanah bertambah karena air mengisi sebagian rongga pori. Sulingan pipa penahan talud (weep holes) mulai meneteskan rembesan.',
    scientificMechanism: 'Air meresap secara gravitasi ke zona tak jenuh (vadose zone). Tegangan geser meningkat namun lereng masih dalam batas stabil (FS > 1.5).',
  },
  {
    hours: 8,
    stageName: 'TANAH JENUH AIR',
    soilState: 'Titik Jenuh Tercapai (85%)',
    soilMoisturePct: 85,
    porePressureU: 28.0,
    effectiveStress: 88,
    shearStrength: 52,
    drivingStress: 76,
    safetyFactor: 1.15,
    riskLevel: 'Waspada',
    riskColor: '#d97706',
    massLoadStatus: 'Beban Berat (Jenuh Air)',
    massLoadPct: 82,
    desc: 'Beban massa lereng bertambah berat ratusan kilogram per meter kubik. Rongga pori tanah hampir seluruhnya terisi air. Tekanan air pori (u) mulai mendesak partikel tanah dan mengurangi gesekan antar butir.',
    scientificMechanism: 'Kenaikan muka air tanah lokal (perched water table). Tekanan pori positif mengurangi tegangan normal efektif (Mohr-Coulomb: τ = c + (σ - u)tan φ).',
  },
  {
    hours: 18,
    stageName: 'TEKANAN AIR PORI TINGGI',
    soilState: 'Tanah Melampaui Batas Plastis (98%)',
    soilMoisturePct: 98,
    porePressureU: 52.0,
    effectiveStress: 35,
    shearStrength: 28,
    drivingStress: 95,
    safetyFactor: 0.82,
    riskLevel: 'Kritis Bahaya',
    riskColor: '#cc4117',
    massLoadStatus: 'Beban Kritis (Sangat Berat)',
    massLoadPct: 98,
    desc: 'Tekanan air dalam rongga pori menolak butir tanah untuk saling mengikat. Gaya normal efektif runtuh mendekati titik kritis. Bidang gelincir aktif dan lereng berada di ambang keruntuhan geser.',
    scientificMechanism: 'Gaya pendorong gravitasi (T) melebihi gaya penahan geser (τ). Faktor Keamanan FS < 1.0 (Ambang kegagalan struktur lereng).',
  },
]

export function InteractiveSlopeStabilityVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState<number>(2) // default: waspada
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const current = SLOPE_STAGES[selectedIdx]

  // Auto-cycling timer if user wants continuous educational playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSelectedIdx((prev) => (prev + 1) % SLOPE_STAGES.length)
      }, 5000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  const togglePlay = () => {
    setIsPlaying((prev) => !prev)
  }

  const handleSelectStage = (idx: number) => {
    setIsPlaying(false) // pause auto cycle when user manually interacts
    setSelectedIdx(idx)
  }

  // Animation intensity classes
  const isReduced = false

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-xs font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <Mountain className="w-4 h-4 text-[#d97706]" />
            Mekanika Tanah & Kestabilan Lereng Perbukitan
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d] tracking-tight">
            Dinamika Longsor: Pengaruh Hujan terhadap Tekanan Air Pori & Beban Massa
          </h3>
          <p className="text-xs text-[#696969] mt-0.5 max-w-3xl leading-relaxed">
            Menjelaskan sains geoteknik di balik kerentanan lereng terjal perbukitan Semarang Selatan (Gombel, Candisari, Banyumanik, Tembalang) saat mengalami infiltrasi air hujan kumulatif.
          </p>
        </div>

        {/* Playback Controls & Info Chip */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f4ede4] border border-[#e6e6e6] text-[11px] font-mono text-[#4a154b]">
            <Info className="w-3.5 h-3.5 text-[#4a154b]" />
            <span>Visualisasi Konseptual Geoteknik</span>
          </div>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Jeda Simulasi' : 'Putar Simulasi'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4a154b] hover:bg-[#611f69] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Putar Otomatis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Cumulative Rainfall Duration Selector (Interactive Tabs) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1d1d1d]">
            Pilih Durasi Hujan Kumulatif di Wilayah Lereng:
          </span>
          <span className="text-[11px] font-mono text-[#696969]">
            Tahap {selectedIdx + 1} dari {SLOPE_STAGES.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SLOPE_STAGES.map((s, idx) => {
            const isSelected = idx === selectedIdx
            return (
              <button
                key={s.hours}
                type="button"
                onClick={() => handleSelectStage(idx)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#f9f0ff] border-[#4a154b] ring-2 ring-[#4a154b]/20 shadow-xs'
                    : 'bg-white border-[#e6e6e6] hover:bg-[#f4ede4]/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono font-bold text-[#4a154b]">
                    {s.hours === 0 ? 'Kondisi Awal' : `Hujan +${s.hours} Jam`}
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.riskColor }}
                  />
                </div>
                <span className="font-bold text-xs text-[#1d1d1d] mt-1.5">{s.stageName}</span>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0f0f0] text-[10px] font-mono">
                  <span className="text-[#696969]">Kadar Air:</span>
                  <span className="font-bold text-[#1d1d1d]">{s.soilMoisturePct}%</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Main Visual Cross-Section Stage */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#17051a] text-white border border-[#3b123e] flex flex-col xl:flex-row items-stretch justify-between gap-6 shadow-inner">
        {/* Left / Main: Dynamic SVG Cross-Section */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#eddcf7]">
                Profil Mekanika Lereng (Kemiringan 30°)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#d9bdde]">
                Sudut Stabilisasi Alami
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-bold px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: current.riskColor, color: '#fff' }}
              >
                {selectedIdx === 0 && <ShieldCheck className="w-3.5 h-3.5" />}
                {selectedIdx === 1 && <ShieldCheck className="w-3.5 h-3.5" />}
                {selectedIdx === 2 && <AlertTriangle className="w-3.5 h-3.5" />}
                {selectedIdx === 3 && <ShieldAlert className="w-3.5 h-3.5" />}
                <span>STATUS RISIKO: {current.riskLevel.toUpperCase()}</span>
              </span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="relative w-full h-64 sm:h-72 rounded-xl bg-[#0d010e] border border-white/15 overflow-hidden flex items-center justify-center">
            {/* Embedded CSS for crisp mechanical animations without external assets */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes rainFall {
                0% { stroke-dashoffset: 60; opacity: 0.1; }
                40% { opacity: 0.9; }
                100% { stroke-dashoffset: 0; opacity: 0.2; }
              }
              @keyframes seepInfiltration {
                0% { stroke-dashoffset: 30; opacity: 0.2; }
                50% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 0.3; }
              }
              @keyframes gravityPulse {
                0%, 100% { opacity: 0.65; transform: scaleY(1); }
                50% { opacity: 1; transform: scaleY(1.06); }
              }
              @keyframes poreWaterExpand {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.18); }
              }
              @keyframes weepingDrop {
                0% { transform: translateY(0); opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(24px); opacity: 0; }
              }
              .rain-stream {
                stroke: #38bdf8;
                stroke-width: 1.5;
                stroke-dasharray: 12 18;
                animation: rainFall 1.6s linear infinite;
              }
              .rain-stream-dense {
                stroke: #38bdf8;
                stroke-width: 2;
                stroke-dasharray: 14 14;
                animation: rainFall 1.1s linear infinite;
              }
              .seep-arrow {
                stroke: #60a5fa;
                stroke-width: 1.75;
                stroke-dasharray: 6 6;
                animation: seepInfiltration 2.2s linear infinite;
              }
              .gravity-vector {
                transform-origin: 320px 140px;
                animation: gravityPulse 2.8s ease-in-out infinite;
              }
              .weep-particle {
                animation: weepingDrop 1.8s ease-in infinite;
              }
            ` }} />

            <svg
              viewBox="0 0 620 300"
              className="w-full h-full select-none"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Visualisasi mekanika lereng 30 derajat pada kondisi ${current.stageName}`}
            >
              <defs>
                {/* Gradients for geological layers */}
                <linearGradient id="bedrockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#252a36" />
                  <stop offset="100%" stopColor="#11141c" />
                </linearGradient>

                <linearGradient id="soilDryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#854d0e" />
                  <stop offset="100%" stopColor="#5c3810" />
                </linearGradient>

                <linearGradient id="soilMoistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#713f12" />
                  <stop offset="100%" stopColor="#452408" />
                </linearGradient>

                <linearGradient id="soilSatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#451a03" />
                  <stop offset="100%" stopColor="#2c1103" />
                </linearGradient>

                <linearGradient id="soilCritGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b1103" />
                  <stop offset="100%" stopColor="#1f0902" />
                </linearGradient>

                {/* Arrow Markers */}
                <marker
                  id="arrowDown"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#facc15" />
                </marker>

                <marker
                  id="arrowDriving"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={current.riskColor} />
                </marker>

                <marker
                  id="arrowResist"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
                </marker>
              </defs>

              {/* 1. ATMOSPHERIC RAIN (Conditional based on stage) */}
              {selectedIdx === 1 && (
                <g className="opacity-75">
                  <line x1="200" y1="10" x2="180" y2="70" className="rain-stream" />
                  <line x1="320" y1="10" x2="300" y2="70" className="rain-stream" />
                  <line x1="440" y1="10" x2="420" y2="70" className="rain-stream" />
                  <line x1="530" y1="10" x2="510" y2="70" className="rain-stream" />
                </g>
              )}
              {selectedIdx === 2 && (
                <g>
                  <line x1="160" y1="10" x2="140" y2="80" className="rain-stream-dense" />
                  <line x1="240" y1="5" x2="220" y2="75" className="rain-stream-dense" />
                  <line x1="320" y1="10" x2="300" y2="80" className="rain-stream-dense" />
                  <line x1="400" y1="5" x2="380" y2="75" className="rain-stream-dense" />
                  <line x1="480" y1="10" x2="460" y2="80" className="rain-stream-dense" />
                  <line x1="560" y1="5" x2="540" y2="75" className="rain-stream-dense" />
                </g>
              )}
              {selectedIdx === 3 && (
                <g>
                  <line x1="140" y1="5" x2="120" y2="85" className="rain-stream-dense" />
                  <line x1="200" y1="5" x2="180" y2="85" className="rain-stream-dense" />
                  <line x1="260" y1="5" x2="240" y2="85" className="rain-stream-dense" />
                  <line x1="320" y1="5" x2="300" y2="85" className="rain-stream-dense" />
                  <line x1="380" y1="5" x2="360" y2="85" className="rain-stream-dense" />
                  <line x1="440" y1="5" x2="420" y2="85" className="rain-stream-dense" />
                  <line x1="500" y1="5" x2="480" y2="85" className="rain-stream-dense" />
                  <line x1="560" y1="5" x2="540" y2="85" className="rain-stream-dense" />
                </g>
              )}

              {/* 2. BASE ROCK (Batuan Dasar Kokoh) */}
              {/* True 30° geometry: dx=360, dy=208 -> tan(30°) = 0.577 */}
              <polygon
                points="40,260 580,260 580,140 180,240 40,260"
                fill="url(#bedrockGrad)"
                stroke="#334155"
                strokeWidth="1.5"
              />
              <text x="380" y="245" fill="#64748b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                BATUAN DASAR KEDAP (BEDROCK)
              </text>

              {/* 3. POTENTIAL SLIP SURFACE (Bidang Gelincir Potensial) */}
              <line
                x1="80"
                y1="240"
                x2="520"
                y2="76"
                stroke={selectedIdx >= 2 ? current.riskColor : '#10b981'}
                strokeWidth={selectedIdx >= 2 ? '3.5' : '2'}
                strokeDasharray="8,5"
                className="transition-colors"
              />
              <text
                x="430"
                y="115"
                fill={selectedIdx >= 2 ? '#fca5a5' : '#86efac'}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                transform="rotate(-21 430 115)"
              >
                BIDANG GELINCIR (SLIP PLANE)
              </text>

              {/* 4. SOIL COLLUVIUM MASS (Lapisan Tanah Penutup di Atas Bidang Gelincir) */}
              <polygon
                points="80,240 440,32 580,32 580,140 180,240 80,240"
                fill={
                  selectedIdx === 0
                    ? 'url(#soilDryGrad)'
                    : selectedIdx === 1
                    ? 'url(#soilMoistGrad)'
                    : selectedIdx === 2
                    ? 'url(#soilSatGrad)'
                    : 'url(#soilCritGrad)'
                }
                stroke="#475569"
                strokeWidth="1"
              />

              {/* 5. 30° SLOPE ANGLE MARKER & BASELINE */}
              {/* Baseline indicator */}
              <line x1="40" y1="240" x2="160" y2="240" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
              {/* Arc for 30 degrees */}
              <path
                d="M 120 240 A 40 40 0 0 0 114.6 220"
                fill="none"
                stroke="#facc15"
                strokeWidth="1.5"
              />
              <text x="128" y="232" fill="#facc15" fontSize="11" fontFamily="monospace" fontWeight="bold">
                30°
              </text>

              {/* 6. SUBSURFACE INFILTRATION PLUMES (When rain occurs) */}
              {selectedIdx >= 1 && (
                <g>
                  <line x1="220" y1="130" x2="205" y2="175" className="seep-arrow" />
                  <line x1="330" y1="75" x2="315" y2="120" className="seep-arrow" />
                  <line x1="440" y1="45" x2="425" y2="90" className="seep-arrow" />
                  <text x="235" y="160" fill="#93c5fd" fontSize="9" fontFamily="monospace">
                    Infiltrasi Air
                  </text>
                </g>
              )}

              {/* 7. SOIL PORES MATRIX (Visual Pori Tanah Terisi Air) */}
              {/* Embedded micro-zoom circle container */}
              <g transform="translate(480, 75)">
                <circle cx="28" cy="28" r="30" fill="#110313" stroke="#eddcf7" strokeWidth="1.5" strokeOpacity="0.4" />
                <text x="28" y="-6" textAnchor="middle" fill="#eddcf7" fontSize="8" fontFamily="monospace" fontWeight="bold">
                  MIKRO PORI TANAH
                </text>

                {/* Soil Grain Particles (Brown Disks) */}
                <circle cx="15" cy="16" r="8" fill="#a16207" />
                <circle cx="40" cy="18" r="7.5" fill="#a16207" />
                <circle cx="26" cy="38" r="8.5" fill="#a16207" />

                {/* Pore Void Water Indicator */}
                {selectedIdx === 0 && (
                  // Dry voids (Air Only)
                  <circle cx="27" cy="24" r="4.5" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                )}
                {selectedIdx === 1 && (
                  // Partially moist void
                  <circle cx="27" cy="24" r="5" fill="#38bdf8" fillOpacity="0.55" />
                )}
                {selectedIdx === 2 && (
                  // Saturated void with outward pore pressure
                  <g>
                    <circle cx="27" cy="24" r="6.5" fill="#0284c7" fillOpacity="0.85" />
                    {/* Outward pressure arrows */}
                    <line x1="27" y1="18" x2="27" y2="14" stroke="#67e8f9" strokeWidth="1" />
                    <line x1="27" y1="30" x2="27" y2="34" stroke="#67e8f9" strokeWidth="1" />
                  </g>
                )}
                {selectedIdx === 3 && (
                  // Critical pore water pressure pushing grains apart
                  <g>
                    <circle cx="27" cy="24" r="8" fill="#0369a1" fillOpacity="0.95" />
                    <circle cx="27" cy="24" r="11" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,3" />
                  </g>
                )}
              </g>

              {/* 8. VEGETATION & ROOT REINFORCEMENT */}
              {/* Trees on the slope surface */}
              {/* Tree 1 */}
              <g transform="translate(180, 165)">
                {/* Trunk */}
                <line x1="0" y1="0" x2="0" y2="-12" stroke="#78350f" strokeWidth="2.5" />
                {/* Foliage */}
                <circle cx="0" cy="-18" r="9" fill="#059669" />
                <circle cx="-5" cy="-16" r="7" fill="#10b981" />
                <circle cx="5" cy="-16" r="7" fill="#047857" />
                {/* Roots penetrating subsoil */}
                <path d="M 0 0 Q -6 10 -10 18 M 0 0 Q 6 12 8 20" fill="none" stroke="#10b981" strokeWidth="1.2" />
              </g>

              {/* Tree 2 */}
              <g transform="translate(300, 95)">
                <line x1="0" y1="0" x2="0" y2="-14" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="0" cy="-20" r="10" fill="#059669" />
                <circle cx="-6" cy="-18" r="8" fill="#10b981" />
                <circle cx="6" cy="-18" r="8" fill="#047857" />
                <path d="M 0 0 Q -8 12 -12 24 M 0 0 Q 7 14 10 26" fill="none" stroke="#10b981" strokeWidth="1.2" />
              </g>

              {/* Tree 3 (Plateau) */}
              <g transform="translate(480, 32)">
                <line x1="0" y1="0" x2="0" y2="-14" stroke="#78350f" strokeWidth="2.5" />
                <circle cx="0" cy="-21" r="11" fill="#059669" />
                <circle cx="-7" cy="-19" r="8.5" fill="#10b981" />
                <circle cx="7" cy="-19" r="8.5" fill="#047857" />
                <path d="M 0 0 Q -6 14 -8 24 M 0 0 Q 8 14 12 22" fill="none" stroke="#10b981" strokeWidth="1.2" />
              </g>

              {/* 9. WEEP HOLE / SULINGAN PIPA TALUD (At slope toe) */}
              <g transform="translate(76, 236)">
                {/* Retaining concrete block */}
                <rect x="0" y="0" width="10" height="24" fill="#64748b" stroke="#334155" strokeWidth="1" />
                {/* PVC pipe */}
                <rect x="2" y="10" width="8" height="4" fill="#0284c7" />
                {/* Weeping water drop */}
                {selectedIdx >= 1 && (
                  <circle cx="1" cy="18" r="2" fill="#38bdf8" className="weep-particle" />
                )}
              </g>

              {/* 10. GEOTECHNICAL FORCE VECTORS */}
              {/* Centroid force diagram at (x=310, y=140) */}
              <g className="gravity-vector">
                {/* Downward Gravity Weight Vector (W = mg) */}
                <line
                  x1="310"
                  y1="130"
                  x2="310"
                  y2={130 + (selectedIdx === 0 ? 35 : selectedIdx === 1 ? 45 : selectedIdx === 2 ? 60 : 75)}
                  stroke="#facc15"
                  strokeWidth="3"
                  markerEnd="url(#arrowDown)"
                />
                <text
                  x="318"
                  y={145 + (selectedIdx * 10)}
                  fill="#fde047"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  GAYA GRAVITASI (W)
                </text>

                {/* Driving Shear Vector (T = W sin 30°) down the slip plane */}
                <line
                  x1="310"
                  y1="130"
                  x2={310 - (20 + (selectedIdx * 14))}
                  y2={130 + (12 + (selectedIdx * 8))}
                  stroke={current.riskColor}
                  strokeWidth="3"
                  markerEnd="url(#arrowDriving)"
                />
                <text
                  x={230 - (selectedIdx * 6)}
                  y={130 + (selectedIdx * 4)}
                  fill={current.riskColor}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  GAYA DORONG (T)
                </text>

                {/* Resisting Shear Strength Vector (tau = c + sigma' tan phi) up the slip plane */}
                <line
                  x1="310"
                  y1="130"
                  x2={310 + (selectedIdx === 0 ? 50 : selectedIdx === 1 ? 40 : selectedIdx === 2 ? 28 : 16)}
                  y2={130 - (selectedIdx === 0 ? 28 : selectedIdx === 1 ? 22 : selectedIdx === 2 ? 15 : 9)}
                  stroke="#10b981"
                  strokeWidth="3"
                  markerEnd="url(#arrowResist)"
                />
                <text
                  x="345"
                  y="108"
                  fill="#6ee7b7"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  KEKUATAN GESER (τ)
                </text>
              </g>

              {/* Failure Shear Dislocation Line (Rendered only on Critical stage) */}
              {selectedIdx === 3 && (
                <path
                  d="M 220 160 Q 240 175 270 190"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
              )}
            </svg>
          </div>

          {/* Description & Scientific Mechanism */}
          <div className="space-y-2 pt-1">
            <p className="text-xs text-[#eddcf7] leading-relaxed">
              {current.desc}
            </p>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#d9bdde] flex items-start gap-2">
              <span className="font-bold text-amber-300 shrink-0">Hukum Fisika:</span>
              <span>{current.scientificMechanism}</span>
            </div>
          </div>
        </div>

        {/* Right: Technical Geotechnical Parameters & Load Gauge */}
        <div className="w-full xl:w-80 bg-white/5 p-4 sm:p-5 rounded-xl border border-white/10 flex flex-col justify-between gap-4 font-mono shrink-0">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-[11px] font-bold text-[#eddcf7] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-300" />
              Parameter Kestabilan Lereng
            </span>
            <span className="text-[10px] text-white/50">ISO 37120</span>
          </div>

          {/* Mass Load Indicator Bar */}
          <div className="space-y-1.5 bg-black/20 p-3 rounded-lg border border-white/5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#a8a8a8]">BEBAN MASSA TANAH:</span>
              <span className="font-bold text-white">{current.massLoadStatus}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${current.massLoadPct}%`,
                  backgroundColor: current.riskColor,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 pt-0.5">
              <span>Alami (Kering)</span>
              <span>Jenuh Maksimum</span>
            </div>
          </div>

          {/* Geotechnical Parameters Grid */}
          <div className="space-y-2.5 text-xs">
            {/* Kadar Air */}
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-[#a8a8a8] text-[10px]">KADAR AIR (w):</span>
              <span className="text-white font-bold">{current.soilMoisturePct}% Volume</span>
            </div>

            {/* Tekanan Air Pori (u) */}
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-[#a8a8a8] text-[10px]">TEKANAN PORI (u):</span>
              <span className="text-amber-300 font-bold">{current.porePressureU} kPa</span>
            </div>

            {/* Tegangan Normal Efektif */}
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-[#a8a8a8] text-[10px]">{"TEGANGAN EFEKTIF (σ'):"}</span>
              <span className="text-sky-300 font-bold">{current.effectiveStress} kPa</span>
            </div>

            {/* Faktor Keamanan (FS) */}
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-[#a8a8a8] text-[10px]">FAKTOR KEAMANAN (FS):</span>
              <span
                className="font-bold text-sm"
                style={{ color: current.riskColor }}
              >
                {current.safetyFactor.toFixed(2)} {current.safetyFactor >= 1.5 ? '(Stabil)' : current.safetyFactor >= 1.0 ? '(Kritis)' : '(Labil)'}
              </span>
            </div>
          </div>

          {/* Scientific Formula Note */}
          <div className="pt-2 border-t border-white/10 text-[10px] text-[#eddcf7]/70 space-y-1">
            <div className="font-bold text-white/90">Formula Mohr-Coulomb:</div>
            <div className="bg-black/30 p-2 rounded text-center text-amber-200 text-[11px] font-mono">
              τ = c + (σ - u) tan(φ)
            </div>
            <p className="text-[9px] text-[#eddcf7]/60 leading-tight pt-0.5">
              Saat air mengisi rongga (u naik), daya lekat butir tanah runtuh sehingga kekuatan geser (τ) melemah.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Visual Legend */}
      <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#1d1d1d]">
        <span className="font-bold text-[#4a154b] uppercase text-[11px]">
          Keterangan Simbol & Elemen Fisika:
        </span>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#a16207]" /> Partikel Butir Tanah
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#0284c7]" /> Air Pori (Pore Water)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#facc15]" /> Gaya Gravitasi (W)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#cc4117] border-b border-dashed" /> Bidang Gelincir (Slip Plane)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#059669]" /> Akar Pengikat Vegetasi
          </span>
        </div>
      </div>
    </div>
  )
}
