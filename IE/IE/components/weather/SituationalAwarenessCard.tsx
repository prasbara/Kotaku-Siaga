'use client'

import React from 'react'
import Link from 'next/link'
import {
  CloudRain,
  Wind,
  Waves,
  ShieldAlert,
  Video,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import type { RealWeatherData } from '@/app/api/weather/route'

interface SituationalAwarenessCardProps {
  weather: RealWeatherData | null
  activeReportsCount: number
  cctvCount: number
  isLoading?: boolean
  onRefresh?: () => void
}

export function SituationalAwarenessCard({
  weather,
  activeReportsCount,
  cctvCount,
  isLoading = false,
  onRefresh,
}: SituationalAwarenessCardProps) {
  const indicators = weather?.riskIndicators

  const rainLevel = indicators?.rainfall.level || 'Normal'
  const windLevel = indicators?.wind.level || 'Normal'
  const coastalLevel = indicators?.coastal.level || 'Normal'

  const getStatusDot = (level: string) => {
    if (level === 'High' || level === 'Attention') {
      return (
        <span className="flex items-center gap-1.5 text-[#cc4117] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#cc4117] animate-pulse"></span>
          {level === 'Attention' ? 'Perhatian' : 'Meningkat Tinggi'}
        </span>
      )
    }
    if (level === 'Elevated') {
      return (
        <span className="flex items-center gap-1.5 text-[#d97706] font-bold">
          <span className="w-2 h-2 rounded-full bg-[#d97706]"></span>
          Meningkat
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 text-[#007a5a] font-bold">
        <span className="w-2 h-2 rounded-full bg-[#007a5a]"></span>
        Normal
      </span>
    )
  }

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-white via-[#fdfbf9] to-[#f9f0ff] border border-[#e6e6e6] shadow-subtle flex flex-col justify-between gap-5">
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4a154b]">
              SITUATIONAL AWARENESS
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b] font-bold">
              KOTA SEMARANG
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#1d1d1d]">
            Kondisi Lingkungan & Indikator Risiko
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Sintesis data meteorologi terbuka, tinggi muka gelombang, dan pantauan lapangan.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#f4ede4] text-[#4a154b] hover:bg-[#eddcf7] transition-colors"
            title="Segarkan telemetri cuaca"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Grid of Situational Telemetry Points */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-mono">
        {/* Rainfall */}
        <div className="p-3 rounded-xl bg-white border border-[#e6e6e6] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
            <CloudRain className="w-3.5 h-3.5 text-[#4a154b]" />
            <span>Curah Hujan</span>
          </div>
          <div className="text-sm font-bold text-[#1d1d1d]">
            {weather?.precipitation_mm ?? 0} mm/j
          </div>
          {getStatusDot(rainLevel)}
        </div>

        {/* Wind */}
        <div className="p-3 rounded-xl bg-white border border-[#e6e6e6] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
            <Wind className="w-3.5 h-3.5 text-[#4a154b]" />
            <span>Kecepatan Angin</span>
          </div>
          <div className="text-sm font-bold text-[#1d1d1d]">
            {weather?.wind_speed_kmh ?? 0} km/j
          </div>
          {getStatusDot(windLevel)}
        </div>

        {/* Coastal / Wave */}
        <div className="p-3 rounded-xl bg-white border border-[#e6e6e6] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
            <Waves className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Gelombang Pesisir</span>
          </div>
          <div className="text-sm font-bold text-[#1d1d1d]">
            {weather?.wave_height_m != null ? `${weather.wave_height_m} m` : 'Stabil'}
          </div>
          {getStatusDot(coastalLevel)}
        </div>

        {/* Active Incidents */}
        <div className="p-3 rounded-xl bg-white border border-[#e6e6e6] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
            <ShieldAlert className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Laporan Aktif</span>
          </div>
          <div className="text-sm font-bold text-[#d97706]">
            {activeReportsCount} Terdata
          </div>
          <span className="text-[10px] text-[#696969]">Pantauan Warga</span>
        </div>

        {/* CCTV Telemetry */}
        <div className="p-3 rounded-xl bg-white border border-[#e6e6e6] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
            <Video className="w-3.5 h-3.5 text-[#007a5a]" />
            <span>CCTV Terhubung</span>
          </div>
          <div className="text-sm font-bold text-[#007a5a]">
            {cctvCount} Kamera
          </div>
          <span className="text-[10px] text-[#696969]">PantauSemar</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex items-center justify-between pt-2 border-t border-[#e6e6e6] flex-wrap gap-2">
        <span className="text-[11px] text-[#696969]">
          Data diperbarui: {weather?.retrieved_at_wib || 'Waktu aktual'} • Sumber: Open-Meteo & BMKG
        </span>
        <Link
          href="/peta?view=weather"
          className="min-h-[40px] px-5 py-2 rounded-[90px] bg-[#4a154b] text-white font-bold text-xs hover:bg-[#3d113e] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <span>Lihat Analisis Lingkungan Lengkap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
