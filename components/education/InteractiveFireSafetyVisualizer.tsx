'use client'

import React, { useState } from 'react'
import { Flame, ShieldAlert, PhoneCall, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Stage {
  step: number
  title: string
  sub: string
  desc: string
  indicator: string
  badge: string
  color: string
}

const FIRE_STAGES_PERMUKIMAN: Stage[] = [
  {
    step: 1,
    title: 'SUMBER PENYULUT / OVERLOAD LISTRIK',
    sub: 'Stop Kontak Bertumpuk & Kabel Serabut Non-SNI',
    desc: 'Pembebanan arus listrik melebihi kapasitas kabel (electrical overload) menimbulkan panas resistansi tinggi yang membakar isolasi plastik PVC kabel listrik.',
    indicator: 'Kabel Hangus > 80°C',
    badge: 'Pemicu Awal',
    color: '#d97706',
  },
  {
    step: 2,
    title: 'PEMICUAN SEGI TIGA API',
    sub: 'Bahan Bakar, Oksigen, & Panas',
    desc: 'Percikan api menyambar bahan mudah terbakar terdekat seperti plafon triplek, tirai kain, atau tumpukan kardus di ruang ventilasi minim.',
    indicator: 'Waktu Reaksi Kritis: < 3 Menit',
    badge: 'Fase Tumbuh',
    color: '#cc4117',
  },
  {
    step: 3,
    title: 'RAMBATAN RADIASI DI LORONG SEMPIT',
    sub: 'Pecinan, Kauman, & Gang Sempit',
    desc: 'Jarak antar atap bangunan kurang dari 1 meter mempercepat perpindahan panas konveksi dan radiasi langsung ke dinding kayu rumah sebelah.',
    indicator: 'Radiasi Termal > 12.5 kW/m²',
    badge: 'Penyebaran Cepat',
    color: '#b91c1c',
  },
  {
    step: 4,
    title: 'INTERVENSI APAR MANDIRI (P.A.S.S)',
    sub: 'Pull, Aim, Squeeze, Sweep',
    desc: 'Warga menggunakan Alat Pemadam Api Ringan (APAR) jenis Dry Chemical Powder / CO2 sebelum api mencapai tahap kilat (flashover). Jangan siram air ke panel listrik aktif!',
    indicator: 'Jarak Semprot APAR 2-3 Meter',
    badge: 'Tindakan Warga',
    color: '#007a5a',
  },
  {
    step: 5,
    title: 'EVAKUASI & CALL DAMKAR 113',
    sub: 'Dinas Pemadam Kebakaran & BPBD 112',
    desc: 'Segera evakuasi warga rentan (lansia, anak-anak) merunduk di bawah kepulan asap. Hubungi Pos Damkar 113 sambil mengosongkan jalur masuk mobil damkar.',
    indicator: 'Evakuasi Merunduk (Udara Bawah Bersih)',
    badge: 'Penyelamatan',
    color: '#4a154b',
  },
]

const FIRE_STAGES_LAHAN: Stage[] = [
  {
    step: 1,
    title: 'KEMARAU PANJANG & VEGETASI KERING',
    sub: 'Perbukitan Mijen, Gunungpati, Tembalang',
    desc: 'Suhu udara tinggi dan kelembapan rendah membuat ilalang serta serasah daun kering menjadi bahan bakar yang sangat mudah terpicu.',
    indicator: 'Kelembapan Udara < 40%',
    badge: 'Kondisi Rentan',
    color: '#d97706',
  },
  {
    step: 2,
    title: 'PEMICU PUNTONG ROKOK / BAKAR SAMPAH',
    sub: 'Aktivitas Manusia di Dekat Semak',
    desc: 'Pembakaran sampah yang ditinggalkan tanpa pengawasan atau puntung rokok menyala memicu bara api pada lapisan serasah kering bawah.',
    indicator: 'Bara Api Menjalar Bawah Tanah',
    badge: 'Awal Api',
    color: '#cc4117',
  },
  {
    step: 3,
    title: 'DORONGAN ANGIN KENCANG',
    sub: 'Pola Angin Muson Timur',
    desc: 'Kecepatan angin > 20 knot membawa percikan bara terbang melompati parit pembatas (spotting fire), memperluas garis api secara mendadak.',
    indicator: 'Kecepatan Angin > 35 km/jam',
    badge: 'Eskalasi',
    color: '#b91c1c',
  },
  {
    step: 4,
    title: 'PEMBUATAN SEKAT BAKAR DARURAT',
    sub: 'Pembersihan Jalur Bersih 3-5 Meter',
    desc: 'Warga dan relawan membersihkan jalur tanaman kering selebar 3-5 meter untuk memutus rantai pasokan bahan bakar api menuju permukiman.',
    indicator: 'Lebar Sekat Minimum 3 Meter',
    badge: 'Mitigasi Lapangan',
    color: '#007a5a',
  },
  {
    step: 5,
    title: 'KOORDINASI DAMKAR & TANGKI AIR',
    sub: 'Suplai Air Terbuka & Titik Hydrant',
    desc: 'Arahkan mobil tangki Damkar ke akses jalan terdekat dan amankan sumur bor warga untuk suplai pengisian ulang air pemadaman.',
    indicator: 'Damkar Kota Semarang (024) 113',
    badge: 'Penanganan Akhir',
    color: '#4a154b',
  },
]

export function InteractiveFireSafetyVisualizer() {
  const [activeStep, setActiveStep] = useState(1)
  const [mode, setMode] = useState<'permukiman' | 'lahan'>('permukiman')

  const stages = mode === 'permukiman' ? FIRE_STAGES_PERMUKIMAN : FIRE_STAGES_LAHAN
  const current = stages[activeStep - 1]

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#b91c1c] mb-1">
            <Flame className="w-4 h-4 text-[#b91c1c]" />
            Dinamika Sains & Penanganan Kebakaran Terstruktur
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">
            Rantai Rambatan Api & Protokol Keselamatan Warga
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Memahami kecepatan rambatan api, metode penggunaan APAR, dan jalur evakuasi aman permukiman Kota Semarang.
          </p>
        </div>

        {/* Scenario Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('permukiman')
              setActiveStep(1)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'permukiman'
                ? 'bg-white text-[#b91c1c] shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            Permukiman Padat
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('lahan')
              setActiveStep(1)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'lahan'
                ? 'bg-white text-[#d97706] shadow-xs font-bold'
                : 'text-[#696969] hover:text-[#1d1d1d]'
            }`}
          >
            Lahan Kering & Ilalang
          </button>
        </div>
      </div>

      {/* Step Indicators Bar */}
      <div className="grid grid-cols-5 gap-2">
        {stages.map((st) => {
          const isActive = st.step === activeStep
          const isPast = st.step < activeStep

          return (
            <button
              key={st.step}
              type="button"
              onClick={() => setActiveStep(st.step)}
              className={`p-2 sm:p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'border-[#b91c1c] bg-[#fff5f5] ring-2 ring-[#b91c1c]/20'
                  : isPast
                  ? 'border-[#e6e6e6] bg-[#fcfcfc] opacity-80'
                  : 'border-[#f0f0f0] bg-white opacity-50 hover:opacity-80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-[10px] font-bold text-[#b91c1c]">
                  TAHAP {st.step}
                </span>
                {isPast && <CheckCircle2 className="w-3 h-3 text-[#007a5a]" />}
              </div>
              <span className="text-[11px] font-bold text-[#1d1d1d] truncate hidden sm:block">
                {st.title.split('/')[0]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Focus Stage Box */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase text-white"
              style={{ backgroundColor: current.color }}
            >
              {current.badge}
            </span>
            <span className="text-xs font-mono text-[#696969]">
              Fase Kecepatan: <strong>{current.indicator}</strong>
            </span>
          </div>

          <h4 className="text-xl sm:text-2xl font-bold text-[#1d1d1d]">
            {current.title}
          </h4>
          <p className="text-xs font-mono font-semibold text-[#b91c1c]">
            {current.sub}
          </p>

          <p className="text-xs sm:text-sm text-[#4d4d4d] leading-relaxed">
            {current.desc}
          </p>
        </div>

        {/* Action / Emergency Tip Card */}
        <div className="w-full md:w-80 p-4 rounded-xl bg-white border border-[#e6e6e6] shadow-xs space-y-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-[#b91c1c]">
            <ShieldAlert className="w-4 h-4" />
            <span>Kaidah Keselamatan Darurat</span>
          </div>

          <div className="text-xs text-[#1d1d1d] space-y-2">
            <div className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-[#b91c1c]">•</span>
              <span>
                <strong>P.A.S.S APAR:</strong> Tarik pin (Pull), Arahkan corong ke dasar api (Aim), Tekan tuas (Squeeze), Sapukan merata (Sweep).
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-[#b91c1c]">•</span>
              <span>
                <strong>Evakuasi Asap:</strong> Merunduk serendah mungkin karena udara bernapas bersih berada 30 cm di atas lantai.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-mono font-bold text-[#b91c1c]">•</span>
              <span>
                <strong>Kontak Resmi:</strong> Damkar Kota Semarang <strong>113</strong> atau <strong>(024) 7605871</strong> / Call Center <strong>112</strong>.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#696969]">Navigasi Tahap:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded border border-[#e6e6e6] disabled:opacity-40 hover:bg-[#f4ede4]"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={activeStep === stages.length}
                onClick={() => setActiveStep((s) => Math.min(stages.length, s + 1))}
                className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-[#b91c1c] text-white disabled:opacity-40 hover:bg-[#991b1b]"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
