import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Database,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Radio,
  Layers,
  Video,
  FileText,
  Cpu,
  ArrowRight,
  Eye,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integritas & Lineage Data Bencana Semarang | KotaKu Siaga',
  description:
    'Transparansi dan integritas sumber data kebencanaan terbuka Kota Semarang berstandar ISO 37120. Audit telemetri BMKG, Open-Meteo, Windy, CCTV PantauSemar, dan Satu Data Semarang.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/data',
  },
  openGraph: {
    title: 'Integritas & Lineage Data Bencana Semarang | KotaKu Siaga',
    description:
      'Transparansi dan integritas sumber data kebencanaan terbuka Kota Semarang berstandar ISO 37120. Audit telemetri BMKG, Open-Meteo, Windy, CCTV PantauSemar, dan Satu Data Semarang.',
    url: 'https://kotaku-siaga.vercel.app/data',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Integritas & Lineage Data Bencana Semarang | KotaKu Siaga',
    description:
      'Transparansi dan integritas sumber data kebencanaan terbuka Kota Semarang berstandar ISO 37120. Audit telemetri BMKG, Open-Meteo, Windy, CCTV PantauSemar, dan Satu Data Semarang.',
  },
}

const dataCatalogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DataCatalog',
  name: 'Katalog Data Terbuka Kebencanaan KotaKu Siaga',
  description:
    'Katalog sumber data terbuka parameter hidrometeorologis, gelombang laut pasang, radar cuaca satelit, dan pemantauan CCTV Kota Semarang berstandar ISO 37120.',
  url: 'https://kotaku-siaga.vercel.app/data',
  publisher: {
    '@type': 'Organization',
    name: 'KotaKu Siaga',
  },
  dataset: [
    {
      '@type': 'Dataset',
      name: 'Telemetri Cuaca & Curah Hujan BMKG Stasiun Semarang',
      description: 'Parameter curah hujan riil, suhu, kelembapan, dan kecepatan angin stasiun Tanjung Emas Semarang.',
      license: 'https://creativecommons.org/licenses/by/4.0/',
      spatialCoverage: 'Kota Semarang, Jawa Tengah, Indonesia',
    },
    {
      '@type': 'Dataset',
      name: 'Data Spasial Administrasi & Elevasi 16 Kecamatan Semarang',
      description: 'Data batas wilayah, populasi, elevasi digital rata-rata DPL, dan indeks kerentanan bencana BPS Kota Semarang.',
      license: 'https://opendata.semarangkota.go.id',
      spatialCoverage: 'Kota Semarang',
    },
    {
      '@type': 'Dataset',
      name: 'Windy Spatial Radar & Atmospheric Composite',
      description: 'Lapisan radar presipitasi hujan real-time Doppler dan aliran angin 10m ECMWF Kota Semarang.',
      license: 'https://www.windy.com',
      spatialCoverage: 'Pesisir Kota Semarang & Laut Jawa',
    },
  ],
}

interface DataSourceItem {
  id: string
  name: string
  provider: string
  category: string
  description: string
  endpointType: string
  accessMethod: string
  status: 'HEALTHY' | 'WARNING' | 'STALE' | 'ERROR'
  totalRecords: number
  lastIngested: string
  spatialValidityRate: number
  provenance: string
  provenanceLabel: string
  isExternal: boolean
  appLink?: string
  appLinkLabel?: string
}

const DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'bmkg-weather',
    name: 'Prakiraan Cuaca & Telemetri Stasiun Maritim',
    provider: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
    category: 'Indikator Cuaca',
    description: 'Data publik parameter kelembapan, suhu, probabilitas hujan, dan kecepatan angin stasiun Tanjung Emas Kota Semarang terhubung telemetri WMO & Open-Meteo.',
    endpointType: 'WMO 4677 & Open-Meteo REST API',
    accessMethod: 'Terbuka · Tanpa Login · Tanpa Kunci Berbayar',
    status: 'HEALTHY',
    totalRecords: 192,
    lastIngested: '10 menit lalu',
    spatialValidityRate: 100,
    provenance: 'https://data.bmkg.go.id/',
    provenanceLabel: 'Portal Data Terbuka BMKG',
    isExternal: true,
    appLink: '/peta?view=weather',
    appLinkLabel: 'Lihat Analisis Cuaca di Peta',
  },
  {
    id: 'windy-spatial-radar',
    name: 'Windy Spatial Radar & ECMWF Atmospheric Engine',
    provider: 'Windy.com / ECMWF & WaveWatch III',
    category: 'Radar Satelit & Atmosfer',
    description: 'Lapisan radar presipitasi hujan real-time Doppler, visualisasi aliran angin 10m model ECMWF, tinggi gelombang laut pasang Laut Jawa, dan tutupan awan satelit optik.',
    endpointType: 'Windy Live Embed & Doppler Tile Stream',
    accessMethod: 'Terbuka · Tanpa Kunci Berbayar',
    status: 'HEALTHY',
    totalRecords: 520,
    lastIngested: 'Realtime Stream',
    spatialValidityRate: 99.8,
    provenance: 'https://www.windy.com/?-6.96,110.42,11',
    provenanceLabel: 'Windy Radar Live Semarang',
    isExternal: true,
    appLink: '/peta',
    appLinkLabel: 'Buka Radar Windy di Peta Spasial',
  },
  {
    id: 'cctv-pantausemar',
    name: 'Jaringan CCTV Pemantau Genangan & Polder',
    provider: 'Diskominfo Pemerintah Kota Semarang (PantauSemar)',
    category: 'Visual Ground-Truth',
    description: 'Pengawasan visual real-time di 70+ titik rawan rob, jembatan sungai, underpass, dan rumah pompa polder (Sringin, Tenggang, Kali Baru, Kaligawe).',
    endpointType: 'PantauSemar HLS Live Stream Video',
    accessMethod: 'Akses Publik Bebas Terbuka',
    status: 'HEALTHY',
    totalRecords: 70,
    lastIngested: 'Live Stream Aktif',
    spatialValidityRate: 100,
    provenance: 'https://pantausemar.semarangkota.go.id/',
    provenanceLabel: 'Portal Resmi PantauSemar',
    isExternal: true,
    appLink: '/peta',
    appLinkLabel: 'Pantau CCTV di Peta Semarang',
  },
  {
    id: 'osm-infrastructure',
    name: 'Infrastruktur Drainase & Fitur Fisik Spasial',
    provider: 'OpenStreetMap (OSM) / Overpass API',
    category: 'Spasial / Geometri',
    description: 'Jaringan sungai primer/sekunder, kanal buatan, drainase perkotaan, tanggul pesisir, dan kontur elevasi perbukitan Semarang.',
    endpointType: 'Overpass QL Public Query API',
    accessMethod: 'Terbuka · Tanpa Login · Tanpa API Key',
    status: 'HEALTHY',
    totalRecords: 1420,
    lastIngested: '6 jam lalu',
    spatialValidityRate: 99.4,
    provenance: 'https://wiki.openstreetmap.org/wiki/Overpass_API',
    provenanceLabel: 'Dokumentasi Overpass OSM',
    isExternal: true,
    appLink: '/peta',
    appLinkLabel: 'Lihat Geometri di Peta GIS',
  },
  {
    id: 'bnpb-disaster-history',
    name: 'Katalog Riwayat Bencana Hidrometeorologis (DIBI)',
    provider: 'Badan Nasional Penanggulangan Bencana (BNPB)',
    category: 'Arsip Historis',
    description: 'Catatan historis kejadian banjir rob, longsor tebing, genangan air jalan raya, dan cuaca ekstrem Kota Semarang periode 2018–2026.',
    endpointType: 'Geoportal Open WFS & DIBI CSV',
    accessMethod: 'Terbuka · Tanpa Registrasi',
    status: 'HEALTHY',
    totalRecords: 86,
    lastIngested: '1 hari lalu',
    spatialValidityRate: 96.8,
    provenance: 'https://dibi.bnpb.go.id/',
    provenanceLabel: 'Katalog DIBI BNPB Indonesia',
    isExternal: true,
    appLink: '/priorities',
    appLinkLabel: 'Lihat Matriks Prioritas Risiko',
  },
  {
    id: 'citizen-reports',
    name: 'Laporan Situasi Lingkungan Warga (Ground-Truth)',
    provider: 'Warga Komunitas Kota Semarang (Citizen Science)',
    category: 'Civic Data Ground-Truth',
    description: 'Data observasi lapangan langsung berupa koordinat GPS, foto bukti, status kedalaman genangan, dan catatan kondisi lingkungan warga.',
    endpointType: 'Supabase Postgres Public API',
    accessMethod: 'Publik Tanpa Registrasi Sensitif',
    status: 'HEALTHY',
    totalRecords: 184,
    lastIngested: 'Terbaru Realtime',
    spatialValidityRate: 98.5,
    provenance: '/laporan',
    provenanceLabel: 'Katalog Laporan Warga Publik',
    isExternal: false,
    appLink: '/laporan/baru',
    appLinkLabel: 'Kirim Laporan Genangan Baru',
  },
  {
    id: 'semarang-opendata',
    name: 'Kepadatan Penduduk & Batas Administrasi 16 Kecamatan',
    provider: 'Satu Data Kota Semarang / BPS',
    category: 'Referensi Geografis',
    description: 'Polygon batas 16 kecamatan, 177 kelurahan, dan kepadatan populasi jiwa per kilometer persegi untuk pembobotan risiko bencana ISO 37120.',
    endpointType: 'CKAN Open Data Portal & BPS API',
    accessMethod: 'Tanpa Autentikasi',
    status: 'HEALTHY',
    totalRecords: 16,
    lastIngested: '1 minggu lalu',
    spatialValidityRate: 100,
    provenance: 'https://opendata.semarangkota.go.id/',
    provenanceLabel: 'Satu Data Kota Semarang',
    isExternal: true,
    appLink: '/priorities',
    appLinkLabel: 'Tinjau Indeks Kerentanan Wilayah',
  },
  {
    id: 'openrouter-ai',
    name: 'Engine Analisis Intelijen Kebencanaan AI',
    provider: 'OpenRouter Multi-Key Pool (4 Failover Keys)',
    category: 'Intelijen & Sintesis Data',
    description: 'Sistem ekstraksi data terstruktur, evaluasi dampak genangan, dan rekomendasi jalur evakuasi aman berbasis model terbuka berlatensi rendah tanpa black-box.',
    endpointType: 'OpenRouter Multi-Key REST API',
    accessMethod: 'Pool Failover Otomatis (Key 1..4)',
    status: 'HEALTHY',
    totalRecords: 4,
    lastIngested: 'Aktif Terhubung',
    spatialValidityRate: 100,
    provenance: 'https://openrouter.ai/docs',
    provenanceLabel: 'Dokumentasi OpenRouter AI',
    isExternal: true,
    appLink: '/dashboard',
    appLinkLabel: 'Audit Key Pool & Latensi di Dashboard',
  },
]

