'use client'

import React from 'react'
import type { RealWeatherData } from '@/app/api/weather/route'
import { CloudRain, Wind, Thermometer, Droplets, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, X, Video } from 'lucide-react'

interface InformationCardModalProps {
  weather: RealWeatherData | null
  cctvCount: number
  isLoading: boolean
  onRefresh: () => void
  onClose: () => void
}

export function InformationCardModal({
  weather,
  cctvCount,
  isLoading,
  onRefresh,
  onClose,
}: InformationCardModalProps) {
  const isAvailable = weather && weather.status === 'AVAILABLE'

  return (
    <div className="absolute top-16 right-4 z-30 w-[calc(100vw-2rem)] sm:w-80 max-w-sm max-h-[calc(100dvh-5rem)] overflow-y-auto bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/40 rounded-xl p-4 shadow-2xl font-body text-xs flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2.5 shrink-0">
        <div className="flex flex-col">
          <span className="font-headline font-bold text-sm text-on-surface">
            KONDISI TERKINI KOTA SEMARANG
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant">
            Data Observasi Stasiun Cuaca Aktual
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
          aria-label="Tutup Ringkasan Informasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Freshness Indicator */}
      <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg border border-outline-variant/30 font-mono text-[11px]">
        <span className="text-on-surface-variant text-[10px] uppercase">Status Freshness:</span>
        {isAvailable ? (
          <span className="flex items-center gap-1.5 text-secondary font-bold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-error font-bold">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            OFFLINE / UNAVAILABLE
          </span>
        )}
      </div>

      {/* Actual Data Metrics */}
      <div className="space-y-2 font-mono text-xs">
        {/* Curah Hujan */}
        <div className="flex items-center justify-between p-2 rounded bg-surface-container/60 border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-primary" />
            <span className="text-on-surface">Curah Hujan</span>
          </div>
          <span className="font-bold text-on-surface">
            {isAvailable && weather.precipitation_mm != null
              ? `${weather.precipitation_mm} mm/jam`
              : 'Data unavailable'}
          </span>
        </div>

        {/* Kecepatan Angin */}
        <div className="flex items-center justify-between p-2 rounded bg-surface-container/60 border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-secondary" />
            <span className="text-on-surface">Kecepatan Angin</span>
          </div>
          <span className="font-bold text-on-surface">
            {isAvailable && weather.wind_speed_kmh != null
              ? `${weather.wind_speed_kmh} km/jam`
              : 'Data unavailable'}
          </span>
        </div>

        {/* Suhu Udara */}
        <div className="flex items-center justify-between p-2 rounded bg-surface-container/60 border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-tertiary" />
            <span className="text-on-surface">Suhu Udara</span>
          </div>
          <span className="font-bold text-on-surface">
            {isAvailable && weather.temperature_c != null
              ? `${weather.temperature_c} °C (${weather.weather_condition})`
              : 'Data unavailable'}
          </span>
        </div>

        {/* Kelembapan */}
        <div className="flex items-center justify-between p-2 rounded bg-surface-container/60 border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-on-surface">Kelembapan Udara</span>
          </div>
          <span className="font-bold text-on-surface">
            {isAvailable && weather.humidity_percent != null
              ? `${weather.humidity_percent}%`
              : 'Data unavailable'}
          </span>
        </div>

        {/* Titik CCTV Terpantau */}
        <div className="flex items-center justify-between p-2 rounded bg-surface-container/60 border border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-secondary" />
            <span className="text-on-surface">Titik CCTV Prioritas</span>
          </div>
          <span className="font-bold text-secondary">
            {cctvCount} Titik Pantau
          </span>
        </div>
      </div>

      {/* Provenance & Timestamp */}
      <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-1 text-[10px] font-mono text-on-surface-variant">
        <div>
          <span className="text-on-surface-variant/80">Sumber Data: </span>
          <span className="text-on-surface font-semibold">
            {isAvailable ? weather.source : 'Open-Meteo & WMO Observation (Semarang)'}
          </span>
        </div>
        <div>
          <span className="text-on-surface-variant/80">Data diperbarui: </span>
          <span className="text-on-surface font-semibold">
            {isAvailable ? weather.retrieved_at_wib : 'Data unavailable'}
          </span>
        </div>
      </div>

      {/* Action Retry */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-primary font-mono text-xs font-bold uppercase transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Sinkronisasi Ulang Telemetri</span>
      </button>
    </div>
  )
}
