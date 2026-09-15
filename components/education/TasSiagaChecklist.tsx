'use client'

import React, { useState, useEffect } from 'react'
import {
  CheckSquare,
  Square,
  ShieldCheck,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Droplets,
  Utensils,
  Pill,
  HeartPulse,
  Flashlight,
  BatteryCharging,
  FileText,
  Shirt,
  Volume2,
  Smile,
} from 'lucide-react'

interface BagItem {
  id: string
  label: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  category: 'Primer' | 'Medis' | 'Komunikasi' | 'Logistik'
}

const BAG_ITEMS: BagItem[] = [
  { id: 'water', label: 'Air Minum Bersih', detail: 'Minimal 3 liter per anggota keluarga untuk 72 jam', icon: Droplets, category: 'Primer' },
  { id: 'food', label: 'Makanan Tahan Lama', detail: 'Biskuit, makanan kaleng siap saji, energi bar tahan air', icon: Utensils, category: 'Primer' },
  { id: 'medicine', label: 'Obat Pribadi Khusus', detail: 'Obat resep rutin bagi lansia/anak/penderita penyakit kronis', icon: Pill, category: 'Medis' },
  { id: 'firstaid', label: 'Kotak P3K Lengkap', detail: 'Plester, kassa steril, cairan antiseptik, gunting, perban', icon: HeartPulse, category: 'Medis' },
  { id: 'flashlight', label: 'Senter & Baterai Cadangan', detail: 'Senter tahan air / headlamp saat jaringan PLN padam', icon: Flashlight, category: 'Logistik' },
  { id: 'powerbank', label: 'Power Bank Terisi Penuh', detail: 'Minimal 10.000 mAh + kabel pengisi daya ponsel', icon: BatteryCharging, category: 'Komunikasi' },
  { id: 'docs', label: 'Dokumen Penting Kedap Air', detail: 'Fotokopi KTP, KK, akta, sertifikat tanah dalam kantong ziplock', icon: FileText, category: 'Primer' },
  { id: 'clothes', label: 'Pakaian & Selimut Hangat', detail: 'Pakaian ganti cepat kering, jas hujan, pakaian hangat', icon: Shirt, category: 'Logistik' },
  { id: 'whistle', label: 'Peluit Darurat', detail: 'Untuk memanggil tim penyelamat SAR saat terjebak banjir/longsor', icon: Volume2, category: 'Komunikasi' },
  { id: 'mask', label: 'Masker & Hand Sanitizer', detail: 'Perlindungan dari debu, lumpur berbau, dan higienitas posko', icon: Smile, category: 'Medis' },
]

const STORAGE_KEY = 'kotaku_siaga_tas_72h'

export function TasSiagaChecklist() {
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setCheckedIds(JSON.parse(saved))
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to LocalStorage
  const toggleItem = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter((item) => item !== id)
      : [...checkedIds, id]
    setCheckedIds(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }

  const resetChecklist = () => {
    setCheckedIds([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const completedCount = checkedIds.length
  const totalCount = BAG_ITEMS.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)
  const isReady = completedCount === totalCount

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e6e6e6] shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6e6e6] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f9f0ff] border border-[#eddcf7] text-[#4a154b] text-[11px] font-mono font-bold uppercase tracking-wider">
            <PackageCheck className="w-3.5 h-3.5 text-[#4a154b]" />
            Checklist Mandiri Warga
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1d] tracking-tight">
            Tas Siaga Bencana (72 Jam Mandiri)
          </h2>
          <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
            Perlengkapan wajib disiapkan keluarga untuk bertahan mandiri selama 3 hari pertama sebelum bantuan logistik tiba.
          </p>
        </div>

        {/* Progress Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-extrabold text-[#4a154b]">
              {completedCount} <span className="text-sm font-normal text-[#696969]">/ {totalCount}</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                isReady
                  ? 'bg-[#ecfdf5] text-[#007a5a] border border-[#a7f3d0]'
                  : completedCount > 0
                  ? 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]'
                  : 'bg-[#f4ede4] text-[#696969]'
              }`}
            >
              {progressPercent}% Siap
            </span>
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={resetChecklist}
              className="text-[11px] text-[#696969] hover:text-[#cc4117] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Checklist
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#f4ede4] h-2.5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4a154b] to-[#007a5a] transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Completion Banner */}
      {isReady && (
        <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center gap-3 animate-in fade-in duration-200">
          <ShieldCheck className="w-6 h-6 text-[#007a5a] shrink-0" />
          <div>
            <span className="text-xs font-bold text-[#007a5a] block uppercase tracking-wider">
              Kesiapsiagaan Keluarga Paripurna!
            </span>
            <span className="text-xs text-[#065f46]">
              Seluruh 10 item logistik darurat telah siap. Letakkan tas siaga di tempat yang mudah dijangkau dekat pintu keluar utama rumah.
            </span>
          </div>
        </div>
      )}

      {/* Grid of Checklist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BAG_ITEMS.map((item) => {
          const isChecked = isLoaded && checkedIds.includes(item.id)
          const Icon = item.icon

          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                isChecked
                  ? 'bg-[#faf7f9] border-[#4a154b]/30 shadow-2xs'
                  : 'bg-[#fdfbf9] border-[#e6e6e6] hover:border-[#4a154b]/20 hover:bg-white'
              }`}
            >
              <div className="pt-0.5 shrink-0 text-[#4a154b]">
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-[#007a5a]" />
                ) : (
                  <Square className="w-5 h-5 text-[#9ca3af]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isChecked ? 'text-[#1d1d1d] line-through opacity-80' : 'text-[#1d1d1d]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#e6e6e6] text-[#696969]">
                    {item.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#696969] leading-snug mt-0.5">{item.detail}</p>
              </div>

              <Icon className="w-4 h-4 text-[#696969] shrink-0 mt-0.5" />
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="text-[11px] text-[#696969] bg-[#f4ede4]/50 p-3.5 rounded-xl flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#4a154b] shrink-0" />
        <span>
          Data checklist disimpan secara lokal pada peramban Anda dan tidak diunggah ke server untuk menjaga privasi rumah tangga.
        </span>
      </div>
    </div>
  )
}
