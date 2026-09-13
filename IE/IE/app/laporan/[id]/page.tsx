import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Report } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS, STATUS_LABELS } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, MapPin, Clock, User, AlertCircle, Bot } from 'lucide-react'
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
  { key: 'in_progress', label: 'Disposisi Armada Pompa/Tim' },
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

  // PRODUCTION: Always query the real database.
  // No fallback to hardcoded reports.
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

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface min-h-screen pb-20">
      {/* Tactical Header */}
      <section className="pt-10 pb-8 bg-surface-container-lowest border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <Link
            href="/peta"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-primary hover:underline transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Peta Spasial
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/30">
                  ID AUDIT: {r.report_code || r.id.substring(0, 10)}
                </span>
                {r.is_demo && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-tertiary/40 bg-tertiary/10 text-tertiary font-bold">
                    Dataset Simulasi EOC
                  </span>
                )}
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface">
                {r.title || categoryLabel}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded border ${
                  r.urgency === 'kritis'
                    ? 'bg-error/20 text-error border-error/40'
                    : r.urgency === 'tinggi'
                    ? 'bg-tertiary/20 text-tertiary border-tertiary/40'
                    : 'bg-primary/20 text-primary border-primary/40'
                }`}
              >
                Urgensi: {urgencyLabel}
              </span>
              <span className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded border border-secondary/40 bg-secondary/10 text-secondary">
                {statusLabel}
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
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container overflow-hidden shadow-md">
                <div className="relative h-80 w-full">
                  <Image
                    src={r.photo_url}
                    alt="Dokumentasi fisik laporan lapangan"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary block">
                Deskripsi Lapangan Warga
              </span>
              <p className="text-sm text-on-surface leading-relaxed font-body">
                {r.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/20 text-xs text-on-surface-variant font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Lat: {r.latitude.toFixed(5)}, Lng: {r.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-on-surface-variant shrink-0" />
                  <span>{formatDate(r.created_at)} ({formatRelativeTime(r.created_at)})</span>
                </div>
                {r.reporter_name && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <User className="h-4 w-4 text-secondary shrink-0" />
                    <span className="text-on-surface">Pelapor: {r.reporter_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Layer */}
            {r.ai_analysis && (
              <div className="p-6 rounded-xl bg-surface-container-low border border-primary/40 shadow-md space-y-4">
                <div className="flex justify-between items-baseline pb-3 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      Analisis Kecerdasan Spasial AI
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-on-surface-variant">
                    Confidence {Math.round((r.ai_analysis.ai_confidence || 0) * 100)}%
                  </span>
                </div>

                <div className="space-y-3 font-body text-xs leading-relaxed">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-on-surface-variant block mb-1">
                      Ringkasan Interpretasi
                    </span>
                    <p className="text-on-surface">
                      {r.ai_analysis.summary}
                    </p>
                  </div>

                  {r.ai_analysis.recommended_action && (
                    <div className="pt-3 border-t border-outline-variant/20">
                      <span className="text-[10px] font-mono uppercase text-secondary font-bold block mb-1">
                        Rekomendasi Penanganan
                      </span>
                      <p className="text-on-surface">
                        {r.ai_analysis.recommended_action}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-[10px] font-mono text-primary uppercase border-t border-outline-variant/10">
                    Klasifikasi: {r.ai_analysis.ai_category} • Tingkat Keparahan: {r.ai_analysis.severity}
                  </div>
                </div>
              </div>
            )}

            {/* CCTV Evidence Bundle */}
            <EvidenceBundlePanel
              reportId={r.id}
              reportCode={r.report_code || r.id.substring(0, 12)}
              autoFetch={true}
            />
          </div>

          {/* Right Column: Status Pipeline & Audit Logs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Status Timeline */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm space-y-4">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary block pb-2 border-b border-outline-variant/30">
                Progres Penanganan EOC
              </span>

              {!isTerminal ? (
                <div className="space-y-3.5 font-mono text-xs">
                  {STATUS_STEPS.map((step, i) => {
                    const isDone = i < currentStep
                    const isCurrent = i === currentStep
                    return (
                      <div key={step.key} className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${
                            isDone
                              ? 'bg-secondary text-on-secondary border-secondary'
                              : isCurrent
                              ? 'bg-primary text-on-primary border-primary animate-pulse'
                              : 'bg-surface-container border-outline-variant/40 text-on-surface-variant'
                          }`}
                        >
                          {isDone ? '✓' : i + 1}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs ${
                              isCurrent
                                ? 'font-bold text-primary'
                                : isDone
                                ? 'text-on-surface font-medium'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-surface-container border border-error/40 text-xs text-error flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-error" />
                  <span>Laporan berstatus: {statusLabel}</span>
                </div>
              )}
            </div>

            {/* Data Provenance Card */}
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm text-xs space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface block pb-2 border-b border-outline-variant/30">
                Integritas Provenance ISO 37120
              </span>
              <div className="flex justify-between border-b border-outline-variant/20 pb-2 font-mono">
                <span className="text-on-surface-variant">Stempel Waktu</span>
                <span className="text-on-surface">{new Date(r.created_at).toLocaleTimeString('id-ID')} WIB</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-2 font-mono">
                <span className="text-on-surface-variant">Tipe Entitas</span>
                <span className="text-primary font-bold">Citizen Ground-Truth</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-on-surface-variant">Validitas Spasial</span>
                <span className="text-secondary font-bold">Terpetakan Valid (100%)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
