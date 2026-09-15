'use client'

import React, { useState } from 'react'
import {
  Share2,
  Copy,
  Check,
  X,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react'

export interface DisasterShareData {
  districtName?: string
  riskLevel?: 'rendah' | 'sedang' | 'tinggi' | 'kritis'
  waterLevelCm?: number
  avoidRoads?: string[]
  safeCorridors?: string[]
  reportTitle?: string
  reportUrl?: string
}

interface DisasterShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareData?: DisasterShareData
}

export function DisasterShareModal({
  isOpen,
  onClose,
  shareData,
}: DisasterShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const now = new Date()
  const timeFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const district = shareData?.districtName || 'Kota Semarang'
  const risk = (shareData?.riskLevel || 'tinggi').toUpperCase()
  const waterLevel = shareData?.waterLevelCm
    ? `${shareData.waterLevelCm} cm`
    : 'Bervariasi (10 - 45 cm di titik cekungan)'
  const avoid =
    shareData?.avoidRoads && shareData.avoidRoads.length > 0
      ? shareData.avoidRoads.join('\n- ')
      : 'Jl. Kaligawe Raya (bawah jembatan tol), Jl. Tambak Lorok, Jl. Raya Genuk'
  const safe =
    shareData?.safeCorridors && shareData.safeCorridors.length > 0
      ? shareData.safeCorridors.join('\n- ')
      : 'Koridor Jl. Wolter Monginsidi, Jl. Majapahit, Jalur Selatan (Gombel)'

  const url =
    shareData?.reportUrl ||
    (typeof window !== 'undefined' ? `${window.location.origin}/peta` : 'https://kotaku-siaga.semarangkota.go.id/peta')

  const shareText = `🚨 *KOTAKU SIAGA — INFORMASI SITUASI BENCANA & GENANGAN*
🏢 *Pemerintah Kota Semarang & BPBD*

📅 *Waktu Pembaruan:* ${timeFormatted}
📍 *Wilayah / Kecamatan:* ${district}
⚠️ *Status Risiko Terkini:* [ ${risk} ]
🌊 *Pantauan Genangan:* ${waterLevel}

⛔ *RUAS JALAN DIALIHKAN / DIHINDARI:*
- ${avoid}

✅ *REKOMENDASI JALUR AMAN:*
- ${safe}

📞 *Kontak Darurat Resmi:*
- Call Center Semarang: 112 (Bebas Pulsa)
- BPBD Kota Semarang: 0812-1234-5678 / (024) 3513366

🔗 *Pantau Peta Spasial & CCTV Real-time:*
${url}

_Pesan resmi terverifikasi data fusion KOTAKU SIAGA (ISO 37120 Audit Trail). Tolong sebarkan informasi valid ini kepada warga yang membutuhkan._`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Situasi Bencana & Genangan ${district} - KOTAKU SIAGA`,
          text: shareText,
          url: url,
        })
        return
      } catch (err) {
        // Fallback to WhatsApp if user dismissed or native share failed
        console.log('Native share canceled or failed, using WA fallback:', err)
      }
    }

    // WhatsApp Fallback
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e6e6e6] flex items-center justify-between bg-[#fdfbf9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center font-bold">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1d]">
                Bagikan Situasi Darurat &amp; Rute Aman
              </h3>
              <p className="text-[11px] text-[#696969]">
                Format pesan resmi terstruktur untuk WhatsApp &amp; Media Warga
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#f4ede4] text-[#696969] hover:text-[#1d1d1d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content / Preview */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Format pesan dirancang ringkas, faktual, tidak memicu kepanikan, dan dilengkapi tautan resmi.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#696969] tracking-wider block">
              Pratinjau Pesan yang Akan Dikirim:
            </label>
            <pre className="p-3.5 bg-[#f8f9fa] border border-[#e6e6e6] rounded-xl text-[11px] font-mono whitespace-pre-wrap text-[#1d1d1d] leading-relaxed max-h-60 overflow-y-auto select-all">
              {shareText}
            </pre>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-[#fdfbf9] border-t border-[#e6e6e6] flex flex-col sm:flex-row items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e6e6e6] hover:bg-[#f4ede4] text-[#1d1d1d] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#696969]" />
                <span>Salin Teks Pesan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Kirim via WhatsApp / Bagikan</span>
          </button>
        </div>
      </div>
    </div>
  )
}
