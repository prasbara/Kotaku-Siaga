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
        badge: 'bg-error/10 text-error border-error/30',
      }
    }
    if (areaName.includes('Semarang Timur') || areaName.includes('Gayamsari') || areaName.includes('Semarang Tengah')) {
      return {
        agency: 'Dinas PU & DLH',
        action: 'Normalisasi saluran sekunder permukiman dan pengangkutan tumpukan sampah penyumbat aliran.',
        badge: 'bg-tertiary/10 text-tertiary border-tertiary/30',
      }
    }
    if (areaName.includes('Candisari') || areaName.includes('Gajahmungkur')) {
      return {
        agency: 'BPBD & Distaru',
        action: 'Inspeksi stabilitas lereng permukiman dan peringatan dini retakan tanah tebing.',
        badge: 'bg-primary/10 text-primary border-primary/30',
      }
    }
    return {
      agency: 'Dinas PU & Kelurahan',
      action: 'Pemeliharaan rutin saluran tersier dan monitoring kesiapan drainase lingkungan.',
      badge: 'bg-secondary/10 text-secondary border-secondary/30',
    }
  }

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold block mb-1">
            PENENTUAN INTERVENSI DETERMINISTIK (ISO 37120)
          </span>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
            Matriks Rekomendasi Disposisi 16 Kecamatan
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Prioritas penanganan otomatis berdasarkan kalkulasi matematis terbuka tanpa intervensi subyektif.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchScores}
          disabled={loading}
          className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-primary border border-outline-variant/40 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Menghitung...' : 'Sinkronkan Matriks'}</span>
        </button>
      </div>

      {/* Intervention Table */}
      <div className="border border-outline-variant/30 rounded-xl bg-surface-container-low overflow-x-auto shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Wilayah Kecamatan</th>
              <th className="py-3 px-4 font-semibold">Skor Prioritas</th>
              <th className="py-3 px-4 font-semibold">Tingkat Risiko</th>
              <th className="py-3 px-4 font-semibold">Disposisi Instansi</th>
              <th className="py-3 px-4 font-semibold">Arahan Tindakan Teknis</th>
              <th className="py-3 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-on-surface-variant font-mono">
                  Memuat data matriks prioritas deterministik...
                </td>
              </tr>
            ) : areas.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-on-surface-variant font-mono">
                  Data belum tersedia.
                </td>
              </tr>
            ) : (
              areas.map((area) => {
                const disp = getDispositionDetails(area.area_name, area.priority_level)
                const slug = area.area_name.toLowerCase().replace(/\s+/g, '-').replace('kecamatan-', '')

                return (
                  <tr key={area.area_id} className="hover:bg-surface-container/60 transition-colors">
                    {/* Area Name */}
                    <td className="py-3.5 px-4 font-headline font-bold text-on-surface text-sm">
                      {area.area_name}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-primary">
                      {area.final_priority_score.toFixed(1)}
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          area.priority_level === 'CRITICAL'
                            ? 'text-error border-error/40 bg-error/10'
                            : area.priority_level === 'HIGH'
                            ? 'text-tertiary border-tertiary/40 bg-tertiary/10'
                            : 'text-secondary border-secondary/40 bg-secondary/10'
                        }`}
                      >
                        {area.priority_level}
                      </span>
                    </td>

                    {/* Disposition Agency */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${disp.badge}`}>
                        {disp.agency}
                      </span>
                    </td>

                    {/* Action directive */}
                    <td className="py-3.5 px-4 max-w-md text-xs text-on-surface-variant leading-relaxed">
                      {disp.action}
                    </td>

                    {/* Link to detail */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/priorities/${slug}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="h-3 w-3" />
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
