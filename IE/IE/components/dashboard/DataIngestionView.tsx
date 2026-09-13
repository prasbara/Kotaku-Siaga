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
        return 'text-secondary border-secondary/40 bg-secondary/10'
      case 'Syncing':
        return 'text-primary border-primary/40 bg-primary/10'
      case 'Delayed':
        return 'text-tertiary border-tertiary/40 bg-tertiary/10'
      case 'Unavailable':
      default:
        return 'text-error border-error/40 bg-error/10'
    }
  }

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Header & Sync Trigger */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold block mb-1">
            INTEGRITAS SUMBER TERBUKA
          </span>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
            Pemantauan Data Terbuka & Sensor Lingkungan
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Status koneksi dan ingestion pipa data publik tanpa autentikasi / tanpa kunci API rahasia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-primary text-on-primary hover:brightness-110 disabled:opacity-50 transition-all self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan Pipeline...' : 'Sync Data Sekarang'}</span>
        </button>
      </div>

      {/* Sync Result Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs ${
            syncFeedback.success
              ? 'bg-secondary/10 border-secondary/40 text-secondary'
              : 'bg-error/10 border-error/40 text-error'
          }`}
        >
          <div className="font-semibold font-mono mb-1">{syncFeedback.message}</div>
          {syncFeedback.details && (
            <div className="font-mono text-[11px] mt-2 space-y-0.5 opacity-90">
              <div>• BMKG Weather Records: {syncFeedback.details.bmkg_weather_points} titik</div>
              <div>• OpenStreetMap Waterways: {syncFeedback.details.osm_spatial_features} fitur</div>
              <div>• BNPB Disaster Events: {syncFeedback.details.bnpb_historical_events} record</div>
              <div>• BPS Referensi Wilayah: {syncFeedback.details.semarang_kecamatan_ref} kecamatan</div>
            </div>
          )}
        </div>
      )}

      {/* Data Source Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-primary font-bold block mb-1">
                  {src.type}
                </span>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  {src.name}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {src.provider}
                </p>
              </div>

              <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${getStatusBadge(src.status)}`}>
                {src.status}
              </span>
            </div>

            <div className="pt-3 border-t border-outline-variant/20 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-on-surface-variant uppercase block">
                  Status Autentikasi
                </span>
                <span className="font-medium text-on-surface text-xs">
                  {src.authRequirement}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-on-surface-variant uppercase block">
                  Jumlah Record
                </span>
                <span className="font-mono text-primary font-bold text-xs">
                  {src.recordCount}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-on-surface-variant font-mono border-t border-outline-variant/20">
              {src.lastSync}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
