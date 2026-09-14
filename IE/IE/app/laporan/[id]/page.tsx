import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Report } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS, STATUS_LABELS } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, MapPin, Clock, User, AlertCircle, Bot, ShieldCheck, Camera } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import EvidenceBundlePanel from '@/components/cctv/EvidenceBundlePanel'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_STEPS = [
  { key: 'submitted', label: 'Terkirim ke EOC' },
  { key: 'under_review', label: 'Ditinjau Verifikator' },
  { key: 'verified', label: 'Tervalidasi Spasial' },
  { key: 'in_progress', label: 'Disposisi Tim Lapangan' },
  { key: 'resolved', label: 'Selesai Ditangani' },
]

const STATUS_ORDER: Record<string, number> = {
  submitted: 0,
  under_review: 1,
  verified: 2,
  in_progress: 3,
  resolved: 4,
  rejected: -1,
  duplicate: -1,
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params
  let report: Report | null = null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reports')
      .select('*, ai_analysis(*)')
      .eq('id', id)
      .single()

    if (!error && data) {
      report = data as Report
    }
  } catch (err) {
    console.warn('Failed to fetch report from Supabase:', err)
  }

  if (!report) {
    notFound()
  }

  const r = report as Report
  const currentStep = STATUS_ORDER[r.status] ?? 0
  const isTerminal = ['rejected', 'duplicate'].includes(r.status)
  const categoryLabel = CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS] || r.category
  const urgencyLabel = URGENCY_LABELS[r.urgency as keyof typeof URGENCY_LABELS] || r.urgency
  const statusLabel = STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] || r.status

  const isCritical = (r.urgency as string) === 'kritis' || (r.urgency as string) === 'tinggi' || (r.urgency as string) === 'critical'
  const isResolved = r.status === 'resolved'

  return (
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen pb-24">
      {/* Header */}
      <section className="pt-10 pb-8 bg-white border-b border-[#e6e6e6] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/laporan"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-xs font-bold text-[#1d1d1d] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Daftar Laporan
            </Link>
            <Link
              href="/peta"
              className="inline-flex items-center gap-1.5 text-xs text-[#4a154b] hover:underline font-semibold"
            >
              Lihat di Peta Spasial →
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-[#4a154b] px-3 py-1 rounded-full bg-[#f9f0ff] border border-[#eddcf7]">
                  TIKET: {r.report_code || r.id.substring(0, 10)}
                </span>
                {r.is_demo && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full border border-[#fef3c7] bg-[#fffbeb] text-[#b45309] font-bold">
                    Dataset Simulasi EOC
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d]">
                {r.title || categoryLabel}
              </h1>
              <span className="text-xs text-[#696969] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#4a154b]" />
                {r.district_name || 'Kota Semarang'} • Dilaporkan {formatDate(r.created_at)} ({formatRelativeTime(r.created_at)})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 text-xs font-bold uppercase rounded-[90px] border ${
                  isCritical
                    ? 'bg-[#fef2f2] text-[#cc4117] border-[#fecaca]'
                    : r.urgency === 'tinggi'
                    ? 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]'
                    : 'bg-[#f4ede4] text-[#1d1d1d] border-[#e8ded2]'
                }`}
              >
                Urgensi: {urgencyLabel}
              </span>
              <span
                className={`px-4 py-2 text-xs font-bold uppercase rounded-[90px] border ${
                  isResolved
                    ? 'bg-[#ecfdf5] text-[#007a5a] border-[#d1fae5]'
                    : 'bg-[#f9f0ff] text-[#4a154b] border-[#eddcf7]'
                }`}
              >
                Status: {statusLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Situation & Analysis */}
          <div className="lg:col-span-8 space-y-6">
            {/* Photo if provided */}
            {r.photo_url && (
              <div className="rounded-[16px] border border-[#e6e6e6] bg-white overflow-hidden shadow-subtle">
                <div className="relative h-80 sm:h-96 w-full">
                  <Image
                    src={r.photo_url}
                    alt="Dokumentasi fisik laporan lapangan"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-mono flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    Dokumentasi Terverifikasi
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="p-6 sm:p-8 rounded-[16px] bg-white border border-[#e6e6e6] shadow-subtle space-y-4">
              <span className="text-xs uppercase font-bold tracking-wider text-[#4a154b] block">
                Deskripsi Situasi Lapangan
              </span>
              <p className="text-sm sm:text-base text-[#1d1d1d] leading-relaxed">
                {r.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e6e6e6] text-xs text-[#696969]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#4a154b] shrink-0" />
                  <span>
                    Lat: {r.latitude.toFixed(5)}, Lng: {r.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#696969] shrink-0" />
                  <span>{formatDate(r.created_at)}</span>
                </div>
                {r.reporter_name && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <User className="h-4 w-4 text-[#007a5a] shrink-0" />
                    <span className="text-[#1d1d1d] font-semibold">Pelapor: {r.reporter_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Layer */}
            {r.ai_analysis && (
              <div className="p-6 sm:p-8 rounded-[16px] bg-[#f9f0ff] border border-[#eddcf7] shadow-subtle space-y-4">
                <div className="flex justify-between items-baseline pb-3 border-b border-[#eddcf7]">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#4a154b]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4a154b]">
                      Analisis Kecerdasan Spasial AI
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#696969]">
                    Keyakinan {Math.round((r.ai_analysis.ai_confidence || 0) * 100)}%
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm leading-relaxed">
                  <div>
                    <span className="text-[10px] uppercase text-[#696969] font-bold block mb-1">
                      Ringkasan Otomatis:
                    </span>
                    <p className="text-[#1d1d1d]">{r.ai_analysis.summary}</p>
                  </div>
                  {r.ai_analysis.recommended_action && (
                    <div className="p-4 rounded-xl bg-white border border-[#eddcf7]">
                      <span className="text-[10px] uppercase text-[#4a154b] font-bold block mb-1">
                        Rekomendasi Tindakan:
                      </span>
                      <p className="text-[#1d1d1d] font-semibold">{r.ai_analysis.recommended_action}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evidence Bundle Panel */}
            <EvidenceBundlePanel
              reportId={r.id}
              reportCode={r.report_code || r.id.substring(0, 8)}
            />
          </div>

          {/* Right Column: Status Timeline & Audit */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status Timeline Card */}
            <div className="p-6 rounded-[16px] bg-white border border-[#e6e6e6] shadow-subtle">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a154b] mb-4">
                Perjalanan Status Penanganan
              </h3>

              {!isTerminal ? (
                <div className="space-y-4">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= currentStep
                    const isCurrent = idx === currentStep

                    return (
                      <div key={step.key} className="flex items-start gap-3 relative">
                        {idx < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                              idx < currentStep ? 'bg-[#007a5a]' : 'bg-[#e6e6e6]'
                            }`}
                          />
                        )}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                            isCurrent
                              ? 'bg-[#4a154b] text-white ring-4 ring-[#4a154b]/15'
                              : isDone
                              ? 'bg-[#007a5a] text-white'
                              : 'bg-[#f4ede4] text-[#696969]'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div className="pt-0.5">
                          <p
                            className={`text-xs font-bold ${
                              isCurrent ? 'text-[#4a154b]' : isDone ? 'text-[#1d1d1d]' : 'text-[#696969]'
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#cc4117] text-xs">
                  Laporan ini berstatus <span className="font-bold">{statusLabel}</span> (Ditutup).
                </div>
              )}
            </div>

            {/* Credibility Score Box */}
            <div className="p-6 rounded-[16px] bg-[#f4ede4] border border-[#e8ded2] shadow-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
                  Skor Kredibilitas
                </span>
                <ShieldCheck className="w-5 h-5 text-[#007a5a]" />
              </div>
              <div className="text-3xl font-bold text-[#1d1d1d]">
                {r.credibility_score ?? 85}<span className="text-sm font-normal text-[#696969]">/100</span>
              </div>
              <p className="text-xs text-[#696969] mt-2 leading-relaxed">
                Dihitung dari kombinasi akurasi GPS, timestamp foto, keaslian citra, dan korelasi telemetri cuaca.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
