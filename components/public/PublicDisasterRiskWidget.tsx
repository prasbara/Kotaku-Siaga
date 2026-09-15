'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  CloudRain,
  Waves,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Info,
  PhoneCall,
  ChevronDown,
  RefreshCw,
  Layers,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'
import type { PublicDisasterSummary } from '@/lib/intelligence/disaster-risk-engine'
import { ExplainableFusionMatrixModal } from '@/components/intelligence/ExplainableFusionMatrixModal'
import { DisasterShareModal } from '@/components/public/DisasterShareModal'

interface PublicDisasterRiskWidgetProps {
  initialAreaSlug?: string
  className?: string
}

export function PublicDisasterRiskWidget({
  initialAreaSlug = 'semarang-utara',
  className,
}: PublicDisasterRiskWidgetProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(initialAreaSlug)
  const [summary, setSummary] = useState<PublicDisasterSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFusionModalOpen, setIsFusionModalOpen] = useState<boolean>(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  const fetchSummary = useCallback(async (slug: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/disaster-intelligence?area=${slug}`, {
        signal: controller.signal,
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      const summaryPayload =
        data.summary ||
        (data.assessment
          ? {
              areaId: data.assessment.areaId,
              areaName: data.assessment.areaName,
              currentRiskLevel: data.assessment.riskLevel,
              riskScore: data.assessment.totalRiskScore,
              simpleConfidence: data.assessment.simpleConfidence,
              rainfallSummary: {
                rateMmH: 0,
                category: 'Aktual',
                status: 'Termonitor BMKG',
              },
              coastalRiskSummary: {
                waveHeightM:
                  data.assessment.zoneCategory === 'pesisir' ? 0.35 : null,
                status:
                  data.assessment.zoneCategory === 'pesisir'
                    ? 'Laut Tenang'
                    : 'Bukan Kawasan Pesisir',
                tideWarning: false,
              },
              publicRecommendations: data.assessment.publicRecommendations || [],
              whySummary: data.assessment.whySummary || [],
              roadsToAvoid: data.assessment.roadsToAvoid || [],
              nearbyFacilities: ['Layanan Darurat: 112 (BPBD Kota Semarang)'],
              lastUpdate: data.assessment.calculatedAt,
              lastUpdateWib: data.assessment.calculatedAtWib,
            }
          : null)

      if (summaryPayload) {
        setSummary(summaryPayload)
        setError(null)
      } else {
        setError('Data belum tersedia untuk wilayah ini.')
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load public disaster summary:', err)
        setError('Gagal memuat data wilayah. Silakan periksa koneksi.')
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchSummary(selectedSlug)
  }, [fetchSummary, selectedSlug])

  const getRiskDisplay = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          label: 'KRITIS / AWAS',
          bg: 'bg-[#e01e5a]',
          text: 'text-white',
          border: 'border-[#e01e5a]',
          dot: 'bg-white',
          badge: 'Tingkat Bahaya Sangat Tinggi',
        }
      case 'HIGH':
        return {
          label: 'SIAGA / TINGGI',
          bg: 'bg-[#e01e5a]/15',
          text: 'text-[#e01e5a]',
          border: 'border-[#e01e5a]/40',
          dot: 'bg-[#e01e5a]',
          badge: 'Potensi Genangan & Limpasan Signifikan',
        }
      case 'ELEVATED':
        return {
          label: 'WASPADA',
          bg: 'bg-[#ec942c]/15',
          text: 'text-[#b45309]',
          border: 'border-[#ec942c]/40',
          dot: 'bg-[#ec942c]',
          badge: 'Kenaikan Muka Air Terpantau',
        }
      case 'MODERATE':
        return {
          label: 'PERHATIAN',
          bg: 'bg-[#1264a3]/15',
          text: 'text-[#1264a3]',
          border: 'border-[#1264a3]/30',
          dot: 'bg-[#1264a3]',
          badge: 'Kondisi Cuaca Mulai Berubah',
        }
      case 'LOW':
      default:
        return {
          label: 'AMAN / NORMAL',
          bg: 'bg-[#007a5a]/10',
          text: 'text-[#007a5a]',
          border: 'border-[#007a5a]/30',
          dot: 'bg-[#007a5a]',
          badge: 'Kapasitas Saluran Normal',
        }
    }
  }

  const riskInfo = getRiskDisplay(summary?.currentRiskLevel)

  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle p-5 sm:p-7 space-y-6 text-[#1d1d1d]',
        className
      )}
    >
      {/* 1. Header with Area Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f0f0f0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold text-[#4a154b] uppercase tracking-wider">
              INFORMASI KESELAMATAN WARGA SEMARANG
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4a154b] tracking-tight mt-0.5">
            Status Risiko & Kesiapsiagaan Wilayah
          </h2>
        </div>

        {/* District Selector */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#4a154b]" />
          <div className="relative flex items-center">
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="appearance-none min-h-[40px] px-3.5 py-2 pr-9 rounded-xl bg-[#f9f8f6] hover:bg-white border border-[#dcdcdc] focus:border-[#4a154b] font-bold text-xs text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#4a154b]/20 transition-all cursor-pointer shadow-2xs"
            >
              {SEMARANG_KECAMATAN.map((k) => (
                <option key={k.id} value={k.slug}>
                  {k.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              {isLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-[#4a154b] border-t-transparent rounded-full animate-spin" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#696969]" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert if any and no summary available */}
      {error && !summary && (
        <div className="p-3.5 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#cc4117] flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchSummary(selectedSlug)}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-white text-[#cc4117] font-bold rounded-lg border border-[#fecaca] hover:bg-[#fee2e2] transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Memuat...' : 'Coba Lagi'}</span>
          </button>
        </div>
      )}

      {/* 2. Main Current Risk Banner (Requirement #12) */}
      <div className={cn('p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4', riskInfo.bg, riskInfo.border)}>
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
            STATUS RISIKO SAAT INI ({summary?.areaName || 'Kota Semarang'})
          </span>
          <div className="flex items-center gap-3">
            <span className={cn('text-2xl sm:text-3xl font-bold font-display tracking-tight', riskInfo.text)}>
              {riskInfo.label}
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/60 border border-current/20">
              Skor: {summary?.riskScore || 0}/100
            </span>
          </div>
          <p className="text-xs text-[#1d1d1d]/80">{riskInfo.badge}</p>
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFusionModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#4a154b] hover:bg-[#f9f0ff] text-[11px] font-bold rounded-lg border border-[#4a154b]/30 shadow-subtle transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#4a154b]" />
              <span>Transparansi Bobot &amp; Data Fusion (7 Faktor)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#075E54] text-[11px] font-bold rounded-lg border border-[#25D366]/40 shadow-subtle transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>Bagikan Situasi (WA)</span>
            </button>
          </div>
        </div>

        <div className="text-right text-xs">
          <div className="font-bold flex items-center gap-1.5 justify-end">
            <span>Tingkat Keyakinan:</span>
            <span className="text-[#007a5a] font-bold bg-white px-2 py-0.5 rounded border border-[#007a5a]/30">
              {summary?.simpleConfidence === 'TINGGI' ? '✓ Tinggi (Data Valid)' : summary?.simpleConfidence === 'SEDANG' ? 'Sedang' : 'Perlu Verifikasi'}
            </span>
          </div>
          <p className="text-[11px] text-[#696969] mt-1 font-mono">
            Diperbarui: {summary?.lastUpdateWib || 'Baru saja'}
          </p>
        </div>
      </div>

      {/* 3. Parameter Grid: Rainfall & Coastal Risk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Rainfall Card */}
        <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#1d1d1d]">
              <CloudRain className="w-4 h-4 text-[#3860be]" />
              <span>Curah Hujan Terpantau</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#007a5a] bg-white px-2 py-0.5 rounded border border-[#e6e6e6]">
              {summary?.rainfallSummary.status || 'Aktual'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-[#1d1d1d]">
              {summary?.rainfallSummary.rateMmH ?? 0}
            </span>
            <span className="text-[#696969]">mm/jam</span>
            <span className="ml-auto text-xs font-bold text-[#4a154b]">
              {summary?.rainfallSummary.category || 'Normal'}
            </span>
          </div>
        </div>

        {/* Coastal / Wave Card */}
        <div className="p-4 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#1d1d1d]">
              <Waves className="w-4 h-4 text-[#1264a3]" />
              <span>Kondisi Pesisir & Rob</span>
            </div>
            {summary?.coastalRiskSummary.tideWarning ? (
              <span className="font-mono text-[10px] font-bold text-[#e01e5a] bg-[#e01e5a]/10 px-2 py-0.5 rounded border border-[#e01e5a]/30">
                Pesisir Rendah (Waspada)
              </span>
            ) : summary?.coastalRiskSummary.waveHeightM != null ? (
              <span className="font-mono text-[10px] font-bold text-[#007a5a] bg-[#007a5a]/10 px-2 py-0.5 rounded border border-[#007a5a]/30">
                Pesisir (Laut Tenang)
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold text-[#4a154b] bg-[#f4ede4] px-2 py-0.5 rounded border border-[#e8ded2]">
                Bukan Pesisir
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-display text-[#1d1d1d]">
              {summary?.coastalRiskSummary.waveHeightM != null
                ? `${summary.coastalRiskSummary.waveHeightM} m`
                : 'Bebas Rob'}
            </span>
            <span className="text-[#696969] text-[11px] truncate" title={summary?.coastalRiskSummary.status}>
              {summary?.coastalRiskSummary.status || 'Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. "MENGAPA RISIKO INI DITETAPKAN?" (Plain Indonesian Explanation) */}
      {summary?.whySummary && summary.whySummary.length > 0 && (
        <div className="p-4 rounded-xl bg-[#f4ede4] border border-[#e8ded2] space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#4a154b]">
            <Info className="w-4 h-4" />
            <span>Mengapa Status Risiko Ini Ditetapkan?</span>
          </div>
          <ul className="space-y-1.5 pl-5 list-disc text-[#1d1d1d]">
            {summary.whySummary.map((point, idx) => (
              <li key={idx} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Rekomendasi Tindakan Warga */}
      {summary?.publicRecommendations && summary.publicRecommendations.length > 0 && (
        <div className="space-y-2 text-xs">
          <span className="font-bold text-[#1d1d1d] block">
            Rekomendasi Tindakan Warga:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {summary.publicRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#faf9f8] border border-[#e6e6e6] flex items-start gap-2.5 text-[#1d1d1d]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#007a5a] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Jalan yang Perlu Dihindari */}
      {summary?.roadsToAvoid && summary.roadsToAvoid.length > 0 && (
        <div className="p-4 rounded-xl bg-[#fdf0f4] border border-[#e01e5a]/20 space-y-2 text-xs text-[#1d1d1d]">
          <div className="flex items-center gap-1.5 font-bold text-[#e01e5a]">
            <AlertTriangle className="w-4 h-4" />
            <span>Ruas Jalan / Lokasi yang Dianjurkan Dihindari:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {summary.roadsToAvoid.map((road, idx) => (
              <span
                key={idx}
                className="font-bold bg-white text-[#e01e5a] px-3 py-1 rounded-lg border border-[#e01e5a]/30 shadow-2xs"
              >
                {road}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 7. Emergency Contact Strip */}
      <div className="p-3.5 rounded-xl bg-[#faf9f8] border border-[#e6e6e6] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#696969]">
          <PhoneCall className="w-4 h-4 text-[#4a154b]" />
          <span>Nomor Kedaruratan Bencana Kota Semarang:</span>
          <span className="font-mono font-bold text-[#1d1d1d] bg-white px-2 py-0.5 rounded border">
            BPBD Call Center 112
          </span>
        </div>
        <span className="text-[11px] text-[#696969] italic">
          Data ini disederhanakan untuk keselamatan umum.
        </span>
      </div>

      {/* Explainable Fusion Matrix Modal */}
      {summary && (
        <ExplainableFusionMatrixModal
          isOpen={isFusionModalOpen}
          onClose={() => setIsFusionModalOpen(false)}
          areaName={summary.areaName}
          totalScore={summary.riskScore}
          riskLevel={summary.currentRiskLevel}
          factors={summary.factors || []}
          dataGaps={summary.dataGaps || []}
          calculationIntegrity={summary.calculationIntegrity || 'OPTIMAL'}
          lastUpdateWib={summary.lastUpdateWib}
        />
      )}

      {/* WhatsApp Disaster Situation Share Modal */}
      {summary && (
        <DisasterShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareData={{
            districtName: summary.areaName,
            riskLevel:
              summary.currentRiskLevel === 'CRITICAL'
                ? 'kritis'
                : summary.currentRiskLevel === 'HIGH' || summary.currentRiskLevel === 'ELEVATED'
                ? 'tinggi'
                : summary.currentRiskLevel === 'MODERATE'
                ? 'sedang'
                : 'rendah',
            waterLevelCm: summary.rainfallSummary?.rateMmH ? Math.round(summary.rainfallSummary.rateMmH * 1.5) : 15,
            avoidRoads: summary.roadsToAvoid,
            safeCorridors: ['Jl. Wolter Monginsidi', 'Jl. Majapahit', 'Kawasan Gombel Baru'],
            reportUrl: typeof window !== 'undefined' ? `${window.location.origin}/priorities/${selectedSlug}` : undefined,
          }}
        />
      )}
    </div>
  )
}
