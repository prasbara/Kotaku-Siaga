'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  Camera,
  ShieldCheck,
  XCircle,
  FileCheck2,
  ExternalLink,
} from 'lucide-react'
import Image from 'next/image'
import { formatRelativeTime } from '@/lib/utils'

interface IncidentCluster {
  id: string
  cluster_code: string
  category: string
  district_name?: string | null
  latitude: number
  longitude: number
  radius_m: number
  report_count: number
  independent_reporter_count: number
  corroboration_score: number
  confidence_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONFIRMED'
  status: string
  first_reported_at: string
  last_reported_at: string
  evidence_photos: string[]
  admin_notes?: string | null
}

export function IncidentClustersView() {
  const [clusters, setClusters] = useState<IncidentCluster[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCluster, setSelectedCluster] = useState<IncidentCluster | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchClusters = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/clusters')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setClusters(data.data)
        if (!selectedCluster && data.data.length > 0) {
          setSelectedCluster(data.data[0])
        }
      }
    } catch (err) {
      console.warn('Failed to fetch incident clusters:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCluster])

  useEffect(() => {
    fetchClusters()
    const interval = setInterval(fetchClusters, 10000)
    return () => clearInterval(interval)
  }, [fetchClusters])

  const handleUpdateStatus = async (status: string) => {
    if (!selectedCluster) return
    setIsUpdating(true)
    try {
      await fetch(`/api/clusters/${selectedCluster.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setSelectedCluster((prev) => (prev ? { ...prev, status } : null))
      fetchClusters()
    } catch (err) {
      console.warn('Update cluster status error:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const corroboratedCount = clusters.filter(
    (c) => c.status === 'CORROBORATED' || c.status === 'CONFIRMED_BY_CORROBORATION'
  ).length

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="p-6 rounded-[24px] bg-[#4a154b] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Layers className="w-7 h-7 text-[#f4ede4]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold">KOROBORASI &amp; KLASTER INSIDEN</span>
              {corroboratedCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#007a5a] text-white text-xs font-bold font-mono">
                  {corroboratedCount} TERKOROBORASI
                </span>
              )}
            </div>
            <span className="text-xs text-[#d9bdde]">
              Sistem pengelompokan spasial (radius 250m) &amp; temporal (30 min) untuk memverifikasi kejadian dari banyak pelapor independen.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchClusters}
          disabled={isLoading}
          className="min-h-[42px] px-5 py-2 rounded-[90px] bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
            Daftar Klaster Kejadian Aktif ({clusters.length})
          </span>

          {clusters.length === 0 ? (
            <div className="p-12 rounded-[20px] bg-white border border-[#e6e6e6] text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-[#007a5a]" />
              <span className="text-sm font-bold text-[#1d1d1d]">Belum Ada Klaster Insiden Aktif</span>
              <span className="text-xs text-[#696969]">Laporan baru akan otomatis dikelompokkan berdasarkan kedekatan lokasi dan waktu.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
              {clusters.map((cluster) => {
                const isSelected = selectedCluster?.id === cluster.id
                const isCorroborated =
                  cluster.status === 'CORROBORATED' ||
                  cluster.status === 'CONFIRMED_BY_CORROBORATION'

                return (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setSelectedCluster(cluster)}
                    className={`p-4 rounded-[16px] text-left border transition-all flex flex-col gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#f9f0ff] border-[#4a154b] ring-2 ring-[#4a154b]/20 shadow-sm'
                        : 'bg-white border-[#e6e6e6] hover:bg-[#fdfbf9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#4a154b]">
                        {cluster.cluster_code}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isCorroborated
                            ? 'bg-[#ecfdf5] text-[#007a5a] border border-[#a7f3d0]'
                            : 'bg-[#f4ede4] text-[#1d1d1d]'
                        }`}
                      >
                        {cluster.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1d1d1d] uppercase">{cluster.category}</span>
                      <span className="text-[#696969]">{cluster.district_name || 'Kota Semarang'}</span>
                    </div>

                    {/* Independent reporter counter */}
                    <div className="flex items-center justify-between p-2 rounded-[10px] bg-black/5 text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-[#1d1d1d]">
                        <Users className="w-3.5 h-3.5 text-[#4a154b]" />
                        {cluster.independent_reporter_count} Pelapor Independen
                      </span>
                      <span className="text-[#696969]">{cluster.report_count} Total Laporan</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#696969] pt-1 border-t border-[#f0f0f0]">
                      <span>Pertama: {formatRelativeTime(cluster.first_reported_at)}</span>
                      <span>Terakhir: {formatRelativeTime(cluster.last_reported_at)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Detail */}
        <div className="lg:col-span-7">
          {selectedCluster ? (
            <div className="p-6 rounded-[24px] bg-white border border-[#e6e6e6] shadow-card flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#4a154b] tracking-wider">
                    Detail Klaster Insiden
                  </span>
                  <h3 className="text-xl font-bold font-mono text-[#1d1d1d]">
                    {selectedCluster.cluster_code}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#f9f0ff] text-[#4a154b] border border-[#eddcf7] text-xs font-bold font-mono">
                    Keyakinan: {selectedCluster.confidence_level}
                  </span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-[14px] bg-[#fdfbf9] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#696969] uppercase font-bold">Pelapor Independen</span>
                  <div className="font-mono text-xl font-bold text-[#007a5a]">
                    {selectedCluster.independent_reporter_count}
                  </div>
                </div>
                <div className="p-3 rounded-[14px] bg-[#fdfbf9] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#696969] uppercase font-bold">Total Laporan</span>
                  <div className="font-mono text-xl font-bold text-[#4a154b]">
                    {selectedCluster.report_count}
                  </div>
                </div>
                <div className="p-3 rounded-[14px] bg-[#fdfbf9] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#696969] uppercase font-bold">Radius Spasial</span>
                  <div className="font-mono text-xl font-bold text-[#1d1d1d]">
                    ~{selectedCluster.radius_m}m
                  </div>
                </div>
                <div className="p-3 rounded-[14px] bg-[#fdfbf9] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#696969] uppercase font-bold">Skor Koroborasi</span>
                  <div className="font-mono text-xl font-bold text-[#cc4117]">
                    {selectedCluster.corroboration_score}/100
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f4ede4] flex items-center justify-center text-[#4a154b]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1d1d1d]">
                      {selectedCluster.district_name || 'Kota Semarang'} ({selectedCluster.latitude}, {selectedCluster.longitude})
                    </span>
                    <span className="text-[11px] text-[#696969]">
                      Klaster aktif kategori {selectedCluster.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps?q=${selectedCluster.latitude},${selectedCluster.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-[90px] bg-[#4a154b] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#481a54] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lihat Lokasi
                </a>
              </div>

              {/* Photos Gallery */}
              {selectedCluster.evidence_photos && selectedCluster.evidence_photos.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                    Bukti Foto Terkumpul ({selectedCluster.evidence_photos.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {selectedCluster.evidence_photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        className="relative w-24 h-24 rounded-[12px] overflow-hidden border border-[#e6e6e6] shrink-0"
                      >
                        <Image src={photo} alt={`Bukti ${pIdx + 1}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Moderation Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e6e6e6]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('ADMIN_CONFIRMED')}
                    disabled={isUpdating}
                    className="min-h-[42px] px-5 py-2.5 rounded-[90px] bg-[#007a5a] text-white hover:bg-[#006046] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Konfirmasi Kejadian Valid (Admin)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('FALSE_REPORT')}
                    disabled={isUpdating}
                    className="min-h-[42px] px-4 py-2 rounded-[90px] bg-[#fff1f0] border border-[#ffccc7] text-[#cc4117] hover:bg-[#ffccc7] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Tandai Hoaks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={isUpdating}
                    className="min-h-[42px] px-4 py-2 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-[24px] bg-white border border-[#e6e6e6] text-center text-xs text-[#696969]">
              Pilih klaster insiden pada daftar di sebelah kiri untuk melihat rincian koroborasi multi-laporan.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
