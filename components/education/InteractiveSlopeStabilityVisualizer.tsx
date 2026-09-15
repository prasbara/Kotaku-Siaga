'use client'

import React, { useState } from 'react'
import { Mountain } from 'lucide-react'

const SLOPE_STAGES = [
  {
    hours: 0,
    stage: 'KONDISI NORMAL',
    soilState: 'Kadar Air Alami (30%)',
    porePressure: 'Tekanan Pori Rendah (0.1 kPa)',
    shearStrength: 'Kekuatan Geser Tinggi (100%)',
    riskLevel: 'Rendah',
    riskColor: '#007a5a',
    desc: 'Kohesi antar butir tanah lempung sangat kuat. Akar vegetasi mengikat lapisan tanah atas dengan batuan dasar yang kokoh.',
  },
  {
    hours: 3,
    stage: 'INFILTRASI AWAL',
    soilState: 'Kadar Air Meningkat (50%)',
    porePressure: 'Tekanan Pori Mulai Naik',
    shearStrength: 'Kekuatan Geser Masih Stabil (85%)',
    riskLevel: 'Aman Terkendali',
    riskColor: '#007a5a',
    desc: 'Air hujan mulai meresap ke dalam lapisan pori tanah. Sulingan pipa penahan talud (weep holes) mulai meneteskan air.',
  },
  {
    hours: 8,
    stage: 'TANAH JENUH AIR',
    soilState: 'Titik Jenuh Tercapai (85%)',
    porePressure: 'Tekanan Air Pori Meningkat Signifikan',
    shearStrength: 'Kekuatan Geser Menurun (55%)',
    riskLevel: 'Waspada',
    riskColor: '#d97706',
    desc: 'Beban massa lereng bertambah berat hingga ratusan kilogram per meter kubik. Rongga tanah terisi penuh oleh air.',
  },
  {
    hours: 18,
    stage: 'TEKANAN AIR PORI TINGGI',
    soilState: 'Tanah Melampaui Batas Plastis',
    porePressure: 'Tekanan Pori Menolak Butiran Tanah',
    shearStrength: 'Kekuatan Geser Kritis (< 30%)',
    riskLevel: 'Kritis Bahaya',
    riskColor: '#cc4117',
    desc: 'Tekanan air dalam rongga pori menolak butir tanah untuk saling mengikat (gaya normal efektif mendekati nol). Bidang gelincir mulai terbentuk.',
  },
]

export function InteractiveSlopeStabilityVisualizer() {
  const [selectedIdx, setSelectedIdx] = useState<number>(2) // default: waspada
  const current = SLOPE_STAGES[selectedIdx]

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <Mountain className="w-4 h-4 text-[#d97706]" />
            Mekanika Tanah & Kestabilan Lereng Perbukitan
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">
            Dinamika Longsor: Pengaruh Hujan terhadap Tekanan Air Pori
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Mempelajari mengapa lereng terjal perbukitan Semarang Selatan (Gombel, Candisari, Banyumanik) rentan saat hujan berkepanjangan.
          </p>
        </div>
      </div>

      {/* Rainfall Duration Selector Buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#1d1d1d]">
          Pilih Durasi Hujan Kumulatif di Wilayah Lereng:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SLOPE_STAGES.map((s, idx) => {
            const isSelected = idx === selectedIdx
            return (
              <button
                key={s.hours}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#f9f0ff] border-[#4a154b] ring-2 ring-[#4a154b]/20 shadow-xs'
                    : 'bg-white border-[#e6e6e6] hover:bg-[#f4ede4]/40'
                }`}
              >
                <span className="text-xs font-mono font-bold text-[#4a154b]">
                  {s.hours === 0 ? 'Kondisi Awal' : `Hujan +${s.hours} Jam`}
                </span>
                <span className="font-bold text-xs text-[#1d1d1d] mt-1">{s.stage}</span>
                <span
                  className="text-[10px] font-mono font-bold mt-2 px-1.5 py-0.5 rounded self-start"
                  style={{ backgroundColor: `${s.riskColor}15`, color: s.riskColor }}
                >
                  {s.riskLevel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Slope Physics Cross-Section Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1f0621] text-white border border-[#360f38] flex flex-col lg:flex-row items-stretch justify-between gap-6">
        {/* Left: Slope Cross-Section Representation */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase text-[#eddcf7]">
              Profil Mekanika Lereng (Kemiringan 30°)
            </span>
            <span
              className="text-xs font-mono font-bold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: current.riskColor, color: '#fff' }}
            >
              RISIKO: {current.riskLevel.toUpperCase()}
            </span>
          </div>

          {/* SVG Diagram of Slope */}
          <div className="relative w-full h-44 rounded-xl bg-[#0e0210] border border-white/10 overflow-hidden flex items-center justify-center p-3">
            <svg viewBox="0 0 400 160" className="w-full h-full">
              {/* Base Rock */}
              <polygon points="0,160 400,160 400,60 160,140 0,160" fill="#2d2d2d" />
              {/* Slip Surface Plane (Bidang Gelincir) */}
              <line
                x1="40"
                y1="150"
                x2="380"
                y2="60"
                stroke={current.riskColor}
                strokeWidth="3"
                strokeDasharray="6,4"
              />
              {/* Soil Upper Mass */}
              <polygon
                points="0,140 380,40 400,40 400,60 160,140 0,160"
                fill={selectedIdx >= 2 ? '#5c4033' : '#795548'}
              />
              {/* Vegetation */}
              <circle cx="100" cy="120" r="8" fill="#007a5a" />
              <circle cx="220" cy="80" r="8" fill="#007a5a" />
              <circle cx="340" cy="40" r="8" fill="#007a5a" />

              {/* Water Infiltration Arrows */}
              {selectedIdx > 0 && (
                <>
                  <line x1="120" y1="50" x2="120" y2="90" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                  <line x1="240" y1="20" x2="240" y2="60" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3,3" />
                </>
              )}

              {/* Slip Arrow */}
              {selectedIdx >= 2 && (
                <path d="M 300 70 L 220 100" stroke="#cc4117" strokeWidth="4" markerEnd="url(#arrow)" />
              )}
            </svg>
          </div>

          <p className="text-xs text-[#eddcf7]/80 leading-relaxed mt-3">
            {current.desc}
          </p>
        </div>

        {/* Right: Technical Geotechnical Parameters */}
        <div className="w-full lg:w-72 bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-between gap-3 text-xs font-mono shrink-0">
          <span className="text-[11px] font-bold text-[#eddcf7] uppercase pb-2 border-b border-white/10">
            Parameter Geoteknik:
          </span>

          <div className="space-y-1">
            <span className="text-[#696969] text-[10px] block">KONDISI TANAH:</span>
            <span className="text-white font-bold">{current.soilState}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[#696969] text-[10px] block">TEKANAN AIR PORI (U):</span>
            <span className="text-amber-300 font-bold">{current.porePressure}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[#696969] text-[10px] block">KEKUATAN GESER PENAHAN:</span>
            <span className="text-emerald-400 font-bold">{current.shearStrength}</span>
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] text-[#eddcf7]/60">
            Formula Mohr-Coulomb: τ = c + (σ - u) tan(φ)
          </div>
        </div>
      </div>
    </div>
  )
}
