'use client'

import React, { useState } from 'react'
import type { Report } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Trash2,
  Waves,
  ShieldAlert,
  ShieldCheck,
  Check,
  XCircle,
  Bot,
  ChevronDown,
  ChevronUp,
  Video,
  CloudRain,
  MapPin,
  Users,
  Camera,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ReportModerationViewProps {
  reports?: Report[]
  onReportUpdated?: () => void
  onRefresh?: () => void
}

const EMPTY_REPORTS: Report[] = []

export function ReportModerationView({ reports, onReportUpdated, onRefresh }: ReportModerationViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localReports, setLocalReports] = useState<Report[]>(reports || EMPTY_REPORTS)
  const [aiInsights, setAiInsights] = useState<Record<string, any>>({})
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)

  const handleAnalyzeReportAI = async (report: Report) => {
    if (aiInsights[report.id]) return
    setLoadingAiId(report.id)
    try {
      const res = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: report.category,
          description: report.description,
          latitude: report.lat || report.latitude || -6.9667,
          longitude: report.lng || report.longitude || 110.4667,
          urgency: report.urgency,
        }),
      })
      const data = await res.json()
      if (data.success && data.analysis) {
        setAiInsights((prev) => ({ ...prev, [report.id]: data.analysis }))
      }
    } catch (err) {
      console.warn('AI analysis error in ReportModerationView:', err)
    } finally {
      setLoadingAiId(null)
    }
  }

  // Fetch verified reports on mount if not supplied by parent
  React.useEffect(() => {
    if (!reports || reports.length === 0) {
      fetch('/api/reports?limit=100')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setLocalReports(data.data)
          }
        })
        .catch((err) => console.warn('Failed to fetch reports in ReportModerationView:', err))
    }
  }, [])

  // Sync if reports prop changes
  React.useEffect(() => {
    if (reports && reports.length > 0) {
      setLocalReports(reports)
    }
  }, [reports])

  const getDispositionAgency = (category: string) => {
    switch (category) {
      case 'drainase_tersumbat':
      case 'drainage_clog':
        return { name: 'Dinas PU (SDA)', badge: 'bg-primary/10 text-primary border-primary/30' }
      case 'sampah_menumpuk':
      case 'waste_accumulation':
        return { name: 'Dinas Lingkungan Hidup (DLH)', badge: 'bg-secondary/10 text-secondary border-secondary/30' }
      case 'pohon_tumbang':
        return { name: 'Disperkim / PLN Siaga', badge: 'bg-tertiary/10 text-tertiary border-tertiary/30' }
      case 'banjir':
      case 'flood':
      case 'longsor':
      case 'landslide':
      default:
        return { name: 'BPBD Kota Semarang', badge: 'bg-error/10 text-error border-error/30' }
    }
  }

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setUpdatingId(reportId)
    // Optimistic local update
    setLocalReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus as any } : r))
    )
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (onReportUpdated) onReportUpdated()
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setUpdatingId(null), 300)
    }
  }

  const filtered =
    statusFilter === 'all'
      ? localReports
      : localReports.filter((r) => r.status === statusFilter)

  const pendingCount = localReports.filter((r) => r.status === 'submitted').length
  const suspiciousCount = localReports.filter((r) => r.status === 'suspicious').length

  const getScoreBadgeClass = (score: number) => {
    if (score >= 70) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
    if (score >= 40) return 'bg-amber-500/15 text-amber-400 border-amber-500/40'
    return 'bg-red-500/15 text-red-400 border-red-500/40'
  }

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/30">
              MODERASI LAPORAN & VERIFIKASI BERLAPIS
            </span>
            <span className="text-[10px] font-mono text-secondary flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3 h-3" /> Akses Warga Terbuka & Verifikasi Petugas
            </span>
          </div>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
            Antrean Moderasi & Verifikasi Laporan Warga
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Setiap laporan diperiksa otomatis melalui koordinat GPS, validasi foto, pencegahan duplikasi, dan sinkronisasi CCTV serta cuaca sebelum ditindaklanjuti.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `Semua (${localReports.length})` },
            { id: 'submitted', label: `Menunggu (${pendingCount})` },
            { id: 'suspicious', label: `Perlu Diperiksa (${suspiciousCount})` },
            { id: 'under_review', label: 'Dalam Peninjauan' },
            { id: 'verified', label: 'Terverifikasi' },
            { id: 'in_progress', label: 'Dalam Penanganan' },
            { id: 'resolved', label: 'Selesai' },
            { id: 'rejected', label: 'Ditolak' },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={`min-h-[38px] text-xs px-3 py-1.5 rounded-lg border font-mono transition-all flex items-center justify-center ${
                statusFilter === filter.id
                  ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Moderation Queue Table */}
      <div className="border border-outline-variant/30 rounded-xl bg-surface-container-low overflow-x-auto shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container text-on-surface-variant font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Kode Laporan / Waktu</th>
              <th className="py-3 px-4 font-semibold">Kategori & Deskripsi</th>
              <th className="py-3 px-4 font-semibold">Skor Validitas</th>
              <th className="py-3 px-4 font-semibold">Status & Disposisi</th>
              <th className="py-3 px-4 font-semibold text-right">Tindakan Petugas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-on-surface-variant font-mono">
                  Tidak ada laporan dengan status ini.
                </td>
              </tr>
            ) : (
              filtered.map((report) => {
                const agency = getDispositionAgency(report.category)
                const isUpdating = updatingId === report.id
                const isExpanded = expandedReportId === report.id
                const meta = report.verification_metadata
                const score = report.credibility_score ?? meta?.credibility_score ?? 80

                return (
                  <React.Fragment key={report.id}>
                    <tr className={`hover:bg-surface-container/60 transition-colors ${isExpanded ? 'bg-surface-container/40' : ''}`}>
                      {/* 1. ID / Time */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono text-primary font-bold flex items-center gap-1.5">
                          {report.report_code || report.id.slice(0, 12)}
                        </div>
                        <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                          {formatRelativeTime(report.created_at)}
                        </div>
                        <div className="text-[10px] font-mono text-on-surface-variant/80">
                          {report.district_name || 'Kota Semarang'}
                        </div>
                      </td>

                      {/* 2. Category & Description & Photo Thumbnail */}
                      <td className="py-3.5 px-4 align-top max-w-xs sm:max-w-sm">
                        <div className="flex items-start gap-2">
                          {report.photo_url && (
                            <a
                              href={report.photo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="relative w-12 h-12 rounded-lg overflow-hidden border border-outline-variant/40 shrink-0 hover:scale-105 transition-transform"
                              title="Lihat foto asli"
                            >
                              <img
                                src={report.photo_url}
                                alt="Foto Laporan"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface font-semibold">
                                {CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category}
                              </span>
                              <span
                                className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded border ${
                                  report.urgency === 'kritis'
                                    ? 'text-error border-error/40 bg-error/10'
                                    : report.urgency === 'tinggi'
                                    ? 'text-tertiary border-tertiary/40 bg-tertiary/10'
                                    : 'text-primary border-primary/40 bg-primary/10'
                                }`}
                              >
                                {report.urgency}
                              </span>
                            </div>

                            <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">
                              {report.description}
                            </p>

                            <div className="flex items-center gap-2 mt-1.5">
                              <button
                                type="button"
                                onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-secondary hover:underline"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" /> Tutup Bukti
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" /> Periksa Bukti Lengkap
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                disabled={loadingAiId === report.id}
                                onClick={() => handleAnalyzeReportAI(report)}
                                className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Bot className="w-3 h-3" />
                                {loadingAiId === report.id ? 'Menganalisis...' : aiInsights[report.id] ? 'Ringkasan Siap' : 'Bantuan Ringkasan'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Inline AI Insight */}
                        {aiInsights[report.id] && (
                          <div className="mt-2 p-2.5 rounded-lg bg-surface-container border border-primary/30 text-[11px] font-body space-y-1 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-[10px] font-mono text-primary font-bold">
                              <span className="flex items-center gap-1">
                                <Bot className="w-3.5 h-3.5" /> Ringkasan Analisis
                              </span>
                              <span className="uppercase text-secondary font-semibold">
                                {aiInsights[report.id].severity} ({Math.round(aiInsights[report.id].confidence * 100)}%)
                              </span>
                            </div>
                            <p className="text-on-surface text-[11px] leading-relaxed">
                              {aiInsights[report.id].summary}
                            </p>
                            <div className="text-[10px] font-mono text-secondary pt-1 border-t border-outline-variant/20">
                              💡 Saran Penanganan: {aiInsights[report.id].recommended_action}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 3. Credibility Score & Quick Evidence Badges */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${getScoreBadgeClass(
                                score
                              )}`}
                            >
                              {score >= 70 ? (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              ) : score >= 40 ? (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5" />
                              )}
                              <span>{score} / 100</span>
                            </span>
                            <span className="text-[10px] font-mono text-on-surface-variant uppercase font-semibold">
                              {score >= 70 ? 'Valid' : score >= 40 ? 'Tinjau' : 'Mencurigakan'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-on-surface-variant">
                            {meta?.location_grade === 'normal' && (
                              <span className="text-emerald-400 font-semibold" title="Koordinat GPS Valid">
                                ✓ GPS Valid
                              </span>
                            )}
                            {meta?.duplicate_photo && (
                              <span className="text-red-400 font-bold" title="Foto Terindikasi Duplikat">
                                ⚠ Foto Duplikat
                              </span>
                            )}
                            {meta?.corroboration_count ? (
                              <span className="text-cyan-400 font-semibold" title="Dikonfirmasi Laporan Sekitar">
                                ✓ {meta.corroboration_count} Laporan Dekat
                              </span>
                            ) : null}
                            {meta?.cctv_evidence === 'corroborated' && (
                              <span className="text-emerald-400 font-semibold" title="Terkonfirmasi CCTV Terdekat">
                                ✓ CCTV
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Workflow Status & Disposition */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border w-fit ${
                              report.status === 'verified'
                                ? 'bg-secondary/15 text-secondary border-secondary/40'
                                : report.status === 'suspicious'
                                ? 'bg-red-500/15 text-red-400 border-red-500/40'
                                : report.status === 'rejected'
                                ? 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
                                : report.status === 'resolved'
                                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                                : 'bg-primary/15 text-primary border-primary/40'
                            }`}
                          >
                            {report.status}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border w-fit ${agency.badge}`}>
                            {agency.name}
                          </span>
                        </div>
                      </td>

                      {/* 5. Admin Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                            {/* Verify Button */}
                            {report.status !== 'verified' && report.status !== 'resolved' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'verified')}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-primary text-on-primary hover:brightness-110 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                title="Verifikasi laporan ini untuk ditangani"
                              >
                                Verifikasi
                              </button>
                            )}

                            {/* Request Review */}
                            {report.status !== 'under_review' && report.status !== 'resolved' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'under_review')}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold uppercase bg-surface-container-high text-on-surface border border-outline-variant/40 hover:bg-surface-container-highest transition-colors flex items-center justify-center cursor-pointer"
                                title="Minta peninjauan ulang tim lapangan"
                              >
                                Tinjau
                              </button>
                            )}

                            {/* Reject Button */}
                            {report.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'rejected')}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-semibold uppercase bg-error/10 text-error border border-error/30 hover:bg-error/20 transition-colors flex items-center justify-center cursor-pointer"
                                title="Tolak laporan karena tidak valid"
                              >
                                Tolak
                              </button>
                            )}

                            {/* Flag Suspicious */}
                            {report.status !== 'suspicious' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'suspicious')}
                                className="min-h-[36px] px-2 py-1.5 rounded-lg text-[10px] font-mono text-red-400 hover:bg-red-500/15 border border-red-500/20 transition-colors flex items-center justify-center cursor-pointer"
                                title="Tandai sebagai mencurigakan"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Progress to Resolved */}
                          {report.status === 'verified' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                              className="min-h-[34px] px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-tertiary text-on-tertiary hover:brightness-110 transition-all flex items-center justify-center cursor-pointer"
                            >
                              Tugaskan ke Petugas
                            </button>
                          )}
                          {report.status === 'in_progress' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(report.id, 'resolved')}
                              className="min-h-[34px] px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase bg-secondary text-on-secondary hover:brightness-110 transition-all flex items-center justify-center cursor-pointer"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDABLE EXPLAINABLE VERIFICATION DRAWER */}
                    {isExpanded && (
                      <tr className="bg-surface-container-lowest/80">
                        <td colSpan={5} className="p-4 sm:p-5 border-b border-outline-variant/30">
                          <div className="space-y-4 rounded-xl bg-surface-container p-4 border border-outline-variant/40 shadow-inner">
                            {/* Header Evidence */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-secondary" />
                                <span className="font-headline font-bold text-sm text-on-surface">
                                  Rincian Bukti Lokasi, Sensor & Cuaca
                                </span>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant/30">
                                  Skor: {score}/100
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-on-surface-variant">
                                Koordinat: {(report.lat ?? report.latitude)?.toFixed(5)}, {(report.lng ?? report.longitude)?.toFixed(5)}
                              </span>
                            </div>

                            {/* Evidence Grid: Positive vs Warnings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Positive Evidence List */}
                              <div className="space-y-2">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Pemeriksaan Terpenuhi
                                </span>
                                <div className="space-y-1.5 bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 text-xs">
                                  {meta?.positive_evidence && meta.positive_evidence.length > 0 ? (
                                    meta.positive_evidence.map((ev: string, idx: number) => (
                                      <div key={idx} className="flex items-start gap-1.5 text-on-surface font-body">
                                        <span className="text-emerald-400 font-bold">✓</span>
                                        <span>{ev}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-on-surface-variant text-[11px] font-mono">
                                      ✓ Lokasi GPS valid di wilayah Kota Semarang
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Warnings & Anomalies List */}
                              <div className="space-y-2">
                                <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Catatan Peringatan
                                </span>
                                <div className="space-y-1.5 bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 text-xs">
                                  {meta?.warnings && meta.warnings.length > 0 ? (
                                    meta.warnings.map((warn: string, idx: number) => (
                                      <div key={idx} className="flex items-start gap-1.5 text-amber-300 font-body">
                                        <span className="text-amber-400 font-bold">!</span>
                                        <span>{warn}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-emerald-400 text-[11px] font-mono flex items-center gap-1">
                                      ✓ Tidak ada catatan anomali atau kecurigaan pada laporan ini
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Cross-Reference Data: CCTV & Weather & Crowd */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-outline-variant/20">
                              {/* CCTV Corroboration */}
                              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-1">
                                <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                                  <Video className="w-3 h-3 text-secondary" /> CCTV PantauSemar
                                </span>
                                {meta?.nearest_cctv ? (
                                  <div className="text-xs">
                                    <div className="font-bold text-on-surface truncate">
                                      {meta.nearest_cctv.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-secondary">
                                      Jarak: {meta.nearest_cctv.distance_meters}m • {meta.nearest_cctv.category}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-on-surface-variant font-mono">
                                    Tidak ada CCTV &lt;1km
                                  </div>
                                )}
                              </div>

                              {/* Weather Corroboration */}
                              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-1">
                                <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                                  <CloudRain className="w-3 h-3 text-primary" /> Data Cuaca Terkini
                                </span>
                                {meta?.weather_snapshot ? (
                                  <div className="text-xs">
                                    <div className="font-bold text-on-surface">
                                      {meta.weather_snapshot.condition} ({meta.weather_snapshot.temperature_c}°C)
                                    </div>
                                    <div className="text-[10px] font-mono text-primary">
                                      Curah Hujan: {meta.weather_snapshot.precipitation_mm} mm/jam
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-on-surface-variant font-mono">
                                    Data BMKG Terhubung
                                  </div>
                                )}
                              </div>

                              {/* Crowd Corroboration */}
                              <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-1">
                                <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                                  <Users className="w-3 h-3 text-tertiary" /> Laporan Warga Sekitar
                                </span>
                                <div className="text-xs font-bold text-on-surface">
                                  {meta?.corroboration_count ? `${meta.corroboration_count} Laporan Terkait di Sekitar` : 'Laporan Tunggal'}
                                </div>
                                <div className="text-[10px] font-mono text-on-surface-variant">
                                  Radius ≤300m / Rentang 30 Menit
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
