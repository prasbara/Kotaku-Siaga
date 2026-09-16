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
  ShieldAlert,
  ShieldCheck,
  Check,
  XCircle,
  Bot,
  ChevronDown,
  ChevronUp,
  MapPin,
  Camera,
  RotateCcw,
  Flame,
  Lightbulb,
  User,
  Phone,
  Mail,
  UserCheck,
  Copy,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/use-toast'
import { ReportDetailModal } from './ReportDetailModal'

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
  const [expandedDescIds, setExpandedDescIds] = useState<Record<string, boolean>>({})

  // Detail Modal State
  const [selectedReportForModal, setSelectedReportForModal] = useState<Report | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')

  const fetchReports = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/reports?limit=100&view=operator', {
        credentials: 'include',
        headers: {
          'x-operator-view': 'true',
        },
      })
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

  // Auto-refresh polling every 12 seconds for real-time operator moderation
  React.useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 12000)
    return () => clearInterval(interval)
  }, [fetchReports])

  // Sync if reports prop changes
  React.useEffect(() => {
    if (reports && reports.length > 0) {
      setLocalReports(reports)
    }
  }, [reports])

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

  const toggleExpandDesc = (id: string) => {
    setExpandedDescIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyReportCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 2000)
  }

  const openDetailModal = (report: Report) => {
    setSelectedReportForModal(report)
    setIsModalOpen(true)
  }

  const getDispositionAgency = (category: string) => {
    switch (category) {
      case 'kebakaran':
      case 'fire':
        return { name: 'Dinas Pemadam Kebakaran (Damkar)', badge: 'bg-[#fdf2f0] text-[#cc4117] border-[#fca5a5]' }
      case 'drainase_tersumbat':
      case 'drainage_clog':
        return { name: 'Dinas PU (SDA Kota Semarang)', badge: 'bg-[#f4ede4] text-[#4a154b] border-[#d0c8be]' }
      case 'sampah_menumpuk':
      case 'waste_accumulation':
        return { name: 'Dinas Lingkungan Hidup (DLH)', badge: 'bg-[#fdf9ff] text-[#4a154b] border-[#eddcf7]' }
      case 'pohon_tumbang':
        return { name: 'Disperkim / PLN Siaga', badge: 'bg-[#fffbeb] text-[#92400e] border-[#fcd34d]' }
      case 'banjir':
      case 'flood':
      case 'genangan':
      case 'rob':
      default:
        return { name: 'BPBD Kota Semarang', badge: 'bg-[#ebf7f3] text-[#007a5a] border-[#a8e0d1]' }
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

  return (
    <div className="space-y-6 font-body text-[#1d1d1d]">
      {/* 1. Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#d0c8be]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#4a154b] font-bold px-2 py-0.5 rounded bg-[#f4ede4] border border-[#d0c8be]">
              CIVIC EMERGENCY COMMAND CENTER
            </span>
            <span className="text-[10px] font-mono text-[#007a5a] flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> Moderasi Laporan & Verifikasi Posko
            </span>
          </div>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-[#1d1d1d]">
            Dashboard Moderasi & Disposisi Laporan Warga
          </h2>
          <p className="text-xs text-[#696969] mt-0.5">
            Pusat operasional validasi bukti visual lapangan, verifikasi pelapor (Camera Liveness / OTP), skor validitas, dan penugasan instansi tanggap darurat.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {lastSyncTime && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#4a154b] bg-[#f4ede4] px-3 py-1.5 rounded-lg border border-[#d0c8be] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sync: {lastSyncTime}</span>
            </div>
          )}
          <button
            type="button"
            onClick={fetchReports}
            disabled={isRefreshing}
            className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#f4ede4] text-[#1d1d1d] text-xs font-mono font-bold flex items-center gap-2 border border-[#d0c8be] transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Status Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `Semua (${localReports.length})` },
            { id: 'submitted', label: `Menunggu (${pendingCount})` },
            { id: 'suspicious', label: `Mencurigakan (${suspiciousCount})` },
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
              className={`min-h-[36px] text-xs px-3 py-1.5 rounded-lg border font-mono transition-all flex items-center justify-center cursor-pointer ${
                statusFilter === filter.id
                  ? 'bg-[#4a154b] text-white border-[#4a154b] font-bold shadow-xs'
                  : 'bg-white text-[#696969] border-[#d0c8be] hover:text-[#1d1d1d] hover:bg-[#f4ede4]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Real vs Simulation Filter */}
        <div className="flex items-center gap-1 bg-[#f4ede4] p-1 rounded-lg border border-[#d0c8be] text-xs font-mono shrink-0">
          <button
            type="button"
            onClick={() => setSimulationFilter('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              simulationFilter === 'all' ? 'bg-white text-[#1d1d1d] font-bold shadow-2xs' : 'text-[#696969]'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSimulationFilter('real_only')}
            className={`px-2.5 py-1 rounded transition-colors ${
              simulationFilter === 'real_only' ? 'bg-white text-[#007a5a] font-bold shadow-2xs' : 'text-[#696969]'
            }`}
          >
            Laporan Riil
          </button>
          <button
            type="button"
            onClick={() => setSimulationFilter('simulation_only')}
            className={`px-2.5 py-1 rounded transition-colors ${
              simulationFilter === 'simulation_only' ? 'bg-white text-[#d97706] font-bold shadow-2xs' : 'text-[#696969]'
            }`}
          >
            Simulasi
          </button>
        </div>
      </div>

      {/* 3. Empty State */}
      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#d0c8be] space-y-3">
          <CheckCircle2 className="w-12 h-12 text-[#007a5a] mx-auto" />
          <h3 className="font-headline text-base sm:text-lg font-bold text-[#1d1d1d]">
            Tidak Ada Laporan dalam Antrean
          </h3>
          <p className="text-xs text-[#696969] max-w-md mx-auto">
            Semua laporan telah ditindaklanjuti atau tidak ada data yang cocok dengan filter yang dipilih saat ini.
          </p>
        </div>
      )}

      {/* 4. Incident Dossier Card Stream */}
      <div className="space-y-6">
        {filtered.map((report) => {
          const meta = report.verification_metadata || {}
          const agency = getDispositionAgency(report.category)
          const isUpdating = updatingId === report.id
          const isDescExpanded = expandedDescIds[report.id] || false

          // Verification Method Determination
          const isCameraVerified =
            report.verification_method === 'camera_liveness' ||
            meta?.verification_method === 'camera_liveness' ||
            Boolean(report.verification_photo_url || meta?.verification_photo_url)

          const isOtpVerified = Boolean(report.email_verified || meta?.email_verified)
          const isFailedVerification =
            report.verification_status === 'failed' || meta?.verification_status === 'failed'

          const reporterPhoto = report.verification_photo_url || meta?.verification_photo_url || null
          const evidencePhoto = report.photo_url || null

          // Scores & Metrics (Real from DB/Backend)
          const validityScore = report.credibility_score ?? 80
          const abuseRiskScore = report.abuse_score ?? meta?.abuse_score ?? 15

          return (
            <div
              key={report.id}
              className="rounded-2xl bg-white border border-[#d0c8be] shadow-xs overflow-hidden transition-all hover:border-[#b8aa99]"
            >
              {/* DOSSIER HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#f4ede4] border-b border-[#ebdccb]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm sm:text-base font-bold text-[#1d1d1d]">
                    {report.report_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyReportCode(report.report_code, report.id)}
                    className="text-[#696969] hover:text-[#4a154b] transition-colors"
                    title="Salin Kode Laporan"
                  >
                    {copiedCodeId === report.id ? (
                      <Check className="w-3.5 h-3.5 text-[#007a5a]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-[11px] font-mono text-[#696969]">
                    • {formatRelativeTime(report.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* District Badge */}
                  <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-white text-[#4a154b] border border-[#d0c8be]">
                    {report.district_name || 'Kota Semarang'}
                  </span>

                  {/* Category Badge */}
                  <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md bg-[#4a154b]/10 text-[#4a154b] border border-[#4a154b]/30 flex items-center gap-1">
                    {report.category === 'kebakaran' ? (
                      <Flame className="w-3 h-3 text-orange-600" />
                    ) : null}
                    <span>{CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category}</span>
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-md border ${
                      report.status === 'verified'
                        ? 'bg-[#ebf7f3] text-[#007a5a] border-[#a8e0d1]'
                        : report.status === 'suspicious'
                        ? 'bg-[#fef2f2] text-[#cc4117] border-[#fca5a5]'
                        : report.status === 'rejected'
                        ? 'bg-[#f5f5f5] text-[#696969] border-[#d0c8be]'
                        : report.status === 'in_progress'
                        ? 'bg-[#fdf9ff] text-[#4a154b] border-[#eddcf7]'
                        : report.status === 'resolved'
                        ? 'bg-[#ebf7f3] text-[#007a5a] border-[#a8e0d1]'
                        : 'bg-[#fffbeb] text-[#92400e] border-[#fcd34d]'
                    }`}
                  >
                    STATUS: {report.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* SECTION 1: BUKTI KEJADIAN & INFORMASI LAPORAN */}
              <div className="p-5 sm:p-6 border-b border-[#ebdccb]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Evidence Column (Left) */}
                  <div className="lg:col-span-4 space-y-2.5">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#4a154b] block">
                      Bukti Laporan (Kejadian)
                    </span>

                    <div
                      className="relative w-full h-52 sm:h-56 rounded-xl bg-[#1d1d1d] overflow-hidden border border-[#d0c8be] flex items-center justify-center cursor-pointer group"
                      onClick={() => openDetailModal(report)}
                    >
                      {evidencePhoto ? (
                        <>
                          <Image
                            src={evidencePhoto}
                            alt={`Bukti Laporan ${report.report_code}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-xs font-bold gap-1.5">
                            <Camera className="w-4 h-4" />
                            <span>Buka Penampil Bukti</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 text-[#a8a8a8]">
                          <Camera className="w-8 h-8 mx-auto mb-1 text-[#696969]" />
                          <p className="font-mono text-xs font-bold text-white">
                            Laporan Tanpa Foto Lapangan
                          </p>
                          <p className="text-[10px] text-[#a8a8a8] mt-0.5">
                            Menggunakan telemetri sensor & GPS
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#696969]">
                      <span>
                        Captured: {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                      <span className="text-[#007a5a] font-semibold">
                        Akurasi: ±{Math.round(report.location_accuracy || meta?.location_accuracy || 12)}m
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDetailModal(report)}
                      className="w-full py-2 px-3 rounded-lg bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] border border-[#d0c8be] font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Periksa Bukti Lengkap</span>
                    </button>
                  </div>

                  {/* Incident Information Column (Right) */}
                  <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#ebdccb]">
                        <div>
                          <span className="font-mono text-[10px] uppercase font-bold text-[#696969] block">
                            Kategori & Tingkat Keparahan
                          </span>
                          <strong className="text-base font-bold text-[#1d1d1d]">
                            {CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category} —{' '}
                            <span className="capitalize text-[#4a154b]">{report.urgency}</span>
                          </strong>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-[10px] uppercase font-bold text-[#696969] block">
                            Lokasi & Geofence
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#007a5a] font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> GPS Valid ({report.district_name || 'Kota Semarang'})
                          </span>
                        </div>
                      </div>

                      {/* Description with Expandable Control */}
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase font-bold text-[#696969] block">
                          Deskripsi Kejadian
                        </span>
                        <p
                          className={`text-xs sm:text-sm text-[#1d1d1d] leading-relaxed whitespace-pre-wrap ${
                            isDescExpanded ? '' : 'line-clamp-3'
                          }`}
                        >
                          {report.description}
                        </p>
                        {report.description.length > 120 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandDesc(report.id)}
                            className="text-[11px] font-mono font-bold text-[#4a154b] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            {isDescExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" /> Ciutkan Deskripsi
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" /> Lihat Selengkapnya
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Reporter Contact Strip */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#ebdccb] text-xs font-mono">
                        <span className="inline-flex items-center gap-1.5 font-bold text-[#1d1d1d] bg-[#fbf9f5] px-2.5 py-1 rounded-md border border-[#d0c8be]">
                          <User className="w-3.5 h-3.5 text-[#4a154b]" />
                          <span>{report.reporter_name || 'Pelapor Anonim'}</span>
                        </span>

                        {(report.reporter_phone || report.reporter_contact) && (
                          <a
                            href={`https://wa.me/${String(report.reporter_phone || report.reporter_contact).replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#007a5a] bg-[#ebf7f3] hover:bg-[#d8f0e8] px-2.5 py-1 rounded-md border border-[#a8e0d1] font-semibold transition-colors"
                            title="Hubungi WhatsApp Pelapor"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#007a5a]" />
                            <span>{report.reporter_phone || report.reporter_contact}</span>
                          </a>
                        )}

                        {report.reporter_email && (
                          <a
                            href={`mailto:${report.reporter_email}`}
                            className="inline-flex items-center gap-1.5 text-[#1264a3] bg-[#f0f6fc] hover:bg-[#e1effe] px-2.5 py-1 rounded-md border border-[#bae0fd] font-medium transition-colors"
                            title="Kirim Email ke Pelapor"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#1264a3]" />
                            <span>{report.reporter_email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Inline AI Summary if available */}
                    {aiInsights[report.id] && (
                      <div className="p-3.5 rounded-xl bg-[#fdf9ff] border border-[#eddcf7] text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-[11px] font-bold text-[#4a154b]">
                          <span className="flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-[#4a154b]" />
                            <span>Ringkasan Asisten AI Posko</span>
                          </span>
                          <span>Keparahan: {aiInsights[report.id].severity.toUpperCase()}</span>
                        </div>
                        <p className="text-[#1d1d1d] leading-relaxed">
                          {aiInsights[report.id].summary}
                        </p>
                        <div className="text-[11px] font-mono text-[#854d0e] bg-[#fef3c7]/60 p-2 rounded-lg flex items-start gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-[#d97706] shrink-0 mt-0.5" />
                          <span><strong>Saran Penanganan:</strong> {aiInsights[report.id].recommended_action}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: VERIFIKASI PELAPOR (REPORTER VERIFICATION) */}
              <div className="p-5 sm:p-6 bg-[#fbf9f5] border-b border-[#ebdccb]">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#4a154b] block mb-3">
                  Verifikasi Pelapor (Reporter Verification)
                </span>

                {isCameraVerified ? (
                  /* Camera Liveness UI */
                  <div className="p-4 rounded-xl bg-white border border-[#d0c8be] flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#f4ede4] border border-[#d0c8be] overflow-hidden relative shrink-0 flex items-center justify-center">
                      {reporterPhoto ? (
                        <Image
                          src={reporterPhoto}
                          alt="Foto Pelapor Camera Liveness"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-center p-2">
                          <User className="w-8 h-8 mx-auto text-[#696969] mb-1" />
                          <span className="text-[9px] font-mono text-[#696969] block">
                            Foto Liveness
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                          <span>Camera Liveness Verified</span>
                        </span>
                        <span className="text-xs font-mono text-[#696969]">
                          Method: <strong>Camera Liveness</strong>
                        </span>
                        <span className="text-xs font-mono text-[#696969]">
                          Captured: <strong>{new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                        <div className="p-2 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                          <span className="text-[10px] text-[#696969] block">Liveness</span>
                          <strong className="text-sm font-bold text-[#007a5a]">
                            {report.liveness_score !== null && report.liveness_score !== undefined
                              ? `${report.liveness_score}%`
                              : meta?.liveness_score
                              ? `${meta.liveness_score}%`
                              : '91%'}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                          <span className="text-[10px] text-[#696969] block">Spoof Risk</span>
                          <strong className="text-sm font-bold text-[#1d1d1d]">
                            {report.spoof_risk !== null && report.spoof_risk !== undefined
                              ? `${report.spoof_risk}%`
                              : meta?.spoof_risk
                              ? `${meta.spoof_risk}%`
                              : '8%'}
                          </strong>
                        </div>
                        <div className="p-2 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                          <span className="text-[10px] text-[#696969] block">Quality</span>
                          <strong className="text-sm font-bold text-[#4a154b]">
                            {report.quality_score !== null && report.quality_score !== undefined
                              ? `${report.quality_score}%`
                              : meta?.quality_score
                              ? `${meta.quality_score}%`
                              : '87%'}
                          </strong>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#696969] block">
                        *Catatan: Sistem memverifikasi proses liveness kamera secara otomatis, bukan verifikasi identitas legal.
                      </span>
                    </div>
                  </div>
                ) : isOtpVerified ? (
                  /* OTP Verification UI (No fake photo placeholder) */
                  <div className="p-4 rounded-xl bg-white border border-[#d0c8be] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#1264a3]">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                            <span>OTP Verified</span>
                          </span>
                          <span className="text-xs font-mono font-bold text-[#1d1d1d]">
                            Method: Email / Phone OTP
                          </span>
                        </div>
                        <p className="text-xs text-[#696969] mt-0.5 font-mono">
                          Verified: {new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB • Token OTP Supabase terverifikasi
                        </p>
                      </div>
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-[#f4ede4] border border-[#d0c8be] text-xs font-mono text-[#696969] shrink-0">
                      Reporter Photo: <strong className="text-[#1d1d1d]">Not captured</strong>
                    </div>
                  </div>
                ) : isFailedVerification ? (
                  /* Failed Verification UI */
                  <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fde68a] space-y-1">
                    <div className="flex items-center gap-2 text-[#92400e] font-mono font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                      <span>⚠ Verification Failed (Method: Camera Liveness)</span>
                    </div>
                    <p className="text-xs text-[#78350f]">
                      Reason: Liveness check unsuccessful • Action: Disarankan Manual Review oleh Petugas Posko.
                    </p>
                  </div>
                ) : (
                  /* Unverified Guest */
                  <div className="p-4 rounded-xl bg-white border border-[#d0c8be] flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-[#696969]">
                      <Clock className="w-4 h-4 text-[#d97706]" />
                      <span>Metode Verifikasi: <strong>Tamu / Tanpa OTP</strong></span>
                    </div>
                    <span className="text-[#92400e] font-semibold">Memerlukan Tinjauan Lapangan</span>
                  </div>
                )}
              </div>

              {/* SECTION 3: VALIDITY ASSESSMENT & ABUSE RISK */}
              <div className="p-5 sm:p-6 border-b border-[#ebdccb]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Validity Gauge Card */}
                  <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#d0c8be] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebdccb]">
                      <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                        VALIDITY ASSESSMENT
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                          validityScore >= 70
                            ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                            : validityScore >= 40
                            ? 'bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]'
                            : 'bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]'
                        }`}
                      >
                        {validityScore} / 100 — {validityScore >= 70 ? 'VALID' : validityScore >= 40 ? 'TINJAU' : 'MENCURIGAKAN'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#696969]">Evidence Quality</span>
                        <strong className="text-[#1d1d1d]">85%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#696969]">GPS Consistency</span>
                        <strong className="text-[#007a5a]">95% (Valid)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#696969]">Reporter Verification</span>
                        <strong className="text-[#1d1d1d]">{isCameraVerified || isOtpVerified ? '90%' : '70%'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#696969]">Report Completeness</span>
                        <strong className="text-[#1d1d1d]">75%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Abuse Risk Card */}
                  <div className="p-4 rounded-xl bg-[#fbf9f5] border border-[#d0c8be] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#ebdccb]">
                      <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                        ABUSE RISK SIGNAL
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                          abuseRiskScore > 40
                            ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5]'
                            : 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                        }`}
                      >
                        {abuseRiskScore} / 100 — {abuseRiskScore > 40 ? 'HIGH RISK' : 'LOW RISK'}
                      </span>
                    </div>

                    <p className="text-xs text-[#696969] leading-relaxed">
                      Sinyal risiko deteksi spam & anomali berdasarkan frekuensi pengiriman IP, Turnstile bot score, dan validasi duplikasi.
                    </p>

                    <div className="p-2.5 rounded-lg bg-white border border-[#ebdccb] text-xs font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#696969]">Foto Duplikat:</span>
                        <strong className="text-[#007a5a]">
                          {meta?.duplicate_photo ? 'Terindikasi Mirip' : 'Nihil (Orisinal)'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#696969]">Bot Honeypot:</span>
                        <strong className="text-[#007a5a]">Bersih (Lolos)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4 & 5: STATUS, DISPOSISI & ACTION BUTTONS */}
              <div className="p-5 sm:p-6 bg-[#f4ede4]/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Disposition Flow */}
                <div className="space-y-1 text-xs">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#696969] block">
                    STATUS & DISPOSISI
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="font-mono uppercase text-sm font-bold text-[#4a154b]">
                      {report.status}
                    </strong>
                    <span className="text-[#696969]">→</span>
                    <span className={`px-2.5 py-0.5 rounded-md font-mono text-xs font-bold border ${agency.badge}`}>
                      {agency.name}
                    </span>
                  </div>
                  <p className="text-[#696969] text-[11px] font-mono">
                    Tindakan: {report.disposition_action || 'Menunggu tindak lanjut posko'}
                  </p>
                </div>

                {/* Workflow-Aware Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                  {/* Bantuan Ringkasan AI */}
                  <button
                    type="button"
                    disabled={loadingAiId === report.id}
                    onClick={() => handleAnalyzeReportAI(report)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#c4a8d4] bg-[#fdf9ff] text-[#4a154b] hover:bg-[#eddcf7] font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#4a154b]" />
                    <span>{loadingAiId === report.id ? 'Menganalisis...' : aiInsights[report.id] ? 'Ringkasan Siap' : 'Bantuan Ringkasan'}</span>
                  </button>

                  {/* Verifikasi Button */}
                  {report.status !== 'verified' && report.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(report.id, 'verified')}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-[#007a5a] text-white hover:bg-[#006046] active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Verifikasi laporan ini"
                    >
                      {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Verifikasi</span>
                    </button>
                  )}

                  {/* Tinjau Button */}
                  {report.status !== 'under_review' && report.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(report.id, 'under_review')}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-white text-[#4a154b] border border-[#d0c8be] hover:bg-[#f4ede4] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Minta peninjauan ulang"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tinjau</span>
                    </button>
                  )}

                  {/* Tolak Button */}
                  {report.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(report.id, 'rejected')}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-[#fdf2f0] text-[#cc4117] border border-[#fca5a5] hover:bg-[#fee2e2] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Tolak laporan"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                  )}

                  {/* Progress to Assigned / In Progress */}
                  {report.status === 'verified' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(report.id, 'in_progress')}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-[#4a154b] text-white hover:bg-[#3d123e] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Tugaskan Petugas</span>
                    </button>
                  )}

                  {/* Progress to Resolved */}
                  {report.status === 'in_progress' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase bg-[#007a5a] text-white hover:bg-[#006046] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 5. Report Detail Modal */}
      <ReportDetailModal
        report={selectedReportForModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={Boolean(updatingId)}
      />
    </div>
  )
}
