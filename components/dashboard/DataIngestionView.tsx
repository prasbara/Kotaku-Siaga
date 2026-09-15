'use client'

import React, { useState } from 'react'
import { Database, RefreshCw, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react'

interface SourceStatus {
  id: string
  name: string
  provider: string
  type: string
  status: 'Connected' | 'Syncing' | 'Delayed' | 'Unavailable' | 'Not Configured'
  lastSync: string
  recordCount: string
  authRequirement: string
}

export function DataIngestionView() {
  const [sources, setSources] = useState<SourceStatus[]>([
    {
      id: 'bmkg',
      name: 'BMKG Public Weather Service',
      provider: 'Badan Meteorologi, Klimatologi, dan Geofisika',
      type: 'Observasi Cuaca & Parameter Atmosfer',
      status: 'Connected',
      lastSync: 'Tersinkronisasi otomatis berkala',
      recordCount: '16 Stasiun / Kecamatan',
      authRequirement: 'Tanpa Login / Tanpa API Key',
    },
    {
      id: 'pantausemar',
      name: 'PantauSemar CCTV Stream Diskominfo',
      provider: 'Diskominfo Kota Semarang',
      type: 'Live HLS Stream (Rawan Genangan Air & Pantau Pompa)',
      status: 'Connected',
      lastSync: '70 Titik Live Stream Terkoneksi',
      recordCount: '70 Titik Kamera (14 Genangan + 56 Pompa)',
      authRequirement: 'Tanpa Login / Akses Terbuka Pemerintah Kota',
    },
    {
      id: 'osm',
      name: 'OpenStreetMap Overpass API',
      provider: 'OpenStreetMap Foundation & Komunitas Spasial',
      type: 'Saluran Hidrografi, Sungai, Kanal & Polder',
      status: 'Connected',
      lastSync: 'Terhubung ke Bounding Box Semarang',
      recordCount: 'Jaringan Hidrografi Semarang',
      authRequirement: 'Tanpa Login / Tanpa API Key',
    },
    {
      id: 'bnpb',
      name: 'BNPB Geoportal & DIBI',
      provider: 'Badan Nasional Penanggulangan Bencana',
      type: 'Arsip Kejadian Bencana Hidrometeorologi',
      status: 'Connected',
      lastSync: 'Data Historis Resmi 2023 - 2026',
      recordCount: '6 Kejadian Bencana Terdokumentasi',
      authRequirement: 'Akses Publik Terbuka',
    },
    {
      id: 'bps',
      name: 'BPS Kota Semarang',
      provider: 'Badan Pusat Statistik Kota Semarang',
      type: 'Statistik Penduduk, Kepadatan & Batas Wilayah',
      status: 'Connected',
      lastSync: 'Basis Data Wilayah 2024',
      recordCount: '16 Kecamatan Lengkap',
      authRequirement: 'Data Terbuka Resmi',
    },
  ])

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string; details?: any } | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncFeedback(null)

    try {
      const res = await fetch('/api/admin/ingest', { method: 'POST' })
      const result = await res.json()

      if (result.success) {
        setSyncFeedback({
          success: true,
          message: result.message || 'Sinkronisasi data publik berhasil diproses.',
          details: result.summary,
        })
      } else {
        setSyncFeedback({
          success: false,
          message: result.error || 'Gagal menyinkronkan data publik.',
        })
      }
    } catch {
      setSyncFeedback({
        success: false,
        message: 'Gagal terhubung ke endpoint ingesti backend.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusBadge = (status: SourceStatus['status']) => {
    switch (status) {
      case 'Connected':
        return 'text-[#007a5a] border-[#007a5a]/30 bg-[#007a5a]/10'
      case 'Syncing':
        return 'text-[#4a154b] border-[#4a154b]/30 bg-[#f9f0ff]'
      case 'Delayed':
        return 'text-[#b45309] border-[#b45309]/30 bg-[#fffbeb]'
      case 'Unavailable':
      default:
        return 'text-[#cc4117] border-[#cc4117]/30 bg-[#cc4117]/10'
    }
  }

  return (
    <div className="space-y-6 font-body text-[#1d1d1d]">
      {/* Header & Sync Trigger */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#4a154b]"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#4a154b] font-bold">
              INTEGRITAS SUMBER TERBUKA
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4a154b]">
            Pemantauan Data Terbuka & Sensor Lingkungan
          </h2>
          <p className="text-xs sm:text-sm text-[#696969] mt-1">
            Status koneksi dan ingestion pipa data publik tanpa autentikasi / tanpa kunci API rahasia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[90px] text-xs font-bold uppercase tracking-wider bg-[#4a154b] text-white hover:bg-[#611f69] disabled:opacity-50 transition-all self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan Pipeline...' : 'Sync Data Sekarang'}</span>
        </button>
      </div>

      {/* Sync Result Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-5 rounded-[16px] border text-xs leading-relaxed ${
            syncFeedback.success
              ? 'bg-[#007a5a]/10 border-[#007a5a]/30 text-[#007a5a]'
              : 'bg-[#cc4117]/10 border-[#cc4117]/30 text-[#cc4117]'
          }`}
        >
          <div className="font-bold text-sm mb-1">{syncFeedback.message}</div>
          {syncFeedback.details && (
            <div className="font-mono text-xs mt-2 space-y-1 opacity-95">
              <div>• BMKG Weather Records: {syncFeedback.details.bmkg_weather_points} titik stasiun</div>
              <div>• OpenStreetMap Waterways: {syncFeedback.details.osm_spatial_features} fitur hidrografi</div>
              <div>• BNPB Disaster Events: {syncFeedback.details.bnpb_historical_events} record historis</div>
              <div>• BPS Referensi Wilayah: {syncFeedback.details.semarang_kecamatan_ref} kecamatan</div>
            </div>
          )}
        </div>
      )}

      {/* Data Source Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sources.map((src) => (
          <div key={src.id} className="bg-white border border-[#e6e6e6] rounded-[16px] p-6 space-y-4 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#4a154b] font-bold block mb-1">
                  {src.type}
                </span>
                <h3 className="text-base font-bold text-[#1d1d1d]">
                  {src.name}
                </h3>
                <p className="text-xs text-[#696969] mt-1">
                  {src.provider}
                </p>
              </div>

              <span className={`text-[10px] font-mono uppercase font-bold px-3 py-1 rounded-[90px] border ${getStatusBadge(src.status)}`}>
                {src.status}
              </span>
            </div>

            <div className="pt-3 border-t border-[#e6e6e6] grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#696969] uppercase block mb-0.5">
                  Status Autentikasi
                </span>
                <span className="font-medium text-[#1d1d1d] text-xs">
                  {src.authRequirement}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#696969] uppercase block mb-0.5">
                  Jumlah Record
                </span>
                <span className="font-mono text-[#4a154b] font-bold text-xs">
                  {src.recordCount}
                </span>
              </div>
            </div>

            <div className="pt-2.5 text-[11px] text-[#696969] font-mono border-t border-[#e6e6e6]">
              {src.lastSync}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
