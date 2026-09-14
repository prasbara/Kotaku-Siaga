'use client'

import { useState } from 'react'
import type { ReportCategory } from '@/types'
import { ArrowRight, BookOpen, ShieldAlert, CheckCircle2, Droplets, Mountain, Waves } from 'lucide-react'

interface Article {
  slug: string
  category: ReportCategory
  overline: string
  title: string
  subtitle: string
  readingTime: string
  paragraphs: string[]
  keyPoints: { label: string; text: string }[]
}

const ARTICLES: Article[] = [
  {
    slug: 'banjir-perkotaan',
    category: 'banjir',
    overline: 'Hidrometeorologi & Drainase Pesisir',
    title: 'Banjir Rob & Dinamika Pesisir Semarang',
    subtitle: 'Memahami interaksi curah hujan ekstrem, daya tampung polder, penurunan tanah (subsidence), dan pasang rob laut Jawa.',
    readingTime: '4 menit membaca',
    paragraphs: [
      'Banjir di kawasan perkotaan pesisir seperti Semarang bukan sekadar peristiwa alamiah limpasan air hujan. Fenomena ini merupakan akumulasi dari perubahan tutupan vegetasi, penurunan permukaan tanah (land subsidence), pasang air laut (rob), dan keterbatasan kapasitas saluran pembuang primer.',
      'Ketika air laut pasang bersamaan dengan hujan deras di kawasan hulu (Gombel, Ungaran), air sungai tidak dapat mengalir secara gravitasi ke Laut Jawa. Di sinilah stasiun pompa polder (Sringin, Tenggang, Kalibaru, BKB) menjadi benteng utama perlindungan pemukiman warga.',
      'Mitigasi yang efektif menuntut integrasi antara infrastruktur abu-abu (tanggul, pompa polder, kolam retensi) dan peran aktif warga dalam melaporkan genangan secara tepat koordinat.',
    ],
    keyPoints: [
      { label: 'Indikator Kritis', text: 'Kombinasi curah hujan intensitas > 30 mm/jam bersamaan dengan pasang maksimum air laut Tanjung Emas > +90 cm MSL.' },
      { label: 'Tindakan Warga', text: 'Amankan instalasi listrik, pindahkan kendaraan ke tempat tinggi, pantau tinggi air dan sampaikan laporan via KotaKu Siaga.' },
      { label: 'Solusi Terpadu', text: 'Optimalisasi kapasitas polder pompa air dan perlindungan sabuk hijau mangrove pesisir Semarang.' },
    ],
  },
  {
    slug: 'saluran-dan-sedimentasi',
    category: 'drainase_tersumbat',
    overline: 'Manajemen Aliran Perkotaan',
    title: 'Drainase & Sedimentasi Gorong-Gorong',
    subtitle: 'Mengapa saluran yang terhambat pada satu titik dapat melumpuhkan sistem hidrolik seluruh kawasan jalan protokol.',
    readingTime: '3 menit membaca',
    paragraphs: [
      'Jaringan drainase perkotaan bekerja berdasarkan gradien kemiringan alami. Hambatan berupa tumpukan sampah anorganik dan endapan lumpur padat pada satu segmen gorong-gorong akan menciptakan efek bendung (backwater effect).',
      'Akibatnya, air dari saluran tersier di pemukiman tidak dapat mengalir ke saluran sekunder, menimbulkan genangan lokal berjam-jam meskipun intensitas hujan sudah reda.',
      'Pemeliharaan berkala melalui pembersihan sedimentasi sebelum musim hujan tiba menghemat biaya penanganan darurat dan menjaga roda ekonomi masyarakat tetap berputar.',
    ],
    keyPoints: [
      { label: 'Faktor Penyumbat Utama', text: 'Lumpur sedimentasi tebing saluran dan sampah plastik anorganik yang tersangkut di mulut inlet.' },
      { label: 'Langkah Preventif', text: 'Pemasangan saringan sampah jeruji (trash rack) berkala di hulu saluran pemukiman warga.' },
      { label: 'Peran Pelaporan', text: 'Foto dan titik koordinat yang dilaporkan warga membantu dinas PU menjadwalkan pengerukan tepat sasaran.' },
    ],
  },
  {
    slug: 'kestabilan-lereng-perbukitan',
    category: 'longsor',
    overline: 'Geologi Terapan & Tebing',
    title: 'Kestabilan Lereng & Erosi Perbukitan',
    subtitle: 'Membaca tanda-tanda pergerakan massa tanah pada zona transisi topografi dataran tinggi Semarang Selatan.',
    readingTime: '5 menit membaca',
    paragraphs: [
      'Wilayah Semarang bagian selatan (Candisari, Gajahmungkur, Tembalang) didominasi oleh formasi perbukitan dengan lapisan lempung yang peka terhadap resapan air berlebih. Saat musim hujan berkepanjangan, rongga pori tanah jenuh air dan dapat memicu gelincir lapisan atas.',
      'Pembangunan hunian di bantaran lereng tanpa dinding penahan tanah (retaining wall) bersuling drainase mempercepat kerentanan lereng runtuh saat dipicu getaran lalu lintas atau pembebanan struktur.',
      'Masyarakat perlu mengenali tanda-tanda dini seperti retakan melengkung di tanah, tiang pagar yang mulai condong, dan munculnya rembesan air keruh di kaki lereng.',
    ],
    keyPoints: [
      { label: 'Tanda Peringatan Dini', text: 'Retakan rambut di lantai rumah, tanah merekah di punggung lereng, dan suara gemuruh kecil saat hujan.' },
      { label: 'Langkah Evakuasi', text: 'Segera mengosongkan hunian yang berada tepat di bawah lereng yang retak dan hubungi 112 BPBD.' },
      { label: 'Vegetasi Penstabil', text: 'Pertahankan tanaman berakar tunjang seperti bambu dan pepohonan keras penahan erosi lereng.' },
    ],
  },
]

