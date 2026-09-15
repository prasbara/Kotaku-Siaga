'use client'

import React, { useEffect, useState } from 'react'
import { CloudRain, MapPin, Video, Compass } from 'lucide-react'
import type { RealWeatherData } from '@/app/api/weather/route'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'

interface IncidentWeatherCorrelationCardProps {
  latitude: number
  longitude: number
  reportCreatedAt: string
  districtName?: string
}

// Haversine distance calculator in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Number((R * c).toFixed(1))
}

export function IncidentWeatherCorrelationCard({
  latitude,
  longitude,
  reportCreatedAt,
}: IncidentWeatherCorrelationCardProps) {
  const [localWeather, setLocalWeather] = useState<RealWeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function fetchLocalTelemetry() {
      try {
        const res = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`)
        const data = await res.json()
        if (isMounted) setLocalWeather(data)
      } catch (err) {
        console.error('Gagal mengambil korelasi cuaca laporan:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchLocalTelemetry()
    return () => {
      isMounted = false
    }
  }, [latitude, longitude])

  // Find nearest CCTV
  const cctvDistances = PANTAUSEMAR_CCTV_POINTS.map((cctv) => ({
    cctv,
    distanceKm: getDistanceKm(latitude, longitude, cctv.latitude, cctv.longitude),
  })).sort((a, b) => a.distanceKm - b.distanceKm)

  const nearestCCTV = cctvDistances[0]

  // Distance to Semarang coast (approx northern shoreline lat ~ -6.94)
  const distanceToCoastKm = Math.max(
    0,
    Number((Math.abs(latitude - -6.94) * 111).toFixed(1))
  )

  const rainMm = localWeather?.precipitation_mm ?? 0
  const windKmh = localWeather?.wind_speed_kmh ?? 0
  const windDir = localWeather?.compass?.cardinal8 ?? 'U'
  const elevationDesc = localWeather?.zone?.elevationMeters ?? '3 - 25 m DPL'

  return (
    <div className="p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b]">
            <CloudRain className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider font-mono">
            Korelasi Meteorologi Kejadian
          </span>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#1d1d1d] font-bold">
          SITUATIONAL CONTEXT
        </span>
      </div>

      {/* 1. CURRENT LOCAL WEATHER */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono">
        <div className="p-2 rounded-lg bg-[#fdfbf9] border border-[#e6e6e6]">
          <span className="text-[9px] text-[#696969] block uppercase">Curah Hujan</span>
          <span className="text-sm font-bold text-[#1d1d1d]">{rainMm} mm/j</span>
        </div>
        <div className="p-2 rounded-lg bg-[#fdfbf9] border border-[#e6e6e6]">
          <span className="text-[9px] text-[#696969] block uppercase">Angin Terpantau</span>
          <span className="text-sm font-bold text-[#1d1d1d]">{windKmh} km/j</span>
        </div>
        <div className="p-2 rounded-lg bg-[#fdfbf9] border border-[#e6e6e6]">
          <span className="text-[9px] text-[#696969] block uppercase">Arah Angin</span>
          <span className="text-sm font-bold text-[#4a154b]">{windDir}</span>
        </div>
      </div>

      {/* 2. NEARBY SPATIAL CONTEXT */}
      <div className="p-2.5 rounded-lg bg-[#fdfbf9] border border-[#e6e6e6] space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-[#696969] flex items-center gap-1">
            <Video className="w-3 h-3 text-[#4a154b]" />
            CCTV Terdekat:
          </span>
          <span className="font-semibold text-[#1d1d1d] truncate max-w-[180px]">
            {nearestCCTV ? `${nearestCCTV.cctv.name} (${nearestCCTV.distanceKm} km)` : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#696969] flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#4a154b]" />
            Estimasi Elevasi:
          </span>
          <span className="font-semibold text-[#1d1d1d]">{elevationDesc}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#696969] flex items-center gap-1">
            <Compass className="w-3 h-3 text-[#4a154b]" />
            Jarak ke Garis Pesisir:
          </span>
          <span className="font-semibold text-[#1d1d1d]">~{distanceToCoastKm} km</span>
        </div>
      </div>

      {/* 3. SCIENTIFIC WEATHER CONTEXT */}
      <div className="p-2.5 rounded-lg bg-[#f4ede4]/60 border border-[#e8ded2] text-xs leading-relaxed text-[#1d1d1d]">
        <span className="font-bold block mb-1 text-[#4a154b]">
          Analisis Konteks Cuaca & Laporan:
        </span>
        <p className="text-[11px] leading-snug">
          {rainMm > 5
            ? 'Data menunjukkan adanya kondisi hujan sedang/tinggi yang berdekatan dengan waktu laporan pada zona wilayah ini.'
            : rainMm > 0
            ? 'Data menunjukkan adanya intensitas hujan ringan di sekitar koordinat laporan saat ini.'
            : 'Saat ini tidak terdeteksi presipitasi aktif di titik laporan. Genangan mungkin berasal dari limpasan hulu, drainase tersumbat, atau akumulasi hujan jam sebelumnya.'}
        </p>
      </div>

      {/* 4. EXPLICIT TIMESTAMPS COMPARISON */}
      <div className="pt-2 border-t border-[#e6e6e6] flex flex-col gap-1 text-[10px] font-mono text-[#696969]">
        <div className="flex items-center justify-between">
          <span>Waktu Laporan Kejadian:</span>
          <span className="text-[#1d1d1d] font-bold">
            {new Date(reportCreatedAt).toLocaleTimeString('id-ID', {
              timeZone: 'Asia/Jakarta',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            WIB
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Waktu Observasi Cuaca:</span>
          <span className="text-[#4a154b] font-bold">
            {localWeather?.retrieved_at_wib || 'Waktu aktual stasiun'}
          </span>
        </div>
      </div>
    </div>
  )
}
