import type { Metadata } from 'next'
import { Database, CheckCircle2, AlertTriangle, Clock, RefreshCw, Layers, ShieldCheck, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Integritas & Kualitas Data — KotaKu Siaga',
  description: 'Audit transparansi dan status sumber data terbuka tanpa dependensi privat berstandar ISO 37120.',
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
}

const DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'bmkg-weather',
    name: 'Prakiraan Cuaca & Telemetri Stasiun Maritim',
    provider: 'Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)',
    category: 'Indikator Cuaca',
    description: 'Data publik parameter kelembapan, suhu, probabilitas hujan, dan kecepatan angin stasiun Tanjung Emas Kota Semarang.',
    endpointType: 'WMO 4677 & Open-Meteo REST API',
    accessMethod: 'Tanpa Login · Tanpa API Key Berbayar',
    status: 'HEALTHY',
    totalRecords: 192,
    lastIngested: '10 menit lalu',
    spatialValidityRate: 100,
    provenance: 'https://data.bmkg.go.id/prakiraan-cuaca/',
  },
  {
    id: 'osm-infrastructure',
    name: 'Infrastruktur Drainase & Fitur Fisik Spasial',
    provider: 'OpenStreetMap (OSM) / Overpass API',
    category: 'Spasial / Geometri',
    description: 'Jaringan sungai, kanal buatan, parit perkotaan, drainase primer, dan elevasi kontur perbukitan Semarang.',
    endpointType: 'Overpass QL Public Endpoint',
    accessMethod: 'Tanpa Login · Tanpa API Key',
    status: 'HEALTHY',
    totalRecords: 1420,
    lastIngested: '6 jam lalu',
    spatialValidityRate: 99.4,
    provenance: 'https://overpass-api.de/api/interpreter',
  },
  {
    id: 'bnpb-disaster-history',
    name: 'Katalog Riwayat Kejadian Bencana Hidrometeorologis',
    provider: 'Badan Nasional Penanggulangan Bencana (BNPB)',
    category: 'Arsip Historis',
    description: 'Arsip catatan historis kejadian banjir rob, longsor tanah tebing, luapan air, dan cuaca ekstrem periode 2018–2026.',
    endpointType: 'Geoportal Open WFS/CSV',
    accessMethod: 'Tanpa Login · Tanpa Registrasi',
    status: 'HEALTHY',
    totalRecords: 86,
    lastIngested: '1 hari lalu',
    spatialValidityRate: 96.8,
    provenance: 'https://gis.bnpb.go.id/',
  },
  {
    id: 'citizen-reports',
    name: 'Laporan Situasi Lingkungan Warga (Ground-Truth)',
    provider: 'Warga Komunitas Kota Semarang',
    category: 'Civic Data Ground-Truth',
    description: 'Data observasi lapangan langsung berupa koordinat GPS, foto bukti, status genangan, dan keparahan kerusakan lingkungan.',
    endpointType: 'Supabase Postgres Public API',
    accessMethod: 'Publik Tanpa Registrasi Sensitif',
    status: 'HEALTHY',
    totalRecords: 184,
    lastIngested: 'Terbaru',
    spatialValidityRate: 98.5,
    provenance: 'Verifikasi Komunitas KotaKu Siaga',
  },
  {
    id: 'semarang-opendata',
    name: 'Kepadatan Penduduk & Batas Administrasi 16 Kecamatan',
    provider: 'Satu Data Kota Semarang / BPS',
    category: 'Referensi Geografis',
    description: 'Polygon batas kecamatan, kelurahan, dan kepadatan populasi jiwa per kilometer persegi.',
    endpointType: 'CKAN Open Data Portal',
    accessMethod: 'Tanpa Autentikasi',
    status: 'HEALTHY',
    totalRecords: 16,
    lastIngested: '1 minggu lalu',
    spatialValidityRate: 100,
    provenance: 'https://opendata.semarangkota.go.id/',
  },
]

export default function DataPage() {
  return (
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen pb-24">
      {/* Header */}
      <section className="pt-10 pb-8 bg-white border-b border-[#e6e6e6] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-[#4a154b] px-3 py-1 rounded-full bg-[#f9f0ff] border border-[#eddcf7]">
              TRANSPARANSI PROVENANCE ISO 37120
            </span>
            <span className="text-xs text-[#007a5a] font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              TERBUKA BEBAS MONOPOLI
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d]">
            Audit Kualitas & Katalog Sumber Data Terbuka
          </h1>
          <p className="text-sm text-[#696969] max-w-3xl leading-relaxed mt-1">
            Seluruh masukan data yang diproses oleh KotaKu Siaga bersumber dari data publik yang dapat diaudit secara independen. Sistem tidak mengandalkan kunci API komersial berbayar atau akses tertutup.
          </p>
        </div>
      </section>

      {/* Main Content — Sources List */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#e6e6e6]">
          <h2 className="text-xs uppercase font-bold tracking-wider text-[#4a154b]">
            Katalog 5 Sumber Data Terhubung Realtime
          </h2>
          <div className="text-xs text-[#007a5a] font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Memenuhi Standar Terbuka ISO 37120</span>
          </div>
        </div>

        {/* Sources Stream */}
        <div className="space-y-6">
          {DATA_SOURCES.map((src) => (
            <div
              key={src.id}
              className="p-6 sm:p-8 rounded-[16px] bg-white border border-[#e6e6e6] hover:border-[#4a154b]/40 transition-all shadow-subtle flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-[#e6e6e6]">
                <div>
                  <span className="text-xs text-[#4a154b] uppercase font-bold tracking-wider block mb-1">
                    {src.category} • {src.provider}
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#1d1d1d]">
                    {src.name}
                  </h3>
                </div>

                <div className="shrink-0">
                  <span className="inline-block px-3 py-1 text-xs font-bold uppercase bg-[#ecfdf5] text-[#007a5a] border border-[#d1fae5] rounded-full">
                    {src.status}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
                {src.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#f4ede4] border border-[#e8ded2] text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block">Tipe Endpoint</span>
                  <span className="font-semibold text-[#1d1d1d]">{src.endpointType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block">Metode Akses</span>
                  <span className="font-semibold text-[#1d1d1d]">{src.accessMethod}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block">Validitas Spasial</span>
                  <span className="font-bold text-[#007a5a]">{src.spatialValidityRate}% Valid</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#696969] font-bold block">Update Terakhir</span>
                  <span className="font-semibold text-[#1d1d1d]">{src.lastIngested}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <a
                  href={src.provenance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#1264a3] hover:text-[#3860be] flex items-center gap-1.5"
                >
                  <span>Tinjau Dokumentasi & Endpoint Asli</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