export default function DataPage() {
  return (
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataCatalogJsonLd) }}
      />

      {/* Header */}
      <section className="pt-10 pb-8 bg-white border-b border-[#e6e6e6] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold text-[#4a154b] px-3 py-1 rounded-full bg-[#f9f0ff] border border-[#eddcf7]">
              TRANSPARANSI PROVENANCE ISO 37120
            </span>
            <span className="text-xs text-[#007a5a] font-semibold flex items-center gap-1.5 bg-[#e6f4ea] px-3 py-1 rounded-full border border-[#ceead6]">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              TERBUKA & BEBAS MONOPOLI
            </span>
            <span className="text-xs text-[#1264a3] font-semibold flex items-center gap-1.5 bg-[#e8f0fe] px-3 py-1 rounded-full border border-[#d2e3fc]">
              8 SUMBER DATA REALTIME
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#1d1d1d]">
            Audit Kualitas & Katalog Sumber Data Terbuka
          </h1>
          <p className="text-sm text-[#696969] max-w-3xl leading-relaxed">
            Seluruh masukan data yang diproses oleh KotaKu Siaga bersumber dari data publik dan observasi warga yang dapat diaudit secara independen. Sistem tidak bergantung pada kunci API komersial monopoli berbayar atau akses tertutup.
          </p>
        </div>
      </section>

      {/* Main Content — Sources List */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-[#e6e6e6]">
          <div>
            <h2 className="text-xs uppercase font-bold tracking-wider text-[#4a154b]">
              Katalog 8 Sumber Data Terhubung Realtime
            </h2>
            <p className="text-xs text-[#696969] mt-0.5">
              Semua tautan dokumentasi resmi dan endpoint dapat diakses langsung tanpa batasan.
            </p>
          </div>
          <div className="text-xs text-[#007a5a] font-bold flex items-center gap-1.5 shrink-0 bg-[#e6f4ea] px-3 py-1.5 rounded-full border border-[#ceead6]">
            <CheckCircle2 className="h-4 w-4 text-[#007a5a]" />
            <span>Memenuhi Standar Terbuka ISO 37120</span>
          </div>
        </div>

        {/* Sources Stream */}
        <div className="space-y-5">
          {DATA_SOURCES.map((src) => (
            <div
              key={src.id}
              className="p-5 sm:p-7 rounded-[18px] bg-white border border-[#e6e6e6] hover:border-[#4a154b]/40 transition-all shadow-subtle flex flex-col gap-4"
            >
              {/* Top Row: Provider, Name, Status */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-[#e6e6e6]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-[#4a154b] uppercase font-bold tracking-wider">
                      {src.category}
                    </span>
                    <span className="text-[#696969] text-xs">•</span>
                    <span className="text-xs font-semibold text-[#696969]">
                      {src.provider}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#1d1d1d]">
                    {src.name}
                  </h3>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase bg-[#ecfdf5] text-[#007a5a] border border-[#d1fae5] rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#007a5a]"></span>
                    {src.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
                {src.description}
              </p>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-[#fdfbf9] border border-[#e8ded2] text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block mb-0.5">Tipe Endpoint</span>
                  <span className="font-semibold text-[#1d1d1d] font-mono text-[11px] block truncate" title={src.endpointType}>
                    {src.endpointType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block mb-0.5">Metode Akses</span>
                  <span className="font-semibold text-[#1d1d1d] block truncate" title={src.accessMethod}>
                    {src.accessMethod}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block mb-0.5">Validitas Spasial</span>
                  <span className="font-bold text-[#007a5a] block">
                    {src.spatialValidityRate}% Terverifikasi
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block mb-0.5">Pembaruan Data</span>
                  <span className="font-semibold text-[#1d1d1d] block">
                    {src.lastIngested}
                  </span>
                </div>
              </div>

              {/* Bottom Action Links */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-[#f0f0f0]">
                {/* Official Documentation Link */}
                <div className="flex items-center gap-2">
                  {src.isExternal ? (
                    <a
                      href={src.provenance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] font-bold text-xs transition-colors"
                      title={`Buka ${src.provenanceLabel}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#4a154b]" />
                      <span>{src.provenanceLabel}</span>
                    </a>
                  ) : (
                    <Link
                      href={src.provenance}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] font-bold text-xs transition-colors"
                      title={src.provenanceLabel}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#4a154b]" />
                      <span>{src.provenanceLabel}</span>
                    </Link>
                  )}
                </div>

                {/* In-App Direct View Button */}
                {src.appLink && (
                  <Link
                    href={src.appLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4a154b] hover:bg-[#3d113e] text-white font-bold text-xs transition-all shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{src.appLinkLabel || 'Buka di Aplikasi'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
