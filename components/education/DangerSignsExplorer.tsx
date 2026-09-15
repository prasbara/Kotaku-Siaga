'use client'

import React, { useState } from 'react'
import { AlertTriangle, ShieldAlert, Waves, Mountain, Droplets, CheckCircle2 } from 'lucide-react'

type HazardType = 'banjir' | 'longsor' | 'rob' | 'drainase'

interface DangerItem {
  sign: string
  detail: string
  action: string
  level: 'kritis' | 'waspada' | 'perhatian'
}

const HAZARD_SIGNS: Record<HazardType, { title: string; icon: React.ComponentType<{ className?: string }>; items: DangerItem[] }> = {
  longsor: {
    title: 'Tanah Longsor & Gerakan Lereng',
    icon: Mountain,
    items: [
      {
        sign: 'Retakan baru berbentuk melengkung pada permukaan tanah atau aspal jalan tebing.',
        detail: 'Menunjukkan deformasi geser aktif di bawah permukaan tanah yang bersiap runtuh.',
        action: 'Tandai batas retakan dan segera jauhi area lereng jika hujan deras sedang berlangsung.',
        level: 'kritis',
      },
      {
        sign: 'Retakan mendadak pada dinding plester atau lantai bangunan di kawasan tebing.',
        detail: 'Pergeseran pondasi akibat pembebanan massa tanah lereng yang labil.',
        action: 'Keluarkan anggota keluarga dan hubungi RT/RW serta 112 BPBD.',
        level: 'kritis',
      },
      {
        sign: 'Pohon, tiang listrik, atau tiang pagar di lereng mulai condong ke arah bawah.',
        detail: 'Indikasi rayapan tanah (soil creep) bertahap sebelum luncuran besar terjadi.',
        action: 'Laporkan koordinat tiang miring melalui aplikasi KotaKu Siaga.',
        level: 'waspada',
      },
      {
        sign: 'Air rembesan mendadak muncul dari area tebing yang sebelumnya selalu kering.',
        detail: 'Aliran air tanah tertekan mencari celah keluar baru (piping effect).',
        action: 'Waspadai erosi internal tebing yang dapat memicu runtuhan mendadak.',
        level: 'waspada',
      },
      {
        sign: 'Pintu atau jendela rumah di bantaran lereng mendadak macet atau sulit ditutup.',
        detail: 'Perubahan sudut siku kusen akibat penurunan diferensial pondasi lereng.',
        action: 'Lakukan inspeksi retakan pondasi luar rumah secara hati-hati.',
        level: 'perhatian',
      },
    ],
  },
  rob: {
    title: 'Banjir Rob & Pasang Pesisir',
    icon: Waves,
    items: [
      {
        sign: 'Air menggenangi jalan aspal meskipun cuaca di lokasi sedang terik dan tidak ada hujan.',
        detail: 'Ciri utama penetrasi pasang air laut maksimum (Mean Sea Level naik > +85 cm).',
        action: 'Pindahkan kendaraan ke tempat tinggi dan hindari menerobos air asin pekat.',
        level: 'kritis',
      },
      {
        sign: 'Aliran air di dalam parit got berbalik arah (mengalir dari arah muara laut ke daratan).',
        detail: 'Efek arus balik (backwater) akibat elevasi laut melebihi mulut saluran pembuang.',
        action: 'Tutup pintu saluran air rumah jika memiliki pintu klep air satu arah (check valve).',
        level: 'waspada',
      },
      {
        sign: 'Pintu air muara atau tanggul pesisir mulai merembes dan mengeluarkan buih air asin.',
        detail: 'Tekanan hidrostatik pasang laut menekan celah struktur pelindung pantai.',
        action: 'Laporkan kebocoran tanggul secara mendesak di KotaKu Siaga untuk intervensi karung pasir.',
        level: 'kritis',
      },
      {
        sign: 'Jadwal tabel pasang surut BMKG menunjukkan fase bulan purnama / perigee.',
        detail: 'Gaya gravitasi bulan dan matahari sejajar menghasilkan pasang laut tertinggi bulanan.',
        action: 'Persiapkan karung pasir penahan di depan pintu rumah sejak pagi hari.',
        level: 'perhatian',
      },
    ],
  },
  banjir: {
    title: 'Banjir Luapan Sungai Perkotaan',
    icon: Droplets,
    items: [
      {
        sign: 'Warna air sungai mendadak berubah menjadi sangat pekat kecokelatan disertai ranting kayu.',
        detail: 'Menandakan erosi hebat dan banjir bandang di kawasan hulu sedang meluncur ke hilir.',
        action: 'Tinggalkan bantaran sungai segera, jangan menonton arus di atas jembatan.',
        level: 'kritis',
      },
      {
        sign: 'Kenaikan tinggi muka air sungai lebih dari 30 cm dalam rentang waktu kurang dari 30 menit.',
        detail: 'Laju akumulasi limpasan hujan hulu sangat cepat melampaui kapasitas tampung tanggul.',
        action: 'Aktifkan sirine peringatan dini lingkungan dan amankan lansia serta anak-anak.',
        level: 'kritis',
      },
      {
        sign: 'Suara gemuruh benturan batu atau getaran tanah di sekitar dinding tanggul sungai.',
        detail: 'Gaya seret arus air sungai yang sangat deras mengikis dasar pondasi tanggul beton.',
        action: 'Jauhi tanggul minimal radius 25 meter untuk mengantisipasi tanggul jebol.',
        level: 'kritis',
      },
      {
        sign: 'Air selokan meluap memenuhi jalan raya hingga merendam knalpot motor.',
        detail: 'Titik terendah lingkungan telah menjadi cekungan retensi air limpasan.',
        action: 'Cari rute jalan alternatif dan laporkan ketinggian genangan di aplikasi.',
        level: 'waspada',
      },
    ],
  },
  drainase: {
    title: 'Drainase Tersumbat & Ambles',
    icon: AlertTriangle,
    items: [
      {
        sign: 'Air menyembur naik dari sela-sela tutup manhole besi di tengah jalan raya.',
        detail: 'Tekanan balik akibat sumbatan total sampah di gorong-gorong segmen berikutnya.',
        action: 'Pasang tanda darurat agar pengendara motor tidak terperosok tutup manhole yang bergeser.',
        level: 'kritis',
      },
      {
        sign: 'Timbunan sampah plastik padat menutupi lebih dari separuh jeruji saringan jalan (inlet).',
        detail: 'Mencegah air jalan masuk ke got pembuang, memicu genangan aspal lokal seketika.',
        action: 'Jika kondisi aman, angkat tumpukan sampah permukaan menggunakan alat pengait.',
        level: 'waspada',
      },
      {
        sign: 'Tanah atau aspal di sekitar gorong-gorong tampak ambles atau retak melingkar.',
        detail: 'Pipa saluran bawah tanah pecah sehingga tanah di atasnya tergerus hanyut.',
        action: 'Beri tanda pembatas dan laporkan titik jalan amblas ke dinas PU melalui aplikasi.',
        level: 'waspada',
      },
    ],
  },
}

