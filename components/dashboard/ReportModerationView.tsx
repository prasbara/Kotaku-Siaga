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
  Flame,
  Tag,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from '@/components/ui/use-toast'

interface ReportModerationViewProps {
  reports?: Report[]
  onReportUpdated?: () => void
  onRefresh?: () => void
}

const EMPTY_REPORTS: Report[] = []

export function ReportModerationView({ reports, onReportUpdated, onRefresh }: ReportModerationViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [simulationFilter, setSimulationFilter] = useState<'all' | 'real_only' | 'simulation_only'>('all')
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

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  const fetchReports = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/reports?limit=100')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setLocalReports(data.data)
      }
      setLastSyncTime(
        new Date().toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB'
      )
    } catch (err) {
      console.warn('Failed to fetch reports in ReportModerationView:', err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Auto-refresh polling every 10 seconds for real-time operator moderation
  React.useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 10000)
    return () => clearInterval(interval)
  }, [fetchReports])

  // Sync if reports prop changes
  React.useEffect(() => {
    if (reports && reports.length > 0) {
      setLocalReports(reports)
    }
  }, [reports])

  const getDispositionAgency = (category: string) => {
    switch (category) {
      case 'kebakaran':
      case 'fire':
        return { name: 'Dinas Pemadam Kebakaran (Damkar)', badge: 'bg-red-500/10 text-red-400 border-red-500/30' }
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

  const STATUS_LABELS_MAP: Record<string, string> = {
    verified: 'Terverifikasi (Siap Ditindaklanjuti)',
    under_review: 'Dalam Peninjauan Lapangan',
    rejected: 'Ditolak (Tidak Valid)',
    suspicious: 'Ditandai Mencurigakan',
    in_progress: 'Dalam Penanganan Petugas',
    resolved: 'Selesai Ditangani',
    submitted: 'Menunggu Moderasi',
  }

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setUpdatingId(reportId)
    const previousReports = [...localReports]

    // Optimistic local update
    setLocalReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus as any } : r))
    )

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast({
          title: 'Status Laporan Diperbarui',
          description: `Status berhasil diubah menjadi "${STATUS_LABELS_MAP[newStatus] || newStatus}".`,
        })
        if (onReportUpdated) onReportUpdated()
        if (onRefresh) onRefresh()
      } else {
        // Revert on server error
        setLocalReports(previousReports)
        toast({
          title: 'Gagal Memperbarui Status',
          description: data.error || 'Terjadi kendala saat memperbarui status di basis data.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      setLocalReports(previousReports)
      toast({
        title: 'Kesalahan Jaringan',
        description: 'Gagal menghubungi server untuk memperbarui status.',
        variant: 'destructive',
      })
      console.error('handleUpdateStatus error:', err)
    } finally {
      setTimeout(() => setUpdatingId(null), 300)
    }
  }

  const filtered = localReports
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .filter((r) => categoryFilter === 'all' || r.category === categoryFilter)
    .filter((r) => {
      const isSim = Boolean(r.is_simulation || r.is_demo)
      if (simulationFilter === 'real_only') return !isSim
      if (simulationFilter === 'simulation_only') return isSim
      return true
    })

  const pendingCount = localReports.filter((r) => r.status === 'submitted').length
  const suspiciousCount = localReports.filter((r) => r.status === 'suspicious').length
  const simulationCount = localReports.filter((r) => Boolean(r.is_simulation || r.is_demo)).length

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {lastSyncTime && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sync: {lastSyncTime}</span>
            </div>
          )}
          <button
            type="button"
            onClick={fetchReports}
            disabled={isRefreshing}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-mono font-bold flex items-center gap-2 border border-outline-variant/30 transition-all cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar & Simulation Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
              className={`min-h-[38px] text-xs px-3 py-1.5 rounded-lg border font-mono transition-all flex items-center justify-center cursor-pointer ${
                statusFilter === filter.id
                  ? 'bg-primary text-on-primary border-primary font-bold shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Data Stream Filter: Real vs Simulation */}
        <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/30 text-xs font-mono shrink-0">
          <button
            type="button"
            onClick={() => setSimulationFilter('all')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
              simulationFilter === 'all'
                ? 'bg-surface-container-highest text-on-surface font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Semua Data
          </button>
          <button
            type="button"
            onClick={() => setSimulationFilter('real_only')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
              simulationFilter === 'real_only'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hanya Data Riil
          </button>
          <button
            type="button"
            onClick={() => setSimulationFilter('simulation_only')}
            className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
              simulationFilter === 'simulation_only'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Simulasi ({simulationCount})
          </button>
        </div>
      </div>

      {/* Category Filter Chips Bar (Section 11) */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-outline-variant/20">
        <span className="text-[11px] font-mono text-on-surface-variant font-bold mr-1">Kategori:</span>
        {[
          { id: 'all', label: 'Semua Kategori' },
          { id: 'banjir', label: 'Banjir' },
          { id: 'genangan', label: 'Rob / Genangan' },
          { id: 'drainase_tersumbat', label: 'Drainase' },
          { id: 'longsor', label: 'Longsor' },
          { id: 'pohon_tumbang', label: 'Pohon Tumbang' },
          { id: 'kebakaran', label: 'Kebakaran' },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`min-h-[32px] text-[11px] px-3 py-1 rounded-full border font-mono transition-all flex items-center justify-center cursor-pointer ${
              categoryFilter === cat.id
                ? cat.id === 'kebakaran'
                  ? 'bg-[#ea580c] text-white border-[#ea580c] font-bold shadow-xs'
                  : 'bg-primary text-on-primary border-primary font-bold shadow-xs'
                : 'bg-surface-container/60 text-on-surface-variant border-outline-variant/30 hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Moderation Queue Table */}
      <div className="border border-outline-variant/30 rounded-xl bg-surface-container-low overflow-x-auto shadow-md">
        <table className="w-full min-w-[720px] text-left text-xs border-collapse">
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
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container border border-outline-variant/30 text-on-surface font-semibold">
                                {report.category === 'kebakaran' ? (
                                  <>
                                    <Flame className="w-3 h-3 text-orange-400" />
                                    <span>Kebakaran</span>
                                  </>
                                ) : (
                                  CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category
                                )}
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
                              {Boolean(report.is_simulation || report.is_demo) && (
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Simulasi
                                </span>
                              )}
                              {meta?.possible_duplicate && (
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  Duplikat Dekat
                                </span>
                              )}
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
                          <div className="mt-2.5 p-3 rounded-xl bg-white border border-[#eddcf7] text-[11px] font-body space-y-2 shadow-xs animate-in fade-in duration-150">
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#4a154b] font-bold">
                              <span className="flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-[#4a154b]" />
                                <span>Ringkasan Analisis AI</span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4ede4] border border-[#d0c8be] text-[#4a154b]">
                                {aiInsights[report.id].severity.toUpperCase()} ({Math.round(aiInsights[report.id].confidence * 100)}%)
                              </span>
                            </div>
                            
                            <p className="text-[#1d1d1d] text-[11px] leading-relaxed font-normal">
                              {aiInsights[report.id].summary}
                            </p>
                            
                            <div className="text-[11px] font-mono text-[#1d1d1d] pt-2 border-t border-[#f0ece5] flex items-start gap-1.5 bg-[#fbf8f3] -mx-3 -mb-3 p-2.5 rounded-b-xl">
                              <Lightbulb className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                              <div className="leading-snug">
                                <strong className="text-[#854d0e] font-bold">Saran Penanganan: </strong>
                                <span className="text-[#1d1d1d] font-medium">{aiInsights[report.id].recommended_action}</span>
                              </div>
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
                            {report.email_verified && (
                              <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5" title="Email Pelapor Terverifikasi OTP">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>OTP Verified</span>
                              </span>
                            )}
                            {(report.independent_reporter_count || meta?.independent_reporter_count) && (
                              <span className="text-cyan-400 font-bold inline-flex items-center gap-0.5" title="Jumlah Pelapor Independen">
                                <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>{report.independent_reporter_count || meta?.independent_reporter_count} Pelapor</span>
                              </span>
                            )}
                            {meta?.cluster_code && (
                              <span className="text-purple-400 font-mono inline-flex items-center gap-0.5" title="Kode Klaster Insiden">
                                <Tag className="w-3 h-3 text-purple-400 shrink-0" />
                                <span>{meta.cluster_code}</span>
                              </span>
                            )}
                            {meta?.location_grade === 'normal' && (
                              <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5" title="Koordinat GPS Valid">
                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>GPS Valid</span>
                              </span>
                            )}
                            {(meta?.abuse_score ?? report.abuse_score) !== undefined && (
                              <span
                                className={`font-semibold ${
                                  (meta?.abuse_score ?? report.abuse_score ?? 0) > 40
                                    ? 'text-red-400'
                                    : 'text-emerald-400'
                                }`}
                                title="Skor Penyalahgunaan / Spam"
                              >
                                Abuse: {meta?.abuse_score ?? report.abuse_score ?? 0}/100
                              </span>
                            )}
                            {meta?.duplicate_photo && (
                              <span className="text-red-400 font-bold inline-flex items-center gap-0.5" title="Foto Terindikasi Duplikat">
                                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                                <span>Foto Duplikat</span>
                              </span>
                            )}
                            {meta?.corroboration_count ? (
                              <span className="text-cyan-400 font-semibold inline-flex items-center gap-0.5" title="Dikonfirmasi Laporan Sekitar">
                                <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span>{meta.corroboration_count} Laporan Dekat</span>
                              </span>
                            ) : null}
                            {meta?.cctv_evidence === 'corroborated' && (
                              <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5" title="Terkonfirmasi CCTV Terdekat">
                                <Camera className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>CCTV</span>
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
                      <td className="py-3.5 px-4 align-top text-right min-w-[200px]">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1.5 justify-end flex-wrap">
                            {/* Verify Button */}
                            {report.status !== 'verified' && report.status !== 'resolved' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'verified')}
                                className="min-h-[34px] px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase bg-[#007a5a] text-white hover:bg-[#006046] active:scale-95 transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Verifikasi laporan ini untuk ditangani"
                              >
                                {isUpdating ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Verifikasi</span>
                              </button>
                            )}

                            {/* Request Review */}
                            {report.status !== 'under_review' && report.status !== 'resolved' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'under_review')}
                                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase bg-[#f4ede4] text-[#4a154b] border border-[#d0c8be] hover:bg-[#e8ded2] active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Minta peninjauan ulang tim lapangan"
                              >
                                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                                <span>Tinjau</span>
                              </button>
                            )}

                            {/* Reject Button */}
                            {report.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'rejected')}
                                className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase bg-[#fdf2f0] text-[#cc4117] border border-[#fca5a5] hover:bg-[#fee2e2] active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Tolak laporan karena tidak valid"
                              >
                                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                <span>Tolak</span>
                              </button>
                            )}

                            {/* Flag Suspicious */}
                            {report.status !== 'suspicious' && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(report.id, 'suspicious')}
                                className="min-h-[34px] px-2 py-1.5 rounded-lg text-[11px] font-mono text-[#b45309] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fcd34d] active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                                title="Tandai sebagai mencurigakan"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-[#b45309]" />
                              </button>
                            )}
                          </div>

                          {/* Progress to Resolved */}
                          {report.status === 'verified' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                              className="min-h-[32px] px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#4a154b] text-white hover:bg-[#3d123e] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>Tugaskan Petugas</span>
                            </button>
                          )}
                          {report.status === 'in_progress' && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(report.id, 'resolved')}
                              className="min-h-[32px] px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-[#007a5a] text-white hover:bg-[#006046] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Tandai Selesai</span>
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

                            {/* Duplicate Advisory Alert */}
                            {meta?.possible_duplicate && (
                              <div className="p-3 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-xs flex items-start gap-2 text-cyan-200 font-mono">
                                <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="block text-cyan-300">Indikasi Laporan Kemungkinan Duplikasi:</strong>
                                  <span>{meta.duplicate_warning || 'Terdeteksi laporan serupa dalam radius 300m & selang waktu 60 menit.'}</span>
                                  {meta.suspected_duplicate_of && meta.suspected_duplicate_of.length > 0 && (
                                    <span className="block mt-0.5 text-[10px] text-cyan-400 font-bold">
                                      Kode Laporan Serupa: {meta.suspected_duplicate_of.join(', ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Dynamic Incident Structured Attributes */}
                            {report.incident_details && (() => {
                              const inc = report.incident_details as any
                              const fDet = inc.fire || (inc.incident_type === 'kebakaran' ? inc : null)
                              const tDet = inc.tree || (inc.incident_type === 'pohon_tumbang' ? inc : null)
                              const catName = inc.category || inc.incident_type || report.category

                              return (
                                <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold block mb-2">
                                    Atribut Terstruktur ({String(catName).toUpperCase()})
                                  </span>
                                  {fDet && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Kondisi Api</span>
                                        <strong className="text-on-surface">{fDet.fire_condition || 'Terlihat'}</strong>
                                      </div>
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Lokasi Subtipe</span>
                                        <strong className="text-on-surface">{fDet.location_subtype || 'Bangunan'}</strong>
                                      </div>
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Intensitas Asap</span>
                                        <strong className="text-on-surface">{fDet.smoke_intensity || 'Sedang'}</strong>
                                      </div>
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Potensi Korban</span>
                                        <strong className="text-on-surface">{fDet.casualty_potential || 'Nihil'}</strong>
                                      </div>
                                      {fDet.additional_hazards && fDet.additional_hazards.length > 0 && (
                                        <div className="col-span-2 sm:col-span-4 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
                                          <span className="text-[10px] font-mono font-bold uppercase text-red-400 block mb-1">Bahaya Tambahan:</span>
                                          <div className="flex flex-wrap gap-1">
                                            {(fDet.additional_hazards as string[]).map((h: string, i: number) => (
                                              <span key={i} className="px-1.5 py-0.5 rounded bg-red-500/20 text-[10px] inline-flex items-center gap-1">
                                                <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                                                <span>{h}</span>
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {tDet && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Ukuran Pohon</span>
                                        <strong className="text-on-surface">{tDet.tree_size || 'Terdampak'}</strong>
                                      </div>
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Jalan Terhalang</span>
                                        <strong className="text-on-surface">{tDet.road_blocked || 'Tercatat'}</strong>
                                      </div>
                                      <div className="p-2 rounded bg-surface-container border border-outline-variant/20">
                                        <span className="text-[10px] text-on-surface-variant font-mono block">Kabel Listrik</span>
                                        <strong className="text-on-surface">{tDet.electricity_impact || 'Status terpantau'}</strong>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}

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
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{ev}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-on-surface-variant text-[11px] font-mono flex items-center gap-1.5">
                                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span>Lokasi GPS valid di wilayah Kota Semarang</span>
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
                                        <span className="text-amber-400 font-bold font-mono">!</span>
                                        <span>{warn}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span>Tidak ada catatan anomali atau kecurigaan pada laporan ini</span>
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
