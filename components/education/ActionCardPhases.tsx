'use client'

import React, { useState } from 'react'

interface ActionChecklist {
  sebelum: string[]
  saatTerjadi: string[]
  setelah: string[]
}

interface ActionCardPhasesProps {
  title?: string
  checklist: ActionChecklist
}

export function ActionCardPhases({ title = 'Jika Terjadi Genangan / Bencana', checklist }: ActionCardPhasesProps) {
  const [activePhase, setActivePhase] = useState<'sebelum' | 'saat' | 'setelah'>('saat')

  const items =
    activePhase === 'sebelum'
      ? checklist.sebelum
      : activePhase === 'saat'
      ? checklist.saatTerjadi
      : checklist.setelah

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-5 shadow-sm">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e6e6e6]">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#007a5a]">
            PANDUAN KESIAPSIAGAAN WARGA (ACTION CARD)
          </span>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">{title}</h3>
        </div>

        {/* Phase Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActivePhase('sebelum')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePhase === 'sebelum'
                ? 'bg-[#4a154b] text-white shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            1. SEBELUM
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('saat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePhase === 'saat'
                ? 'bg-[#cc4117] text-white shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            2. SAAT TERJADI
          </button>
          <button
            type="button"
            onClick={() => setActivePhase('setelah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePhase === 'setelah'
                ? 'bg-[#007a5a] text-white shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            3. SETELAH
          </button>
        </div>
      </div>

      {/* Checklist Display */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-[#696969] uppercase font-bold">
          Daftar Tindakan Prioritas Fasa{' '}
          {activePhase === 'sebelum'
            ? 'Mitigasi & Kesiapsiagaan Awal'
            : activePhase === 'saat'
            ? 'Tanggap Darurat & Keselamatan Jiwa'
            : 'Pemulihan & Rehabilitasi Sanitasi'}
          :
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {items.map((text, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] flex items-start gap-3"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono text-white ${
                  activePhase === 'sebelum'
                    ? 'bg-[#4a154b]'
                    : activePhase === 'saat'
                    ? 'bg-[#cc4117]'
                    : 'bg-[#007a5a]'
                }`}
              >
                {idx + 1}
              </div>
              <p className="text-xs sm:text-sm text-[#1d1d1d] leading-relaxed font-medium">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
