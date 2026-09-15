import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Database, Check, Droplets, MapPin, ArrowRight } from 'lucide-react'
import { SituationBriefActions } from '@/components/priority/SituationBriefActions'

interface AreaDetail {
  slug: string
  name: string
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  explanation: string
  components: {
    name: string
    value: number
    raw: string
    description: string
  }[]
  sources: {
    name: string
    type: string
    records: number
    lastSync: string
  }[]
}

const AREAS_DB: Record<string, AreaDetail> = {
  'semarang-utara': {
    slug: 'semarang-utara',
    name: 'Kecamatan Semarang Utara',
    score: 84.6,
    level: 'CRITICAL',
    explanation:
      'Area ini memiliki konsentrasi laporan pasang laut (rob) dan genangan yang sangat tinggi dalam 7 hari terakhir. Elevasi wilayah yang berada di bawah permukaan pasang air laut harian diperparah oleh penurunan tanah (land subsidence), menjadikannya kawasan berisiko paling mendesak di Kota Semarang.',
    components: [
      { name: 'Report Frequency [L]', value: 92, raw: '28 laporan / 7 hari', description: 'Konsentrasi laporan warga tertinggi di koridor pesisir.' },
      { name: 'Field Urgency [U]', value: 88, raw: 'Skor rata-rata 88/100', description: 'Mayoritas laporan menandai jalur logistik dan perumahan terputus.' },
      { name: 'Population Density [P]', value: 85, raw: '8.420 jiwa/km²', description: 'Kawasan padat permukiman nelayan dan pergudangan bandar.' },
      { name: 'Historical Disaster [H]', value: 89, raw: '14 kejadian (2020-2026)', description: 'Arsip BNPB mencatat frekuensi banjir rob teratur tiap pasang purnama.' },
      { name: 'Environmental Vulnerability [K]', value: 84, raw: 'Indeks 0.84 DEM Elevasi', description: 'Tingkat penurunan tanah aktif dan kejenuhan muara drainase.' },
      { name: 'Weather Indicator [C]', value: 70, raw: 'Curah hujan 42 mm/jam', description: 'Prakiraan BMKG menunjukkan probabilitas hujan tinggi dan pasang tinggi.' },
    ],
    sources: [
      { name: 'Citizen Reports (Warga)', type: 'Laporan Lapangan Spasial', records: 28, lastSync: '10 menit lalu' },
      { name: 'BNPB Geoportal', type: 'Katalog Sejarah Kejadian Bencana', records: 14, lastSync: 'Terintegrasi' },
      { name: 'OpenStreetMap Overpass', type: 'Jaringan Kanal & Tanggul Laut', records: 142, lastSync: '1 hari lalu' },
      { name: 'BMKG Data Publik', type: 'Prakiraan Cuaca Maritim & Hujan', records: 24, lastSync: '1 jam lalu' },
    ],
  },
  'tembalang': {
    slug: 'tembalang',
    name: 'Kecamatan Tembalang',
    score: 74.8,
    level: 'HIGH',
    explanation:
      'Area ini memiliki konsentrasi laporan limpasan air permukaan dan gerusan tanah di kawasan perbukitan permukiman mahasiswa. Perubahan tutupan lahan yang masif dalam lima tahun terakhir membebani kapasitas saluran drainase primer.',
    components: [
      { name: 'Report Frequency [L]', value: 78, raw: '19 laporan / 7 hari', description: 'Limpasan air deras di jalan turunan dan saluran meluap.' },
      { name: 'Field Urgency [U]', value: 75, raw: 'Skor rata-rata 75/100', description: 'Mengancam akses permukiman dan fondasi pagar tebing.' },
      { name: 'Population Density [P]', value: 80, raw: '7.800 jiwa/km²', description: 'Konsentrasi hunian kos dan pusat aktivitas akademik.' },
      { name: 'Historical Disaster [H]', value: 72, raw: '8 kejadian tanah bergerak/longsor', description: 'Catatan longsor talud dan saluran ambrol saat intensitas hujan tinggi.' },
      { name: 'Environmental Vulnerability [K]', value: 68, raw: 'Indeks 0.68', description: 'Kontur perbukitan dengan tingkat permeabilitas tanah menurun.' },
      { name: 'Weather Indicator [C]', value: 76, raw: 'Curah hujan 55 mm/jam', description: 'Prakiraan hujan lebat konvektif di dataran tinggi Semarang.' },
    ],
    sources: [
      { name: 'Citizen Reports (Warga)', type: 'Laporan Lapangan Spasial', records: 19, lastSync: '25 menit lalu' },
      { name: 'BNPB Geoportal', type: 'Katalog Sejarah Kejadian Bencana', records: 8, lastSync: 'Terintegrasi' },
      { name: 'OpenStreetMap Overpass', type: 'Topografi Jalan & Bangunan', records: 310, lastSync: '1 hari lalu' },
      { name: 'BMKG Data Publik', type: 'Stasiun Meteorologi Climatology', records: 24, lastSync: '1 jam lalu' },
    ],
  },
  'genuk': {
    slug: 'genuk',
    name: 'Kecamatan Genuk',
    score: 81.2,
    level: 'CRITICAL',
    explanation:
      'Area industri dan perumahan di Genuk mengalami banjir genangan berulang akibat luapan Kali Babon dan Kali Tenggang. Hambatan drainase di jalan nasional Pantura memperpanjang waktu surut air hingga beberapa hari.',
    components: [
      { name: 'Report Frequency [L]', value: 88, raw: '24 laporan / 7 hari', description: 'Genangan jalan raya dan area permukiman warga.' },
      { name: 'Field Urgency [U]', value: 84, raw: 'Skor rata-rata 84/100', description: 'Lumpuhnya akses jalur distribusi ekonomi nasional.' },
      { name: 'Population Density [P]', value: 74, raw: '6.500 jiwa/km²', description: 'Kawasan padat penduduk dan pekerja industri.' },
      { name: 'Historical Disaster [H]', value: 85, raw: '18 kejadian banjir genangan', description: 'Rekam historis jalur Pantura terendam berkala.' },
      { name: 'Environmental Vulnerability [K]', value: 88, raw: 'Indeks 0.88', description: 'Elevasi rendah dataran aluvial dengan laju sedimentasi muara.' },
      { name: 'Weather Indicator [C]', value: 72, raw: 'Curah hujan 48 mm/jam', description: 'Prakiraan hujan sedang disertai gelombang pasang rob laut.' },
    ],
    sources: [
      { name: 'Citizen Reports (Warga)', type: 'Laporan Lapangan Spasial', records: 24, lastSync: '15 menit lalu' },
      { name: 'BNPB Geoportal', type: 'Katalog Sejarah Kejadian Bencana', records: 18, lastSync: 'Terintegrasi' },
      { name: 'OpenStreetMap Overpass', type: 'Jaringan Saluran & Jalur Pantura', records: 215, lastSync: '1 hari lalu' },
      { name: 'BMKG Data Publik', type: 'Observasi Hujan & Pasang Maritim', records: 24, lastSync: '1 jam lalu' },
    ],
  },
}

