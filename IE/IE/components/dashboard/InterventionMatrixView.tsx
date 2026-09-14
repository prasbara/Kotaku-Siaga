'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ShieldAlert, Building2, Wrench, RefreshCw } from 'lucide-react'

interface AreaScore {
  area_id: string
  area_name: string
  final_priority_score: number
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  report_count: number
  explanation: string
}

export function InterventionMatrixView() {
  const [areas, setAreas] = useState<AreaScore[]>([])
  const [loading, setLoading] = useState(true)

  const fetchScores = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/priority-scores')
      const data = await res.json()
      if (data.success && data.areas) {
        setAreas(data.areas)
      }
    } catch (err) {
      console.error('Gagal mengambil matriks prioritas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScores()
  }, [])

  const getDispositionDetails = (areaName: string, level: string) => {
    if (areaName.includes('Semarang Utara') || areaName.includes('Genuk')) {
      return {
        agency: 'BPBD & Dinas PU (SDA)',
        action: 'Operasi pompa darurat, kesiapsiagaan polder rob, dan pembersihan sedimentasi saluran primer.',
        badge: 'bg-[#cc4117]/10 text-[#cc4117] border-[#cc4117]/30',
      }
    }
    if (areaName.includes('Semarang Timur') || areaName.includes('Gayamsari') || areaName.includes('Semarang Tengah')) {
      return {
        agency: 'Dinas PU & DLH',
        action: 'Normalisasi saluran sekunder permukiman dan pengangkutan tumpukan sampah penyumbat aliran.',
        badge: 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/30',
      }
    }
    if (areaName.includes('Candisari') || areaName.includes('Gajahmungkur')) {
      return {
        agency: 'BPBD & Distaru',
        action: 'Inspeksi stabilitas lereng permukiman dan peringatan dini retakan tanah tebing.',
        badge: 'bg-[#4a154b]/10 text-[#4a154b] border-[#4a154b]/30',
      }
    }
    return {
      agency: 'Dinas PU & Kelurahan',
      action: 'Pemeliharaan rutin saluran tersier dan monitoring kesiapan drainase lingkungan.',
      badge: 'bg-[#007a5a]/10 text-[#007a5a] border-[#007a5a]/30',
    }
  }

  return (
    <div className="space-y-6 font-body text-[#1d1d1d]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4a154b]"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#4a154b] font-bold">
              PENENTUAN INTERVENSI DETERMINISTIK (ISO 37120)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4a154b]">
            Matriks Rekomendasi Disposisi 16 Kecamatan
          </h2>
          <p className="text-xs sm:text-sm text-[#696969] mt-1">
            Prioritas penanganan otomatis berdasarkan kalkulasi matematis terbuka tanpa intervensi subyektif.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchScores}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4a154b] border border-[#4a154b]/40 px-5 py-2.5 rounded-[90px] bg-white hover:bg-[#f9f0ff] transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Menghitung...' : 'Sinkronkan Matriks'}</span>
        </button>
      </div>

      {/* Intervention Table */}
      <div className="border border-[#e6e6e6] rounded-[16px] bg-white overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#e6e6e6] bg-[#f4ede4] text-[#4a154b] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4 font-bold">Wilayah Kecamatan</th>
              <th className="py-3.5 px-4 font-bold">Skor Prioritas</th>
              <th className="py-3.5 px-4 font-bold">Tingkat Risiko</th>
              <th className="py-3.5 px-4 font-bold">Disposisi Instansi</th>
              <th className="py-3.5 px-4 font-bold">Arahan Tindakan Teknis</th>
              <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6e6e6]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#696969] font-mono">
                  Memuat data matriks prioritas deterministik...
                </td>
              </tr>
            ) : areas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-[#696969] font-mono">
                  Data belum tersedia.
                </td>
              </tr>
            ) : (
              areas.map((area) => {
                const disp = getDispositionDetails(area.area_name, area.priority_level)
                const slug = area.area_name.toLowerCase().replace(/\s+/g, '-').replace('kecamatan-', '')

                return (
                  <tr key={area.area_id} className="hover:bg-[#fcfaf7] transition-colors">
                    {/* Area Name */}
                    <td className="py-4 px-4 font-bold text-[#1d1d1d] text-sm">
                      {area.area_name}
                    </td>

                    {/* Score */}
                    <td className="py-4 px-4 font-mono font-bold text-sm text-[#4a154b]">
                      {area.final_priority_score.toFixed(1)}
                    </td>

                    {/* Risk Level */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-[90px] border ${
                          area.priority_level === 'CRITICAL'
                            ? 'text-[#cc4117] border-[#cc4117]/30 bg-[#cc4117]/10'
                            : area.priority_level === 'HIGH'
                            ? 'text-[#b45309] border-[#b45309]/30 bg-[#fffbeb]'
                            : 'text-[#007a5a] border-[#007a5a]/30 bg-[#007a5a]/10'
                        }`}
                      >
                        {area.priority_level}
                      </span>
                    </td>

                    {/* Disposition Agency */}
                    <td className="py-4 px-4">
                      <span className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-[90px] border ${disp.badge}`}>
                        {disp.agency}
                      </span>
                    </td>

                    {/* Action directive */}
                    <td className="py-4 px-4 max-w-md text-xs text-[#696969] leading-relaxed">
                      {disp.action}
                    </td>

                    {/* Link to detail */}
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/priorities/${slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#4a154b] hover:underline"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
