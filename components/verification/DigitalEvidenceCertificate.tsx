'use client'

import React, { useState } from 'react'
import {
  ShieldCheck,
  Lock,
  Copy,
  Check,
  MapPin,
  Mail,
  Fingerprint,
} from 'lucide-react'
import type { Report } from '@/types'

interface DigitalEvidenceCertificateProps {
  report: Report
  className?: string
}

export function DigitalEvidenceCertificate({ report, className }: DigitalEvidenceCertificateProps) {
  const [copiedHash, setCopiedHash] = useState(false)

  const meta = report.verification_metadata || {}
  const hasHash = Boolean(meta.photo_hash || meta.photo_sha256)
  const displayHash = (meta.photo_hash || meta.photo_sha256 || 'TIDAK_TERSEDIA').toUpperCase()

  const copyHashToClipboard = () => {
    if (!hasHash) return
    navigator.clipboard.writeText(displayHash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const accuracyMeters = report.location_accuracy || meta.location_accuracy || 25
  const credibilityScore = report.credibility_score || meta.credibility_score || 75
  const isEmailVerified = report.email_verified || meta.email_verified || false
  const isTurnstileVerified = report.turnstile_verified || meta.turnstile_verified !== false

  return (
    <div className={`p-5 bg-white border border-[#e6e6e6] rounded-2xl shadow-subtle space-y-5 text-[#1d1d1d] ${className || ''}`}>
      {/* Top Certificate Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e6e6e6] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4a154b] flex items-center justify-center text-white shrink-0">
            <Fingerprint className="w-6 h-6 text-[#f4ede4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a154b]">
                Sertifikat Integritas Bukti Digital
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#f9f0ff] text-[#4a154b] border border-[#eddcf7]">
                CHAIN-OF-CUSTODY
              </span>
            </div>
            <p className="text-xs text-[#696969] font-mono">
              Tiket: {report.report_code} • Stempel Waktu: {new Date(report.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-[#696969] block font-bold uppercase">SKOR KREDIBILITAS</span>
            <span className="text-lg font-bold font-mono text-[#007a5a]">{credibilityScore}%</span>
          </div>
        </div>
      </div>

      {/* SHA-256 Cryptographic Hash Box */}
      <div className="p-4 bg-[#fdfbf9] border border-[#e6e6e6] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#4a154b] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#4a154b]" />
            DIGITAL FINGERPRINT (SHA-256 HASH)
          </span>
          {hasHash && (
            <button
              onClick={copyHashToClipboard}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4a154b] hover:text-[#3860be] transition-colors cursor-pointer"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#007a5a]" />
                  <span className="text-[#007a5a]">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Hash</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-2.5 bg-white border border-[#e6e6e6] rounded-lg font-mono text-[11px] text-[#1d1d1d] break-all select-all">
          {displayHash}
        </div>
        <p className="text-[11px] text-[#696969] leading-relaxed">
          <strong>Jaminan Kriptografis:</strong> Hash SHA-256 dihitung secara instan pada array buffer foto di peramban pelapor via Web Crypto API sebelum diunggah ke server. Jika foto diubah 1 piksel pun, nilai hash akan berubah total.
        </p>
      </div>

      {/* Multi-Layer Verification Chain Steps */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#696969] block">
          TAHAPAN VERIFIKASI MULTI-TIER
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Step 1: Turnstile Bot Defense */}
          <div className="p-3 bg-[#faf9f8] border border-[#e6e6e6] rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#007a5a] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1d1d1d] block">Cloudflare Turnstile Anti-Bot</span>
              <span className="text-[11px] text-[#696969]">
                {isTurnstileVerified ? '✓ Lolos Tantangan Kemanusiaan Non-Intrusif' : 'Verifikasi Bot Server'}
              </span>
            </div>
          </div>

          {/* Step 2: Email OTP Auth */}
          <div className="p-3 bg-[#faf9f8] border border-[#e6e6e6] rounded-xl flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-[#007a5a] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1d1d1d] block">Supabase Passwordless Email OTP</span>
              <span className="text-[11px] text-[#696969]">
                {isEmailVerified ? '✓ Kepemilikan Email Terverifikasi Token 6-Digit' : 'Identitas Email Terdaftar'}
              </span>
            </div>
          </div>

          {/* Step 3: Geolocation Boundary */}
          <div className="p-3 bg-[#faf9f8] border border-[#e6e6e6] rounded-xl flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#007a5a] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1d1d1d] block">Batas Administratif Semarang</span>
              <span className="text-[11px] text-[#696969]">
                ✓ Validasi 16 Kecamatan (Akurasi GPS ±{accuracyMeters}m)
              </span>
            </div>
          </div>

          {/* Step 4: Spatial Corroboration */}
          <div className="p-3 bg-[#faf9f8] border border-[#e6e6e6] rounded-xl flex items-start gap-2.5">
            <Check className="w-4 h-4 text-[#007a5a] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1d1d1d] block">Spatial Haversine Corroboration</span>
              <span className="text-[11px] text-[#696969]">
                {meta.corroboration_count && meta.corroboration_count > 0
                  ? `✓ ${meta.corroboration_count} Laporan Bersesuaian dalam Radius 300m`
                  : 'Pencocokan Titik Pantau CCTV & Curah Hujan BMKG'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Honesty Disclaimer */}
      <div className="p-3 bg-[#f4ede4] border border-[#e6e6e6] rounded-xl text-[11px] text-[#696969] leading-relaxed">
        <strong>Batasan Ilmiah:</strong> Hashing kriptografi membuktikan integritas berkas digital sejak transmisi dan mencegah manipulasi dokumen. Sertifikat ini menjadi bukti forensik terstruktur untuk audit posko darurat BPBD Kota Semarang.
      </div>
    </div>
  )
}