import type { Metadata } from 'next'
import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'

function getAreaDetail(slug: string): AreaDetail {
  if (AREAS_DB[slug]) return AREAS_DB[slug]
  const k = SEMARANG_KECAMATAN.find((x) => x.slug === slug || x.id === slug)
  if (!k) return AREAS_DB['semarang-utara']

  const isCoastal = k.elevation_avg_m <= 4.0
  const isHill = k.elevation_avg_m >= 60.0
  const score = Number((k.flood_vulnerability_index * 0.85 + (isCoastal ? 10 : isHill ? 3 : 6)).toFixed(1))
  const level: AreaDetail['level'] = score >= 80 ? 'CRITICAL' : score >= 65 ? 'HIGH' : score >= 45 ? 'MEDIUM' : 'LOW'

  return {
    slug: k.slug,
    name: k.name,
    score,
    level,
    explanation: `Kawasan ${k.name} memiliki elevasi rata-rata ${k.elevation_avg_m} meter DPL dengan kepadatan penduduk ${k.population_density.toLocaleString('id-ID')} jiwa/km². Indeks kerentanan hidrometeorologis historis berada pada angka ${k.flood_vulnerability_index}/100 berdasarkan data BPS Kota Semarang dan kajian risiko spasial.`,
    components: [
      { name: 'Report Frequency [L]', value: Math.min(95, k.flood_vulnerability_index), raw: `${k.flood_vulnerability_index > 70 ? 'Tinggi' : 'Sedang'}`, description: 'Frekuensi laporan genangan dan drainase di wilayah ini.' },
      { name: 'Population Density [P]', value: Math.min(100, Math.round(k.population_density / 130)), raw: `${k.population_density.toLocaleString('id-ID')} jiwa/km²`, description: 'Tingkat kepadatan penduduk per kilometer persegi.' },
      { name: 'Historical Disaster [H]', value: k.flood_vulnerability_index, raw: `Indeks ${k.flood_vulnerability_index}/100`, description: 'Catatan historis genangan, rob pesisir, atau limpasan hulu.' },
      { name: 'Environmental Vulnerability [K]', value: Math.min(100, Math.max(10, Math.round(100 - k.elevation_avg_m * 2))), raw: `${k.elevation_avg_m} m DPL`, description: 'Model elevasi digital (DEM) dan karakteristik topografi lereng/pesisir.' },
    ],
    sources: [
      { name: 'BPS Kota Semarang', type: 'Statistik Spasial & Demografi', records: 1, lastSync: 'Terverifikasi' },
      { name: 'Ina-Geoportal DEM', type: 'Model Elevasi Digital Nasional', records: 1, lastSync: 'Terintegrasi' },
      { name: 'BMKG Data Publik', type: 'Stasiun Meteorologi Tanjung Emas', records: 24, lastSync: '1 jam lalu' },
    ],
  }
}

