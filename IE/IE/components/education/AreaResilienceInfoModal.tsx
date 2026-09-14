'use client'

import React from 'react'
import Link from 'next/link'
import {
  X,
  MapPin,
  BookOpen,
  ArrowRight,
  Camera,
  Layers
} from 'lucide-react'
import { getRecommendedModuleForLocation } from '@/lib/data/education-resilience'
import { PANTAUSEMAR_CCTV_POINTS, type CCTVPoint } from '@/lib/data/cctv-pantausemar'

interface AreaResilienceInfoModalProps {
  isOpen: boolean
  onClose: () => void
  latitude: number
  longitude: number
  areaName?: string
  reportsCount?: number
}

export function AreaResilienceInfoModal({
  isOpen,
  onClose,
  latitude,
  longitude,
  areaName = 'Kawasan Terpilih',
  reportsCount = 3,
}: AreaResilienceInfoModalProps) {
  if (!isOpen) return null

  // Geografic classification based on latitude
  const isCoastal = latitude > -6.98
  const isHilly = latitude < -7.03
  const topography = isCoastal
    ? 'Pesisir Pantai Dataran Aluvial Rendah (Elevasi 0 - 2 m DPL)'
    : isHilly
    ? 'Zona Perbukitan Bergelombang Terjal (Elevasi > 120 m DPL)'
    : 'Dataran Rendah Perkotaan (Elevasi 3 - 25 m DPL)'

  const potentialRisk = isCoastal
    ? 'Banjir Rob Pasang Laut, Intrusi Air Asin, dan Land Subsidence'
    : isHilly
    ? 'Gerakan Tanah Lereng, Erosi Alur Tebing, dan Longsoran Dangkal'
    : 'Genangan Limpasan Jalan, Penyempitan Gorong-Gorong, dan Efek Arus Balik'

  const riverProximity = isCoastal
    ? 'Muara Kali Tenggang & Banjir Kanal Timur (< 500m)'
    : isHilly
    ? 'Hulu Aliran Kali Garang & Kali Kripik'
    : 'Saluran Primer Drainase Perkotaan (< 250m)'

  const coastProximity = isCoastal
    ? 'Garis Pantai Laut Jawa (< 1.5 km)'
    : isHilly
    ? 'Jauh dari Pesisir (> 12 km)'
    : 'Zona Penyangga Pesisir (3 - 6 km)'

  const infrastructure = isCoastal
    ? 'Rumah Pompa Sringin, Pompa Tenggang, Tanggul Laut Tambaklorok'
    : isHilly
    ? 'Dinding Penahan Tanah (Talud Bronjong) & Saluran Sulingan Lereng'
    : 'Sistem Saluran Sekunder Kali Semarang & Polder Kalibaru'

  // Nearest CCTV from PantauSemar
  const nearestCCTV: CCTVPoint | undefined = PANTAUSEMAR_CCTV_POINTS.find((c) => {
    const dist = Math.sqrt(Math.pow(c.latitude - latitude, 2) + Math.pow(c.longitude - longitude, 2))
    return dist < 0.05
  }) || PANTAUSEMAR_CCTV_POINTS[0]

  const recommendedModule = getRecommendedModuleForLocation(latitude, longitude)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#e6e6e6] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#4a154b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#f4ede4]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#eddcf7] block font-bold">
                PROFIL KETAHANAN KAWASAN
              </span>
              <h3 className="font-bold text-lg text-white">{areaName}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Key Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#696969] block">
                Topografi & Elevasi
              </span>
              <div className="font-bold text-[#1d1d1d]">{topography}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#cc4117] block">
                Potensi Risiko Utama
              </span>
              <div className="font-bold text-[#1d1d1d]">{potentialRisk}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#1264a3] block">
                Kedekatan Sungai / Saluran
              </span>
              <div className="font-bold text-[#1d1d1d]">{riverProximity}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#007a5a] block">
                Kedekatan Garis Pantai
              </span>
              <div className="font-bold text-[#1d1d1d]">{coastProximity}</div>
            </div>
          </div>

          {/* Infrastructure & CCTV Context */}
          <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#4a154b]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Infrastruktur Terkait Kawasan:
              </span>
              <span className="font-mono text-[10px] text-[#696969]">
                {reportsCount} Laporan Terdaftar
              </span>
            </div>
            <p className="text-[#1d1d1d] leading-relaxed">
              {infrastructure}
            </p>

            {nearestCCTV && (
              <div className="pt-2 border-t border-[#ebdccb] flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-bold text-[#1d1d1d]">
                  <Camera className="w-3.5 h-3.5 text-[#007a5a]" />
                  CCTV PantauSemar Terdekat:
                </span>
                <span className="font-mono text-[#4a154b] font-bold">
                  {nearestCCTV.name} ({nearestCCTV.code})
                </span>
              </div>
            )}
          </div>

          {/* Action CTA: Pelajari Mengapa Area Ini Berisiko (Requirement #7) */}
          <div className="p-4 rounded-xl bg-[#f9f0ff] border-2 border-[#4a154b]/30 flex flex-col gap-2">
            <div className="text-[11px] font-mono font-bold uppercase text-[#4a154b]">
              Edukasi Berbasis Lokasi:
            </div>
            <h4 className="font-bold text-sm text-[#1d1d1d]">
              Pelajari Mengapa Area Ini Berisiko
            </h4>
            <p className="text-[11px] text-[#696969] leading-relaxed">
              Pahami dinamika sains di balik kerentanan kawasan {areaName} dan langkah mitigasi mandiri yang dapat dilakukan warga.
            </p>

            <Link
              href={`/edukasi?modul=${recommendedModule.slug}`}
              onClick={onClose}
              className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#4a154b] hover:bg-[#611f69] text-white font-bold text-xs shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Buka Modul: {recommendedModule.title}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#fdfbf9] border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
          <span>Koordinat: {latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-[#e6e6e6] hover:bg-[#f4ede4] text-[#1d1d1d] font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
