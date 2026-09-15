'use client'

import React, { useState } from 'react'
import {
  Layers,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Waves,
  Mountain,
  Navigation,
  Building,
  Users,
  Video,
  History,
  Satellite,
  Gauge,
  Activity,
  Zap,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdminMapLayersState {
  floodRisk: boolean
  robRisk: boolean
  rainfall: boolean
  elevation: boolean
  coastline: boolean
  rivers: boolean
  roads: boolean
  buildings: boolean
  citizenReports: boolean
  cctv: boolean
  historicalEvents: boolean
  satelliteObservation: boolean
  dataConfidence: boolean
  dataSourceStatus: boolean
  infrastructureExposure: boolean
  dataQuality: boolean
}

export const DEFAULT_ADMIN_LAYERS: AdminMapLayersState = {
  floodRisk: true,
  robRisk: true,
  rainfall: true,
  elevation: true,
  coastline: true,
  rivers: true,
  roads: false,
  buildings: false,
  citizenReports: true,
  cctv: true,
  historicalEvents: true,
  satelliteObservation: true,
  dataConfidence: true,
  dataSourceStatus: false,
  infrastructureExposure: true,
  dataQuality: true,
}

interface AdminTacticalLayerControlProps {
  layers: AdminMapLayersState
  onToggleLayer: (key: keyof AdminMapLayersState) => void
  onSelectAll?: () => void
  onResetDefault?: () => void
  className?: string
}

export function AdminTacticalLayerControl({
  layers,
  onToggleLayer,
  onSelectAll,
  onResetDefault,
  className,
}: AdminTacticalLayerControlProps) {
  const [isOpen, setIsOpen] = useState(true)

  const layerItems: Array<{
    key: keyof AdminMapLayersState
    label: string
    category: 'RISK' | 'HYDROLOGY' | 'SURFACE' | 'SENSORS' | 'OBSERVABILITY'
    icon: React.ComponentType<{ className?: string }>
    badge?: string
    color: string
  }> = [
    { key: 'floodRisk', label: 'Flood Risk (Banjir)', category: 'RISK', icon: Waves, badge: '5 Zona', color: '#e01e5a' },
    { key: 'robRisk', label: 'Rob Risk (Pasang Pesisir)', category: 'RISK', icon: Waves, badge: 'Pesisir Utara', color: '#1264a3' },
    { key: 'rainfall', label: 'Rainfall Radar (Curah Hujan)', category: 'HYDROLOGY', icon: CloudRain, badge: 'Open-Meteo', color: '#3860be' },
    { key: 'elevation', label: 'Elevation (DEM 0-350m DPL)', category: 'HYDROLOGY', icon: Mountain, badge: 'Ina-Geoportal', color: '#8d6e63' },
    { key: 'coastline', label: 'Coastline (Garis Pantai Pantura)', category: 'HYDROLOGY', icon: Navigation, badge: 'Muara Laut', color: '#007a5a' },
    { key: 'rivers', label: 'Rivers & Canals (Garang, KBT, Tenggang)', category: 'HYDROLOGY', icon: Waves, badge: '6 Saluran', color: '#1264a3' },
    { key: 'roads', label: 'Roads & Logistics (Pantura Kaligawe)', category: 'SURFACE', icon: Navigation, badge: 'Arteri', color: '#ec942c' },
    { key: 'buildings', label: 'Buildings & Critical Facilities', category: 'SURFACE', icon: Building, badge: 'Fasum', color: '#696969' },
    { key: 'citizenReports', label: 'Citizen Reports (Laporan Terverifikasi)', category: 'SENSORS', icon: Users, badge: 'Crowd-Sourced', color: '#4a154b' },
    { key: 'cctv', label: 'CCTV PantauSemar (Streaming Diskominfo)', category: 'SENSORS', icon: Video, badge: '70 Titik', color: '#007a5a' },
    { key: 'historicalEvents', label: 'Historical Events (Arsip Bencana BPBD)', category: 'SENSORS', icon: History, badge: 'DIBI BNPB', color: '#b45309' },
    { key: 'satelliteObservation', label: 'Satellite Observation (Sentinel-1 SAR)', category: 'SENSORS', icon: Satellite, badge: 'ESA Sentinel', color: '#6b21a8' },
    { key: 'dataConfidence', label: 'Data Confidence Metric (Tingkat Keyakinan)', category: 'OBSERVABILITY', icon: Gauge, badge: '86% Avg', color: '#007a5a' },
    { key: 'dataSourceStatus', label: 'Data Source Status (Live Health Indicator)', category: 'OBSERVABILITY', icon: Activity, badge: '8 API', color: '#4a154b' },
    { key: 'infrastructureExposure', label: 'Infrastructure Exposure (Pompa & RS)', category: 'OBSERVABILITY', icon: Zap, badge: '5 Pompa', color: '#e01e5a' },
    { key: 'dataQuality', label: 'Data Quality & Freshness Indicator', category: 'OBSERVABILITY', icon: ShieldCheck, badge: 'Honest Nulls', color: '#007a5a' },
  ]

  const activeCount = Object.values(layers).filter(Boolean).length

  return (
    <div
      className={cn(
        'rounded-xl bg-white/95 backdrop-blur-md border border-[#e6e6e6] shadow-xl text-xs overflow-hidden transition-all duration-200',
        className
      )}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-[#4a154b] text-white flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#f4ede4]" />
          <span className="font-bold text-[13px] tracking-wide">
            Layer Taktis Admin EOC
          </span>
          <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {activeCount}/16 Aktif
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-white/80">
          <span className="text-[11px] font-mono hidden sm:inline">
            {isOpen ? 'Tutup' : 'Buka'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 space-y-3 max-h-[420px] overflow-y-auto">
          {/* Quick toggle actions */}
          <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2 text-[11px]">
            <span className="text-[#696969] font-medium">Kontrol Cepat:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onSelectAll) onSelectAll()
                }}
                className="text-[#4a154b] hover:underline font-bold flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Semua
              </button>
              <span className="text-[#dcdcdc]">•</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (onResetDefault) onResetDefault()
                }}
                className="text-[#696969] hover:underline font-bold flex items-center gap-1"
              >
                <EyeOff className="w-3 h-3" />
                Default
              </button>
            </div>
          </div>

          {/* 16 Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {layerItems.map((item) => {
              const isChecked = Boolean(layers[item.key])
              const Icon = item.icon

              return (
                <div
                  key={item.key}
                  onClick={() => onToggleLayer(item.key)}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all select-none border',
                    isChecked
                      ? 'bg-[#faf7f9] border-[#4a154b]/30 shadow-2xs'
                      : 'bg-[#fafafa] border-[#e6e6e6] opacity-60 hover:opacity-90'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 text-[#4a154b]">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#4a154b]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#888]" />
                      )}
                    </div>
                    <Icon className="w-3.5 h-3.5 shrink-0 text-[#696969]" />
                    <span className={cn('truncate text-[11.5px]', isChecked ? 'font-bold text-[#1d1d1d]' : 'text-[#696969]')}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span
                      className="ml-1 shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-[#e6e6e6] text-[#4a154b]"
                      style={{ borderLeftColor: item.color, borderLeftWidth: '2px' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="pt-2 border-t border-[#f0f0f0] text-[10.5px] text-[#696969] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a] shrink-0" />
            <span>Layer taktis ini dilindungi otentikasi peran (RBAC Operator EOC) dan tidak dibocorkan ke dashboard publik.</span>
          </div>
        </div>
      )}
    </div>
  )
}
