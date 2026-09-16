'use client'

import type { Report } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS, STATUS_LABELS } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import {
  X,
  MapPin,
  Clock,
  User,
  ExternalLink,
  PhoneCall,
  Flame,
  Droplets,
  Trees,
  Mountain,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Radio,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import Image from 'next/image'
import { WhyDidThisHappenCard } from '@/components/education/WhyDidThisHappenCard'
import { IncidentWeatherCorrelationCard } from '@/components/weather/IncidentWeatherCorrelationCard'

interface ReportDetailPanelProps {
  report: Report | null
  onClose: () => void
}

export function ReportDetailPanel({ report, onClose }: ReportDetailPanelProps) {
  if (!report) return null

  const isFire = report.category === 'kebakaran'
  const isTree = report.category === 'pohon_tumbang'
  const isLandslide = report.category === 'longsor'
  const isFlood = ['banjir', 'genangan', 'rob', 'drainase_tersumbat'].includes(report.category)
  const isSimulation = Boolean(report.is_simulation || report.is_demo)

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

  const incDetails = (report.incident_details as any) || null
  const fireDetails = incDetails?.incident_type === 'kebakaran' || incDetails?.fire_condition ? incDetails : incDetails?.fire
  const floodDetails = incDetails?.incident_type === 'banjir' || incDetails?.incident_type === 'genangan' || incDetails?.water_height ? incDetails : incDetails?.flood
  const treeDetails = incDetails?.incident_type === 'pohon_tumbang' || incDetails?.tree_size ? incDetails : incDetails?.tree
  const landslideDetails = incDetails?.incident_type === 'longsor' || incDetails?.material_condition ? incDetails : incDetails?.landslide
  const meta = report.verification_metadata

  return (
    <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] max-w-full bg-surface-container-low/95 backdrop-blur-xl border-l border-outline-variant/30 flex flex-col z-30 font-body shadow-2xl animate-in slide-in-from-right duration-200">
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
            {isSimulation && (
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Simulasi
              </span>
            )}
          </div>
          <h2 className="font-headline font-bold text-base text-on-surface truncate flex items-center gap-1.5">
            {isFire && <Flame className="w-4 h-4 text-red-400 shrink-0" />}
            {isTree && <Trees className="w-4 h-4 text-emerald-400 shrink-0" />}
            {isLandslide && <Mountain className="w-4 h-4 text-amber-400 shrink-0" />}
            {isFlood && <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{report.title || categoryLabel}</span>
          </h2>
          <div className="text-xs text-on-surface-variant mt-0.5">
            Kategori: <strong className="text-on-surface">{categoryLabel}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${urgencyColor}`}>
              {urgencyLabel}
            </span>
            <span className="text-[9px] font-mono text-on-surface-variant/80">
              Klasifikasi Awal
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup panel inspeksi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Simulation Alert Banner */}
        {isSimulation && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Mode Uji Coba / Simulasi Terdeteksi</strong>
              <span>Laporan ini ditandai sebagai data pengujian, tidak masuk ke statistik operasional nyata dan tidak memicu pergerakan tim regu lapangan.</span>
            </div>
          </div>
        )}

        {/* Possible Duplicate Banner if detected */}
        {meta?.possible_duplicate && (
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 flex items-start gap-2 text-xs">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Indikasi Klaster Kejadian Serupa</strong>
              <span>{meta.duplicate_warning || 'Terdeteksi laporan kejadian serupa dalam jarak dan waktu berdekatan.'}</span>
            </div>
          </div>
        )}

        {/* Anti-Panic Verification Status Banner */}
        {report.status === 'verified' ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-start gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Status: Kejadian Terverifikasi</strong>
              <span>Informasi telah dikonfirmasi valid berdasarkan silang bukti visual dan parameter telemetri lapangan.</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface-variant flex items-start gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-on-surface">Status: Dalam Peninjauan Operator Posko</strong>
              <span>Laporan warga sedang dalam proses verifikasi. Informasi disajikan untuk kehati-hatian awal tanpa menggantikan instruksi resmi petugas.</span>
            </div>
          </div>
        )}

        {/* Photo if exists */}
        {report.photo_url ? (
          <div className="relative h-48 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30">
            <Image
              src={report.photo_url}
              alt="Bukti foto laporan"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-surface-container-highest/80 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-on-surface flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-secondary" />
              Bukti Lapangan Terverifikasi
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-surface-container border border-dashed border-outline-variant/40 text-center text-on-surface-variant font-mono text-[11px]">
            Tidak ada foto bukti terlampir (No evidence attached)
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

        {/* Dynamic Telemetry Parameter Section */}
        {isFire ? (
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 block">
              Parameter Rincian Kebakaran
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Kondisi Kejadian</span>
                <span className="font-mono text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {fireDetails?.fire_condition || 'Api/Asap Terlihat'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Subkategori Lokasi</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {fireDetails?.location_subtype || 'Bangunan / Permukiman'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Intensitas Asap</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {fireDetails?.smoke_intensity || 'Terlihat di Lokasi'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Potensi Korban</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {fireDetails?.casualty_potential || 'Tidak ada laporan'}
                </span>
              </div>
            </div>

            {fireDetails?.additional_hazards && fireDetails.additional_hazards.length > 0 && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25">
                <span className="text-[10px] font-mono font-bold uppercase text-red-400 block mb-1">
                  Bahaya Tambahan di Lokasi
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(fireDetails.additional_hazards as string[]).map((hazard: string, idx: number) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-200 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                      <span>{hazard}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : isTree ? (
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
              Parameter Rincian Pohon Tumbang
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Ukuran Pohon</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {treeDetails?.tree_size || 'Terdampak'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Penutupan Jalan</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {treeDetails?.road_blocked || 'Tercatat di Lokasi'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1 col-span-2">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Kabel Listrik / PLN</span>
                <span className="font-mono text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {treeDetails?.electricity_impact || 'Status kabel terpantau'}
                </span>
              </div>
            </div>
          </div>
        ) : isLandslide ? (
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
              Parameter Rincian Tanah Longsor
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Material Longsor</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {landslideDetails?.landslide_material || 'Tanah/Bebatuan'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase">Akses Jalan</span>
                <span className="font-mono text-xs font-bold text-on-surface">
                  {landslideDetails?.road_blocked || 'Tercatat di Lokasi'}
                </span>
              </div>
            </div>
          </div>
        ) : (
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
                {report.water_height_cm ? `${report.water_height_cm} cm` : (floodDetails?.water_height || 'Tercatat di Lokasi')}
              </span>
            </div>
          </div>
        )}

        {/* Spatial & Provenance Metadata */}
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

        {/* Incident Weather Correlation */}
        <IncidentWeatherCorrelationCard
          latitude={reportLat}
          longitude={reportLng}
          reportCreatedAt={report.created_at}
          districtName={report.district_name || undefined}
        />

        {/* Education & Resilience Context */}
        <WhyDidThisHappenCard
          category={report.category}
          latitude={reportLat}
          longitude={reportLng}
          locationName={report.district_name ? `Kec. ${report.district_name}` : 'Kawasan Ini'}
        />

        {/* Direct Action Dispatch Triggers */}
        <div className="flex flex-col gap-2 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {isFire ? (
            <a
              href="tel:113"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs font-bold uppercase transition-colors shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Hubungi Pemadam Kebakaran (Damkar 113 / 112)
            </a>
          ) : (
            <a
              href="tel:112"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-error-container/40 border border-error/50 text-error hover:bg-error-container font-mono text-xs font-bold uppercase transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Eskalasi Cepat ke BPBD 112
            </a>
          )}
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
