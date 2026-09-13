'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  Download,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Wind,
  Layers,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react'

interface DistrictData {
  id: string
  name: string
  score: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  reportsCount: number
  primaryIssue: string
  trend: string
  vars: {
    L: number // Laporan Warga (0-100)
    U: number // Urgensi (0-100)
    P: number // Kepadatan Jiwa (0-100)
    H: number // Historis InaRISK (0-100)
    K: number // Kerentanan Elevasi (0-100)
    C: number // Curah Hujan BMKG (0-100)
  }
}

const INITIAL_DISTRICTS: DistrictData[] = [
  {
    id: 'semarang-utara',
    name: 'Semarang Utara',
    score: 84.6,
    level: 'CRITICAL',
    reportsCount: 28,
    primaryIssue: 'Banjir Rob Tanjung Emas & Bandarharjo',
    trend: '+4 laporan mgg ini',
    vars: { L: 88, U: 92, P: 85, H: 90, K: 95, C: 78 },
  },
  {
    id: 'genuk',
    name: 'Genuk',
    score: 81.2,
    level: 'CRITICAL',
    reportsCount: 24,
    primaryIssue: 'Genangan Pantura Kaligawe & Industri Terboyo',
    trend: '+6 laporan mgg ini',
    vars: { L: 85, U: 88, P: 80, H: 86, K: 90, C: 75 },
  },
  {
    id: 'semarang-timur',
    name: 'Semarang Timur',
    score: 76.4,
    level: 'HIGH',
    reportsCount: 21,
    primaryIssue: 'Luapan Kanal Banjir Timur & Antrean Saluran',
    trend: '+3 laporan mgg ini',
    vars: { L: 78, U: 80, P: 88, H: 82, K: 75, C: 72 },
  },
  {
    id: 'gayamsari',
    name: 'Gayamsari',
    score: 72.3,
    level: 'HIGH',
    reportsCount: 17,
    primaryIssue: 'Sedimentasi Kaligawe & Genangan Tambakrejo',
    trend: 'Stabil',
    vars: { L: 72, U: 74, P: 76, H: 75, K: 80, C: 68 },
  },
  {
    id: 'tembalang',
    name: 'Tembalang',
    score: 68.5,
    level: 'HIGH',
    reportsCount: 19,
    primaryIssue: 'Erosi Lereng & Drainase Perbukitan',
    trend: '+2 laporan mgg ini',
    vars: { L: 65, U: 70, P: 72, H: 68, K: 70, C: 82 },
  },
  {
    id: 'semarang-barat',
    name: 'Semarang Barat',
    score: 65.0,
    level: 'HIGH',
    reportsCount: 15,
    primaryIssue: 'Kawasan Pesisir Ronggowarsito & Tawang Mas',
    trend: 'Stabil',
    vars: { L: 64, U: 68, P: 70, H: 66, K: 72, C: 60 },
  },
  {
    id: 'pedurungan',
    name: 'Pedurungan',
    score: 58.2,
    level: 'MEDIUM',
    reportsCount: 13,
    primaryIssue: 'Genangan Muktiharjo & Drainase Pemukiman',
    trend: '-1 laporan mgg ini',
    vars: { L: 56, U: 58, P: 82, H: 60, K: 55, C: 54 },
  },
  {
    id: 'candisari',
    name: 'Candisari',
    score: 54.0,
    level: 'MEDIUM',
    reportsCount: 9,
    primaryIssue: 'Kawasan Lereng Rawan Retakan Tanah',
    trend: 'Stabil',
    vars: { L: 48, U: 55, P: 65, H: 58, K: 62, C: 70 },
  },
  {
    id: 'ngaliyan',
    name: 'Ngaliyan',
    score: 52.8,
    level: 'MEDIUM',
    reportsCount: 11,
    primaryIssue: 'Luapan Aliran Saluran Silandak',
    trend: 'Stabil',
    vars: { L: 50, U: 52, P: 60, H: 54, K: 50, C: 64 },
  },
  {
    id: 'gajahmungkur',
    name: 'Gajahmungkur',
    score: 48.6,
    level: 'MEDIUM',
    reportsCount: 7,
    primaryIssue: 'Drainase Lereng & Tebing Gombel Lama',
    trend: '-2 laporan mgg ini',
    vars: { L: 42, U: 48, P: 55, H: 52, K: 58, C: 65 },
  },
  {
    id: 'semarang-tengah',
    name: 'Semarang Tengah',
    score: 46.5,
    level: 'MEDIUM',
    reportsCount: 8,
    primaryIssue: 'Polder Pemuda & Kawasan Johar',
    trend: 'Terkendali',
    vars: { L: 45, U: 46, P: 75, H: 50, K: 42, C: 40 },
  },
  {
    id: 'semarang-selatan',
    name: 'Semarang Selatan',
    score: 42.0,
    level: 'MEDIUM',
    reportsCount: 6,
    primaryIssue: 'Saluran Peterongan & Sompok',
    trend: 'Terkendali',
    vars: { L: 40, U: 42, P: 68, H: 45, K: 40, C: 42 },
  },
  {
    id: 'banyumanik',
    name: 'Banyumanik',
    score: 38.4,
    level: 'LOW',
    reportsCount: 5,
    primaryIssue: 'Drainase Jalur Perintis Kemerdekaan',
    trend: 'Aman',
    vars: { L: 35, U: 36, P: 58, H: 38, K: 35, C: 50 },
  },
  {
    id: 'tugu',
    name: 'Tugu',
    score: 36.2,
    level: 'LOW',
    reportsCount: 4,
    primaryIssue: 'Pesisir Mangkang & Muara Beringin',
    trend: 'Terkendali Pompa',
    vars: { L: 38, U: 40, P: 40, H: 45, K: 50, C: 42 },
  },
  {
    id: 'gunungpati',
    name: 'Gunungpati',
    score: 32.0,
    level: 'LOW',
    reportsCount: 3,
    primaryIssue: 'Aliran Sungai Garang Hulu',
    trend: 'Aman',
    vars: { L: 28, U: 30, P: 45, H: 35, K: 40, C: 55 },
  },
  {
    id: 'mijen',
    name: 'Mijen',
    score: 28.5,
    level: 'LOW',
    reportsCount: 2,
    primaryIssue: 'Saluran Perkebunan & Batas Barat',
    trend: 'Aman Terkendali',
    vars: { L: 22, U: 25, P: 35, H: 30, K: 30, C: 45 },
  },
]

