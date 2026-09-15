'use client'

import React from 'react'
import type { RealWeatherData } from '@/app/api/weather/route'
import { CloudRain, Wind, Thermometer, Droplets, RefreshCw, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'

interface WeatherSummaryCardProps {
  weather: RealWeatherData | null
  isLoading: boolean
  onRefresh: () => void
}

export function WeatherSummaryCard({ weather, isLoading, onRefresh }: WeatherSummaryCardProps) {
  if (isLoading && !weather) {
    return (
      <div className="flex items-center gap-3 text-xs font-mono text-on-surface-variant">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
        <span>Menghubungkan telemetri observasi Kota Semarang...</span>
      </div>
    )
  }

  if (!weather || weather.status === 'UNAVAILABLE') {
    return (
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-error">
          <AlertCircle className="w-4 h-4" />
          <span className="font-bold">WEATHER DATA UNAVAILABLE</span>
        </div>
        <span className="hidden sm:inline text-on-surface-variant text-[11px]">
          Sumber telemetri cuaca tidak dapat diakses saat ini.
        </span>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant/30 text-[10px] font-bold"
        >
          <RefreshCw className="w-3 h-3" />
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
      {/* Freshness Badge */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
        <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
          LIVE OBSERVASI
        </span>
      </div>

      {/* Temperature & Condition */}
      <div className="flex items-center gap-1.5 text-on-surface">
        <Thermometer className="w-3.5 h-3.5 text-tertiary" />
        <span>
          {weather.temperature_c != null ? `${weather.temperature_c}°C` : 'N/A'}
        </span>
        <span className="text-on-surface-variant text-[11px]">({weather.weather_condition})</span>
      </div>

      {/* Rain / Precipitation */}
      <div className="hidden sm:flex items-center gap-1.5 text-on-surface">
        <CloudRain className="w-3.5 h-3.5 text-primary" />
        <span className="text-on-surface-variant text-[11px]">Curah Hujan:</span>
        <span className="font-bold text-primary">
          {weather.precipitation_mm != null ? `${weather.precipitation_mm} mm/j` : '0 mm/j'}
        </span>
      </div>

      {/* Wind */}
      <div className="hidden md:flex items-center gap-1.5 text-on-surface">
        <Wind className="w-3.5 h-3.5 text-secondary" />
        <span className="text-on-surface-variant text-[11px]">Angin:</span>
        <span className="font-bold text-secondary">
          {weather.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/j` : 'N/A'}
        </span>
      </div>

      {/* Humidity */}
      <div className="hidden lg:flex items-center gap-1.5 text-on-surface">
        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-on-surface-variant text-[11px]">Lembap:</span>
        <span className="text-on-surface font-semibold">
          {weather.humidity_percent != null ? `${weather.humidity_percent}%` : 'N/A'}
        </span>
      </div>

      {/* Update timestamp */}
      <div className="hidden xl:flex items-center gap-1 text-[10px] text-on-surface-variant border-l border-outline-variant/30 pl-3">
        <span>Diperbarui: {weather.retrieved_at_wib}</span>
      </div>
    </div>
  )
}
