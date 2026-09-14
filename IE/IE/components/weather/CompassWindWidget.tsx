'use client'

import React from 'react'
import { Wind, Navigation, AlertTriangle } from 'lucide-react'
import type { CompassDirection } from '@/lib/weather/weather-intelligence'

interface CompassWindWidgetProps {
  windSpeed: number | null
  windGust: number | null
  compass: CompassDirection | undefined
  advice: string | null
  timestamp?: string
  source?: string
}

export function CompassWindWidget({
  windSpeed,
  windGust,
  compass,
  advice,
  timestamp,
  source = 'Open-Meteo Sensor Kecepatan & Arah Angin 10m',
}: CompassWindWidgetProps) {
  const deg = compass?.deg ?? 0
  const cardinal8 = compass?.cardinal8 ?? 'N'
  const cardinalDesc = compass?.windBearingDesc ?? 'Arah angin terpantau'

  const CARDINALS: { id: string; label: string; angle: number }[] = [
    { id: 'N', label: 'U', angle: 0 },
    { id: 'NE', label: 'TL', angle: 45 },
    { id: 'E', label: 'T', angle: 90 },
    { id: 'SE', label: 'TG', angle: 135 },
    { id: 'S', label: 'S', angle: 180 },
    { id: 'SW', label: 'BD', angle: 225 },
    { id: 'W', label: 'B', angle: 270 },
    { id: 'NW', label: 'BL', angle: 315 },
  ]

  const isGustElevated = (windGust ?? 0) >= 35
  const isGustHigh = (windGust ?? 0) >= 50

  return (
    <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] shadow-xs flex flex-col gap-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b]">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
              Analisis Angin & Kompas Arah
            </h4>
            <span className="text-[10px] text-[#696969] block">
              Skala Beaufort & Puncak Hembusan
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b] font-bold">
          10M SURFACE
        </span>
      </div>

      {/* Compass Dial & Metrics Layout */}
      <div className="flex items-center justify-between gap-4 pt-1">
        {/* Visual 8-Point Compass */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          {/* Compass Circle Rim */}
          <div className="absolute inset-0 rounded-full border-2 border-[#e6e6e6] bg-white shadow-inner flex items-center justify-center">
            {/* Cardinal Tick Marks */}
            {CARDINALS.map((c) => {
              const isSelected = c.id === cardinal8
              const rad = ((c.angle - 90) * Math.PI) / 180
              const r = 42 // radius in px
              const x = Math.round(56 + r * Math.cos(rad))
              const y = Math.round(56 + r * Math.sin(rad))

              return (
                <span
                  key={c.id}
                  style={{ left: `${x}px`, top: `${y}px` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] font-bold transition-all ${
                    isSelected
                      ? 'text-[#4a154b] scale-125 font-black bg-[#f9f0ff] px-1 rounded-sm shadow-2xs'
                      : 'text-[#696969]/70'
                  }`}
                >
                  {c.label}
                </span>
              )
            })}
          </div>

          {/* Compass Needle Rotating by Deg */}
          <div
            className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div className="w-1.5 h-16 relative flex flex-col items-center justify-between">
              {/* North Pointer (Aubergine) */}
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[20px] border-b-[#4a154b]" />
              {/* Pivot */}
              <div className="w-3 h-3 rounded-full bg-[#1d1d1d] border-2 border-white shadow-xs z-10" />
              {/* South Pointer (Muted) */}
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[20px] border-t-[#b3a4b6]" />
            </div>
          </div>
        </div>

        {/* Numeric Telemetry Grid */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          {/* Current Wind Speed */}
          <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
            <span className="text-[10px] text-[#696969] block uppercase font-medium">
              Kecepatan Konstan
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-[#1d1d1d]">
                {windSpeed != null ? windSpeed : 'N/A'}
              </span>
              <span className="text-xs text-[#696969] font-mono">km/jam</span>
            </div>
          </div>

          {/* Maximum Wind Gust */}
          <div className="p-2 rounded-lg bg-white border border-[#e6e6e6]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#696969] block uppercase font-medium">
                Hembusan Puncak (Gust)
              </span>
              {isGustElevated && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#fffbeb] text-[#d97706] font-bold">
                  Waspada
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono ${
                  isGustHigh
                    ? 'text-[#cc4117]'
                    : isGustElevated
                    ? 'text-[#d97706]'
                    : 'text-[#1d1d1d]'
                }`}
              >
                {windGust != null ? windGust : 'N/A'}
              </span>
              <span className="text-xs text-[#696969] font-mono">km/jam</span>
            </div>
          </div>

          {/* Direction Bearing */}
          <div className="text-[11px] font-mono text-[#4a154b] font-bold">
            {compass?.labelId || 'N/A'} • {deg}°
          </div>
        </div>
      </div>

      {/* Direction Description Note */}
      <div className="text-[11px] text-[#1d1d1d] bg-[#f4ede4]/60 p-2 rounded-lg border border-[#e8ded2] flex items-center gap-1.5">
        <Navigation className="w-3 h-3 text-[#4a154b] shrink-0" />
        <span>{cardinalDesc}</span>
      </div>

      {/* Advisory Note if Gust is High/Elevated */}
      {advice && (
        <div
          className={`p-2.5 rounded-lg border text-xs leading-relaxed flex items-start gap-2 ${
            isGustHigh
              ? 'bg-[#fef2f2] border-[#fecaca] text-[#cc4117]'
              : 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">
              Konteks Risiko Hembusan Angin:
            </span>
            <p className="text-[11px] leading-snug">{advice}</p>
          </div>
        </div>
      )}

      {/* Source attribution & timestamp */}
      <div className="pt-1 border-t border-[#e6e6e6]/60 flex items-center justify-between text-[10px] text-[#696969] font-mono">
        <span className="truncate max-w-[200px]" title={source}>
          Sumber: {source}
        </span>
        {timestamp && <span>{timestamp}</span>}
      </div>
    </div>
  )
}