export function EducationModule() {
  const [selectedSlug, setSelectedSlug] = useState(ARTICLES[0].slug)
  const currentArticle = ARTICLES.find((a) => a.slug === selectedSlug) || ARTICLES[0]

  return (
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen pb-24 font-body">
      {/* Editorial Hero Banner */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 bg-[#f4ede4] border-b border-[#e6e6e6] overflow-hidden">
        {/* Soft atmospheric gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,#f9f0ff_0%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-[#4a154b] px-3 py-1 rounded-[90px] bg-white border border-[#e6e6e6]">
              LITERASI & RESILIENSI IKLIM
            </span>
            <span className="font-mono text-xs text-[#007a5a] flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              PANDUAN PRAKTIS WARGA SEMARANG
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#4a154b] tracking-tight leading-tight">
            Kajian & Panduan Ketahanan Perkotaan
          </h1>
          <p className="text-sm sm:text-base text-[#696969] max-w-3xl leading-relaxed">
            Materi edukatif berbasis sains hidrologi lingkungan, dinamika banjir rob pesisir, kestabilan lereng perbukitan, serta panduan kesiapsiagaan warga Kota Semarang.
          </p>
        </div>
      </section>

      {/* Main Reading Section */}
      <section className="pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar of Articles */}
          <aside className="lg:col-span-4 flex flex-col gap-3">
            <div className="pb-2 border-b border-[#e6e6e6] flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#4a154b]">
                Daftar Topik Kajian
              </span>
              <span className="text-xs text-[#696969] font-mono">{ARTICLES.length} Modul</span>
            </div>

            <nav className="flex flex-col gap-3">
              {ARTICLES.map((art) => {
                const isSelected = art.slug === selectedSlug
                return (
                  <button
                    key={art.slug}
                    onClick={() => setSelectedSlug(art.slug)}
                    className={`w-full text-left p-5 rounded-[16px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#f9f0ff] border-[#4a154b] shadow-sm'
                        : 'bg-white border-[#e6e6e6] hover:bg-[#f4ede4]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] text-[#4a154b] uppercase font-bold tracking-wider">
                        {art.overline}
                      </span>
                      <span className="font-mono text-[10px] text-[#696969]">
                        {art.readingTime}
                      </span>
                    </div>
                    <span className="font-bold text-base block mb-1 text-[#1d1d1d]">
                      {art.title}
                    </span>
                    <p className="text-xs text-[#696969] line-clamp-2 leading-relaxed">
                      {art.subtitle}
                    </p>
                  </button>
                )
              })}
            </nav>

            {/* Emergency Info Card */}
            <div className="mt-4 p-5 rounded-[16px] bg-[#f4ede4] border border-[#e6e6e6] space-y-2">
              <span className="text-[11px] font-mono uppercase font-bold text-[#4a154b] block">
                Pusat Bantuan Darurat
              </span>
              <p className="text-xs text-[#696969] leading-relaxed">
                Jika Anda menghadapi keadaan mendesak akibat genangan air atau longsor:
              </p>
              <div className="pt-2 flex flex-col gap-1.5 font-mono text-xs font-bold text-[#4a154b]">
                <div>• Call Center Semarang: <span className="underline">112</span> (Bebas Pulsa)</div>
                <div>• BPBD Kota Semarang: <span className="underline">024-7629474</span></div>
              </div>
            </div>
          </aside>

          {/* Publication Article Content */}
          <article className="lg:col-span-8 p-6 sm:p-10 rounded-[16px] bg-white border border-[#e6e6e6] flex flex-col gap-6 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[90px] bg-[#f9f0ff] border border-[#d9bdde]/60 text-[#4a154b] font-mono text-[11px] font-bold uppercase tracking-wider mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                {currentArticle.overline} • {currentArticle.readingTime}
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4a154b] tracking-tight leading-snug mb-3">
                {currentArticle.title}
              </h2>
              <p className="text-sm sm:text-base text-[#696969] leading-relaxed pb-6 border-b border-[#e6e6e6]">
                {currentArticle.subtitle}
              </p>
            </div>

            {/* Paragraphs */}
            <div className="space-y-4 text-sm sm:text-base text-[#1d1d1d] leading-relaxed font-body">
              {currentArticle.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Key Points Strip */}
            <div className="mt-4 pt-6 border-t border-[#e6e6e6] flex flex-col gap-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#007a5a] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#007a5a]" />
                Poin Kunci & Tindakan Mitigasi
              </span>

              <div className="grid grid-cols-1 gap-3">
                {currentArticle.keyPoints.map((kp, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-[16px] bg-[#f4ede4] border border-[#e6e6e6] flex flex-col gap-1.5"
                  >
                    <span className="font-mono font-bold text-xs text-[#4a154b] uppercase tracking-wider">
                      {kp.label}
                    </span>
                    <p className="text-xs sm:text-sm text-[#1d1d1d] leading-relaxed">
                      {kp.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
