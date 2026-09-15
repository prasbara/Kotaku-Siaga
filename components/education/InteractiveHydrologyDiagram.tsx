'use client'

import React, { useState } from 'react'
import { Waves, Gauge, AlertTriangle } from 'lucide-react'

const HYDRO_STAGES = [
  {
    step: 1,
    title: 'HUJAN DI HULU',
    sub: 'Wilayah Semarang Selatan & Ungaran',
    desc: 'Hujan lebat dengan intensitas tinggi di lereng perbukitan menghasilkan volume air limpasan besar yang terkumpul menuju alur sungai.',
    indicator: 'Curah Hujan > 50 mm/jam',
    badge: 'Hulu',
    color: '#1264a3',
  },
  {
    step: 2,
    title: 'DEBIT SUNGAI MENINGKAT',
    sub: 'Banjir Kanal Timur & Kali Tenggang',
    desc: 'Volume air mengalir cepat melalui palung sungai menuju dataran rendah pesisir dengan kecepatan arus tinggi.',
    indicator: 'Elevasi Muka Air +1.8m',
    badge: 'Transisi',
    color: '#1264a3',
  },
  {
    step: 3,
    title: 'SALURAN MENUJU PESISIR',
    sub: 'Kawasan Kaligawe & Genuk',
    desc: 'Air tiba di kawasan hilir yang memiliki kemiringan dasar saluran sangat landai (< 0.1%), memperlambat laju buang alami.',
    indicator: 'Kemiringan Landai 0.05%',
    badge: 'Dataran Rendah',
    color: '#4a154b',
  },
  {
    step: 4,
    title: 'PASANG LAUT TINGGI',
    sub: 'Pesisir Laut Jawa (Tanjung Emas)',
    desc: 'Gaya gravitasi bulan memicu pasang astronomi maksimum, menaikkan muka air laut melampaui elevasi dasar muara saluran pembuang.',
    indicator: 'Pasang Laut > +90 cm MSL',
    badge: 'Pesisir',
    color: '#d97706',
  },
  {
    step: 5,
    title: 'ALIRAN GRAVITASI TERHAMBAT',
    sub: 'Efek Arus Balik (Backwater)',
    desc: 'Karena muka laut lebih tinggi dari daratan pesisir, air sungai tidak dapat mengalir secara alami dan berbalik mendesak saluran drainase jalan.',
    indicator: 'Gravitasi Alami = 0',
    badge: 'Kritis',
    color: '#cc4117',
  },
  {
    step: 6,
    title: 'POLDER & POMPA BEKERJA',
    sub: 'Rumah Pompa Sringin & Tenggang',
    desc: 'Pintu air muara ditutup rapat untuk menahan air laut, dan pompa mekanis berkapasitas besar dinyalakan untuk membuang air ke laut.',
    indicator: 'Kapasitas Pompa 12.000 L/dtk',
    badge: 'Intervensi',
    color: '#007a5a',
  },
  {
    step: 7,
    title: 'RISIKO GENANGAN',
    sub: 'Faktor Daya Tampung Polder',
    desc: 'Jika volume debit hulu melebihi kapasitas pompa atau terjadi pemadaman, limpasan meluap menjadi genangan di jalan arteri dan pemukiman.',
    indicator: 'Perlu Kesiapsiagaan Warga',
    badge: 'Resiliensi',
    color: '#4a154b',
  },
]

export function InteractiveHydrologyDiagram() {
  const [activeStep, setActiveStep] = useState(1)
  const [simulationMode, setSimulationMode] = useState<'normal' | 'ekstrem'>('ekstrem')

  const current = HYDRO_STAGES[activeStep - 1]

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <Waves className="w-4 h-4 text-[#1264a3]" />
            Rantai Interaksi Sains Hidrometeorologi Pesisir
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">
            Bagaimana Banjir Rob Terjadi: Hulu ke Hilir
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Banjir pesisir adalah hasil interaksi multi-faktor terhubung, bukan semata peristiwa hujan deras lokal.
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSimulationMode('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              simulationMode === 'normal'
                ? 'bg-white text-[#007a5a] shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            Kondisi Normal
          </button>
          <button
            type="button"
            onClick={() => setSimulationMode('ekstrem')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              simulationMode === 'ekstrem'
                ? 'bg-[#cc4117] text-white shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            Kondisi Pasang Ekstrem
          </button>
        </div>
      </div>

      {/* Interactive 7-Step Pipeline Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {HYDRO_STAGES.map((s) => {
          const isSelected = s.step === activeStep
          const isPassed = s.step < activeStep

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#f9f0ff] border-[#4a154b] ring-2 ring-[#4a154b]/20 shadow-xs'
                  : isPassed
                  ? 'bg-[#f4ede4]/40 border-[#d9bdde]/50'
                  : 'bg-white border-[#e6e6e6] hover:bg-[#f4ede4]/30'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="w-5 h-5 rounded-full text-[11px] font-mono font-bold flex items-center justify-center bg-white border border-[#e6e6e6] text-[#4a154b]">
                  {s.step}
                </span>
                <span className="text-[9px] font-mono uppercase font-bold text-[#696969]">
                  {s.badge}
                </span>
              </div>
              <div className="font-bold text-[11px] text-[#1d1d1d] leading-tight line-clamp-2">
                {s.title}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Step Explanation Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#fdf9ff] border border-[#eddcf7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#4a154b] text-white">
              FAKTOR TAHAP 0{current.step}
            </span>
            <span className="text-xs font-mono text-[#696969] font-semibold">
              {current.sub}
            </span>
          </div>
          <h4 className="text-xl font-bold text-[#4a154b]">{current.title}</h4>
          <p className="text-sm text-[#1d1d1d] leading-relaxed max-w-2xl">{current.desc}</p>
        </div>

        {/* Telemetry Gauge Box */}
        <div className="p-4 rounded-xl bg-white border border-[#eddcf7] shadow-xs flex flex-col gap-1.5 shrink-0 w-full sm:w-64">
          <span className="text-[10px] font-mono uppercase font-bold text-[#696969]">
            Indikator Lapangan
          </span>
          <div className="font-mono font-bold text-sm text-[#4a154b] flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#007a5a]" />
            {current.indicator}
          </div>
          <div className="text-[11px] text-[#696969] leading-tight pt-1 border-t border-[#f0f0f0]">
            {simulationMode === 'ekstrem'
              ? 'Peringatan: Pasang laut menahan gravitasi. Diperlukan pompa polder.'
              : 'Aliran gravitasi masih dapat mengalir secara wajar.'}
          </div>
        </div>
      </div>

      {/* Flow Summary Alert */}
      <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-[#4a154b] font-semibold">
          <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />
          <span>
            <strong>Kesimpulan Ilmiah:</strong> Penanganan banjir Semarang harus mengintegrasikan normalisasi sungai hulu, pengerukan sedimen, pemeliharaan pompa polder, dan pengendalian penurunan tanah (land subsidence).
          </span>
        </div>
      </div>
    </div>
  )
}
