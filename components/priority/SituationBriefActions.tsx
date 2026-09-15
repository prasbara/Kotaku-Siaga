'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Printer, ArrowLeft, MessageCircle } from 'lucide-react'
import { DisasterShareModal } from '@/components/public/DisasterShareModal'

interface SituationBriefActionsProps {
  areaName: string
  score?: number
  level: string
}

export function SituationBriefActions({ areaName, level, score }: SituationBriefActionsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 print:hidden">
      {/* Responsive Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs font-mono text-[#696969]">
        <Link
          href="/priorities"
          className="flex items-center gap-1.5 text-[#4a154b] hover:underline font-bold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:hidden" />
          <span className="sm:hidden">Kembali ke Matriks Risiko</span>
          <span className="hidden sm:inline">Matriks Risiko</span>
        </Link>
        <span className="hidden sm:inline mx-2 text-[#9ca3af]">/</span>
        <span className="hidden sm:inline font-bold text-[#1d1d1d] truncate max-w-[200px]">
          {areaName.replace('Kecamatan ', '')}
        </span>
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-1.5 rounded-[90px] bg-white border border-[#e6e6e6] hover:bg-[#f9f0ff] hover:border-[#4a154b]/30 text-[#4a154b] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          title="Cetak lembar situasi atau simpan sebagai PDF A4"
        >
          <Printer className="w-3.5 h-3.5 text-[#4a154b]" />
          <span>Cetak Lembar Situasi (A4)</span>
        </button>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="px-3.5 py-1.5 rounded-[90px] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#075E54] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Bagikan ringkasan situasi wilayah ke WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Bagikan ke WhatsApp</span>
        </button>
      </div>

      <DisasterShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={{
          districtName: areaName,
          riskLevel:
            level === 'CRITICAL'
              ? 'kritis'
              : level === 'HIGH'
              ? 'tinggi'
              : level === 'MEDIUM'
              ? 'waspada'
              : 'rendah',
          riskScore: score,
        }}
      />
    </div>
  )
}
