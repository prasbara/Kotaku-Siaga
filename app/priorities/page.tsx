'use client'

import { useState, useMemo, useEffect } from 'react'
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
  RefreshCw,
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
    primaryIssue: 'Saluran Tersumbat Sedimen Industri',
    trend: '+1 laporan mgg ini',
    vars: { L: 50, U: 52, P: 58, H: 52, K: 50, C: 65 },
  },
  {
    id: 'gajahmungkur',
    name: 'Gajahmungkur',
    score: 49.5,
    level: 'MEDIUM',
    reportsCount: 8,
    primaryIssue: 'Dinding Saluran Kali Garang & Erosi',
    trend: 'Stabil',
    vars: { L: 45, U: 48, P: 55, H: 50, K: 55, C: 62 },
  },
  {
    id: 'semarang-tengah',
    name: 'Semarang Tengah',
    score: 47.3,
    level: 'MEDIUM',
    reportsCount: 10,
    primaryIssue: 'Antrean Air Hujan di Protokol Pemuda',
    trend: '-2 laporan mgg ini',
    vars: { L: 42, U: 46, P: 84, H: 45, K: 40, C: 48 },
  },
  {
    id: 'semarang-selatan',
    name: 'Semarang Selatan',
    score: 44.1,
    level: 'MEDIUM',
    reportsCount: 7,
    primaryIssue: 'Genangan Lokal Simpang Lima Saat Hujan Lebat',
    trend: 'Stabil',
    vars: { L: 40, U: 42, P: 78, H: 42, K: 38, C: 50 },
  },
  {
    id: 'tugu',
    name: 'Tugu',
    score: 42.0,
    level: 'MEDIUM',
    reportsCount: 12,
    primaryIssue: 'Tambak Tergerus Rob Pesisir Barat',
    trend: '+1 laporan mgg ini',
    vars: { L: 38, U: 40, P: 35, H: 65, K: 70, C: 58 },
  },
  {
    id: 'banyumanik',
    name: 'Banyumanik',
    score: 38.6,
    level: 'LOW',
    reportsCount: 6,
    primaryIssue: 'Topografi Tinggi, Drainase Cepat Mengalir',
    trend: 'Stabil',
    vars: { L: 30, U: 35, P: 60, H: 38, K: 30, C: 72 },
  },
  {
    id: 'gunungpati',
    name: 'Gunungpati',
    score: 31.4,
    level: 'LOW',
    reportsCount: 4,
    primaryIssue: 'Kawasan Konservasi & Resapan Air Hulu',
    trend: 'Stabil',
    vars: { L: 25, U: 28, P: 40, H: 30, K: 32, C: 68 },
  },
  {
    id: 'mijen',
    name: 'Mijen',
    score: 28.0,
    level: 'LOW',
    reportsCount: 3,
    primaryIssue: 'Risiko Hidrologi Rendah, Tutupan Hijau Luas',
    trend: 'Stabil',
    vars: { L: 20, U: 22, P: 32, H: 25, K: 28, C: 60 },
  },
]

