'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  MessageCircle,
} from 'lucide-react'
import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'
import { DisasterShareModal } from '@/components/public/DisasterShareModal'

interface DistrictQuickRisk {
  slug: string
  name: string
  elevation: number
  riskLevel: 'RENDAH' | 'SEDANG' | 'WASPADA' | 'KRITIS'
  avoidRoads: string[]
  safeShelter: string
  contactPhone: string
}

const DISTRICT_LITE_DATA: Record<string, DistrictQuickRisk> = {
  'genuk': {
    slug: 'genuk',
    name: 'Kecamatan Genuk',
    elevation: 2.8,
    riskLevel: 'KRITIS',
    avoidRoads: ['Jl. Raya Kaligawe (Depan RSI Sultan Agung)', 'Jembatan Kali Babon', 'Jl. Wolter Monginsidi'],
    safeShelter: 'Kantor Kecamatan Genuk / Balai Kelurahan Bangetayu Wetan',
    contactPhone: '024-6581234',
  },
  'semarang-utara': {
    slug: 'semarang-utara',
    name: 'Kecamatan Semarang Utara',
    elevation: 2.1,
    riskLevel: 'KRITIS',
    avoidRoads: ['Kawasan Pelabuhan Tanjung Emas (Jl. Coaster)', 'Jl. Bandarharjo', 'Sekitar Stasiun Tawang'],
    safeShelter: 'Kantor Kecamatan Semarang Utara (Jl. Bandarharjo)',
    contactPhone: '024-3545678',
  },
  'gayamsari': {
    slug: 'gayamsari',
    name: 'Kecamatan Gayamsari',
    elevation: 3.5,
    riskLevel: 'WASPADA',
    avoidRoads: ['Jl. Gajah Raya (Akses MAJT)', 'Jl. Tambak Dalam Raya', 'Bawah Flyover Kaligawe'],
    safeShelter: 'Balai Kelurahan Gayamsari / Masjid Agung Jawa Tengah (Area Tinggi)',
    contactPhone: '024-6712345',
  },
  'pedurungan': {
    slug: 'pedurungan',
    name: 'Kecamatan Pedurungan',
    elevation: 6.0,
    riskLevel: 'SEDANG',
    avoidRoads: ['Jl. Wolter Monginsidi (Gasem)', 'Perumahan Tlogosari (Taman Tlogosari)'],
    safeShelter: 'Kantor Kecamatan Pedurungan (Jl. Majapahit)',
    contactPhone: '024-6723456',
  },
  'tugu': {
    slug: 'tugu',
    name: 'Kecamatan Tugu',
    elevation: 3.0,
    riskLevel: 'WASPADA',
    avoidRoads: ['Jl. Raya Mangkang (Depan Pasar Mangkang)', 'Jembatan Kali Beringin Mangkang Wetan'],
    safeShelter: 'Kantor Kecamatan Tugu (Jl. Walisongo)',
    contactPhone: '024-8661234',
  },
  'tembalang': {
    slug: 'tembalang',
    name: 'Kecamatan Tembalang',
    elevation: 180.0,
    riskLevel: 'RENDAH',
    avoidRoads: ['Tikungan Curam Sigar Bencah (Saat Hujan Lebat)', 'Tanjakan Bukit Sari'],
    safeShelter: 'Kantor Kecamatan Tembalang / GSG Undip Tembalang',
    contactPhone: '024-7471234',
  },
  'banyumanik': {
    slug: 'banyumanik',
    name: 'Kecamatan Banyumanik',
    elevation: 210.0,
    riskLevel: 'RENDAH',
    avoidRoads: ['Tanjakan Gombel Baru / Gombel Lama', 'Jl. Perintis Kemerdekaan'],
    safeShelter: 'Kantor Kecamatan Banyumanik (Jl. Jenderal Sudirman)',
    contactPhone: '024-7475678',
  },
  'ngaliyan': {
    slug: 'ngaliyan',
    name: 'Kecamatan Ngaliyan',
    elevation: 75.0,
    riskLevel: 'SEDANG',
    avoidRoads: ['Tanjakan Silayur (Jl. Prof. Hamka)', 'Jl. Beringin Raya'],
    safeShelter: 'Kantor Kecamatan Ngaliyan (Jl. Prof. Hamka)',
    contactPhone: '024-7601234',
  },
}

