'use client'

import React, { useState, useRef, useEffect, type ComponentType } from 'react'
import {
  Layers,
  Wind,
  CloudRain,
  Waves,
  Cloud,
  Gauge,
  MapPin,
  ChevronDown,
  Check,
  Info,
} from 'lucide-react'

export type WeatherLayerKey = 'gis' | 'wind' | 'radar' | 'waves' | 'clouds' | 'pressure'

interface WeatherLayerSelectorProps {
  currentLayer: WeatherLayerKey
  onSelectLayer: (layer: WeatherLayerKey) => void
  onOpenIntelligencePanel: () => void
  isPanelOpen: boolean
}

export function WeatherLayerSelector({
  currentLayer,
  onSelectLayer,
  onOpenIntelligencePanel,
  isPanelOpen,
}: WeatherLayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const LAYER_NAMES: Record<WeatherLayerKey, { title: string; category: string; icon: ComponentType<{ className?: string }> }> = {
    gis: { title: 'Peta Spasial Risiko & Titik Pantau', category: 'RISIKO LINGKUNGAN', icon: MapPin },
    wind: { title: 'Aliran Angin Permukaan (10m)', category: 'ATMOSFER', icon: Wind },
    radar: { title: 'Radar Presipitasi Hujan', category: 'ATMOSFER', icon: CloudRain },
    waves: { title: 'Tinggi Gelombang Pesisir', category: 'PESISIR', icon: Waves },
    clouds: { title: 'Tutupan & Pergerakan Awan', category: 'ATMOSFER', icon: Cloud },
    pressure: { title: 'Garis Tekanan Barometrik', category: 'ATMOSFER', icon: Gauge },
  }

  const active = LAYER_NAMES[currentLayer] || LAYER_NAMES.gis

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button with Progressive Disclosure */}
      <div className="flex items-center gap-1.5 bg-[#f4ede4] p-1 rounded-[90px] border border-[#e8ded2]">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[90px] bg-white hover:bg-[#fdfbf9] text-[#1d1d1d] border border-[#e6e6e6] shadow-2xs font-bold text-xs transition-colors cursor-pointer"
          title="Pilih Lapisan Spasial & Cuaca"
        >
          <Layers className="w-3.5 h-3.5 text-[#4a154b]" />
          <span className="hidden sm:inline text-[#696969] text-[10px] uppercase font-mono">
            Lapisan:
          </span>
          <span className="text-[#4a154b]">{active.title.split(' ')[0]}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#696969] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Intelligence Panel Trigger */}
        <button
          type="button"
          onClick={onOpenIntelligencePanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[90px] font-bold text-xs transition-all cursor-pointer ${
            isPanelOpen
              ? 'bg-[#4a154b] text-white shadow-xs'
              : 'bg-white hover:bg-[#f9f0ff] text-[#4a154b] border border-[#eddcf7]'
          }`}
          title="Buka Panel Intelijen Cuaca & Indikator Risiko"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Analisis Risiko Cuaca</span>
        </button>
      </div>

      {/* Progressive Disclosure Popover Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto z-50 w-72 bg-white/98 backdrop-blur-md rounded-2xl border border-[#e6e6e6] shadow-card p-3 font-sans text-xs flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4a154b]">
              Katalog Lapisan Spasial & Cuaca
            </span>
            <span className="text-[9px] text-[#696969] font-mono">
              Progressive Multi-Layer
            </span>
          </div>

          {/* GROUP 1: RISIKO LINGKUNGAN */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold font-mono uppercase text-[#696969] px-2 block">
              1. RISIKO LINGKUNGAN
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectLayer('gis')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                currentLayer === 'gis'
                  ? 'bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]'
                  : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#4a154b]" />
                <div>
                  <span className="block text-xs">Peta Spasial GIS</span>
                  <span className="text-[10px] text-[#696969]">Laporan kejadian, CCTV, & polder</span>
                </div>
              </div>
              {currentLayer === 'gis' && <Check className="w-4 h-4 text-[#4a154b]" />}
            </button>
          </div>

          {/* GROUP 2: ATMOSFER */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold font-mono uppercase text-[#696969] px-2 block">
              2. ATMOSFER & CUACA
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectLayer('wind')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                currentLayer === 'wind'
                  ? 'bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]'
                  : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#4a154b]" />
                <div>
                  <span className="block text-xs">Aliran Angin Permukaan</span>
                  <span className="text-[10px] text-[#696969]">Partikel angin & gust 10m</span>
                </div>
              </div>
              {currentLayer === 'wind' && <Check className="w-4 h-4 text-[#4a154b]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectLayer('radar')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                currentLayer === 'radar'
                  ? 'bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]'
                  : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-[#4a154b]" />
                <div>
                  <span className="block text-xs">Radar Presipitasi Hujan</span>
                  <span className="text-[10px] text-[#696969]">Intensitas hujan & awan konvektif</span>
                </div>
              </div>
              {currentLayer === 'radar' && <Check className="w-4 h-4 text-[#4a154b]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectLayer('clouds')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                currentLayer === 'clouds'
                  ? 'bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]'
                  : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#4a154b]" />
                <div>
                  <span className="block text-xs">Tutupan & Pergerakan Awan</span>
                  <span className="text-[10px] text-[#696969]">Fraksi awan satelit optik</span>
                </div>
              </div>
              {currentLayer === 'clouds' && <Check className="w-4 h-4 text-[#4a154b]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectLayer('pressure')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                currentLayer === 'pressure'
                  ? 'bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]'
                  : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#4a154b]" />
                <div>
                  <span className="block text-xs">Tekanan Barometrik</span>
                  <span className="text-[10px] text-[#696969]">Isobar pusat tekanan rendah</span>
                </div>
              </div>
              {currentLayer === 'pressure' && <Check className="w-4 h-4 text-[#4a154b]" />}
            </button>
          </div>

          {/* GROUP 3: PESISIR */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold font-mono uppercase text-[#696969] px-2 block">
              3. PESISIR & KELAUTAN
            </span>
            <button
              type="button"
              onClick={() => {
                onSelectLayer('waves')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                currentLayer === 'waves'
                  ? 'bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]'
                  : 'hover:bg-[#f4ede4] text-[#1d1d1d]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#0284c7]" />
                <div>
                  <span className="block text-xs">Gelombang & Ombak Laut</span>
                  <span className="text-[10px] text-[#696969]">Tinggi gelombang Laut Jawa</span>
                </div>
              </div>
              {currentLayer === 'waves' && <Check className="w-4 h-4 text-[#4a154b]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
