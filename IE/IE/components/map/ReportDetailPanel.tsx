'use client'

import type { Report } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS, STATUS_LABELS } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { X, MapPin, Clock, User, ChevronRight, ExternalLink, PhoneCall, AlertCircle, Droplets } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface ReportDetailPanelProps {
  report: Report | null
  onClose: () => void
}

const STATUS_ORDER: Record<string, number> = {
  submitted: 0,
  under_review: 1,
  verified: 2,
  in_progress: 3,
  resolved: 4,
  rejected: -1,
  duplicate: -1,
}

export function ReportDetailPanel({ report, onClose }: ReportDetailPanelProps) {
  if (!report) return null

  const categoryLabel = CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category
  const urgencyLabel = URGENCY_LABELS[report.urgency as keyof typeof URGENCY_LABELS] || report.urgency
  const statusLabel = STATUS_LABELS[report.status as keyof typeof STATUS_LABELS] || report.status

  const urgencyColor =
    report.urgency === 'kritis'
      ? 'text-error bg-error/10 border-error/30'
      : report.urgency === 'tinggi'
      ? 'text-tertiary bg-tertiary/10 border-tertiary/30'
      : report.urgency === 'sedang'
      ? 'text-primary bg-primary/10 border-primary/30'
      : 'text-secondary bg-secondary/10 border-secondary/30'

  const reportLat = report.latitude ?? report.lat ?? -6.9932
  const reportLng = report.longitude ?? report.lng ?? 110.4203

  return (
    <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] max-w-full bg-surface-container-low/95 backdrop-blur-xl border-l border-outline-variant/30 flex flex-col z-30 font-body shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start justify-between p-4 sm:p-5 border-b border-outline-variant/30 bg-surface-container shrink-0">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
              {report.report_code || 'SMG-ALERT'}
            </span>
            <span className="text-[10px] font-mono text-on-surface-variant">
              • ID-{report.id.substring(0, 6)}
            </span>
          </div>
          <h2 className="font-headline font-bold text-base text-on-surface truncate">
            {report.title || categoryLabel}
          </h2>
          <div className="text-xs text-on-surface-variant mt-0.5">
            Kategori: {categoryLabel}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${urgencyColor}`}>
            {urgencyLabel}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            aria-label="Tutup panel inspeksi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Photo if exists */}
        {report.photo_url && (
          <div className="relative h-48 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30">
            <Image
              src={report.photo_url}
              alt="Bukti foto laporan"
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Description Box */}
        <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary block mb-1.5">
            Deskripsi Situasi Lapangan
          </span>
          <p className="text-xs text-on-surface leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* Telemetry Parameter Badges */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">Status Respon</span>
            <span className="font-mono text-xs font-bold text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              {statusLabel}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">Tinggi Genangan</span>
            <span className="font-mono text-xs font-bold text-on-surface flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-primary" />
              {report.water_height_cm ? `${report.water_height_cm} cm` : 'Tercatat di Lokasi'}
            </span>
          </div>
        </div>

        {/* Spatial & Time Metadata */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-2.5 text-xs text-on-surface-variant">
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-on-surface font-semibold block">
                {report.district_name ? `Kecamatan ${report.district_name}` : 'Wilayah Kota Semarang'}
              </span>
              <span className="text-[11px] text-on-surface-variant block">
                {report.address || 'Titik koordinat terpetakan'}
              </span>
              <span className="font-mono text-[10px] text-primary/80">
                Lat: {reportLat.toFixed(5)}, Lng: {reportLng.toFixed(5)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-outline-variant/20">
            <Clock className="h-4 w-4 text-on-surface-variant shrink-0" />
            <span>
              Dilaporkan {formatRelativeTime(report.created_at)} ({formatDate(report.created_at)})
            </span>
          </div>

          <div className="flex items-center gap-2.5 pt-2 border-t border-outline-variant/20">
            <User className="h-4 w-4 text-on-surface-variant shrink-0" />
            <span>Pelapor: {report.reporter_name || 'Warga (Anonim Aman)'}</span>
          </div>
        </div>

        {/* Direct Action Dispatch Triggers */}
        <div className="flex flex-col gap-2 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <a
            href="tel:112"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-error-container/40 border border-error/50 text-error hover:bg-error-container font-mono text-xs font-bold uppercase transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Eskalasi Cepat ke BPBD 112
          </a>
          <a
            href={`https://www.google.com/maps?q=${reportLat},${reportLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface font-mono text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka di Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}