export async function generateStaticParams() {
  return SEMARANG_KECAMATAN.map((k) => ({
    area: k.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ area: string }>
}): Promise<Metadata> {
  const { area } = await params
  const data = getAreaDetail(area)

  return {
    title: `Prioritas Penanganan Banjir ${data.name} | KotaKu Siaga`,
    description: `Audit deterministik risiko bencana banjir dan rob ${data.name} Kota Semarang. Skor prioritas ${data.score}/100 dengan status ${data.level}. Pelajari profil elevasi, densitas penduduk, dan data historis.`,
    alternates: {
      canonical: `https://kotaku-siaga.vercel.app/priorities/${area}`,
    },
    openGraph: {
      title: `Prioritas Penanganan Banjir ${data.name} | KotaKu Siaga`,
      description: `Audit deterministik risiko bencana banjir dan rob ${data.name} Kota Semarang. Skor prioritas ${data.score}/100.`,
      url: `https://kotaku-siaga.vercel.app/priorities/${area}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Prioritas Penanganan Banjir ${data.name} | KotaKu Siaga`,
      description: `Audit deterministik risiko bencana banjir dan rob ${data.name} Kota Semarang. Skor prioritas ${data.score}/100.`,
    },
  }
}

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ area: string }>
}) {
  const { area } = await params
  const data = getAreaDetail(area)

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface min-h-screen pb-20">
      {/* Tactical Header */}
      <section className="pt-8 pb-8 bg-surface-container-lowest border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <SituationBriefActions areaName={data.name} score={data.score} level={data.level} />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                AUDIT DETERMINISTIK WILAYAH ISO 37120
              </span>
              <h1 className="font-headline text-2xl sm:text-4xl font-extrabold text-on-surface">
                {data.name}
              </h1>
            </div>

            <div className="flex items-baseline gap-4 border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant block">
                  Skor Deterministik
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-bold text-primary">
                  {data.score.toFixed(1)}
                </span>
              </div>
              <span
                className={`px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase rounded border ${
                  data.level === 'CRITICAL'
                    ? 'bg-error/20 text-error border-error/40'
                    : 'bg-tertiary/20 text-tertiary border-tertiary/40'
                }`}
              >
                {data.level}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Explanation & Component Breakdown */}
          <div className="lg:col-span-8 space-y-8">
            {/* WHY THIS AREA IS PRIORITIZED */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary block">
                Mengapa Wilayah Ini Diprioritaskan
              </span>
              <p className="font-body text-xs sm:text-sm text-on-surface leading-relaxed">
                {data.explanation}
              </p>
            </div>

            {/* Component breakdown */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-6">
              <div className="flex justify-between items-baseline pb-3 border-b border-outline-variant/30">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  Rincian 6 Parameter Formula D-RISK v2.4
                </h2>
                <span className="text-[11px] font-mono text-on-surface-variant">
                  Skala Normalisasi 0–100
                </span>
              </div>

              <div className="space-y-5">
                {data.components.map((comp) => (
                  <div key={comp.name} className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-on-surface">{comp.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-on-surface-variant">{comp.raw}</span>
                        <span className="font-mono font-bold text-xs text-primary w-8 text-right">
                          {comp.value}
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${comp.value}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      {comp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Data Provenance & Recommended Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/30">
                <Database className="h-4 w-4 text-primary" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface">
                  Sumber Data & Provenance
                </h3>
              </div>

              <div className="space-y-4">
                {data.sources.map((src) => (
                  <div key={src.name} className="border-b border-outline-variant/20 pb-3 last:border-b-0 last:pb-0 text-xs">
                    <span className="font-headline font-bold text-on-surface block">
                      {src.name}
                    </span>
                    <span className="text-[11px] text-on-surface-variant block mb-1">
                      {src.type}
                    </span>
                    <div className="flex justify-between text-[10px] font-mono text-primary">
                      <span>{src.records} record</span>
                      <span>{src.lastSync}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-secondary block">
                Arahan Intervensi EOC
              </span>
              <ul className="text-xs text-on-surface space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                  <span>Kesiapsiagaan rumah pompa Sringin & Tenggang 100% aktif.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                  <span>Pembersihan rutin sedimen drainase primer di muara.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
                  <span>Siaga armada perahu karet BPBD di titik rawan jalur logistik.</span>
                </li>
              </ul>

              <Link
                href={`/peta?q=${data.name}`}
                className="mt-4 w-full py-2.5 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider text-center hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <span>Buka Peta Wilayah Ini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
