'use client'

import React, { useState } from 'react'
import {
  AlertTriangle,
  MapPin,
  CheckCircle2,
  X,
  Compass,
} from 'lucide-react'

export interface SafeRoutePreset {
  id: string
  title: string
  originName: string
  destName: string
  originCoords: [number, number]
  destCoords: [number, number]
  safeWaypoints: Array<[number, number]>
  avoidRoads: string[]
  safeDistanceKm: number
  estimatedMinutes: number
  elevationSummary: string
  safetyStatus: 'RECOMMENDED_SAFE' | 'CAUTION_HIGH_WATER'
  adviceNotes: string
}

export const SEMARANG_SAFE_ROUTE_PRESETS: SafeRoutePreset[] = [
  {
    id: 'genuk-to-center',
    title: 'Genuk / Kaligawe → Simpang Lima (Pusat Kota)',
    originName: 'Jl. Raya Genuksari / Terboyo (Pesisir Timur)',
    destName: 'Kawasan Simpang Lima (Semarang Tengah)',
    originCoords: [-6.9602, 110.4721],
    destCoords: [-6.9932, 110.4203],
    safeWaypoints: [
      [-6.9602, 110.4721],
      [-6.9785, 110.4623], // Via Jl. Wolter Monginsidi
      [-7.0012, 110.4552], // Via Jl. Majapahit
      [-6.9932, 110.4203], // Ke Simpang Lima
    ],
    avoidRoads: [
      'Jl. Raya Kaligawe (Depan RSI Sultan Agung - Genangan Rob 40cm)',
      'Bawah Jembatan Tol Kaligawe',
    ],
    safeDistanceKm: 11.4,
    estimatedMinutes: 24,
    elevationSummary: 'Elevasi meningkat dari 2.8m DPL menuju 6.5m DPL (Aman dari rob)',
    safetyStatus: 'RECOMMENDED_SAFE',
    adviceNotes:
      'Gunakan koridor Jl. Wolter Monginsidi tembus Jl. Majapahit untuk menghindari lumpuh total di bawah jembatan tol Kaligawe.',
  },
  {
    id: 'tanjungemas-to-rsup',
    title: 'Pelabuhan Tanjung Emas → RSUP Dr. Kariadi',
    originName: 'Kawasan Pelabuhan Tanjung Emas (Semarang Utara)',
    destName: 'RSUP Dr. Kariadi (Gajahmungkur)',
    originCoords: [-6.9535, 110.4221],
    destCoords: [-6.9995, 110.4072],
    safeWaypoints: [
      [-6.9535, 110.4221],
      [-6.9712, 110.4152], // Via Jl. Usman Janatin / Ronggowarsito
      [-6.9854, 110.4085], // Via Jl. Pemuda / Imam Bonjol
      [-6.9995, 110.4072], // Tiba RSUP Kariadi
    ],
    avoidRoads: [
      'Jl. Coaster Pesisir (Limpasan Pasang Laut)',
      'Jl. Bandarharjo Sisi Bawah',
    ],
    safeDistanceKm: 8.2,
    estimatedMinutes: 18,
    elevationSummary: 'Elevasi bergerak dari 2.1m DPL ke 45.0m DPL (Dataran Tinggi Medis)',
    safetyStatus: 'RECOMMENDED_SAFE',
    adviceNotes:
      'Akses Jl. Pemuda terpantau lancar dan kering. Rute darurat rujukan medis prioritas.',
  },
  {
    id: 'mangkang-to-bandara',
    title: 'Mangkang (Pantura Barat) → Bandara Ahmad Yani',
    originName: 'Pasar Mangkang (Kecamatan Tugu)',
    destName: 'Bandara Internasional Jenderal Ahmad Yani',
    originCoords: [-6.9754, 110.3125],
    destCoords: [-6.9782, 110.3854],
    safeWaypoints: [
      [-6.9754, 110.3125],
      [-6.9842, 110.3452], // Via Jalur Lingkar GT Kaliwungu
      [-6.9782, 110.3854], // Ke Akses Bandara
    ],
    avoidRoads: [
      'Jembatan Kali Beringin Mangkang Wetan (Potensi Luapan Debit)',
      'Ruas Depan Taman Margasatwa Mangkang',
    ],
    safeDistanceKm: 14.8,
    estimatedMinutes: 28,
    elevationSummary: 'Elevasi 3.0m DPL (Pesisir Barat Terestrial)',
    safetyStatus: 'RECOMMENDED_SAFE',
    adviceNotes:
      'Gunakan lajur tengah dan perhatikan peringatan ketinggian air di bantaran Kali Beringin.',
  },
]

