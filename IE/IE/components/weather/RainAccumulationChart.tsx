'use client'

import React from 'react'
import { CloudRain, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { RainfallTemporalAccumulation } from '@/lib/weather/weather-intelligence'

interface RainAccumulationChartProps {
  analysis?: RainfallTemporalAccumulation
  timestamp?: string
  source?: string
}

export function RainAccumulationChart({
  analysis,
  timestamp,
  source = 'Open-Meteo & WMO Hourly Precipitation Model',
}: RainAccumulationChartProps) {
  if (!analysis) {
    return (
      <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] text-xs text-[#696969] text-center">
        Data akumulasi curah hujan belum tersedia.
      </div>
    )
  }

  const { acc1h, acc3h, acc6h, acc12h, acc24h, trend, trendDescription, hourlySeries } = analysis

  // Trend Badge Styling
  const trendBadge =
    trend === 'HUJAN MENINGKAT' ? (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fef2f2] text-[#cc4117] border border-[#fecaca]">
        <TrendingUp className="w-3.5 h-3.5" />
        HUJAN MENINGKAT
      </span>
    ) : trend === 'HUJAN MENURUN' ? (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f0fdf4] text-[#007a5a] border border-[#bbf7d0]">
        <TrendingDown className="w-3.5 h-3.5" />
        HUJAN MENURUN
      </span>
    ) : (
      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b] border border-[#e8ded2]">
        <Minus className="w-3.5 h-3.5" />
        HUJAN STABIL
      </span>
    )

  // Max value for scaling bar heights in chart
  const series24 = hourlySeries.slice(0, 24)
  const maxRain = Math.max(...series24.map((s) => s.rainMm), 5)

  return (
    <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b]">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
              Analisis Temporal Curah Hujan
            </h4>
            <span className="text-[10px] text-[#696969] block">
              Akumulasi & Tren Durasi Kejadian
            </span>
          </div>
        </div>
        {trendBadge}
      </div>

      {/* 5-Phase Accumulation Metrics (1h, 3h, 6h, 12h, 24h) */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        <div className="p-2 rounded-lg bg-white border border-[#e6e6e6] text-center">
          <span className="text-[9px] text-[#696969] block font-bold uppercase">1 Jam</span>
          <span className="text-sm font-mono font-bold text-[#1d1d1d]">{acc1h}</span>
          <span className="text-[8px] text-[#696969] block font-mono">mm</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-[#e6e6e6] text-center">
          <span className="text-[9px] text-[#696969] block font-bold uppercase">3 Jam</span>
          <span className="text-sm font-mono font-bold text-[#1d1d1d]">{acc3h}</span>
          <span className="text-[8px] text-[#696969] block font-mono">mm</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-[#e6e6e6] text-center">
          <span className="text-[9px] text-[#696969] block font-bold uppercase">6 Jam</span>
          <span className="text-sm font-mono font-bold text-[#1d1d1d]">{acc6h}</span>
          <span className="text-[8px] text-[#696969] block font-mono">mm</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-[#e6e6e6] text-center">
          <span className="text-[9px] text-[#696969] block font-bold uppercase">12 Jam</span>
          <span className="text-sm font-mono font-bold text-[#1d1d1d]">{acc12h}</span>
          <span className="text-[8px] text-[#696969] block font-mono">mm</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-[#e6e6e6] text-center bg-[#f9f0ff]/50">
          <span className="text-[9px] text-[#4a154b] block font-bold uppercase">24 Jam</span>
          <span className="text-sm font-mono font-bold text-[#4a154b]">{acc24h}</span>
          <span className="text-[8px] text-[#696969] block font-mono">mm</span>
        </div>
      </div>

      {/* RAIN ACCUMULATION GRAPH (0h ─────────────── 24h) */}
      <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#696969]">
          <span className="font-bold text-[#4a154b]">DISTRIBUSI PRESIFITASI (0H — 24H)</span>
          <span>Max: {maxRain.toFixed(1)} mm/j</span>
        </div>

        {/* Bar Visualizer */}
        <div className="h-16 flex items-end gap-1 pt-2 border-b border-[#e6e6e6] px-1">
          {series24.map((point, idx) => {
            const heightPercent = Math.min(Math.round((point.rainMm / maxRain) * 100), 100)
            const isZero = point.rainMm === 0
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-[#1d1d1d] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-md whitespace-nowrap">
                    {point.timeStr}: {point.rainMm} mm
                  </div>
                </div>

                <div
                  style={{ height: isZero ? '3px' : `${Math.max(heightPercent, 8)}%` }}
                  className={`w-full rounded-t-xs transition-all ${
                    isZero
                      ? 'bg-[#e6e6e6]'
                      : point.rainMm > 15
                      ? 'bg-[#cc4117]'
                      : point.rainMm >= 5
                      ? 'bg-[#d97706]'
                      : 'bg-[#4a154b]'
                  }`}
                />
              </div>
            )
          })}
        </div>

        {/* Timeline Axis Labels */}
        <div className="flex items-center justify-between text-[9px] font-mono text-[#696969] px-0.5">
          <span>0h (Kini)</span>
          <span>+6h</span>
          <span>+12h</span>
          <span>+18h</span>
          <span>+24h</span>
        </div>
      </div>

      {/* Trend Explanation Text */}
      <div className="text-[11px] text-[#1d1d1d] bg-[#f4ede4]/60 p-2.5 rounded-lg border border-[#e8ded2] leading-relaxed">
        <p>{trendDescription}</p>
      </div>

      {/* Provenance Footer */}
      <div className="pt-1 border-t border-[#e6e6e6]/60 flex items-center justify-between text-[10px] text-[#696969] font-mono">
        <span className="truncate max-w-[200px]" title={source}>
          Sumber: {source}
        </span>
        {timestamp && <span>{timestamp}</span>}
      </div>
    </div>
  )
}
