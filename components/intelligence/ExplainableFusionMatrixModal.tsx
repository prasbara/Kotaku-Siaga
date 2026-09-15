'use client'

import React from 'react'
import {
  X,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  ExternalLink,
  Activity,
  Cpu,
} from 'lucide-react'
import type {
  RiskFactorItem,
  DataGapWarning,
  DisasterRiskLevel,
} from '@/lib/intelligence/disaster-risk-engine'

interface ExplainableFusionMatrixModalProps {
  isOpen: boolean
  onClose: () => void
  areaName: string
  totalScore: number
  riskLevel: DisasterRiskLevel
  factors?: RiskFactorItem[]
  dataGaps?: DataGapWarning[]
  calculationIntegrity?: 'OPTIMAL' | 'DEGRADED_DUE_TO_GAPS' | 'LOW_EVIDENCE'
  lastUpdateWib?: string
}

export function ExplainableFusionMatrixModal({
  isOpen,
  onClose,
  areaName,
  totalScore,
  riskLevel,
  factors = [],
  dataGaps = [],
  calculationIntegrity = 'OPTIMAL',
  lastUpdateWib,
}: ExplainableFusionMatrixModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fusion-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-[#e6e6e6] flex flex-col overflow-hidden text-[#1d1d1d]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#4a154b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 id="fusion-modal-title" className="text-base sm:text-lg font-bold">
                Transparansi Multi-Source Data Fusion: {areaName}
              </h2>
              <p className="text-xs text-[#d9bdde]">
                Dekomposisi 7 Data Stream &amp; Audit Deterministik ISO 37120
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#d9bdde] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Tutup modal transparansi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Top Score Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#fdfbf9] border border-[#e6e6e6] rounded-xl">
            <div>
              <span className="text-[11px] text-[#696969] block font-bold uppercase tracking-wider">
                TOTAL SKOR RISIKO
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-bold text-[#4a154b] font-mono">
                  {totalScore.toFixed(1)}
                </span>
                <span className="text-xs text-[#696969]">/ 100</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-[#696969] block font-bold uppercase tracking-wider">
                KLASIFIKASI RISIKO
              </span>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  riskLevel === 'CRITICAL'
                    ? 'bg-[#cc4117] text-white'
                    : riskLevel === 'HIGH'
                    ? 'bg-amber-600 text-white'
                    : riskLevel === 'ELEVATED'
                    ? 'bg-amber-500 text-white'
                    : 'bg-[#007a5a] text-white'
                }`}
              >
                {riskLevel}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#696969] block font-bold uppercase tracking-wider">
                INTEGRITAS KALKULASI
              </span>
              <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-[#007a5a]">
                <ShieldCheck className="w-4 h-4 text-[#007a5a]" />
                {calculationIntegrity === 'OPTIMAL' ? 'OPTIMAL (Data Terhubung)' : 'ESTIMASI TERDEKAT'}
              </span>
              {lastUpdateWib && (
                <span className="block text-[10px] text-[#696969] mt-0.5 font-mono">
                  Diperbarui: {lastUpdateWib}
                </span>
              )}
            </div>
          </div>

          {/* Factors Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a154b] flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Kontribusi 7 Parameter Deterministik (Total Bobot = 100%)
            </h3>
            <div className="border border-[#e6e6e6] rounded-xl overflow-hidden shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f4ede4] text-[#4a154b] font-bold border-b border-[#e6e6e6]">
                      <th className="py-2.5 px-3">Parameter &amp; Bobot</th>
                      <th className="py-2.5 px-3">Nilai Riil Input</th>
                      <th className="py-2.5 px-3">Normalisasi</th>
                      <th className="py-2.5 px-3">Kontribusi</th>
                      <th className="py-2.5 px-3">Sumber Data Resmi</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e6e6]">
                    {factors.length > 0 ? (
                      factors.map((factor) => (
                        <tr key={factor.id} className="hover:bg-[#faf8f5] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#1d1d1d]">
                            {factor.name}
                            <span className="block text-[10px] font-mono text-[#696969]">
                              Bobot: {(factor.weight * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium text-[#1d1d1d]">
                            {factor.rawValue}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[#4a154b]">
                            <div className="flex items-center gap-2">
                              <span>{factor.normalizedValue}</span>
                              <div className="w-16 h-1.5 bg-[#e6e6e6] rounded-full overflow-hidden hidden sm:block">
                                <div
                                  className="h-full bg-[#4a154b] rounded-full"
                                  style={{ width: `${Math.min(100, factor.normalizedValue)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#4a154b]">
                            +{factor.contribution.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-[#696969] text-[11px]">
                            {factor.source}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#f9f0ff] text-[#4a154b] border border-[#eddcf7]">
                              {factor.freshness}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-[#696969]">
                          Memuat rincian faktor data...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Honest Data Gap Transparency Section */}
          {dataGaps.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Catatan Transparansi Data Gap &amp; Latensi Sensor:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900/90">
                {dataGaps.map((gap, i) => (
                  <li key={i}>
                    <strong>{gap.sourceName}:</strong> {gap.impactDescription} (Stempel Waktu:{' '}
                    {gap.lastObservationWib})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Scientific Disclaimer */}
          <div className="p-3.5 bg-[#f4ede4] border border-[#e6e6e6] rounded-xl text-[11px] text-[#696969] leading-relaxed">
            <strong>Prinsip Ilmiah Rekayasa:</strong> Skor risiko dihitung murni secara deterministik
            menggunakan normalisasi multikriteria standar ISO 37120 tanpa rekayasa angka (Zero Dummy Data).
            Formula ini dapat direproduksi dan diaudit secara terbuka.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#fdfbf9] border-t border-[#e6e6e6] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#4a154b] hover:bg-[#592466] text-white font-bold text-xs shadow-sm transition-all"
          >
            Tutup Panel Audit
          </button>
        </div>
      </div>
    </div>
  )
}
