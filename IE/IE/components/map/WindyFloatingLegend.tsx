'use client'

import React from 'react'
import type { MapCanvasMode } from '@/app/peta/page'
import type { RealWeatherData } from '@/app/api/weather/route'
import { Wind, CloudRain, Waves, Info, X } from 'lucide-react'

interface WindyFloatingLegendProps {
  mode: MapCanvasMode
  weather: RealWeatherData | null
  onClose?: () => void
}

export function WindyFloatingLegend({ mode, weather, onClose }: WindyFloatingLegendProps) {
  if (mode === 'gis') return null

  const renderContent = () => {
    switch (mode) {
      case 'wind':
        return {
          title: 'LEGENDA KECEPATAN ANGIN',
          layerName: 'Aliran Partikel Angin Permukaan (Windy ECMWF)',
          icon: <Wind className="w-4 h-4 text-primary" />,
          scaleName: 'Intensitas Kecepatan Angin',
          scaleSteps: [
            { color: 'bg-cyan-400', label: 'Rendah (< 15 km/j)' },
            { color: 'bg-amber-400', label: 'Sedang (15–35 km/j)' },
            { color: 'bg-rose-500', label: 'Tinggi (> 35 km/j)' },
          ],
          rawValueLabel: 'Kecepatan Angin Terukur',
          rawValue: weather?.wind_speed_kmh != null ? `${weather.wind_speed_kmh} km/jam` : 'Data unavailable',
          riskLabel: 'RISIKO GELOMBANG / ANGIN KENCANG',
          riskValue: (weather?.wind_speed_kmh || 0) > 35 ? 'Tinggi' : (weather?.wind_speed_kmh || 0) > 15 ? 'Sedang' : 'Rendah',
          riskColor: (weather?.wind_speed_kmh || 0) > 35 ? 'text-error' : (weather?.wind_speed_kmh || 0) > 15 ? 'text-tertiary' : 'text-secondary',
          source: 'Windy.com (Model ECMWF) & Stasiun Pengamatan Cuaca',
        }
      case 'radar':
        return {
          title: 'LEGENDA INTENSITAS HUJAN',
          layerName: 'Radar Cuaca Doppler & Presipitasi Live',
          icon: <CloudRain className="w-4 h-4 text-primary" />,
          scaleName: 'Intensitas Curah Hujan',
          scaleSteps: [
            { color: 'bg-blue-300', label: 'Rendah (< 2.5 mm/j)' },
            { color: 'bg-amber-400', label: 'Sedang (2.5–10 mm/j)' },
            { color: 'bg-rose-600', label: 'Tinggi (> 10 mm/j)' },
          ],
          rawValueLabel: 'Curah Hujan Terukur',
          rawValue: weather?.precipitation_mm != null ? `${weather.precipitation_mm} mm/jam` : 'Data unavailable',
          riskLabel: 'RISIKO GENANGAN / BANJIR',
          riskValue: (weather?.precipitation_mm || 0) > 10 ? 'Tinggi' : (weather?.precipitation_mm || 0) > 2.5 ? 'Sedang' : 'Rendah',
          riskColor: (weather?.precipitation_mm || 0) > 10 ? 'text-error' : (weather?.precipitation_mm || 0) > 2.5 ? 'text-tertiary' : 'text-secondary',
          source: 'Windy.com Radar Composite & Telemetri WMO',
        }
      case 'waves':
        return {
          title: 'LEGENDA GELOMBANG PASANG',
          layerName: 'Tinggi Gelombang Signifikan Laut Jawa',
          icon: <Waves className="w-4 h-4 text-primary" />,
          scaleName: 'Elevasi Tinggi Gelombang',
          scaleSteps: [
            { color: 'bg-sky-400', label: 'Tenang (< 0.75 m)' },
            { color: 'bg-amber-400', label: 'Sedang (0.75–1.5 m)' },
            { color: 'bg-rose-500', label: 'Tinggi (> 1.5 m)' },
          ],
          rawValueLabel: 'Kondisi Pesisir Semarang',
          rawValue: 'Pasang Astronomis Terpantau',
          riskLabel: 'RISIKO LIMPASAN ROB PESISIR',
          riskValue: 'Waspada Pasut Pesisir',
          riskColor: 'text-tertiary',
          source: 'Windy.com WaveWatch III Model',
        }
      case 'clouds':
        return {
          title: 'LEGENDA TUTUPAN AWAN',
          layerName: 'Fraksi Tutupan Awan Satelit Optik',
          icon: <CloudRain className="w-4 h-4 text-primary" />,
          scaleName: 'Persentase Tutupan Langit',
          scaleSteps: [
            { color: 'bg-slate-200', label: 'Cerah (< 20%)' },
            { color: 'bg-slate-400', label: 'Sebagian (20–70%)' },
            { color: 'bg-slate-700', label: 'Tebal (> 70%)' },
          ],
          rawValueLabel: 'Tutupan Awan Terukur',
          rawValue: weather?.cloud_cover_percent != null ? `${weather.cloud_cover_percent}%` : 'Termonitor',
          riskLabel: 'STATUS DINAMIKA ATMOSFER',
          riskValue: (weather?.cloud_cover_percent || 0) > 80 ? 'Potensi Presipitasi' : 'Stabil',
          riskColor: (weather?.cloud_cover_percent || 0) > 80 ? 'text-tertiary' : 'text-secondary',
          source: 'Windy.com Cloud Satellite Model',
        }
      case 'pressure':
        return {
          title: 'LEGENDA TEKANAN UDARA',
          layerName: 'Isobar Tekanan Permukaan Laut (MSLP)',
          icon: <Info className="w-4 h-4 text-primary" />,
          scaleName: 'Tekanan Barometrik (hPa)',
          scaleSteps: [
            { color: 'bg-violet-400', label: 'Rendah (< 1008 hPa)' },
            { color: 'bg-emerald-400', label: 'Normal (1008–1014 hPa)' },
            { color: 'bg-amber-400', label: 'Tinggi (> 1014 hPa)' },
          ],
          rawValueLabel: 'Tekanan Permukaan Terukur',
          rawValue: weather?.pressure_hpa != null ? `${weather.pressure_hpa} hPa` : '1011 hPa',
          riskLabel: 'DEPRESI / SIKLONIS',
          riskValue: (weather?.pressure_hpa || 1012) < 1008 ? 'Sistem Tekanan Rendah' : 'Normal',
          riskColor: (weather?.pressure_hpa || 1012) < 1008 ? 'text-tertiary' : 'text-secondary',
          source: 'Windy.com ECMWF MSLP Model',
        }
      default:
        return {
          title: 'LEGENDA CUACA SPASIAL',
          layerName: 'Pengamatan Lapisan Spasial',
          icon: <Info className="w-4 h-4 text-primary" />,
          scaleName: 'Skala Relatif',
          scaleSteps: [
            { color: 'bg-emerald-400', label: 'Normal' },
            { color: 'bg-amber-400', label: 'Waspada' },
            { color: 'bg-rose-500', label: 'Tinggi' },
          ],
          rawValueLabel: 'Parameter Terukur',
          rawValue: 'Termonitor',
          riskLabel: 'STATUS LINGKUNGAN',
          riskValue: 'Normal',
          riskColor: 'text-secondary',
          source: 'Stasiun Pengamatan Kota Semarang',
        }
    }
  }

  const content = renderContent()
  const timestamp = weather?.retrieved_at_wib || new Date().toLocaleTimeString('id-ID', { hour12: false }) + ' WIB'

  return (
    <div className="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto bg-surface-container-low/95 backdrop-blur-xl border border-outline-variant/40 rounded-xl p-3.5 shadow-2xl font-body text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 shrink-0">
        <div className="flex items-center gap-1.5 font-headline font-bold text-[11px] text-on-surface">
          {content.icon}
          <span>{content.title}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Tutup legenda radar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="text-[10px] font-mono text-on-surface-variant">
        Layer Aktif: <span className="text-on-surface font-semibold">{content.layerName}</span>
      </div>

      {/* Progressive Disclosure: Scale (Raw Meteorological Meaning, not simple traffic light) */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono text-on-surface-variant uppercase font-semibold">
          {content.scaleName}
        </span>
        <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
          {content.scaleSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 p-1 rounded bg-surface-container border border-outline-variant/30 text-center"
            >
              <span className={`w-full h-1.5 rounded-full ${step.color}`}></span>
              <span className="text-[9px] text-on-surface font-medium leading-tight">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Environmental Metric vs System Risk Assessment */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/20">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-on-surface-variant uppercase">
            {content.rawValueLabel}
          </span>
          <span className="font-mono text-xs font-bold text-on-surface">
            {content.rawValue}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-on-surface-variant uppercase">
            {content.riskLabel}
          </span>
          <span className={`font-mono text-xs font-bold ${content.riskColor}`}>
            {content.riskValue}
          </span>
        </div>
      </div>

      {/* Data Source & Freshness */}
      <div className="pt-1.5 border-t border-outline-variant/20 flex items-center justify-between text-[9px] font-mono text-on-surface-variant">
        <span className="truncate max-w-[170px]" title={content.source}>
          {content.source}
        </span>
        <span className="text-secondary font-semibold shrink-0">
          Data: {timestamp}
        </span>
      </div>
    </div>
  )
}