export default function PrioritiesPage() {
  const [districts, setDistricts] = useState<DistrictData[]>(INITIAL_DISTRICTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(INITIAL_DISTRICTS[0])
  const [showSimulator, setShowSimulator] = useState(false)
  const [isLoadingApi, setIsLoadingApi] = useState(false)

  // Dynamic Weights (deterministic ISO baseline: 0.25, 0.20, 0.15, 0.15, 0.15, 0.10)
  const [weights, setWeights] = useState({
    L: 0.25,
    U: 0.20,
    P: 0.15,
    H: 0.15,
    K: 0.15,
    C: 0.10,
  })

  // Try fetching live scores from API
  useEffect(() => {
    setIsLoadingApi(true)
    fetch('/api/priority-scores')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const apiMapped: DistrictData[] = data.data.map((item: any) => {
            const foundInitial = INITIAL_DISTRICTS.find((d) => d.name.toLowerCase() === item.area.name.toLowerCase())
            return {
              id: item.area.slug || item.area.id,
              name: item.area.name,
              score: Math.round(item.score * 10) / 10,
              level: (item.riskLabel || 'LOW') as any,
              reportsCount: item.report_count ?? foundInitial?.reportsCount ?? 0,
              primaryIssue: foundInitial?.primaryIssue || 'Kawasan Pemantauan Terpadu',
              trend: foundInitial?.trend || 'Stabil',
              vars: {
                L: item.factors?.reportFrequency?.normalized ?? foundInitial?.vars.L ?? 50,
                U: item.factors?.urgency?.normalized ?? foundInitial?.vars.U ?? 50,
                P: item.factors?.populationDensity?.normalized ?? foundInitial?.vars.P ?? 50,
                H: foundInitial?.vars.H ?? 50,
                K: item.factors?.vulnerability?.normalized ?? foundInitial?.vars.K ?? 50,
                C: foundInitial?.vars.C ?? 50,
              },
            }
          })
          setDistricts(apiMapped)
          if (apiMapped.length > 0) {
            setSelectedDistrict(apiMapped[0])
          }
        }
      })
      .catch((err) => console.warn('Gagal memuat API priority-scores:', err))
      .finally(() => setIsLoadingApi(false))
  }, [])

  // Recalculate district scores dynamically based on weights
  const recalculatedDistricts = useMemo(() => {
    return districts.map((d) => {
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
  }, [districts, weights])

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
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen pb-24">
      {/* Header Banner with Pastel-Mesh Atmospheric Backdrop */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 bg-gradient-to-br from-[#f4ede4] via-[#f9f0ff] to-[#f4ede4] border-b border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-[90px] bg-white text-[#4a154b] text-xs font-bold border border-[#eddcf7] uppercase tracking-[0.96px] shadow-2xs">
                  STANDAR PENILAIAN TERBUKA
                </span>
                <span className="text-xs text-[#007a5a] font-semibold flex items-center gap-1.5 ml-1">
                  <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
                  Kalkulasi Transparan & Terbuka
                </span>
              </div>
              <h1 className="text-[32px] sm:text-[40px] font-bold text-[#4a154b] tracking-[-0.6px] leading-[1.15]">
                Matriks Prioritas Penanganan 16 Kecamatan
              </h1>
              <p className="text-[15px] sm:text-[16px] text-[#1d1d1d] leading-[1.55]">
                Perhitungan transparan tingkat kerentanan banjir di seluruh kecamatan Kota Semarang untuk memprioritaskan penyaluran bantuan dan pengerahan pompa darurat.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={exportCSV}
                className="min-h-[48px] px-6 py-3 rounded-[90px] bg-white hover:bg-[#f9f0ff] text-[#4a154b] font-bold text-xs flex items-center gap-2 transition-colors border border-[#4a154b]/30 shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#4a154b]" />
                <span>Unduh Data CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#611f69] active:bg-[#481a54] font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                <span>{showSimulator ? 'Tutup Simulasi' : 'Simulasi Pembobotan'}</span>
              </button>
            </div>
          </div>

          {/* Formula Display Box */}
          <div className="rounded-2xl bg-white p-6 border border-[#e6e6e6] shadow-subtle flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
                Formula Perhitungan Terbuka
              </span>
              <span className="text-xs text-[#696969]">Total Bobot = 100%</span>
            </div>
            <div className="p-3 bg-[#fdfbf9] rounded-xl border border-[#e6e6e6] overflow-x-auto">
              <code className="text-sm font-mono text-[#4a154b] font-bold whitespace-nowrap block">
                Skor = ({weights.L.toFixed(2)}·Laporan) + ({weights.U.toFixed(2)}·Urgensi) + ({weights.P.toFixed(2)}·Kepadatan) + ({weights.H.toFixed(2)}·Historis) + ({weights.K.toFixed(2)}·ElevasiRob) + ({weights.C.toFixed(2)}·CurahHujan)
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Simulator Drawer (if enabled) */}
      {showSimulator && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-6 rounded-2xl bg-white border border-[#4a154b]/30 shadow-card flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-3">
              <span className="font-bold text-sm text-[#4a154b]">
                Simulasi Penyesuaian Bobot Parameter
              </span>
              <button
                onClick={() =>
                  setWeights({ L: 0.25, U: 0.20, P: 0.15, H: 0.15, K: 0.15, C: 0.10 })
                }
                className="text-xs text-[#1264a3] hover:text-[#3860be] hover:underline font-semibold cursor-pointer"
              >
                Kembalikan ke Nilai Awal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span>Laporan Warga (L)</span>
                  <span className="text-[#4a154b]">{(weights.L * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.L}
                  onChange={(e) => setWeights({ ...weights, L: parseFloat(e.target.value) })}
                  className="w-full accent-[#4a154b]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span>Tingkat Urgensi (U)</span>
                  <span className="text-[#4a154b]">{(weights.U * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.U}
                  onChange={(e) => setWeights({ ...weights, U: parseFloat(e.target.value) })}
                  className="w-full accent-[#4a154b]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-semibold">
                  <span>Kepadatan Penduduk (P)</span>
                  <span className="text-[#4a154b]">{(weights.P * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={weights.P}
                  onChange={(e) => setWeights({ ...weights, P: parseFloat(e.target.value) })}
                  className="w-full accent-[#4a154b]"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid: District Table & Detail Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: District Ranking Table (Col 8) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Pills & Search */}
            <div className="p-4 rounded-[16px] bg-white border border-[#e6e6e6] shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#696969] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama kecamatan..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e6e6e6] text-xs focus:outline-none focus:border-[#4a154b]"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'Semua Tingkat' },
                  { id: 'CRITICAL', label: 'Sangat Tinggi' },
                  { id: 'HIGH', label: 'Tinggi' },
                  { id: 'MEDIUM', label: 'Sedang' },
                  { id: 'LOW', label: 'Rendah' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRiskFilter(r.id as any)}
                    className={`px-3 py-1.5 rounded-[90px] text-xs font-bold transition-all ${
                      riskFilter === r.id
                        ? 'bg-[#4a154b] text-white'
                        : 'bg-[#f4ede4] text-[#1d1d1d] hover:bg-[#e8ded2]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Card */}
            <div className="rounded-[16px] bg-white border border-[#e6e6e6] overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f4ede4] border-b border-[#e8ded2] text-[#4a154b] font-bold text-[11px] uppercase">
                    <tr>
                      <th className="py-3.5 px-4">Peringkat</th>
                      <th className="py-3.5 px-4">Kecamatan</th>
                      <th className="py-3.5 px-4">Skor Kerentanan</th>
                      <th className="py-3.5 px-4">Tingkat Urgensi</th>
                      <th className="py-3.5 px-4">Laporan</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e6e6]">
                    {filteredDistricts.map((d, idx) => {
                      const isSelected = selectedDistrict.id === d.id
                      return (
                        <tr
                          key={d.id}
                          onClick={() => setSelectedDistrict(d)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#f9f0ff]' : 'hover:bg-[#fdfbf9]'
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-[#696969]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1d1d1d] text-sm">
                            {d.name}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#4a154b] text-sm">
                            {d.score.toFixed(1)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                d.level === 'CRITICAL'
                                  ? 'bg-[#fef2f2] text-[#cc4117] border-[#fecaca]'
                                  : d.level === 'HIGH'
                                  ? 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'
                                  : 'bg-[#f4ede4] text-[#1d1d1d] border-[#e8ded2]'
                              }`}
                            >
                              {d.level === 'CRITICAL' ? 'Sangat Tinggi' : d.level === 'HIGH' ? 'Tinggi' : d.level === 'MEDIUM' ? 'Sedang' : 'Rendah'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#696969]">
                            {d.reportsCount} Laporan
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-[#4a154b] font-bold hover:underline">
                              Lihat Rincian &rarr;
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Selected District Detail (Col 4) */}
          <div className="lg:col-span-4 rounded-[16px] bg-white border border-[#e6e6e6] p-6 shadow-subtle flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#4a154b] tracking-wider">
                    Rincian Wilayah
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#1d1d1d]">
                    Kecamatan {selectedDistrict.name}
                  </h3>
                </div>
                <span className="font-bold text-2xl text-[#4a154b]">
                  {selectedDistrict.score.toFixed(1)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f4ede4] text-xs">
                <span className="font-bold text-[#4a154b] block mb-1">Kondisi Utama di Lapangan:</span>
                <p className="text-[#1d1d1d] font-medium">{selectedDistrict.primaryIssue}</p>
                <span className="text-[11px] text-[#696969] block mt-1">{selectedDistrict.trend}</span>
              </div>

              {/* Variable Bars */}
              <div className="space-y-3 pt-2 text-xs">
                <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider block">
                  Skor 6 Parameter Penilaian (0-100):
                </span>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Laporan Warga (L)</span>
                    <span className="font-bold text-[#4a154b]">{selectedDistrict.vars.L}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f4ede4] overflow-hidden">
                    <div className="h-full bg-[#4a154b]" style={{ width: `${selectedDistrict.vars.L}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Tingkat Urgensi (U)</span>
                    <span className="font-bold text-[#d97706]">{selectedDistrict.vars.U}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f4ede4] overflow-hidden">
                    <div className="h-full bg-[#d97706]" style={{ width: `${selectedDistrict.vars.U}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Kepadatan Penduduk (P)</span>
                    <span className="font-bold text-[#007a5a]">{selectedDistrict.vars.P}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f4ede4] overflow-hidden">
                    <div className="h-full bg-[#007a5a]" style={{ width: `${selectedDistrict.vars.P}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span>Elevasi & Rob Pesisir (K)</span>
                    <span className="font-bold text-[#cc4117]">{selectedDistrict.vars.K}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f4ede4] overflow-hidden">
                    <div className="h-full bg-[#cc4117]" style={{ width: `${selectedDistrict.vars.K}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={`/peta?q=${selectedDistrict.name}`}
              className="w-full min-h-[48px] py-3 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <span>Lihat Wilayah di Peta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
