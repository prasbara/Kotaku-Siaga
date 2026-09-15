'use client'

import React, { useEffect, useState } from 'react'
import { CloudRain, ShieldAlert } from 'lucide-react'
import type { RealWeatherData } from '@/app/api/weather/route'
import type { CCTVPoint } from '@/lib/data/cctv-pantausemar'
import type { Report } from '@/types'

interface CCTVWeatherCorrelationCardProps {
  cctv: CCTVPoint
  cctvLastChecked: string
}

// Distance helper
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

export function CCTVWeatherCorrelationCard({
  cctv,
  cctvLastChecked,
}: CCTVWeatherCorrelationCardProps) {
  const [weather, setWeather] = useState<RealWeatherData | null>(null)
  const [nearbyReportsCount, setNearbyReportsCount] = useState<number>(0)
  const [closestReportDist, setClosestReportDist] = useState<number | null>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchTelemetryAndReports() {
      try {
        const [weatherRes, reportsRes] = await Promise.allSettled([
          fetch(`/api/weather?lat=${cctv.latitude}&lon=${cctv.longitude}`),
          fetch('/api/reports?limit=50'),
        ])

        if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
          const wData = await weatherRes.value.json()
          if (isMounted) setWeather(wData)
        }

        if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
          const rData = await reportsRes.value.json()
          const reports: Report[] = rData.data || []
          // Filter reports within 3km of this CCTV
          const withDist = reports.map((r) => ({
            ...r,
            dist: getDistanceKm(cctv.latitude, cctv.longitude, r.latitude ?? 0, r.longitude ?? 0),
          })).filter((r) => r.dist <= 3.0)

          if (isMounted) {
            setNearbyReportsCount(withDist.length)
            if (withDist.length > 0) {
              const sorted = withDist.sort((a, b) => a.dist - b.dist)
              setClosestReportDist(sorted[0].dist)
            }
          }
        }
      } catch (err) {
        console.error('Gagal mengambil korelasi CCTV:', err)
      }
    }

    fetchTelemetryAndReports()
    return () => {
      isMounted = false
    }
  }, [cctv])

  return (
    <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
        <span className="font-mono text-[10px] uppercase text-primary font-bold tracking-wider flex items-center gap-1.5">
          <CloudRain className="w-3.5 h-3.5" />
          Kondisi Lingkungan Sekitar CCTV
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
          TELEMETRI SPASIAL
        </span>
      </div>

      {/* Grid of Weather at CCTV Point */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <span className="text-[10px] text-on-surface-variant block uppercase">Kondisi Cuaca</span>
          <span className="font-bold text-on-surface text-[11px] truncate block">
            {weather?.weather_condition || 'Termonitor'}
          </span>
          <span className="text-[10px] text-primary font-bold">
            {weather?.precipitation_mm != null ? `${weather.precipitation_mm} mm/j` : '0 mm/j'}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <span className="text-[10px] text-on-surface-variant block uppercase">Kecepatan Angin</span>
          <span className="font-bold text-on-surface text-[11px] block">
            {weather?.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/j` : 'N/A'}
          </span>
          <span className="text-[10px] text-secondary font-bold">
            {weather?.compass?.cardinal8 ? `Arah ${weather.compass.cardinal8}` : 'Stabil'}
          </span>
        </div>
      </div>

      {/* Related Incidents Nearby */}
      <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-tertiary shrink-0" />
          <div>
            <span className="text-on-surface font-bold block">
              {nearbyReportsCount} Laporan Kejadian di Radius 3 km
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {closestReportDist != null
                ? `Laporan terdekat berjarak ${closestReportDist} km dari kamera`
                : 'Tidak ada laporan aktif dalam radius 3 km'}
            </span>
          </div>
        </div>
      </div>

      {/* Explicit Timestamps Comparison */}
      <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-1 text-[10px] font-mono text-on-surface-variant">
        <div className="flex items-center justify-between">
          <span>Pengecekan Stream CCTV:</span>
          <span className="text-on-surface font-semibold">{cctvLastChecked}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Observasi Sensor Cuaca:</span>
          <span className="text-primary font-semibold">
            {weather?.retrieved_at_wib || 'Data sinkron'}
          </span>
        </div>
      </div>
    </div>
  )
}
