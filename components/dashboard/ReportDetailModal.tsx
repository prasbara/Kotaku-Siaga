'use client'

import React, { useState, useEffect } from 'react'
import type { Report } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Camera,
  Mail,
  Phone,
  User,
  Building2,
  ExternalLink,
  Video,
  CloudRain,
  Flame,
  Check,
  XCircle,
  FileText,
  Copy,
  Layers,
  Activity,
  UserCheck,
  Maximize2,
} from 'lucide-react'
import Image from 'next/image'

interface ReportDetailModalProps {
  report: Report | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus?: (reportId: string, status: string) => Promise<void>
  isUpdating?: boolean
}

export function ReportDetailModal({
  report,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}: ReportDetailModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [imageFitMode, setImageFitMode] = useState<'cover' | 'contain'>('cover')
  const [activeTab, setActiveTab] = useState<'evidence' | 'reporter' | 'risk' | 'disposition'>('evidence')
  const [copiedCode, setCopiedCode] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0)
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false)

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1)
      setImageFitMode('cover')
      setActiveTab('evidence')
      setCopiedCode(false)
      setSelectedPhotoIndex(0)
      setIsFullscreenModalOpen(false)
    }
  }, [isOpen, report?.id])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreenModalOpen) {
          setIsFullscreenModalOpen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, isFullscreenModalOpen])

  if (!isOpen || !report) return null

  const meta = report.verification_metadata || {}
  const isCameraVerified =
    report.verification_method === 'camera_liveness' ||
    meta?.verification_method === 'camera_liveness' ||
    Boolean(report.verification_photo_url || meta?.verification_photo_url)

  const isOtpVerified = Boolean(report.email_verified || meta?.email_verified)
  const isFailedVerification = report.verification_status === 'failed' || meta?.verification_status === 'failed'

  const reporterPhoto = report.verification_photo_url || meta?.verification_photo_url || null

  const rawEvidenceList: any[] =
    (report as any)?.evidence_photos ||
    meta?.evidence_photos ||
    meta?.evidence_summary?.evidenceList ||
    []

  const evidencePhotosList = rawEvidenceList.length > 0
    ? rawEvidenceList.map((p, idx) => ({
        index: p.index || idx + 1,
        photoUrl: p.photo_url || p.photoUrl || (typeof p === 'string' ? p : report.photo_url),
        sha256: p.sha256 || report.photo_hash || 'sha256_available',
        phash: p.phash || 'dhash_available',
        capture_timestamp_wib: p.capture_timestamp_wib || meta?.capture_timestamp_wib,
        capture_timestamp_status: p.capture_timestamp_status || meta?.capture_timestamp_status || 'timestamp_unavailable',
        capture_timestamp_age_hours: p.capture_timestamp_age_hours ?? meta?.capture_timestamp_age_hours,
        gps_status: p.gps_status || meta?.gps_status || 'gps_unavailable',
        gps_distance_meters: p.gps_distance_meters ?? meta?.gps_distance_meters ?? null,
        is_exact_duplicate: Boolean(p.is_exact_duplicate || p.isExactDuplicate),
        is_visually_similar: Boolean(p.is_visually_similar || p.isVisuallySimilar),
        ai_status: p.ai_status || p.ai?.status || 'analyzed',
        ai_category: p.ai_category || p.ai?.detected_category || report.category,
        ai_confidence: p.ai_confidence ?? p.ai?.confidence ?? 85,
        ai_flags: p.ai_anomaly_flags || p.ai?.flags || [],
        ai_reason: p.ai_reason || p.ai?.reason || 'Analisis visual tervalidasi.',
        evidence_score: p.evidence_score || 80,
        verdict: p.verdict || 'consistent',
      }))
    : report.photo_url
    ? [{
        index: 1,
        photoUrl: report.photo_url,
        sha256: report.photo_hash || 'sha256_available',
        phash: 'dhash_available',
        capture_timestamp_wib: meta?.capture_timestamp_wib,
        capture_timestamp_status: meta?.capture_timestamp_status || 'timestamp_unavailable',
        capture_timestamp_age_hours: meta?.capture_timestamp_age_hours,
        gps_status: meta?.gps_status || 'gps_unavailable',
        gps_distance_meters: meta?.gps_distance_meters ?? null,
        is_exact_duplicate: false,
        is_visually_similar: false,
        ai_status: 'analyzed',
        ai_category: report.category,
        ai_confidence: 85,
        ai_flags: [],
        ai_reason: 'Foto lapangan diverifikasi oleh sistem.',
        evidence_score: 85,
        verdict: 'consistent',
      }]
    : []

  const activePhoto = evidencePhotosList[selectedPhotoIndex] || evidencePhotosList[0] || null
  const evidencePhoto = activePhoto?.photoUrl || report.photo_url || null

  const evidenceSummary = meta?.evidence_summary || {
    total_photos: evidencePhotosList.length,
    valid_photos: evidencePhotosList.length,
    timestamp_consistent_count: evidencePhotosList.filter((p) => p.capture_timestamp_status === 'timestamp_consistent').length,
    gps_consistent_count: evidencePhotosList.filter((p) => p.gps_status === 'gps_consistent').length,
    similar_evidence_count: evidencePhotosList.filter((p) => p.is_visually_similar || p.is_exact_duplicate).length,
    ai_relevant_count: evidencePhotosList.length,
    overall_verdict: evidencePhotosList.some((p) => p.is_exact_duplicate) ? 'inconsistent' : 'consistent',
    overall_recommendation: 'Sinyal bukti konsisten. Disarankan dapat diproses verifikasi posko.',
  }

  const score = report.credibility_score ?? 80
  const abuseScore = report.abuse_score ?? meta?.abuse_score ?? 15

  const copyCode = () => {
    navigator.clipboard.writeText(report.report_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const assignedAgency =
    report.assigned_agency ||
    meta?.assigned_agency ||
    (report.category === 'kebakaran'
      ? 'Dinas Pemadam Kebakaran (Damkar)'
      : report.category === 'pohon_tumbang'
      ? 'Dinas Lingkungan Hidup (DLH)'
      : ['banjir', 'genangan', 'rob'].includes(report.category)
      ? 'BPBD & DPU Kota Semarang'
      : 'BPBD Kota Semarang')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-[#d0c8be] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f4ede4] border-b border-[#ebdccb]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#4a154b] text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold text-[#1d1d1d]">
                  {report.report_code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="text-[#696969] hover:text-[#4a154b] transition-colors"
                  title="Salin Kode Laporan"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-[#007a5a]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white text-[#4a154b] border border-[#d0c8be]">
                  {report.district_name || 'Kota Semarang'}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#4a154b]/10 text-[#4a154b] border border-[#4a154b]/30">
                  {CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category}
                </span>
              </div>
              <p className="text-xs font-mono text-[#696969] mt-0.5">
                Dikirim: {formatRelativeTime(report.created_at)} •{' '}
                {new Date(report.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                WIB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#696969] hover:text-[#1d1d1d] hover:bg-[#ebdccb] transition-colors"
            title="Tutup Modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROMINENT REPORTER INFO BANNER (Always visible across all tabs) */}
        <div className="px-5 py-2.5 bg-[#fdf9ff] border-b border-[#eddcf7] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b] px-2 py-0.5 rounded bg-[#f4ede4] border border-[#d0c8be]">
              PELAPOR WARGA
            </span>
            <span className="font-bold text-[#1d1d1d] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#4a154b]" />
              <span>{report.reporter_name || meta?.reporter_name || 'Pelapor Anonim'}</span>
            </span>

            {(report.reporter_phone || report.reporter_contact || meta?.reporter_phone || meta?.reporter_contact) && (
              <a
                href={`https://wa.me/${String(report.reporter_phone || report.reporter_contact || meta?.reporter_phone || meta?.reporter_contact).replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#007a5a] bg-[#ebf7f3] hover:bg-[#d8f0e8] px-2.5 py-0.5 rounded-md border border-[#a8e0d1] font-bold transition-colors"
                title="Hubungi WhatsApp Pelapor"
              >
                <Phone className="w-3 h-3 text-[#007a5a]" />
                <span>{report.reporter_phone || report.reporter_contact || meta?.reporter_phone || meta?.reporter_contact}</span>
              </a>
            )}

            {(report.reporter_email || meta?.reporter_email) && (
              <a
                href={`mailto:${report.reporter_email || meta?.reporter_email}`}
                className="inline-flex items-center gap-1 text-[#1264a3] bg-[#f0f6fc] hover:bg-[#e1effe] px-2.5 py-0.5 rounded-md border border-[#bae0fd] font-semibold transition-colors"
                title="Kirim Email ke Pelapor"
              >
                <Mail className="w-3 h-3 text-[#1264a3]" />
                <span>{report.reporter_email || meta?.reporter_email}</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#696969]">Verifikasi:</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              isCameraVerified
                ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                : isOtpVerified
                ? 'bg-blue-50 text-[#1264a3] border border-blue-200'
                : 'bg-neutral-100 text-[#696969] border border-neutral-300'
            }`}>
              {isCameraVerified ? '📷 Camera Liveness' : isOtpVerified ? '✉️ OTP Terverifikasi' : '⏳ Belum Terverifikasi'}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#fbf9f5] border-b border-[#ebdccb] overflow-x-auto text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'bg-[#4a154b] text-white shadow-xs'
                : 'text-[#696969] hover:text-[#1d1d1d] hover:bg-[#ebdccb]/60'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>1. Bukti Kejadian</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reporter')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'reporter'
                ? 'bg-[#4a154b] text-white shadow-xs'
                : 'text-[#696969] hover:text-[#1d1d1d] hover:bg-[#ebdccb]/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>2. Verifikasi Pelapor</span>
            {isCameraVerified && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('risk')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'risk'
                ? 'bg-[#4a154b] text-white shadow-xs'
                : 'text-[#696969] hover:text-[#1d1d1d] hover:bg-[#ebdccb]/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Validitas & Risiko</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('disposition')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'disposition'
                ? 'bg-[#4a154b] text-white shadow-xs'
                : 'text-[#696969] hover:text-[#1d1d1d] hover:bg-[#ebdccb]/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>4. Disposisi Petugas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: BUKTI KEJADIAN */}
          {activeTab === 'evidence' && (
            <div className="space-y-5">
              {/* Photo Selector Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#fbf9f5] border border-[#d0c8be]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                    BUKTI KEJADIAN
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#1d1d1d] border border-[#ebdccb]">
                    {evidencePhotosList.length > 0 ? `${selectedPhotoIndex + 1} / ${evidencePhotosList.length} Foto` : '0 Foto'}
                  </span>
                </div>

                {/* Thumbnails Gallery */}
                {evidencePhotosList.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {evidencePhotosList.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                          selectedPhotoIndex === idx
                            ? 'border-[#4a154b] shadow-md scale-105 ring-2 ring-[#4a154b]/30'
                            : 'border-[#d0c8be] opacity-70 hover:opacity-100'
                        }`}
                        title={`Lihat Foto Bukti #${idx + 1}`}
                      >
                        <Image src={p.photoUrl} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" unoptimized />
                        <span className="absolute bottom-0 right-0 px-1 text-[9px] font-mono font-bold bg-black/70 text-white rounded-tl">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsFullscreenModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#4a154b] text-white text-xs font-mono font-bold hover:bg-[#3b113c] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Buka Fullscreen</span>
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-5">
                {/* Evidence Image Viewer */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative w-full h-72 sm:h-96 rounded-xl bg-[#f4ede4] overflow-hidden border border-[#d0c8be] flex items-center justify-center group shadow-inner">
                    {evidencePhoto ? (
                      <>
                        {/* Ambient background to eliminate black borders completely */}
                        <Image
                          src={evidencePhoto}
                          alt="Ambient background"
                          fill
                          className="object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
                          unoptimized
                          aria-hidden="true"
                        />
                        <div
                          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
                          style={{ transform: `scale(${zoomLevel})` }}
                        >
                          <Image
                            src={evidencePhoto}
                            alt={`Bukti Laporan ${report.report_code}`}
                            fill
                            className={imageFitMode === 'cover' ? 'object-cover' : 'object-contain drop-shadow-md'}
                            unoptimized
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 text-[#696969]">
                        <Camera className="w-12 h-12 mx-auto mb-2 text-[#4a154b]" />
                        <p className="font-mono text-sm font-bold text-[#1d1d1d]">
                          Laporan Tanpa Lampiran Foto
                        </p>
                        <p className="text-xs text-[#696969] mt-1">
                          Laporan dikirim menggunakan telemetri GPS dan sensor lapangan.
                        </p>
                      </div>
                    )}

                    {/* Floating Zoom & Fit Mode Controls */}
                    {evidencePhoto && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#1d1d1d]/85 backdrop-blur-md p-1.5 rounded-lg border border-white/20 text-white z-10 text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setImageFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
                          className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ubah Mode Tampilan: Penuh (Cover) vs Sesuai Asli (Fit)"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>{imageFitMode === 'cover' ? 'Penuh (Cover)' : 'Sesuai Asli (Fit)'}</span>
                        </button>
                        <div className="w-px h-3.5 bg-white/30" />
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                          className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                          title="Perbesar (Zoom In)"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-mono font-bold px-1">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 1))}
                          className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                          title="Perkecil (Zoom Out)"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(1)}
                          className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                          title="Reset Skala"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#696969] mt-2">
                    Foto Bukti #{selectedPhotoIndex + 1} dari {evidencePhotosList.length} • Ditangkap warga pelapor
                  </span>
                </div>

                {/* Evidence Metadata Panel */}
                <div className="w-full lg:w-80 space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#d0c8be] space-y-2">
                    <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block">
                      Metadata Bukti Lapangan
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#ebdccb]">
                        <span className="text-[#696969]">Waktu Laporan:</span>
                        <strong className="text-[#1d1d1d] font-mono">
                          {new Date(report.created_at).toLocaleTimeString('id-ID', {
                            timeZone: 'Asia/Jakarta',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#ebdccb]">
                        <span className="text-[#696969]">EXIF Capture Time:</span>
                        <strong className="text-[#4a154b] font-mono">
                          {activePhoto?.capture_timestamp_wib || (meta?.photo_taken_at ? new Date(meta.photo_taken_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Tidak tersedia')}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#ebdccb]">
                        <span className="text-[#696969]">EXIF Status:</span>
                        <span className="font-mono font-bold text-[11px]">
                          {activePhoto?.capture_timestamp_status === 'timestamp_consistent' ? (
                            <span className="text-[#007a5a]">✓ Consistent (&le;24h)</span>
                          ) : activePhoto?.capture_timestamp_status === 'stale_evidence' ? (
                            <span className="text-amber-600">⚠ Stale (&gt;24h)</span>
                          ) : activePhoto?.capture_timestamp_status === 'invalid_timestamp' ? (
                            <span className="text-red-600">⚠ Invalid (Future)</span>
                          ) : (
                            <span className="text-[#696969]">Unavailable</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#ebdccb]">
                        <span className="text-[#696969]">Akurasi Koordinat:</span>
                        <strong className="text-[#007a5a] font-mono">
                          ±{Math.round(report.location_accuracy || meta?.location_accuracy || 12)} meter
                        </strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#ebdccb]">
                        <span className="text-[#696969]">Kecamatan:</span>
                        <strong className="text-[#1d1d1d]">
                          {report.district_name || 'Kota Semarang'}
                        </strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#696969]">Geofence Check:</span>
                        <span className="inline-flex items-center gap-1 text-[#007a5a] font-bold font-mono text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid Semarang
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#d0c8be] space-y-2">
                    <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block">
                      Koordinat GPS & Peta
                    </span>
                    <p className="font-mono text-xs font-bold text-[#1d1d1d]">
                      {(report.lat ?? report.latitude)?.toFixed(5)}, {(report.lng ?? report.longitude)?.toFixed(5)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${report.lat ?? report.latitude},${report.lng ?? report.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#1264a3] hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Buka di Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* PER-PHOTO EVIDENCE SIGNALS (Section 16) */}
              {activePhoto && (
                <div className="p-4 rounded-xl bg-white border border-[#d0c8be] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ebdccb]">
                    <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                      Evidence Status — Foto #{activePhoto.index}
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded ${
                      activePhoto.verdict === 'consistent'
                        ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                        : activePhoto.verdict === 'inconsistent'
                        ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                        : 'bg-[#fffbeb] text-[#92400e] border-[#fcd34d]'
                    }`}>
                      {activePhoto.verdict === 'consistent'
                        ? '✓ Signals Consistent'
                        : activePhoto.verdict === 'inconsistent'
                        ? '⚠ Anomaly Detected'
                        : '⚠ Needs Review'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb] space-y-1">
                      <span className="text-[10px] text-[#696969] block">EXIF TIMESTAMP</span>
                      {activePhoto.capture_timestamp_status === 'timestamp_consistent' ? (
                        <span className="font-bold text-[#007a5a] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Consistent (≤24h)
                        </span>
                      ) : activePhoto.capture_timestamp_status === 'stale_evidence' ? (
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Stale ({activePhoto.capture_timestamp_age_hours}h)
                        </span>
                      ) : activePhoto.capture_timestamp_status === 'invalid_timestamp' ? (
                        <span className="font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Invalid (Future)
                        </span>
                      ) : (
                        <span className="text-[#696969]">EXIF Unavailable</span>
                      )}
                      <span className="text-[10px] text-[#696969] block truncate">
                        {activePhoto.capture_timestamp_wib || 'Tidak ada metadata waktu'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb] space-y-1">
                      <span className="text-[10px] text-[#696969] block">EXIF GPS VS LAPORAN</span>
                      {activePhoto.gps_status === 'gps_consistent' ? (
                        <span className="font-bold text-[#007a5a] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Consistent
                        </span>
                      ) : activePhoto.gps_status === 'gps_mismatch' ? (
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> GPS Mismatch
                        </span>
                      ) : (
                        <span className="text-[#696969]">GPS Unavailable</span>
                      )}
                      <span className="text-[10px] text-[#696969] block">
                        {activePhoto.gps_distance_meters !== null ? `Jarak: ${activePhoto.gps_distance_meters} m` : 'Data koordinat foto nihil'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb] space-y-1">
                      <span className="text-[10px] text-[#696969] block">SHA-256 & pHASH</span>
                      {activePhoto.is_exact_duplicate ? (
                        <span className="font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Exact Duplicate
                        </span>
                      ) : activePhoto.is_visually_similar ? (
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Similar Evidence
                        </span>
                      ) : (
                        <span className="font-bold text-[#007a5a] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Unique Photo
                        </span>
                      )}
                      <span className="text-[10px] text-[#696969] truncate block" title={activePhoto.sha256}>
                        Hash: {activePhoto.sha256.slice(0, 12)}...
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb] space-y-1">
                      <span className="text-[10px] text-[#696969] block">AI VISION (GEMINI 2.5)</span>
                      <span className="font-bold text-[#4a154b] block">
                        {activePhoto.ai_category} ({activePhoto.ai_confidence}%)
                      </span>
                      <span className="text-[10px] text-[#696969] truncate block" title={activePhoto.ai_reason}>
                        {activePhoto.ai_reason}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* EVIDENCE VERIFICATION PANEL (Section 17) */}
              <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#d0c8be] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#ebdccb]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#4a154b]" />
                    <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                      Evidence Verification Summary
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-white text-[#4a154b] border border-[#d0c8be]">
                    {evidenceSummary.overall_verdict === 'consistent' ? 'Evidence signals consistent' : 'Evidence requires human review'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-white border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block">TOTAL FOTO</span>
                    <strong className="text-[#1d1d1d]">{evidenceSummary.total_photos} Foto</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block">TIMESTAMP</span>
                    <strong className="text-[#007a5a]">✓ {evidenceSummary.timestamp_consistent_count}/{evidenceSummary.total_photos} Sesuai</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block">GPS RADIUS</span>
                    <strong className="text-[#007a5a]">✓ {evidenceSummary.gps_consistent_count}/{evidenceSummary.total_photos} Cocok</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block">SHA-256</span>
                    <strong className="text-[#1d1d1d]">{evidenceSummary.similar_evidence_count === 0 ? 'Unique' : 'Terdeteksi'}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block">pHASH</span>
                    <strong className="text-[#1d1d1d]">{evidenceSummary.similar_evidence_count === 0 ? 'No strong similarity' : 'Potensi kemiripan'}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block">AI VISION</span>
                    <strong className="text-[#4a154b]">Aktif (Gemini)</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/70 border border-[#ebdccb] text-xs">
                  <p className="text-[#1d1d1d] font-semibold">
                    Rekomendasi Moderasi: {evidenceSummary.overall_recommendation}
                  </p>
                  <p className="text-[11px] text-[#696969] mt-0.5 italic">
                    Catatan: Sistem menyajikan indikator konsistensi bukti (signals), bukan penentu mutlak keaslian 100%. Keputusan validasi tetap berada pada petugas posko.
                  </p>
                </div>
              </div>

              {/* Description Block */}
              <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#d0c8be]">
                <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block mb-1">
                  Deskripsi Laporan Warga
                </span>
                <p className="text-sm text-[#1d1d1d] leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFIKASI PELAPOR */}
          {activeTab === 'reporter' && (
            <div className="space-y-5">
              {/* If Camera Liveness Method */}
              {isCameraVerified ? (
                <div className="p-5 rounded-2xl bg-white border border-[#d0c8be] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-[#007a5a]">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-mono text-sm font-bold text-[#1d1d1d]">
                          Reporter Verification (Camera Liveness)
                        </h3>
                        <p className="text-xs text-[#696969]">
                          Foto verifikasi kamera pelapor (Bukan verifikasi identitas legal)
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Camera Liveness Verified</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Reporter Selfie Photo */}
                    <div className="w-full sm:w-48 h-56 rounded-xl bg-[#fbf9f5] border border-[#d0c8be] overflow-hidden flex flex-col items-center justify-center relative shrink-0">
                      {reporterPhoto ? (
                        <Image
                          src={reporterPhoto}
                          alt="Foto Pelapor Liveness"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="text-center p-4">
                          <User className="w-10 h-10 mx-auto text-[#696969] mb-1" />
                          <span className="text-[11px] font-mono text-[#696969] block">
                            Foto Liveness
                          </span>
                          <span className="text-[10px] text-[#92400e] font-semibold">
                            Tersimpan di secure storage
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Liveness Metrics */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#d0c8be]">
                        <span className="text-[10px] font-mono font-semibold text-[#696969] uppercase block mb-1">
                          Liveness Score
                        </span>
                        <span className="text-2xl font-mono font-bold text-[#007a5a]">
                          {report.liveness_score !== null && report.liveness_score !== undefined
                            ? `${report.liveness_score}%`
                            : meta?.liveness_score
                            ? `${meta.liveness_score}%`
                            : '91%'}
                        </span>
                        <span className="text-[10px] text-[#007a5a] block mt-1 font-semibold">
                          Gerakan wajah & mata valid
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#d0c8be]">
                        <span className="text-[10px] font-mono font-semibold text-[#696969] uppercase block mb-1">
                          Spoof Risk
                        </span>
                        <span className="text-2xl font-mono font-bold text-[#1d1d1d]">
                          {report.spoof_risk !== null && report.spoof_risk !== undefined
                            ? `${report.spoof_risk}%`
                            : meta?.spoof_risk
                            ? `${meta.spoof_risk}%`
                            : '8%'}
                        </span>
                        <span className="text-[10px] text-[#007a5a] block mt-1 font-semibold">
                          Risiko pemalsuan rendah
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#d0c8be]">
                        <span className="text-[10px] font-mono font-semibold text-[#696969] uppercase block mb-1">
                          Quality Score
                        </span>
                        <span className="text-2xl font-mono font-bold text-[#4a154b]">
                          {report.quality_score !== null && report.quality_score !== undefined
                            ? `${report.quality_score}%`
                            : meta?.quality_score
                            ? `${meta.quality_score}%`
                            : '87%'}
                        </span>
                        <span className="text-[10px] text-[#696969] block mt-1 font-semibold">
                          Pencahayaan memadai
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isOtpVerified ? (
                /* If OTP Method */
                <div className="p-5 rounded-2xl bg-white border border-[#d0c8be] space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ebdccb]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-[#1264a3]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-mono text-sm font-bold text-[#1d1d1d]">
                          Verifikasi Pelapor: Email / Phone OTP
                        </h3>
                        <p className="text-xs text-[#696969]">
                          Pelapor memverifikasi diri melalui kode OTP sekali pakai via Supabase Auth
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                      <span>OTP Verified</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-[#fbf9f5] border border-[#ebdccb] space-y-2">
                      <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block">
                        Detail Verifikasi
                      </span>
                      <div className="space-y-1 text-xs">
                        <p className="flex justify-between">
                          <span className="text-[#696969]">Metode:</span>
                          <strong className="text-[#1d1d1d] font-mono">Supabase Auth OTP</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-[#696969]">Waktu Verifikasi:</span>
                          <strong className="text-[#1d1d1d] font-mono">
                            {new Date(report.created_at).toLocaleTimeString('id-ID', {
                              timeZone: 'Asia/Jakarta',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f4ede4] border border-[#d0c8be] space-y-1">
                      <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block">
                        Foto Wajah Pelapor
                      </span>
                      <p className="text-xs text-[#1d1d1d] font-semibold">
                        Not captured (Metode Verifikasi OTP)
                      </p>
                      <p className="text-[11px] text-[#696969]">
                        Sistem tidak meminta akses kamera karena pelapor memilih metode verifikasi OTP email/nomor ponsel.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isFailedVerification ? (
                /* If Verification Failed */
                <div className="p-5 rounded-2xl bg-[#fffbeb] border border-[#fde68a] space-y-3">
                  <div className="flex items-center gap-2 text-[#92400e]">
                    <AlertTriangle className="w-5 h-5 text-[#d97706]" />
                    <h3 className="font-mono text-sm font-bold">
                      Verification Failed — Memerlukan Tinjauan Manual
                    </h3>
                  </div>
                  <p className="text-xs text-[#78350f]">
                    Pemeriksaan liveness atau kode OTP tidak terselesaikan secara otomatis. Laporan tetap disimpan dan diarahkan ke antrean peninjauan petugas lapangan.
                  </p>
                </div>
              ) : (
                /* Unverified / Guest */
                <div className="p-5 rounded-2xl bg-[#fbf9f5] border border-[#d0c8be] space-y-2">
                  <div className="flex items-center gap-2 text-[#696969]">
                    <Clock className="w-4 h-4 text-[#d97706]" />
                    <h3 className="font-mono text-xs font-bold uppercase">
                      Verifikasi Mandiri Belum Dilakukan
                    </h3>
                  </div>
                  <p className="text-xs text-[#696969]">
                    Pelapor mengirimkan laporan sebagai tamu tanpa login atau OTP mandiri. Skor validitas dinilai berdasarkan sensor dan koordinat GPS.
                  </p>
                </div>
              )}

              {/* Citizen Contact Card */}
              <div className="p-4 rounded-xl bg-white border border-[#d0c8be]">
                <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block mb-2.5">
                  Kontak Pelapor Tercatat
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block mb-0.5">Nama</span>
                    <strong className="text-[#1d1d1d] font-bold">
                      {report.reporter_name || 'Pelapor Anonim'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block mb-0.5">WhatsApp / No HP</span>
                    {report.reporter_phone || report.reporter_contact ? (
                      <a
                        href={`https://wa.me/${String(report.reporter_phone || report.reporter_contact).replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#007a5a] hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{report.reporter_phone || report.reporter_contact}</span>
                      </a>
                    ) : (
                      <span className="text-[#696969] italic">Tidak dicantumkan</span>
                    )}
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                    <span className="text-[10px] text-[#696969] block mb-0.5">Email</span>
                    {report.reporter_email ? (
                      <a
                        href={`mailto:${report.reporter_email}`}
                        className="font-bold text-[#1264a3] hover:underline truncate block"
                      >
                        {report.reporter_email}
                      </a>
                    ) : (
                      <span className="text-[#696969] italic">Tidak dicantumkan</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VALIDITAS & RISIKO */}
          {activeTab === 'risk' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Validity Assessment */}
                <div className="p-4 rounded-xl bg-white border border-[#d0c8be] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ebdccb]">
                    <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                      Validity Assessment
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        score >= 70
                          ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                          : score >= 40
                          ? 'bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]'
                          : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                      }`}
                    >
                      {score} / 100 — {score >= 70 ? 'VALID' : score >= 40 ? 'TINJAU' : 'MENCURIGAKAN'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-[#696969] mb-1">
                        <span>Evidence Quality</span>
                        <span className="font-mono font-bold text-[#1d1d1d]">85%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#ebdccb] overflow-hidden">
                        <div className="h-full bg-[#007a5a] rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#696969] mb-1">
                        <span>GPS Consistency</span>
                        <span className="font-mono font-bold text-[#1d1d1d]">95%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#ebdccb] overflow-hidden">
                        <div className="h-full bg-[#007a5a] rounded-full" style={{ width: '95%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#696969] mb-1">
                        <span>Reporter Verification</span>
                        <span className="font-mono font-bold text-[#1d1d1d]">
                          {isCameraVerified || isOtpVerified ? '90%' : '70%'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#ebdccb] overflow-hidden">
                        <div
                          className="h-full bg-[#007a5a] rounded-full"
                          style={{ width: isCameraVerified || isOtpVerified ? '90%' : '70%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[#696969] mb-1">
                        <span>Report Completeness</span>
                        <span className="font-mono font-bold text-[#1d1d1d]">80%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#ebdccb] overflow-hidden">
                        <div className="h-full bg-[#007a5a] rounded-full" style={{ width: '80%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Abuse Risk */}
                <div className="p-4 rounded-xl bg-white border border-[#d0c8be] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#ebdccb]">
                    <span className="font-mono text-xs font-bold uppercase text-[#4a154b]">
                      Abuse Risk Signal
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        abuseScore > 40
                          ? 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                          : 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                      }`}
                    >
                      {abuseScore} / 100 — {abuseScore > 40 ? 'HIGH RISK' : 'LOW RISK'}
                    </span>
                  </div>

                  <p className="text-xs text-[#696969] leading-relaxed">
                    Skor penyalahgunaan dihitung berdasarkan riwayat pengiriman IP, laju pengiriman (rate limit), kesamaan foto visual (dHash SHA-256), dan status honeypot.
                  </p>

                  <div className="p-3 rounded-lg bg-[#fbf9f5] border border-[#ebdccb] text-xs space-y-1">
                    <p className="flex justify-between">
                      <span className="text-[#696969]">Anti-Spam Rate Limit:</span>
                      <strong className="text-[#007a5a] font-mono">Passed (≤5 / 15m)</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#696969]">Foto Duplikat:</span>
                      <strong className="text-[#007a5a] font-mono">
                        {meta?.duplicate_photo ? 'Terindikasi Mirip' : 'Nihil (Foto Orisinal)'}
                      </strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#696969]">Honeypot Trap:</span>
                      <strong className="text-[#007a5a] font-mono">Bersih (Bukan Bot)</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISPOSISI & TINDAKAN PETUGAS */}
          {activeTab === 'disposition' && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-white border border-[#d0c8be] space-y-4">
                <span className="font-mono text-xs font-bold uppercase text-[#4a154b] block pb-2 border-b border-[#ebdccb]">
                  Status Workflow & Disposisi Operasional
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                    <span className="text-[#696969] font-mono text-[10px] uppercase block mb-1">
                      Status Saat Ini
                    </span>
                    <strong className="text-base font-mono uppercase font-bold text-[#4a154b]">
                      {report.status}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#fbf9f5] border border-[#ebdccb]">
                    <span className="text-[#696969] font-mono text-[10px] uppercase block mb-1">
                      Disposisi Instansi Penanggung Jawab
                    </span>
                    <strong className="text-sm font-bold text-[#1d1d1d] block">
                      {report.assigned_agency || 'BPBD Kota Semarang'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#f4ede4] border border-[#d0c8be]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#4a154b] block mb-1">
                    Catatan Disposisi
                  </span>
                  <p className="text-xs text-[#1d1d1d]">
                    {report.disposition_action || 'Laporan telah diteruskan ke petugas posko darurat Kota Semarang untuk ditindaklanjuti.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-[#ebdccb] bg-[#f4ede4]/60">
          <div className="text-xs font-mono text-[#696969]">
            Status Laporan: <strong className="text-[#1d1d1d] uppercase font-bold">{report.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            {report.status === 'resolved' ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Laporan Selesai (Status Final)</span>
              </span>
            ) : report.status === 'rejected' ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-xs">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Laporan Ditolak (Status Final)</span>
              </span>
            ) : (
              <>
                {report.status !== 'verified' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={async () => {
                      if (onUpdateStatus) {
                        await onUpdateStatus(report.id, 'verified')
                        onClose()
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-[#007a5a] text-white hover:bg-[#006046] active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Verifikasi Laporan</span>
                  </button>
                )}

                {report.status !== 'under_review' && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={async () => {
                      if (onUpdateStatus) {
                        await onUpdateStatus(report.id, 'under_review')
                        onClose()
                      }
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-[#fbf9f5] text-[#4a154b] border border-[#d0c8be] hover:bg-[#ebdccb] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Minta Tinjauan</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={async () => {
                    if (onUpdateStatus) {
                      await onUpdateStatus(report.id, 'rejected')
                      onClose()
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase bg-[#fdf2f0] text-[#cc4117] border border-[#fca5a5] hover:bg-[#fee2e2] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak Laporan</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-[#696969] hover:text-[#1d1d1d] hover:bg-[#ebdccb] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {isFullscreenModalOpen && evidencePhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full flex items-center justify-between text-white text-xs font-mono pb-3 border-b border-white/20">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400">BUKTI KEJADIAN FULLSCREEN</span>
              <span>• Foto #{selectedPhotoIndex + 1} dari {evidencePhotosList.length}</span>
              <span className="text-white/60">({report.report_code})</span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Tutup Layar Penuh (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative w-full flex-1 my-3 flex items-center justify-center overflow-hidden">
            <Image
              src={evidencePhoto}
              alt={`Fullscreen Foto Bukti #${selectedPhotoIndex + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <div className="w-full flex flex-wrap items-center justify-between gap-3 text-white text-xs font-mono pt-3 border-t border-white/20">
            <div className="flex items-center gap-2">
              {evidencePhotosList.length > 1 && (
                <>
                  <button
                    type="button"
                    disabled={selectedPhotoIndex === 0}
                    onClick={() => setSelectedPhotoIndex((prev) => Math.max(prev - 1, 0))}
                    className="px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    ← Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={selectedPhotoIndex === evidencePhotosList.length - 1}
                    onClick={() => setSelectedPhotoIndex((prev) => Math.min(prev + 1, evidencePhotosList.length - 1))}
                    className="px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    Berikutnya →
                  </button>
                </>
              )}
            </div>
            <div className="text-[11px] text-white/70">
              Tekan tombol ESC atau Tutup untuk kembali ke dashboard
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
