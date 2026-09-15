'use client'

import React from 'react'
import Link from 'next/link'
import { Printer, Share2, ArrowLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface SituationBriefActionsProps {
  areaName: string
  score: number
  level: string
}

export function SituationBriefActions({ areaName, score, level }: SituationBriefActionsProps) {
  const [copied, setCopied] = React.useState(false)

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.href
      if (navigator.share) {
        navigator.share({
          title: `Lembar Situasi Risiko: ${areaName} (Skor: ${score})`,
          text: `Audit Deterministik Risiko Bencana ${areaName} — KotaKu Siaga EOC Semarang.`,
          url: shareUrl,
        }).catch(() => {})
      } else {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast({
          title: 'Tautan Disalin!',
          description: 'Tautan lembar situasi siap dibagikan ke WhatsApp atau media koordinasi.',
        })
        setTimeout(() => setCopied(false), 2000)
      }
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
          onClick={handleShare}
          className="px-3.5 py-1.5 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Bagikan ringkasan situasi wilayah"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#007a5a]" /> : <Share2 className="w-3.5 h-3.5 text-[#4a154b]" />}
          <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
        </button>
      </div>
    </div>
  )
}
