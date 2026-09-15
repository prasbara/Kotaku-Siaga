'use client'

import React, { useState } from 'react'
import type { RealWeatherData } from '@/app/api/weather/route'
import {
  SEMARANG_ZONES,
  SemarangZoneId,
} from '@/lib/weather/weather-intelligence'
import {
  X,
  RefreshCw,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Cloud,
  Waves,
  Mountain,
  Compass,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { CompassWindWidget } from './CompassWindWidget'
import { RainAccumulationChart } from './RainAccumulationChart'
import { EnvironmentalIndicatorsCard } from './EnvironmentalIndicatorsCard'
import { WeatherTimelineWidget } from './WeatherTimelineWidget'

interface WeatherIntelligencePanelProps {
  weather: RealWeatherData | null
  isLoading: boolean
  activeZone: SemarangZoneId
  onZoneChange: (zone: SemarangZoneId) => void
  onRefresh: () => void
  onClose: () => void
}

export function WeatherIntelligencePanel({
  weather,
  isLoading,
  activeZone,
  onZoneChange,
  onRefresh,
  onClose,
}: WeatherIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'temporal' | 'context' | 'education'>('overview')

  const isAvailable = weather && (weather.status === 'LIVE' || weather.status === 'AVAILABLE' || weather.status === 'UPDATED')
  const currentParams = weather?.currentWeatherParams
  const zoneInfo = weather?.zone || SEMARANG_ZONES[activeZone]
  const quality = weather?.dataQuality

  return (
    <div className="absolute top-16 right-3 md:right-4 z-30 w-[calc(100vw-1.5rem)] sm:w-[480px] max-w-full max-h-[calc(100dvh-5rem)] overflow-y-auto bg-white/95 backdrop-blur-xl border border-[#e6e6e6] rounded-2xl p-4 sm:p-5 shadow-card font-sans text-xs flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* 1. Header & Quality Freshness */}
      <div className="flex items-start justify-between border-b border-[#e6e6e6] pb-3 shrink-0">
        <div className="flex flex-col gap-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4a154b]">
              KONDISI LINGKUNGAN & INDIKATOR RISIKO
            </span>
          </div>
          <h2 className="text-base font-bold text-[#1d1d1d] flex items-center gap-1.5">
            <span>Kota Semarang</span>
            <span className="text-[#696969] text-xs font-normal">• {zoneInfo.name}</span>
          </h2>
          <span className="text-[11px] text-[#696969]">
            {zoneInfo.subtitle} ({zoneInfo.elevationMeters})
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-[#696969] hover:text-[#1d1d1d] p-1.5 rounded-lg hover:bg-[#f4ede4] transition-colors shrink-0"
          aria-label="Tutup Panel Cuaca"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Zone Selector Tabs (Pesisir, Perkotaan, Perbukitan) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#696969]">
          Pilih Zona Wilayah Semarang:
        </span>
        <div className="grid grid-cols-3 gap-1.5 bg-[#f4ede4] p-1 rounded-xl border border-[#e8ded2]">
          {(Object.keys(SEMARANG_ZONES) as SemarangZoneId[]).map((zId) => {
            const z = SEMARANG_ZONES[zId]
            const isSelected = zId === activeZone
            return (
              <button
                key={zId}
                onClick={() => onZoneChange(zId)}
                className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#4a154b] text-white shadow-xs'
                    : 'text-[#696969] hover:text-[#1d1d1d]'
                }`}
              >
                <span>{z.name.replace('Zona ', '')}</span>
                <span className={`text-[9px] font-normal ${isSelected ? 'text-white/80' : 'text-[#696969]'}`}>
                  {zId === 'pesisir' ? 'Genuk & Tugu' : zId === 'perkotaan' ? 'Tengah & BKB' : 'Banyumanik'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Freshness & Data Quality Badge */}
      <div className="flex items-center justify-between bg-[#fdfbf9] p-2.5 rounded-xl border border-[#e6e6e6] font-mono text-[11px]">
        <div className="flex items-center gap-2">
          {isAvailable ? (
            <span className="flex items-center gap-1.5 text-[#007a5a] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              {quality?.indicator || 'LIVE OBSERVASI'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#cc4117] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#cc4117]"></span>
              DATA TEMPORARILY UNAVAILABLE
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#696969]">
          {weather?.retrieved_at_wib || 'Memuat...'}
        </span>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e6e6e6] pb-1 font-bold text-[11px]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#4a154b] text-white'
              : 'text-[#696969] hover:bg-[#f4ede4]'
          }`}
        >
          Kondisi Aktual
        </button>
        <button
          onClick={() => setActiveTab('temporal')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'temporal'
              ? 'bg-[#4a154b] text-white'
              : 'text-[#696969] hover:bg-[#f4ede4]'
          }`}
        >
          Analisis Temporal
        </button>
        <button
          onClick={() => setActiveTab('context')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'context'
              ? 'bg-[#4a154b] text-white'
              : 'text-[#696969] hover:bg-[#f4ede4]'
          }`}
        >
          Konteks Risiko
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'education'
              ? 'bg-[#4a154b] text-white'
              : 'text-[#696969] hover:bg-[#f4ede4]'
          }`}
        >
          Edukasi
        </button>
      </div>

      {/* 5. TAB 1: OVERVIEW (10 Scientific Parameters & Environmental Indicators) */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Section Title */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b]">
              Parameter Meteorologi Terpantau
            </span>
            <span className="text-[9px] text-[#696969] font-mono">
              WMO Code 4677 & BMKG
            </span>
          </div>

          {/* 10-Parameter Telemetry Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Curah Hujan */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <CloudRain className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Curah Hujan</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.rainfall.formatted ?? '0 mm/j'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.rainfall.source ?? 'Stasiun Cuaca'}
              </div>
            </div>

            {/* 2. Kecepatan Angin */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Wind className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Kecepatan Angin</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.wind.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.wind.periodDesc ?? 'Observasi 10m'}
              </div>
            </div>

            {/* 3. Hembusan Maksimum (Gust) */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Wind className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Puncak Hembusan</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.windGust.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.windGust.periodDesc ?? 'Gust Sesaat'}
              </div>
            </div>

            {/* 4. Arah Angin */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Compass className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Arah Angin</span>
              </div>
              <div className="my-1">
                <span className="text-sm font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.windDirection.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.windDirection.periodDesc ?? 'Arah Sensor'}
              </div>
            </div>

            {/* 5. Suhu Udara */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Thermometer className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Suhu Udara</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.temperature.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {weather?.weather_condition ?? 'Termonitor'}
              </div>
            </div>

            {/* 6. Kelembapan Udara */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Droplets className="w-3.5 h-3.5 text-[#007a5a]" />
                <span>Kelembapan Udara</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.humidity.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.humidity.periodDesc ?? 'Sensor 2m'}
              </div>
            </div>

            {/* 7. Tekanan Permukaan */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Gauge className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Tekanan Udara</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.pressure.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.pressure.periodDesc ?? 'Barometrik'}
              </div>
            </div>

            {/* 8. Tutupan Awan */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Cloud className="w-3.5 h-3.5 text-[#4a154b]" />
                <span>Tutupan Awan</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.cloudCover.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.cloudCover.periodDesc ?? 'Satelit'}
              </div>
            </div>

            {/* 9. Tinggi Gelombang Laut */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Waves className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Gelombang Laut</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.waveHeight.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.waveHeight.source ?? 'Marine API'}
              </div>
            </div>

            {/* 10. Periode Gelombang */}
            <div className="p-2.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[#696969] text-[10px] uppercase font-bold">
                <Waves className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Periode Gelombang</span>
              </div>
              <div className="my-1">
                <span className="text-base font-bold font-mono text-[#1d1d1d]">
                  {currentParams?.wavePeriod.formatted ?? 'N/A'}
                </span>
              </div>
              <div className="text-[9px] text-[#696969] truncate">
                {currentParams?.wavePeriod.periodDesc ?? 'Interval Muara'}
              </div>
            </div>
          </div>

          {/* Environmental Indicators Widget */}
          <EnvironmentalIndicatorsCard indicators={weather?.riskIndicators} />

          {/* Compass & Wind Widget */}
          <CompassWindWidget
            windSpeed={weather?.wind_speed_kmh ?? null}
            windGust={weather?.wind_gusts_kmh ?? null}
            compass={weather?.compass}
            advice={weather?.contextualInsights?.windGustContext.advice ?? null}
            timestamp={weather?.retrieved_at_wib}
          />
        </div>
      )}

      {/* 6. TAB 2: TEMPORAL RAIN & FORECAST TIMELINE */}
      {activeTab === 'temporal' && (
        <div className="flex flex-col gap-4">
          <RainAccumulationChart
            analysis={weather?.rainfallAnalysis}
            timestamp={weather?.retrieved_at_wib}
          />

          <WeatherTimelineWidget
            timeline={weather?.timelineForecast}
            timestamp={weather?.retrieved_at_wib}
          />
        </div>
      )}

      {/* 7. TAB 3: CONTEXTUAL SITUATIONAL AWARENESS */}
      {activeTab === 'context' && (
        <div className="flex flex-col gap-3">
          {/* Flood Implication Card */}
          <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-[#4a154b]" />
              <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                {weather?.contextualInsights?.floodRiskContext.title}
              </h4>
            </div>
            <p className="text-xs text-[#1d1d1d] leading-relaxed">
              {weather?.contextualInsights?.floodRiskContext.implication}
            </p>
            {weather?.contextualInsights?.floodRiskContext.recommendations && (
              <div className="pt-2 border-t border-[#e6e6e6] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#696969]">
                  Rekomendasi Situasional:
                </span>
                {weather.contextualInsights.floodRiskContext.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#696969]">
                    <span className="text-[#4a154b] font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coastal & Rob Context Card */}
          <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-[#0284c7]" />
              <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                {weather?.contextualInsights?.coastalRobContext.title}
              </h4>
            </div>
            <p className="text-xs text-[#1d1d1d] leading-relaxed">
              {weather?.contextualInsights?.coastalRobContext.condition}
            </p>
            {weather?.contextualInsights?.coastalRobContext.recommendations && (
              <div className="pt-2 border-t border-[#e6e6e6] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#696969]">
                  Rekomendasi Kawasan Pesisir:
                </span>
                {weather.contextualInsights.coastalRobContext.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#696969]">
                    <span className="text-[#0284c7] font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slope / Landslide Context Card */}
          <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4 text-[#d97706]" />
              <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                {weather?.contextualInsights?.slopeContext.title}
              </h4>
            </div>
            <p className="text-xs text-[#1d1d1d] leading-relaxed">
              {weather?.contextualInsights?.slopeContext.status}
            </p>
            {weather?.contextualInsights?.slopeContext.recommendations && (
              <div className="pt-2 border-t border-[#e6e6e6] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#696969]">
                  Perhatian Lereng & Drainase Tebing:
                </span>
                {weather.contextualInsights.slopeContext.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-[#696969]">
                    <span className="text-[#d97706] font-bold">•</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. TAB 4: "WHY IS THIS IMPORTANT?" EDUCATIONAL MICRO-PANEL */}
      {activeTab === 'education' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 bg-[#f9f0ff] border border-[#eddcf7] rounded-xl text-[#4a154b]">
            <span className="text-xs font-bold uppercase tracking-wider block mb-1">
              Mengapa Informasi Ini Penting?
            </span>
            <p className="text-[11px] leading-relaxed text-[#1d1d1d]">
              Platform KotaKu Siaga menerjemahkan data mentah cuaca menjadi pemahaman risiko perkotaan agar masyarakat dan petugas dapat mengambil keputusan yang tepat sebelum terjadi dampak buruk.
            </p>
          </div>

          {/* Links to Education Modules */}
          <div className="space-y-2.5">
            {weather?.whyItMatters?.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2"
              >
                <span className="text-xs font-bold text-[#1d1d1d]">
                  {item.topic}
                </span>
                <p className="text-[11px] text-[#696969] leading-relaxed">
                  {item.summary}
                </p>
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#4a154b] hover:underline pt-1 border-t border-[#e6e6e6]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#4a154b]" />
                  <span>{item.actionLabel}</span>
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Provenance & Scientific Transparency Footer */}
      <div className="p-3 rounded-xl bg-[#f4ede4]/50 border border-[#e8ded2] flex flex-col gap-1 text-[10px] font-mono text-[#696969]">
        <div className="flex items-start justify-between gap-2">
          <span>Sumber Integrasi:</span>
          <span className="text-[#1d1d1d] font-bold text-right truncate max-w-[240px]">
            {weather?.source || 'Open-Meteo, WMO, BMKG Maritim'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Koordinat Stasiun:</span>
          <span className="text-[#1d1d1d] font-bold">
            {zoneInfo.defaultCoords.lat.toFixed(4)}, {zoneInfo.defaultCoords.lon.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Sistem Drainase Terkait:</span>
          <span className="text-[#4a154b] font-bold truncate max-w-[200px]">
            {zoneInfo.drainageSystem}
          </span>
        </div>
      </div>

      {/* 10. Action Refresh */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#4a154b] hover:bg-[#3d113e] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        <span>Sinkronisasi Ulang Telemetri Cuaca</span>
      </button>
    </div>
  )
}
