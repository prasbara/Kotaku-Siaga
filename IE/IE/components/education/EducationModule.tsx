'use client'

import { useState } from 'react'
import type { ReportCategory } from '@/types'
import { ArrowRight, BookOpen, ShieldAlert, CheckCircle2 } from 'lucide-react'

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
    subtitle: 'Memahami bagaimana curah hujan ekstrem, daya tampung polder, penurunan tanah (subsidence), dan pasang rob laut berinteraksi.',
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
    <div className="flex flex-col w-full bg-surface text-on-surface min-h-screen pb-20">
      {/* Tactical Header */}
      <section className="pt-10 pb-8 bg-surface-container-lowest border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/30">
              LITERASI & RESILIENSI IKLIM
            </span>
            <span className="font-mono text-xs text-secondary flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              PANDUAN PRAKTIS WARGA
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface">
            Kajian & Panduan Ketahanan Perkotaan Semarang
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-3xl leading-relaxed">
            Materi kajian mendalam untuk memahami sains hidrologi lingkungan, dinamika banjir rob pesisir, kestabilan lereng, dan langkah antisipasi warga kota.
          </p>
        </div>
      </section>

      {/* Main Reading Section */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar of Articles */}
          <aside className="lg:col-span-4 flex flex-col gap-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary pb-2 border-b border-outline-variant/30">
              Daftar Topik Kajian
            </span>
            <nav className="flex flex-col gap-2.5">
              {ARTICLES.map((art) => {
                const isSelected = art.slug === selectedSlug
                return (
                  <button
                    key={art.slug}
                    onClick={() => setSelectedSlug(art.slug)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary-container/20 border-primary shadow-[0_0_12px_rgba(76,215,246,0.2)]'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-primary uppercase tracking-wider block mb-1">
                      {art.overline} • {art.readingTime}
                    </span>
                    <span className="font-headline font-bold text-sm block mb-1 text-on-surface">
                      {art.title}
                    </span>
                    <p className="font-body text-xs text-on-surface-variant line-clamp-2">
                      {art.subtitle}
                    </p>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Publication Article Content */}
          <article className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-6 shadow-md">
            <div>
              <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase block mb-1">
                {currentArticle.overline}
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight mb-3">
                {currentArticle.title}
              </h2>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed pb-4 border-b border-outline-variant/30">
                {currentArticle.subtitle}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-on-surface leading-relaxed font-body">
              {currentArticle.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Key Points Strip */}
            <div className="mt-4 pt-6 border-t border-outline-variant/30 flex flex-col gap-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Poin Kunci & Tindakan Mitigasi
              </span>

              <div className="grid grid-cols-1 gap-3">
                {currentArticle.keyPoints.map((kp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1"
                  >
                    <span className="font-mono font-bold text-xs text-primary uppercase tracking-wider">
                      {kp.label}
                    </span>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">
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