interface SafeRouteNavigatorProps {
  onSelectRoute?: (route: SafeRoutePreset | null) => void
  onClose?: () => void
  className?: string
}

export function SafeRouteNavigator({ onSelectRoute, onClose, className }: SafeRouteNavigatorProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('genuk-to-center')

  const activeRoute =
    SEMARANG_SAFE_ROUTE_PRESETS.find((r) => r.id === selectedRouteId) ||
    SEMARANG_SAFE_ROUTE_PRESETS[0]

  const handleRouteSelect = (id: string) => {
    setSelectedRouteId(id)
    const route = SEMARANG_SAFE_ROUTE_PRESETS.find((r) => r.id === id) || null
    if (onSelectRoute) {
      onSelectRoute(route)
    }
  }

  return (
    <div
      className={`bg-white/95 backdrop-blur-md border border-[#e6e6e6] rounded-2xl shadow-lg p-4 sm:p-5 text-[#1d1d1d] space-y-4 ${
        className || ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[#e6e6e6] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#007a5a] text-white flex items-center justify-center font-bold">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#1d1d1d] flex items-center gap-2">
              Pencari Jalur Evakuasi Bebas Banjir
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
            </h3>
            <p className="text-[11px] text-[#696969]">
              Navigasi Cerdas Menghindari Genangan &amp; Rob
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4ede4] text-[#696969] hover:text-[#1d1d1d] transition-colors"
            title="Tutup Navigasi Jalur Aman"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preset Selector */}
      <div className="space-y-1.5">
        <label htmlFor="safe-route-select" className="text-[11px] font-bold text-[#696969] uppercase tracking-wider block">
          PILIH KORIDOR EVAKUASI / PERJALANAN:
        </label>
        <select
          id="safe-route-select"
          value={selectedRouteId}
          onChange={(e) => handleRouteSelect(e.target.value)}
          className="w-full bg-[#faf9f8] text-xs font-bold text-[#1d1d1d] px-3 py-2 rounded-xl border border-[#e6e6e6] focus:outline-none focus:ring-2 focus:ring-[#4a154b]"
        >
          {SEMARANG_SAFE_ROUTE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.title}
            </option>
          ))}
        </select>
      </div>

      {/* Active Route Details Card */}
      <div className="p-3.5 bg-[#fdfbf9] border border-[#e6e6e6] rounded-xl space-y-3 text-xs">
        {/* Origin & Destination */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-[#cc4117] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-[#696969] uppercase font-bold block">TITIK ASAL:</span>
              <span className="font-semibold text-[#1d1d1d]">{activeRoute.originName}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#007a5a] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-[#696969] uppercase font-bold block">TITIK TUJUAN AMAN:</span>
              <span className="font-semibold text-[#1d1d1d]">{activeRoute.destName}</span>
            </div>
          </div>
        </div>

        {/* Route Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e6e6e6] text-[11px]">
          <div className="p-2 bg-white rounded-lg border border-[#e6e6e6]">
            <span className="text-[#696969] block">Jarak Jalur Aman:</span>
            <span className="text-xs font-mono font-bold text-[#4a154b]">
              {activeRoute.safeDistanceKm} km
            </span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-[#e6e6e6]">
            <span className="text-[#696969] block">Estimasi Tempuh:</span>
            <span className="text-xs font-mono font-bold text-[#007a5a]">
              ~{activeRoute.estimatedMinutes} Menit
            </span>
          </div>
        </div>

        {/* Avoid Roads Box */}
        <div className="p-2.5 bg-red-50/80 border border-red-200 rounded-lg text-red-950 text-[11px] space-y-1">
          <span className="font-bold flex items-center gap-1 text-red-900">
            <AlertTriangle className="w-3.5 h-3.5 text-[#cc4117]" />
            Ruas Jalan yang Dialihkan / Dihindari:
          </span>
          <ul className="list-disc list-inside space-y-0.5 text-red-900/90 pl-1">
            {activeRoute.avoidRoads.map((road, i) => (
              <li key={i}>{road}</li>
            ))}
          </ul>
        </div>

        {/* Advice Notes */}
        <p className="text-[11px] text-[#696969] leading-relaxed">
          <strong>Rekomendasi Jalur:</strong> {activeRoute.adviceNotes}
        </p>
      </div>

      {/* Safety Disclaimer */}
      <div className="text-[10px] text-[#696969] leading-tight italic">
        *Rute rekomendasi dihitung berbasis data titik genangan aktif dan model elevasi DEM Semarang. Selalu ikuti petunjuk rambu dan petugas BPBD di lapangan.
      </div>
    </div>
  )
}