export default function PrioritiesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(INITIAL_DISTRICTS[0])
  const [showSimulator, setShowSimulator] = useState(false)

  // Dynamic Weights (default deterministic: 0.25, 0.20, 0.15, 0.15, 0.15, 0.10)
  const [weights, setWeights] = useState({
    L: 0.25,
    U: 0.20,
    P: 0.15,
    H: 0.15,
    K: 0.15,
    C: 0.10,
  })

  // Recalculate district scores dynamically based on weights
  const recalculatedDistricts = useMemo(() => {
    return INITIAL_DISTRICTS.map((d) => {
      const calcScore =
        weights.L * d.vars.L +
        weights.U * d.vars.U +
        weights.P * d.vars.P +
        weights.H * d.vars.H +
        weights.K * d.vars.K +
        weights.C * d.vars.C

      const scoreRounded = Math.round(calcScore * 10) / 10
      let level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
      if (scoreRounded >= 75) level = 'CRITICAL'
      else if (scoreRounded >= 60) level = 'HIGH'
      else if (scoreRounded >= 40) level = 'MEDIUM'

      return {
        ...d,
        score: scoreRounded,
        level,
      }
    }).sort((a, b) => b.score - a.score)
  }, [weights])

  const filteredDistricts = useMemo(() => {
    return recalculatedDistricts.filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      const matchesFilter = riskFilter === 'ALL' || d.level === riskFilter
      return matchesSearch && matchesFilter
    })
  }, [recalculatedDistricts, searchQuery, riskFilter])

  const exportCSV = () => {
    const headers = ['Kecamatan', 'Skor Akhir', 'Level', 'Laporan Warga', 'Urgensi', 'Kepadatan', 'Historis', 'Elevasi', 'Curah Hujan']
    const rows = recalculatedDistricts.map((d) => [
      d.name,
      d.score,
      d.level,
      d.vars.L,
      d.vars.U,
      d.vars.P,
      d.vars.H,
      d.vars.K,
      d.vars.C,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'matriks_prioritas_semarang.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface min-h-screen">
      {/* 1. FORMULA INTELLIGENCE & METOCEAN BANNER */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 bg-surface-container-lowest border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-primary-container text-on-primary-container font-mono text-[10px] font-bold tracking-wider uppercase">
                  ALGORITMA TERVERIFIKASI ISO 37120
                </span>
                <span className="font-mono text-xs text-secondary flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  SINKRONISASI REAL-TIME
                </span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface">
                Matriks Risiko Spasial & Transparansi Data
              </h1>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Sistem pembobotan risiko deterministik non-komersial Kota Semarang. Menghitung kerentanan hidrometeorologis kumulatif secara terbuka tanpa dependensi API proprietary berbayar.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-surface-container px-4 py-2.5 rounded-xl border border-outline-variant/40 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[28px]">biotech</span>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
                  Versi Formula
                </span>
                <span className="font-mono text-sm text-on-surface font-bold">
                  D-RISK v2.4 (Open Math)
                </span>
              </div>
            </div>
          </div>

          {/* Formula Breakdown Cards & Metocean Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Mathematical Formula Visualizer */}
            <div className="lg:col-span-8 bg-surface-container rounded-xl p-5 sm:p-6 border border-outline-variant/30 shadow-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">
                  Persamaan Deterministik Terbuka
                </span>
                <span className="font-mono text-xs text-on-surface-variant">Total Bobot Σ = 1.00 (100%)</span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-3 sm:p-4 overflow-x-auto border border-outline-variant/30">
                <code className="font-mono text-sm sm:text-base text-primary whitespace-nowrap block font-bold">
                  FinalScore = ({weights.L.toFixed(2)}·L) + ({weights.U.toFixed(2)}·U) + ({weights.P.toFixed(2)}·P) + ({weights.H.toFixed(2)}·H) + ({weights.K.toFixed(2)}·K) + ({weights.C.toFixed(2)}·C)
                </code>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                <div className="flex flex-col bg-surface-container-high p-2.5 rounded border border-outline-variant/20">
                  <span className="font-mono text-[11px] text-primary font-bold">{(weights.L * 100).toFixed(0)}% [L]</span>
                  <span className="font-body text-xs text-on-surface font-semibold truncate">Laporan Warga</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">Telemetri + Bot</span>
                </div>
                <div className="flex flex-col bg-surface-container-high p-2.5 rounded border border-outline-variant/20">
                  <span className="font-mono text-[11px] text-tertiary font-bold">{(weights.U * 100).toFixed(0)}% [U]</span>
                  <span className="font-body text-xs text-on-surface font-semibold truncate">Tingkat Urgensi</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">Kenaikan Air/Jam</span>
                </div>
                <div className="flex flex-col bg-surface-container-high p-2.5 rounded border border-outline-variant/20">
                  <span className="font-mono text-[11px] text-secondary font-bold">{(weights.P * 100).toFixed(0)}% [P]</span>
                  <span className="font-body text-xs text-on-surface font-semibold truncate">Kepadatan Jiwa</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">BPS Kota Smg</span>
                </div>
                <div className="flex flex-col bg-surface-container-high p-2.5 rounded border border-outline-variant/20">
                  <span className="font-mono text-[11px] text-primary font-bold">{(weights.H * 100).toFixed(0)}% [H]</span>
                  <span className="font-body text-xs text-on-surface font-semibold truncate">Data Historis</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">InaRISK 10 Thn</span>
                </div>
                <div className="flex flex-col bg-surface-container-high p-2.5 rounded border border-outline-variant/20">
                  <span className="font-mono text-[11px] text-tertiary font-bold">{(weights.K * 100).toFixed(0)}% [K]</span>
                  <span className="font-body text-xs text-on-surface font-semibold truncate">Kerentanan Fisik</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">DEM Elevasi Rob</span>
                </div>
                <div className="flex flex-col bg-surface-container-high p-2.5 rounded border border-outline-variant/20">
                  <span className="font-mono text-[11px] text-secondary font-bold">{(weights.C * 100).toFixed(0)}% [C]</span>
                  <span className="font-body text-xs text-on-surface font-semibold truncate">Curah Hujan</span>
                  <span className="font-mono text-[9px] text-on-surface-variant">AWS BMKG Maritim</span>
                </div>
              </div>
            </div>

            {/* Metocean Coastal Live Feeds */}
            <div className="lg:col-span-4 bg-surface-container rounded-xl p-5 sm:p-6 border border-outline-variant/30 shadow-md flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-tertiary font-bold uppercase tracking-wider">
                  Telemetri Pesisir Semarang
                </span>
                <span className="material-symbols-outlined text-tertiary text-[20px]">tsunami</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                      Pasang Air Laut (St. Tanjung Emas)
                    </span>
                    <span className="font-mono text-2xl text-error font-bold">+92 cm</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-error/20 text-error font-mono text-[10px] font-bold">
                    PASANG MAKS
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                      Curah Hujan Maritim BMKG
                    </span>
                    <span className="font-mono text-2xl text-tertiary font-bold">48.2 mm/j</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-tertiary/20 text-tertiary font-mono text-[10px] font-bold">
                    HUJAN LEBAT
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="font-mono text-[10px]">Stasiun: AWS-MARITIM-TE01</span>
                <span className="font-mono text-[11px] text-primary font-semibold">Valid 3 Jam Kedepan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE MATRIX OF 16 DISTRICTS */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-primary uppercase font-bold tracking-wider">
                Tingkat Prioritas Intervensi Wilayah
              </span>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                Urutan Prioritas Risiko 16 Kecamatan
              </h2>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant">
                Pilih kecamatan untuk membuka rincian nilai 6 variabel dan rekomendasi aksi dinas terkait.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full md:w-auto">
              <div className="relative flex-1 min-w-[180px] sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama kecamatan..."
                  className="w-full pl-9 pr-3 h-10 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface font-body text-xs focus:outline-none focus:border-primary"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              </div>

              {/* Risk Level Filter */}
              <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/30 overflow-x-auto max-w-full">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRiskFilter(level)}
                    className={`px-2.5 min-h-[36px] flex items-center justify-center rounded font-mono text-[10px] font-bold transition-all ${
                      riskFilter === level
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {level === 'ALL' ? 'SEMUA' : level}
                  </button>
                ))}
              </div>

              {/* Simulator & Export buttons */}
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className={`min-h-[38px] px-3 rounded-lg border flex items-center justify-center gap-1.5 font-mono text-xs font-semibold transition-colors ${
                  showSimulator
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface border-outline-variant/40 hover:bg-surface-container-high'
                }`}
                title="Buka Simulator Bobot Formula"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulator</span>
              </button>

              <button
                onClick={exportCSV}
                className="min-h-[38px] px-3 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 hover:bg-surface-container-high font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                title="Ekspor CSV Data Terbuka"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC WEIGHT SIMULATOR PANEL */}
          {showSimulator && (
            <div className="p-5 rounded-xl bg-surface-container-low border border-primary/40 shadow-xl flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    Simulator Bobot Deterministik (Uji Sensitivitas Wilayah)
                  </span>
                </div>
                <button
                  onClick={() =>
                    setWeights({ L: 0.25, U: 0.20, P: 0.15, H: 0.15, K: 0.15, C: 0.10 })
                  }
                  className="font-mono text-[11px] text-on-surface-variant hover:text-primary underline"
                >
                  Reset ke Bobot Standar ISO 37120
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Laporan Warga (L)</span>
                    <span className="text-primary font-bold">{(weights.L * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={weights.L}
                    onChange={(e) => setWeights({ ...weights, L: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Tingkat Urgensi (U)</span>
                    <span className="text-tertiary font-bold">{(weights.U * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={weights.U}
                    onChange={(e) => setWeights({ ...weights, U: parseFloat(e.target.value) })}
                    className="w-full accent-tertiary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Kepadatan Jiwa (P)</span>
                    <span className="text-secondary font-bold">{(weights.P * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={weights.P}
                    onChange={(e) => setWeights({ ...weights, P: parseFloat(e.target.value) })}
                    className="w-full accent-secondary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Data Historis (H)</span>
                    <span className="text-primary font-bold">{(weights.H * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={weights.H}
                    onChange={(e) => setWeights({ ...weights, H: parseFloat(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Kerentanan DEM (K)</span>
                    <span className="text-tertiary font-bold">{(weights.K * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={weights.K}
                    onChange={(e) => setWeights({ ...weights, K: parseFloat(e.target.value) })}
                    className="w-full accent-tertiary"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Curah Hujan (C)</span>
                    <span className="text-secondary font-bold">{(weights.C * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={weights.C}
                    onChange={(e) => setWeights({ ...weights, C: parseFloat(e.target.value) })}
                    className="w-full accent-secondary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* District Table & Detail Inspection Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Table (Col 8) */}
            <div className="lg:col-span-8 min-w-0 bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-md">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container border-b border-outline-variant/30 font-mono text-[10px] text-on-surface-variant uppercase">
                    <tr>
                      <th className="py-3 px-4"># Rank</th>
                      <th className="py-3 px-4">Kecamatan</th>
                      <th className="py-3 px-4">Skor Risiko</th>
                      <th className="py-3 px-4">Level</th>
                      <th className="py-3 px-4">Aduan Warga</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {filteredDistricts.map((d, index) => {
                      const isSelected = selectedDistrict.id === d.id
                      return (
                        <tr
                          key={d.id}
                          onClick={() => setSelectedDistrict(d)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10'
                              : 'hover:bg-surface-container/60'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-on-surface-variant">
                            0{index + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-on-surface">
                            {d.name}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {d.score.toFixed(1)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                d.level === 'CRITICAL'
                                  ? 'bg-error/20 text-error'
                                  : d.level === 'HIGH'
                                  ? 'bg-tertiary/20 text-tertiary'
                                  : 'bg-secondary/20 text-secondary'
                              }`}
                            >
                              {d.level}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-on-surface-variant">
                            {d.reportsCount} Laporan
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono text-[11px] text-primary hover:underline">
                              Rincian &rarr;
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected District Detail Breakdown Card (Col 4) */}
            <div className="lg:col-span-4 min-w-0 bg-surface-container rounded-xl p-5 sm:p-6 border border-outline-variant/40 shadow-lg flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between border-b border-outline-variant/30 pb-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                      Inspeksi Variabel Wilayah
                    </span>
                    <h3 className="font-headline text-lg font-bold text-on-surface">
                      Kecamatan {selectedDistrict.name}
                    </h3>
                  </div>
                  <span
                    className={`font-mono text-xs px-2.5 py-1 rounded font-bold uppercase ${
                      selectedDistrict.level === 'CRITICAL'
                        ? 'bg-error/20 text-error'
                        : selectedDistrict.level === 'HIGH'
                        ? 'bg-tertiary/20 text-tertiary'
                        : 'bg-secondary/20 text-secondary'
                    }`}
                  >
                    {selectedDistrict.level}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase">Isu Utama Lapangan</span>
                  <span className="font-body text-xs font-semibold text-on-surface">
                    {selectedDistrict.primaryIssue}
                  </span>
                  <span className="font-mono text-[10px] text-secondary mt-0.5">
                    {selectedDistrict.trend}
                  </span>
                </div>

                {/* 6 Variables Bar Breakdown */}
                <div className="flex flex-col gap-2.5 font-mono text-xs">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                    Nilai Bobot 6 Parameter:
                  </span>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Laporan Warga (L)</span>
                      <span className="text-primary font-bold">{selectedDistrict.vars.L}/100</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${selectedDistrict.vars.L}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Tingkat Urgensi (U)</span>
                      <span className="text-tertiary font-bold">{selectedDistrict.vars.U}/100</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full" style={{ width: `${selectedDistrict.vars.U}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Kepadatan Penduduk (P)</span>
                      <span className="text-secondary font-bold">{selectedDistrict.vars.P}/100</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full" style={{ width: `${selectedDistrict.vars.P}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Data Historis InaRISK (H)</span>
                      <span className="text-primary font-bold">{selectedDistrict.vars.H}/100</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${selectedDistrict.vars.H}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Kerentanan Elevasi Rob (K)</span>
                      <span className="text-tertiary font-bold">{selectedDistrict.vars.K}/100</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className="bg-tertiary h-full" style={{ width: `${selectedDistrict.vars.K}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Curah Hujan BMKG (C)</span>
                      <span className="text-secondary font-bold">{selectedDistrict.vars.C}/100</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full" style={{ width: `${selectedDistrict.vars.C}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={`/peta?q=${selectedDistrict.name}`}
                className="w-full min-h-[44px] py-3 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider text-center hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <span>Lihat di Peta Spasial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
