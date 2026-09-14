'use client'

import React, { useState } from 'react'
import { Droplets, RefreshCw } from 'lucide-react'

export function InteractiveDrainageFlowVisualizer() {
  const [sedimentLevel, setSedimentLevel] = useState<number>(45) // 0 to 80 %
  const [hasTrashBlockage, setHasTrashBlockage] = useState<boolean>(true)

  // Hydraulic Calculations (Illustrative educational model)
  const effectiveCapacity = Math.max(10, 100 - sedimentLevel - (hasTrashBlockage ? 30 : 0))
  const waterLevelHeight = Math.min(100, Math.round(30 + (sedimentLevel * 0.6) + (hasTrashBlockage ? 25 : 0)))
  const isOverflowing = waterLevelHeight > 85

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <Droplets className="w-4 h-4 text-[#1264a3]" />
            Simulasi Hidrolik Saluran & Sedimentasi
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">
            Perbandingan: Saluran Normal vs Saluran Terhambat
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Melihat langsung bagaimana sedimentasi lumpur dan sampah mempersempit penampang basah gorong-gorong.
          </p>
        </div>

        {/* Reset Button */}
        <button
          type="button"
          onClick={() => {
            setSedimentLevel(10)
            setHasTrashBlockage(false)
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4ede4] hover:bg-[#ebdccb] text-xs font-semibold text-[#4a154b] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Kondisi Ideal (Bersih)
        </button>
      </div>

      {/* Visual Simulation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Interactive Cross-Section Visualizer */}
        <div className="p-5 rounded-xl bg-[#1f0621] text-white flex flex-col justify-between gap-4 border border-[#360f38]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#eddcf7]">
              Penampang Melintang Gorong-Gorong Jalan
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                isOverflowing ? 'bg-[#cc4117] text-white' : 'bg-[#007a5a] text-white'
              }`}
            >
              {isOverflowing ? 'STATUS: LIMPASAN MELUAP' : 'STATUS: ALIRAN LANCAR'}
            </span>
          </div>

          {/* Graphical Conduit View */}
          <div className="relative w-full h-44 rounded-lg bg-[#0d010e] border-2 border-[#eddcf7]/30 overflow-hidden flex flex-col justify-end">
            {/* Road Surface level indicator */}
            <div className="absolute top-0 left-0 w-full h-3 bg-[#444] border-b border-white/20 flex items-center justify-center">
              <span className="text-[8px] font-mono uppercase tracking-widest text-white/70">
                Elevasi Aspal Jalan Raya
              </span>
            </div>

            {/* Water Fill Layer */}
            <div
              style={{ height: `${waterLevelHeight}%` }}
              className={`w-full transition-all duration-300 relative flex items-center justify-center ${
                isOverflowing ? 'bg-[#1264a3]/80' : 'bg-[#1264a3]/50'
              }`}
            >
              <div className="absolute top-1 left-0 w-full flex justify-around text-white/40 text-xs font-mono pointer-events-none">
                {effectiveCapacity > 40 ? (
                  <>
                    <span>→</span>
                    <span>→</span>
                    <span>→</span>
                    <span>→</span>
                    <span>→</span>
                  </>
                ) : (
                  <>
                    <span>→</span>
                    <span className="text-red-400 font-bold">✕ TERHAMBAT</span>
                    <span>→</span>
                  </>
                )}
              </div>
              <span className="text-[10px] font-mono font-bold text-white/80">
                Muka Air: {waterLevelHeight}%
              </span>
            </div>

            {/* Trash Blockage at Inlet */}
            {hasTrashBlockage && (
              <div className="absolute bottom-0 right-8 w-16 h-28 bg-[#d97706]/80 border-2 border-dashed border-amber-300 rounded-t flex items-center justify-center text-center p-1 text-[9px] font-bold text-white">
                SAMPAH INLET
              </div>
            )}

            {/* Sediment Layer at Bottom */}
            <div
              style={{ height: `${sedimentLevel}%` }}
              className="w-full bg-[#5c4033] border-t-2 border-[#8b5a2b] transition-all duration-300 flex items-center justify-center text-[10px] font-mono text-amber-200"
            >
              {sedimentLevel > 15 && `SEDIMEN LUMPUR: ${sedimentLevel}%`}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#eddcf7]/70 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#5c4033]" /> Sedimen Lumpur
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#d97706]" /> Sampah Organik/Plastik
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1264a3]" /> Air Limpasan Hujan
            </span>
          </div>
        </div>

        {/* Right: Controls & Consequence Flow */}
        <div className="flex flex-col justify-between gap-5">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#1d1d1d] mb-1.5">
                <span>Ketebalan Endapan Lumpur (Sedimentasi):</span>
                <span className="font-mono font-bold text-[#4a154b]">{sedimentLevel}% Dasar Saluran</span>
              </div>
              <input
                type="range"
                min={0}
                max={80}
                value={sedimentLevel}
                onChange={(e) => setSedimentLevel(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-[#f4ede4] rounded-lg appearance-none cursor-pointer accent-[#4a154b]"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#696969] mt-1">
                <span>0% (Baru Dikeruk)</span>
                <span>40% (Waspada)</span>
                <span>80% (Kritis Tersumbat)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdf9ff] border border-[#eddcf7] flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#1d1d1d]">Sumbatan Sampah di Saringan (Inlet)</div>
                <div className="text-[11px] text-[#696969]">Plastik dan sampah menyangkut di jeruji besi jalan</div>
              </div>
              <input
                type="checkbox"
                checked={hasTrashBlockage}
                onChange={(e) => setHasTrashBlockage(e.target.checked)}
                className="w-5 h-5 accent-[#4a154b] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Rantai Konsekuensi (Consequence Chain) */}
          <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-[#4a154b] block">
              Rantai Konsekuensi Fisika Hidrolik:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
              <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
                <div className="text-[10px] text-[#696969] font-normal">Tahap 1</div>
                Aliran Berkurang
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
                <div className="text-[10px] text-[#696969] font-normal">Tahap 2</div>
                Muka Air Naik
              </div>
              <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
                <div className="text-[10px] text-[#696969] font-normal">Tahap 3</div>
                Limpasan Meningkat
              </div>
              <div
                className={`p-2 rounded-lg border ${
                  isOverflowing
                    ? 'bg-[#cc4117] text-white border-[#cc4117]'
                    : 'bg-white border-[#e6e6e6]'
                }`}
              >
                <div className={`text-[10px] ${isOverflowing ? 'text-white/80' : 'text-[#696969]'} font-normal`}>
                  Tahap 4
                </div>
                Genangan Meluas
              </div>
            </div>
            <p className="text-[11px] text-[#696969] leading-relaxed pt-1">
              {isOverflowing
                ? '⚠️ Kapasitas buang efektif menurun ke ' +
                  effectiveCapacity +
                  '%. Air meluap ke aspal jalan menimbulkan kemacetan dan bahaya terperosok.'
                : '✓ Kapasitas buang efektif aman pada ' +
                  effectiveCapacity +
                  '%. Air hujan cepat terserap masuk ke saluran sekunder.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