export function EmergencyLiteView() {
  const [selectedKec, setSelectedKec] = useState<string>('genuk')
  const [currentTime, setCurrentTime] = useState<string>('')
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentDistrict = DISTRICT_LITE_DATA[selectedKec] || {
    slug: selectedKec,
    name: `Kecamatan ${selectedKec.replace('-', ' ').toUpperCase()}`,
    elevation: 15.0,
    riskLevel: 'SEDANG' as const,
    avoidRoads: ['Pantau saluran pemukiman dan hindari genangan air lokal.'],
    safeShelter: `Kantor Kecamatan ${selectedKec.replace('-', ' ')}`,
    contactPhone: '024-7629444',
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#f4ede4] p-4 sm:p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Emergency Header */}
        <div className="bg-[#cc4117] text-white p-4 rounded-xl border-2 border-white/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold uppercase tracking-wide">
                KOTAKU SIAGA • MODE DARURAT LITE
              </h1>
              <p className="text-xs text-white/90">
                Mode rendah kuota &amp; baterai aktif • {currentTime || 'WIB'}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-black/40 text-[11px] font-mono font-bold rounded-md uppercase">
            Data Teks Ringan (&lt;30KB)
          </span>
        </div>

        {/* 1-Click Priority Emergency Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:112"
            className="flex items-center justify-center gap-3 p-4 bg-[#cc4117] hover:bg-[#b03712] text-white font-bold text-base rounded-xl border border-white/30 shadow-md active:scale-[0.98] transition-transform text-center"
          >
            <PhoneCall className="w-6 h-6 animate-bounce" />
            <span>PANGGIL DARURAT 112 (BEBAS PULSA)</span>
          </a>
          <Link
            href="/laporan/baru"
            className="flex items-center justify-center gap-3 p-4 bg-[#4a154b] hover:bg-[#592466] text-white font-bold text-base rounded-xl border border-white/30 shadow-md active:scale-[0.98] transition-transform text-center"
          >
            <AlertTriangle className="w-6 h-6 text-[#f4ede4]" />
            <span>KIRIM LAPORAN GENANGAN CEPAT</span>
          </Link>
        </div>

        {/* District Selector & Avoidance Roads */}
        <div className="bg-[#1d1d1d] border border-white/20 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-3">
            <label htmlFor="lite-district" className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#cc4117]" />
              PILIH WILAYAH KECAMATAN ANDA:
            </label>
            <select
              id="lite-district"
              aria-label="Pilih Wilayah Kecamatan Anda"
              value={selectedKec}
              onChange={(e) => setSelectedKec(e.target.value)}
              className="bg-[#2a2a2a] text-white text-sm font-bold px-3 py-2 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#cc4117]"
            >
              {SEMARANG_KECAMATAN.map((k) => (
                <option key={k.slug} value={k.slug}>
                  {k.name} ({k.elevation_avg_m}m DPL)
                </option>
              ))}
            </select>
          </div>

          {/* Selected District Status Box */}
          <div className="space-y-3 bg-[#242424] p-4 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">{currentDistrict.name}</span>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                  currentDistrict.riskLevel === 'KRITIS'
                    ? 'bg-[#cc4117] text-white animate-pulse'
                    : currentDistrict.riskLevel === 'WASPADA'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#007a5a] text-white'
                }`}
              >
                STATUS: {currentDistrict.riskLevel}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>RUAS JALAN RAWAN TERGENANG / DIHINDARI:</span>
              </p>
              <ul className="list-disc list-inside text-xs space-y-1 text-white/90">
                {currentDistrict.avoidRoads.map((road, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="font-semibold text-white">{road}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/10 text-xs flex flex-col sm:flex-row justify-between gap-1 text-white/80">
              <span>
                <strong>Posko Evakuasi Terdekat:</strong> {currentDistrict.safeShelter}
              </span>
              <span>
                <strong>Kontak Posko:</strong>{' '}
                <a href={`tel:${currentDistrict.contactPhone}`} className="underline text-amber-400 font-mono">
                  {currentDistrict.contactPhone}
                </a>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full mt-3 py-2.5 px-4 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 rounded-xl text-xs font-bold text-[#25D366] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Bagikan Peringatan &amp; Rute {currentDistrict.name} ke WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Disaster Share Modal for Lite View */}
        <DisasterShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareData={{
            districtName: currentDistrict.name,
            riskLevel:
              currentDistrict.riskLevel === 'KRITIS'
                ? 'kritis'
                : currentDistrict.riskLevel === 'WASPADA'
                ? 'tinggi'
                : currentDistrict.riskLevel === 'SEDANG'
                ? 'sedang'
                : 'rendah',
            avoidRoads: currentDistrict.avoidRoads,
            safeCorridors: [currentDistrict.safeShelter],
          }}
        />

        {/* Essential Emergency Contacts Grid */}
        <div className="bg-[#1d1d1d] border border-white/20 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-white/15 pb-2">
            TELEPON PENTING KEDARURATAN KOTA SEMARANG
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <a
              href="tel:112"
              className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-white/10 rounded-lg text-center block"
            >
              <span className="text-amber-400 font-bold block text-sm">112</span>
              <span className="text-white/80 text-[11px]">Pusat Panggilan Darurat Pemkot</span>
            </a>
            <a
              href="tel:119"
              className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-white/10 rounded-lg text-center block"
            >
              <span className="text-amber-400 font-bold block text-sm">119</span>
              <span className="text-white/80 text-[11px]">Ambulans PSC Medis</span>
            </a>
            <a
              href="tel:0247629444"
              className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-white/10 rounded-lg text-center block"
            >
              <span className="text-amber-400 font-bold block text-sm">024-7629444</span>
              <span className="text-white/80 text-[11px]">Posko TRC BPBD Kota</span>
            </a>
            <a
              href="tel:115"
              className="p-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-white/10 rounded-lg text-center block"
            >
              <span className="text-amber-400 font-bold block text-sm">115</span>
              <span className="text-white/80 text-[11px]">Basarnas Semarang</span>
            </a>
          </div>
        </div>

        {/* 72-Hour Survival Essentials Reminder */}
        <div className="bg-[#1d1d1d] border border-white/20 rounded-xl p-5 text-xs text-white/80 space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">
            PANDUAN KESELAMATAN MANDIRI SAAT BANJIR
          </h3>
          <p>
            1. Putuskan aliran listrik utama (MCB/Sekring rumah) jika air mulai masuk pekarangan.<br />
            2. Pindahkan dokumen penting, obat pribadi, dan HP/Powerbank ke lantai/tempat yang lebih tinggi.<br />
            3. Jangan menerobos genangan arus deras dengan sepeda motor.<br />
            4. Tetap tenang dan hubungi 112 jika ada lansia, anak-anak, atau warga sakit yang butuh evakuasi.
          </p>
        </div>
      </div>
    </div>
  )
}
