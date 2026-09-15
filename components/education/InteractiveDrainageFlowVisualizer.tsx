'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Droplets,
  RotateCcw,
  Play,
  Pause,
  Info,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  CloudRain,
  Activity,
  Waves,
  ArrowRight,
} from 'lucide-react'

export function InteractiveDrainageFlowVisualizer() {
  const [sedimentLevel, setSedimentLevel] = useState<number>(45) // 0 to 80 %
  const [hasTrashBlockage, setHasTrashBlockage] = useState<boolean>(true)
  const [rainfallIntensity, setRainfallIntensity] = useState<number>(35) // mm/h
  const [isPlaying, setIsPlaying] = useState<boolean>(true)

  // 1. Hydraulic Calculations (Illustrative educational model based on Manning's Equation)
  // Effective opening area percentage
  const effectiveOpeningArea = Math.max(8, 100 - sedimentLevel - (hasTrashBlockage ? 30 : 0))
  
  // Hydraulic Water Elevation (% of conduit height)
  const waterLevelHeight = Math.min(
    100,
    Math.round(
      15 + (rainfallIntensity * 0.4) + (sedimentLevel * 0.55) + (hasTrashBlockage ? 25 : 0)
    )
  )

  // Status classification
  const isOverflowing = waterLevelHeight >= 88
  const isRestricted = !isOverflowing && (effectiveOpeningArea <= 45 || waterLevelHeight >= 65)
  const isOptimal = !isOverflowing && !isRestricted

  // Flow velocity status
  const flowVelocityMps = isOverflowing
    ? 0.25
    : isRestricted
    ? 0.65
    : Math.min(2.2, Number((1.2 + (rainfallIntensity * 0.015)).toFixed(2)))

  const handleResetIdeal = () => {
    setSedimentLevel(10)
    setHasTrashBlockage(false)
    setRainfallIntensity(10)
  }

  const handleSetModerate = () => {
    setSedimentLevel(40)
    setHasTrashBlockage(false)
    setRainfallIntensity(35)
  }

  const handleSetCritical = () => {
    setSedimentLevel(70)
    setHasTrashBlockage(true)
    setRainfallIntensity(70)
  }

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-xs font-sans">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <Droplets className="w-4 h-4 text-[#1264a3]" />
            Simulasi Hidrolika Saluran & Sedimentasi
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d] tracking-tight">
            Penampang Melintang Gorong-Gorong Jalan: Saluran Normal vs Tersumbat
          </h3>
          <p className="text-xs text-[#696969] mt-0.5 max-w-3xl leading-relaxed">
            Mempelajari interaksi hidrolika antara intensitas hujan, ketebalan endapan sedimen lumpur, dan sampah inlet terhadap elevasi muka air saluran perkotaan.
          </p>
        </div>

        {/* Play / Preset Control Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f4ede4] border border-[#e6e6e6] text-[11px] font-mono text-[#4a154b]">
            <Info className="w-3.5 h-3.5 text-[#4a154b]" />
            <span>Visualisasi Konseptual Hidrolika</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying((prev) => !prev)}
            aria-label={isPlaying ? 'Jeda Aliran' : 'Putar Aliran'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4a154b] hover:bg-[#611f69] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Jeda Aliran</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Mulai Aliran</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Visual Simulation & Controls Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Cross-Section Visualizer (7 Columns) */}
        <div className="xl:col-span-7 p-5 sm:p-6 rounded-2xl bg-[#130517] text-white flex flex-col justify-between gap-4 border border-[#3b123e] shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#eddcf7]">
              Penampang Melintang Gorong-Gorong Jalan (Cross-Section)
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
                isOverflowing
                  ? 'bg-[#cc4117] text-white'
                  : isRestricted
                  ? 'bg-[#d97706] text-white'
                  : 'bg-[#007a5a] text-white'
              }`}
            >
              {isOverflowing && <ShieldAlert className="w-3.5 h-3.5" />}
              {isRestricted && <AlertTriangle className="w-3.5 h-3.5" />}
              {isOptimal && <ShieldCheck className="w-3.5 h-3.5" />}
              <span>
                {isOverflowing
                  ? 'STATUS: LIMPASAN MELUAP KE JALAN'
                  : isRestricted
                  ? 'STATUS: KAPASITAS TERBATAS (WASPADA)'
                  : 'STATUS: ALIRAN LANCAR & AMAN'}
              </span>
            </span>
          </div>

          {/* Graphical Conduit View (SVG) */}
          <div className="relative w-full h-64 sm:h-72 rounded-xl bg-[#09010a] border border-white/15 overflow-hidden flex flex-col justify-end select-none">
            {/* Embedded CSS for hydrodynamic stream animations */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes laminarFlow {
                0% { stroke-dashoffset: 60; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes slowFlow {
                0% { stroke-dashoffset: 40; }
                100% { stroke-dashoffset: 0; }
              }
              @keyframes backflowRipples {
                0% { stroke-dashoffset: 0; opacity: 0.2; }
                50% { opacity: 0.9; }
                100% { stroke-dashoffset: 40; opacity: 0.2; }
              }
              @keyframes waterSurfaceWave {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-3px); }
              }
              @keyframes floodSpillWave {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 0.95; }
              }
              .stream-fast {
                stroke: #38bdf8;
                stroke-width: 2;
                stroke-dasharray: 12 8;
                animation: ${isPlaying ? 'laminarFlow 1.2s linear infinite' : 'none'};
              }
              .stream-slow {
                stroke: #60a5fa;
                stroke-width: 1.75;
                stroke-dasharray: 8 12;
                animation: ${isPlaying ? 'slowFlow 2.4s linear infinite' : 'none'};
              }
              .stream-backflow {
                stroke: #f87171;
                stroke-width: 2;
                stroke-dasharray: 6 8;
                animation: ${isPlaying ? 'backflowRipples 1.8s linear infinite' : 'none'};
              }
              .water-surface {
                animation: ${isPlaying ? 'waterSurfaceWave 3s ease-in-out infinite' : 'none'};
              }
              .flood-spill {
                animation: ${isPlaying ? 'floodSpillWave 2s ease-in-out infinite' : 'none'};
              }
            ` }} />

            <svg
              viewBox="0 0 640 280"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Visualisasi penampang saluran gorong-gorong dengan muka air ${waterLevelHeight}% dan sedimen ${sedimentLevel}%`}
            >
              <defs>
                <linearGradient id="asphaltGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="culvertWallGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="sedimentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#78350f" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>

                <linearGradient id="waterFlowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
                </linearGradient>

                <marker
                  id="flowArrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* 1. TOP ROAD SURFACE (Elevasi Aspal Jalan Raya) */}
              <rect x="0" y="0" width="640" height="34" fill="url(#asphaltGrad)" />
              {/* Road markings */}
              <line x1="20" y1="17" x2="620" y2="17" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="14 14" strokeOpacity="0.6" />
              <text x="320" y="12" textAnchor="middle" fill="#f8fafc" fontSize="9" fontFamily="monospace" fontWeight="bold">
                ELEVASI ASPAL JALAN RAYA
              </text>

              {/* 2. CULVERT CONDUIT GEOMETRY */}
              {/* Culvert top ceiling slab */}
              <rect x="120" y="34" width="400" height="14" fill="url(#culvertWallGrad)" stroke="#334155" strokeWidth="1" />
              {/* Culvert bottom invert slab */}
              <rect x="120" y="246" width="400" height="14" fill="url(#culvertWallGrad)" stroke="#334155" strokeWidth="1" />
              {/* Culvert interior background void */}
              <rect x="120" y="48" width="400" height="198" fill="#0b020c" />

              {/* Left Inflow Catch Basin Drop Area */}
              <polygon points="0,34 120,34 120,246 0,246" fill="#18041c" stroke="#334155" strokeWidth="1" />
              {/* Right Outflow Channel Area */}
              <polygon points="520,48 640,48 640,246 520,246" fill="#18041c" stroke="#334155" strokeWidth="1" />

              {/* 3. INLET STREET GRATE (Jeruji Saringan Inlet Jalan) */}
              <g transform="translate(90, 34)">
                {/* Grate frame */}
                <rect x="0" y="0" width="30" height="8" fill="#64748b" />
                {/* Vertical steel bars */}
                <line x1="6" y1="0" x2="6" y2="34" stroke="#94a3b8" strokeWidth="2" />
                <line x1="14" y1="0" x2="14" y2="34" stroke="#94a3b8" strokeWidth="2" />
                <line x1="22" y1="0" x2="22" y2="34" stroke="#94a3b8" strokeWidth="2" />
                <text x="15" y="-4" textAnchor="middle" fill="#cbd5e1" fontSize="8" fontFamily="monospace">
                  INLET
                </text>
              </g>

              {/* 4. DYNAMIC WATER LEVEL LAYER */}
              {/* Computed Water Height in SVG: conduit interior is from y=48 to y=246 (total height = 198px) */}
              {(() => {
                const totalConduitH = 198
                const waterH = (waterLevelHeight / 100) * totalConduitH
                const waterTopY = 246 - waterH

                return (
                  <g>
                    {/* Main Water Body in Culvert */}
                    <rect
                      x="0"
                      y={waterTopY}
                      width="640"
                      height={waterH}
                      fill="url(#waterFlowGrad)"
                      className="transition-all duration-300"
                    />

                    {/* Water Surface Line */}
                    <line
                      x1="0"
                      y1={waterTopY}
                      x2="640"
                      y2={waterTopY}
                      stroke="#7dd3fc"
                      strokeWidth="2"
                      className="water-surface transition-all duration-300"
                    />

                    {/* Water Height Metric Label */}
                    <text
                      x="320"
                      y={Math.min(235, waterTopY + 16)}
                      textAnchor="middle"
                      fill="#f0f9ff"
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      MUKA AIR HIDROLIKA: {waterLevelHeight}%
                    </text>

                    {/* 5. HYDRODYNAMIC FLOW STREAMLINES */}
                    {isOptimal && (
                      // Unobstructed Smooth Laminar Flow
                      <g className="stream-fast">
                        <line x1="40" y1={waterTopY + 25} x2="600" y2={waterTopY + 25} />
                        <line x1="60" y1={waterTopY + 45} x2="580" y2={waterTopY + 45} />
                        <line x1="80" y1={waterTopY + 65} x2="560" y2={waterTopY + 65} />
                      </g>
                    )}

                    {isRestricted && (
                      // Restricted Flow
                      <g>
                        <line x1="40" y1={waterTopY + 25} x2="600" y2={waterTopY + 25} className="stream-slow" />
                        <line x1="60" y1={waterTopY + 50} x2="580" y2={waterTopY + 50} className="stream-slow" />
                        <text x="320" y={waterTopY + 38} textAnchor="middle" fill="#fed7aa" fontSize="9" fontFamily="monospace">
                          Arus Melambat Akibat Penyempitan
                        </text>
                      </g>
                    )}

                    {isOverflowing && (
                      // Critical / Severe Obstruction & Backflow
                      <g>
                        {/* Swirling backpressure ripples at inlet */}
                        <line x1="220" y1={waterTopY + 30} x2="50" y2={waterTopY + 30} className="stream-backflow" />
                        <line x1="200" y1={waterTopY + 55} x2="70" y2={waterTopY + 55} className="stream-backflow" />
                        <text x="140" y={waterTopY + 45} textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          ARUS BALIK (BACKWATER)
                        </text>
                      </g>
                    )}

                    {/* 6. ROAD SURFACE SPILL (When Overflowing) */}
                    {isOverflowing && (
                      <g className="flood-spill">
                        <rect x="0" y="20" width="640" height="14" fill="#0284c7" fillOpacity="0.85" />
                        <text x="320" y="30" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="bold">
                          GENANGAN MELUAP DI ATAS BADAN JALAN
                        </text>
                      </g>
                    )}
                  </g>
                )
              })()}

              {/* 7. INLET TRASH & DEBRIS BLOCKAGE (Conditional on hasTrashBlockage) */}
              {hasTrashBlockage && (
                <g transform="translate(80, 60)">
                  {/* Clustered debris mass */}
                  <rect
                    x="0"
                    y="0"
                    width="44"
                    height="120"
                    rx="6"
                    fill="#d97706"
                    fillOpacity="0.85"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  {/* Organic leaf shapes */}
                  <circle cx="16" cy="25" r="5" fill="#78350f" />
                  <circle cx="28" cy="45" r="6" fill="#451a03" />
                  <circle cx="18" cy="70" r="5.5" fill="#78350f" />
                  <circle cx="26" cy="95" r="6.5" fill="#451a03" />
                  <text
                    x="22"
                    y="60"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                    transform="rotate(-90 22 60)"
                  >
                    SAMPAH INLET
                  </text>
                </g>
              )}

              {/* 8. SEDIMENT DEPOSITION LAYER AT BOTTOM */}
              {(() => {
                const totalConduitH = 198
                const sedimentH = (sedimentLevel / 100) * totalConduitH
                const sedimentTopY = 246 - sedimentH

                return (
                  <g>
                    {/* Sediment Mud Mass */}
                    <rect
                      x="0"
                      y={sedimentTopY}
                      width="640"
                      height={sedimentH}
                      fill="url(#sedimentGrad)"
                      className="transition-all duration-300"
                    />
                    {/* Sediment Top Contour */}
                    <line
                      x1="0"
                      y1={sedimentTopY}
                      x2="640"
                      y2={sedimentTopY}
                      stroke="#a16207"
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                    {sedimentLevel > 12 && (
                      <text
                        x="320"
                        y={Math.min(240, sedimentTopY + 14)}
                        textAnchor="middle"
                        fill="#fef08a"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        SEDIMEN LUMPUR: {sedimentLevel}% DASAR SALURAN
                      </text>
                    )}
                  </g>
                )
              })()}

              {/* Directional Flow Indicators */}
              <g transform="translate(560, 110)">
                <line x1="0" y1="0" x2="35" y2="0" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#flowArrow)" />
                <text x="18" y="14" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontFamily="monospace">
                  OUTLET
                </text>
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#eddcf7]/80 pt-2 border-t border-white/10 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#78350f]" /> Sedimen Lumpur Dasar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#d97706]" /> Sampah Organik/Plastik Inlet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#0284c7]" /> Aliran Air Limpasan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#334155]" /> Aspal Jalan Raya
            </span>
          </div>
        </div>

        {/* Right: Interactive Controls & Physics Consequence Chain (5 Columns) */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-5 font-sans">
          {/* Preset Scenarios Buttons */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#1d1d1d]">
              Skenario Kondisi Cepat:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleResetIdeal}
                className="p-2 rounded-xl bg-[#ebf7f3] border border-[#007a5a]/30 hover:bg-[#d8f0e8] text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-[#007a5a]">Kondisi 1</div>
                <div className="font-bold text-xs text-[#1d1d1d] mt-0.5">Ideal (Bersih)</div>
              </button>

              <button
                type="button"
                onClick={handleSetModerate}
                className="p-2 rounded-xl bg-[#fef3c7] border border-[#d97706]/30 hover:bg-[#fde68a] text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-[#b45309]">Kondisi 2</div>
                <div className="font-bold text-xs text-[#1d1d1d] mt-0.5">Sedimen Sedang</div>
              </button>

              <button
                type="button"
                onClick={handleSetCritical}
                className="p-2 rounded-xl bg-[#fee2e2] border border-[#cc4117]/30 hover:bg-[#fecaca] text-left transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-[#cc4117]">Kondisi 3</div>
                <div className="font-bold text-xs text-[#1d1d1d] mt-0.5">Kritis Tersumbat</div>
              </button>
            </div>
          </div>

          {/* Interactive Sliders & Toggle Controls */}
          <div className="space-y-4 p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6]">
            {/* Sediment Level Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1d] mb-1.5">
                <span>Ketebalan Endapan Lumpur (Sedimen):</span>
                <span className="font-mono font-bold text-[#4a154b]">{sedimentLevel}% Penampang</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={sedimentLevel}
                onChange={(e) => setSedimentLevel(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#e6e6e6] rounded-lg appearance-none cursor-pointer accent-[#4a154b]"
                aria-label="Atur persentase ketebalan sedimen lumpur"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#696969] mt-1">
                <span>0% (Bersih Dikeruk)</span>
                <span>40% (Waspada)</span>
                <span>80% (Kritis)</span>
              </div>
            </div>

            {/* Rainfall Inflow Intensity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1d] mb-1.5">
                <span>Intensitas Curah Hujan Inflow:</span>
                <span className="font-mono font-bold text-[#1264a3]">{rainfallIntensity} mm/jam</span>
              </div>
              <input
                type="range"
                min={10}
                max={70}
                step={5}
                value={rainfallIntensity}
                onChange={(e) => setRainfallIntensity(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#e6e6e6] rounded-lg appearance-none cursor-pointer accent-[#1264a3]"
                aria-label="Atur intensitas curah hujan inflow"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#696969] mt-1">
                <span>10 mm/jam (Ringan)</span>
                <span>35 mm/jam (Sedang)</span>
                <span>70 mm/jam (Lebat)</span>
              </div>
            </div>

            {/* Trash Blockage Checkbox */}
            <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#1d1d1d]">Sumbatan Sampah di Jeruji Saringan (Inlet)</div>
                <div className="text-[11px] text-[#696969]">Plastik dan ranting pohon tersangkut pada mulut saluran</div>
              </div>
              <input
                type="checkbox"
                checked={hasTrashBlockage}
                onChange={(e) => setHasTrashBlockage(e.target.checked)}
                className="w-5 h-5 accent-[#4a154b] rounded cursor-pointer shrink-0 ml-3"
                aria-label="Toggle sumbatan sampah pada jeruji saringan"
              />
            </div>
          </div>

          {/* 4-Stage Consequence Chain */}
          <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] space-y-2.5">
            <span className="text-[10px] font-mono uppercase font-bold text-[#4a154b] block">
              Rantai Konsekuensi Hidrolika Saluran:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
                <div className="text-[10px] text-[#696969] font-normal">Tahap 1</div>
                Penampang Menyempit
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
                <div className="text-[10px] text-[#696969] font-normal">Tahap 2</div>
                Muka Air Naik
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
                <div className="text-[10px] text-[#696969] font-normal">Tahap 3</div>
                Debit Buang Turun
              </div>
              <div
                className={`p-2 rounded-lg border transition-colors ${
                  isOverflowing
                    ? 'bg-[#cc4117] text-white border-[#cc4117]'
                    : isRestricted
                    ? 'bg-[#d97706] text-white border-[#d97706]'
                    : 'bg-white border-[#e6e6e6]'
                }`}
              >
                <div className={`text-[10px] ${isOverflowing || isRestricted ? 'text-white/90' : 'text-[#696969]'} font-normal`}>
                  Tahap 4
                </div>
                {isOverflowing ? 'Limpasan Meluap' : isRestricted ? 'Hambatan Arus' : 'Lancar Bebas'}
              </div>
            </div>

            <p className="text-[11px] text-[#1d1d1d] leading-relaxed pt-1">
              {isOverflowing
                ? 'Kapasitas penampang basah efektif tersisa ' +
                  effectiveOpeningArea +
                  '%. Air hujan tidak tertampung dan meluap membanjiri badan jalan raya sehingga lalu lintas terputus.'
                : isRestricted
                ? 'Kapasitas efektif menurun ke ' +
                  effectiveOpeningArea +
                  '%. Aliran melambat dengan kenaikan muka air saluran mencapai ' +
                  waterLevelHeight +
                  '%.'
                : 'Kapasitas buang optimal pada ' +
                  effectiveOpeningArea +
                  '%. Debit air hujan mengalir lancar menuju saluran sekunder tanpa hambatan backwater.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
