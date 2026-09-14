'use client'

import React from 'react'
import { ShieldCheck, CloudRain, Wind, Waves, Mountain } from 'lucide-react'
import type { EnvironmentalRiskIndicators, RiskLevel } from '@/lib/weather/weather-intelligence'

interface EnvironmentalIndicatorsCardProps {
  indicators?: EnvironmentalRiskIndicators
  compact?: boolean
}

export function EnvironmentalIndicatorsCard({
  indicators,
  compact = false,
}: EnvironmentalIndicatorsCardProps) {
  if (!indicators) return null

  const { rainfall, wind, coastal, slope } = indicators

  const getBadge = (level: RiskLevel | 'Attention') => {
    switch (level) {
      case 'High':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef2f2] text-[#cc4117] border border-[#fecaca]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#cc4117] animate-pulse"></span>
            HIGH
          </span>
        )
      case 'Elevated':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></span>
            ELEVATED
          </span>
        )
      case 'Attention':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b45309] animate-pulse"></span>
            ATTENTION
          </span>
        )
      case 'Normal':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#007a5a] border border-[#bbf7d0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007a5a]"></span>
            NORMAL
          </span>
        )
    }
  }

  return (
    <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
              Indikator Risiko Lingkungan
            </h4>
            <span className="text-[10px] text-[#696969] block">
              Ambang Batas Ilmiah BMKG & PVMBG
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b] font-bold">
          THRESHOLD STANDARD
        </span>
      </div>

      {/* Grid of 4 Environmental Indicators */}
      <div className={`grid gap-2.5 ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {/* 1. Rainfall Indicator */}
        <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#1d1d1d]">Curah Hujan</span>
            </div>
            {getBadge(rainfall.level, rainfall.label)}
          </div>
          <div className="text-xs font-mono font-bold text-[#1d1d1d]">
            {rainfall.valueMm} mm/jam
          </div>
          <span className="text-[10px] text-[#696969] leading-tight">
            {rainfall.thresholdDesc}
          </span>
        </div>

        {/* 2. Wind Indicator */}
        <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#1d1d1d]">Kecepatan & Gust</span>
            </div>
            {getBadge(wind.level, wind.label)}
          </div>
          <div className="text-xs font-mono font-bold text-[#1d1d1d]">
            {wind.speedKmh} km/j (Gust: {wind.gustKmh} km/j)
          </div>
          <span className="text-[10px] text-[#696969] leading-tight">
            {wind.thresholdDesc}
          </span>
        </div>

        {/* 3. Coastal Wave Indicator */}
        <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#1d1d1d]">Gelombang Laut</span>
            </div>
            {getBadge(coastal.level, coastal.label)}
          </div>
          <div className="text-xs font-mono font-bold text-[#1d1d1d]">
            {coastal.waveHeightM != null ? `${coastal.waveHeightM} meter` : 'Tidak Tersedia'}
          </div>
          <span className="text-[10px] text-[#696969] leading-tight">
            {coastal.thresholdDesc}
          </span>
        </div>

        {/* 4. Slope Indicator */}
        <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#1d1d1d]">Kondisi Lereng</span>
            </div>
            {getBadge(slope.level, slope.label)}
          </div>
          <div className="text-xs font-mono font-bold text-[#1d1d1d]">
            Akumulasi 12j: {slope.cumulRain12h} mm
          </div>
          <span className="text-[10px] text-[#696969] leading-tight">
            {slope.thresholdDesc}
          </span>
        </div>
      </div>
    </div>
  )
}
