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

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
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
        <div
          role="menu"
          aria-label="Katalog Lapisan Spasial dan Cuaca"
          style={{ backgroundColor: '#ffffff' }}
          className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto z-[1000] w-80 sm:w-84 bg-white rounded-2xl border-2 border-[#4a154b]/30 shadow-[0_16px_48px_rgba(0,0,0,0.28)] p-3.5 font-sans text-xs flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-1 duration-150 max-w-[calc(100vw-1.5rem)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#f0e6f5] pb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4a154b] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4a154b]" />
              Katalog Lapisan Peta
            </span>
            <span className="text-[9px] bg-[#f4ede4] text-[#4a154b] px-2 py-0.5 rounded font-mono font-bold border border-[#e8ded2]">
              Realtime Multi-Layer
            </span>
          </div>

          {/* GROUP 1: RISIKO LINGKUNGAN */}
          <div className="space-y-1.5">
            <div className="bg-[#f8f5f0] border border-[#e8ded2] px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase text-[#37003c] tracking-wide">
              1. RISIKO LINGKUNGAN
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectLayer('gis')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4a154b] focus:outline-none ${
                currentLayer === 'gis'
                  ? 'bg-[#4a154b] text-white font-bold shadow-md border-2 border-[#37003c]'
                  : 'bg-[#faf8f5] hover:bg-[#f3e8f8] text-[#1a1a1a] border border-[#e5dfd5] hover:border-[#4a154b]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${currentLayer === 'gis' ? 'bg-white/20 text-white' : 'bg-white text-[#4a154b] border border-[#e5dfd5]'}`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold leading-snug ${currentLayer === 'gis' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    Peta Spasial GIS
                  </span>
                  <span className={`text-[10px] block leading-tight ${currentLayer === 'gis' ? 'text-[#f3e8f8]' : 'text-[#4b5563]'}`}>
                    Laporan kejadian, CCTV, & polder
                  </span>
                </div>
              </div>
              {currentLayer === 'gis' && (
                <div className="w-5 h-5 rounded-full bg-white text-[#4a154b] flex items-center justify-center shrink-0 shadow-xs ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          {/* GROUP 2: ATMOSFER */}
          <div className="space-y-1.5">
            <div className="bg-[#f8f5f0] border border-[#e8ded2] px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase text-[#37003c] tracking-wide">
              2. ATMOSFER & CUACA
            </div>

            {/* Angin */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectLayer('wind')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4a154b] focus:outline-none ${
                currentLayer === 'wind'
                  ? 'bg-[#4a154b] text-white font-bold shadow-md border-2 border-[#37003c]'
                  : 'bg-[#faf8f5] hover:bg-[#f3e8f8] text-[#1a1a1a] border border-[#e5dfd5] hover:border-[#4a154b]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${currentLayer === 'wind' ? 'bg-white/20 text-white' : 'bg-white text-[#4a154b] border border-[#e5dfd5]'}`}>
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold leading-snug ${currentLayer === 'wind' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    Aliran Angin Permukaan
                  </span>
                  <span className={`text-[10px] block leading-tight ${currentLayer === 'wind' ? 'text-[#f3e8f8]' : 'text-[#4b5563]'}`}>
                    Partikel angin & gust 10m
                  </span>
                </div>
              </div>
              {currentLayer === 'wind' && (
                <div className="w-5 h-5 rounded-full bg-white text-[#4a154b] flex items-center justify-center shrink-0 shadow-xs ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Radar Presipitasi */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectLayer('radar')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4a154b] focus:outline-none ${
                currentLayer === 'radar'
                  ? 'bg-[#4a154b] text-white font-bold shadow-md border-2 border-[#37003c]'
                  : 'bg-[#faf8f5] hover:bg-[#f3e8f8] text-[#1a1a1a] border border-[#e5dfd5] hover:border-[#4a154b]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${currentLayer === 'radar' ? 'bg-white/20 text-white' : 'bg-white text-[#4a154b] border border-[#e5dfd5]'}`}>
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold leading-snug ${currentLayer === 'radar' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    Radar Presipitasi Hujan
                  </span>
                  <span className={`text-[10px] block leading-tight ${currentLayer === 'radar' ? 'text-[#f3e8f8]' : 'text-[#4b5563]'}`}>
                    Intensitas hujan & awan konvektif
                  </span>
                </div>
              </div>
              {currentLayer === 'radar' && (
                <div className="w-5 h-5 rounded-full bg-white text-[#4a154b] flex items-center justify-center shrink-0 shadow-xs ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Awan */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectLayer('clouds')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4a154b] focus:outline-none ${
                currentLayer === 'clouds'
                  ? 'bg-[#4a154b] text-white font-bold shadow-md border-2 border-[#37003c]'
                  : 'bg-[#faf8f5] hover:bg-[#f3e8f8] text-[#1a1a1a] border border-[#e5dfd5] hover:border-[#4a154b]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${currentLayer === 'clouds' ? 'bg-white/20 text-white' : 'bg-white text-[#4a154b] border border-[#e5dfd5]'}`}>
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold leading-snug ${currentLayer === 'clouds' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    Tutupan & Pergerakan Awan
                  </span>
                  <span className={`text-[10px] block leading-tight ${currentLayer === 'clouds' ? 'text-[#f3e8f8]' : 'text-[#4b5563]'}`}>
                    Fraksi awan satelit optik
                  </span>
                </div>
              </div>
              {currentLayer === 'clouds' && (
                <div className="w-5 h-5 rounded-full bg-white text-[#4a154b] flex items-center justify-center shrink-0 shadow-xs ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Tekanan Barometrik */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectLayer('pressure')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4a154b] focus:outline-none ${
                currentLayer === 'pressure'
                  ? 'bg-[#4a154b] text-white font-bold shadow-md border-2 border-[#37003c]'
                  : 'bg-[#faf8f5] hover:bg-[#f3e8f8] text-[#1a1a1a] border border-[#e5dfd5] hover:border-[#4a154b]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${currentLayer === 'pressure' ? 'bg-white/20 text-white' : 'bg-white text-[#4a154b] border border-[#e5dfd5]'}`}>
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold leading-snug ${currentLayer === 'pressure' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    Tekanan Barometrik
                  </span>
                  <span className={`text-[10px] block leading-tight ${currentLayer === 'pressure' ? 'text-[#f3e8f8]' : 'text-[#4b5563]'}`}>
                    Isobar pusat tekanan rendah
                  </span>
                </div>
              </div>
              {currentLayer === 'pressure' && (
                <div className="w-5 h-5 rounded-full bg-white text-[#4a154b] flex items-center justify-center shrink-0 shadow-xs ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          {/* GROUP 3: PESISIR */}
          <div className="space-y-1.5">
            <div className="bg-[#f8f5f0] border border-[#e8ded2] px-2.5 py-1 rounded-md text-[10px] font-bold font-mono uppercase text-[#37003c] tracking-wide">
              3. PESISIR & KELAUTAN
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSelectLayer('waves')
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#4a154b] focus:outline-none ${
                currentLayer === 'waves'
                  ? 'bg-[#4a154b] text-white font-bold shadow-md border-2 border-[#37003c]'
                  : 'bg-[#faf8f5] hover:bg-[#f3e8f8] text-[#1a1a1a] border border-[#e5dfd5] hover:border-[#4a154b]/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 ${currentLayer === 'waves' ? 'bg-white/20 text-white' : 'bg-white text-[#0284c7] border border-[#e5dfd5]'}`}>
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <span className={`block text-xs font-bold leading-snug ${currentLayer === 'waves' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                    Gelombang & Ombak Laut
                  </span>
                  <span className={`text-[10px] block leading-tight ${currentLayer === 'waves' ? 'text-[#f3e8f8]' : 'text-[#4b5563]'}`}>
                    Tinggi gelombang Laut Jawa
                  </span>
                </div>
              </div>
              {currentLayer === 'waves' && (
                <div className="w-5 h-5 rounded-full bg-white text-[#4a154b] flex items-center justify-center shrink-0 shadow-xs ml-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