export function DangerSignsExplorer() {
  const [selectedHazard, setSelectedHazard] = useState<HazardType>('longsor')
  const hazard = HAZARD_SIGNS[selectedHazard]

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <ShieldAlert className="w-4 h-4 text-[#cc4117]" />
            Panduan Deteksi Dini Lapangan
          </div>
          <h3 className="font-bold text-xl sm:text-2xl text-[#1d1d1d]">
            Kenali Tanda Bahaya & Indikator Risiko
          </h3>
          <p className="text-xs text-[#696969] mt-0.5">
            Panduan praktis membaca gejala awal lingkungan sebelum potensi bencana berkembang menjadi kondisi darurat.
          </p>
        </div>

        {/* Caveat Badge (Requirement #5) */}
        <div className="px-3.5 py-2 rounded-xl bg-[#fef3c7] border border-[#d97706]/30 text-[11px] font-mono text-[#d97706] font-bold self-start sm:self-auto flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />
          <span>Indikator risiko — perlu verifikasi kondisi lapangan.</span>
        </div>
      </div>

      {/* Hazard Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(HAZARD_SIGNS) as HazardType[]).map((key) => {
          const item = HAZARD_SIGNS[key]
          const TabIcon = item.icon
          const isSelected = key === selectedHazard

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedHazard(key)}
              className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#4a154b] text-white border-[#4a154b] shadow-xs'
                  : 'bg-[#f4ede4]/40 hover:bg-[#f4ede4] text-[#1d1d1d] border-[#e6e6e6]'
              }`}
            >
              <TabIcon className={`w-4 h-4 ${isSelected ? 'text-[#f4ede4]' : 'text-[#4a154b]'}`} />
              <span className="capitalize">{key === 'rob' ? 'Banjir Rob' : key === 'drainase' ? 'Drainase Mampet' : key}</span>
            </button>
          )
        })}
      </div>

      {/* Signs Cards List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-mono font-bold uppercase text-[#4a154b]">
            Daftar Tanda Lapangan Yang Perlu Diwaspadai:
          </span>
          <span className="text-xs text-[#696969] font-mono">
            {hazard.items.length} Indikator Teridentifikasi
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {hazard.items.map((item, idx) => {
            const isKritis = item.level === 'kritis'
            const isWaspada = item.level === 'waspada'

            return (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] hover:border-[#4a154b]/30 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isKritis
                          ? 'bg-[#cc4117] text-white'
                          : isWaspada
                          ? 'bg-[#d97706] text-white'
                          : 'bg-[#007a5a] text-white'
                      }`}
                    >
                      {item.level.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-[#696969]">Gejala #{idx + 1}</span>
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-[#1d1d1d] leading-snug">
                    {item.sign}
                  </h4>
                  <p className="text-xs text-[#696969] leading-relaxed">
                    <strong>Penyebab Ilmiah:</strong> {item.detail}
                  </p>
                </div>

                {/* Practical Action Recommendation */}
                <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] sm:w-80 shrink-0 text-xs text-[#4a154b] flex flex-col gap-1">
                  <span className="font-mono font-bold text-[10px] uppercase text-[#007a5a] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#007a5a]" />
                    Langkah Tindakan Segera:
                  </span>
                  <p className="text-[11px] text-[#1d1d1d] leading-relaxed font-medium">
                    {item.action}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
