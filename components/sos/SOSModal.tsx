'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  PhoneCall,
  MapPin,
  CheckCircle2,
  X,
  Send,
  Camera,
  ShieldAlert,
  Radio,
  ExternalLink,
  Navigation,
  Info,
} from 'lucide-react'
import Image from 'next/image'

interface SOSModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [step, setStep] = useState<'INITIAL' | 'SENDING' | 'SENT'>('INITIAL')
  const [sosCode, setSosCode] = useState<string>('')
  const [sosId, setSosId] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hasGps, setHasGps] = useState<boolean | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null)

  // Optional Followup fields
  const [reporterName, setReporterName] = useState('')
  const [reporterPhone, setReporterPhone] = useState('')
  const [description, setDescription] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isUpdatingFollowup, setIsUpdatingFollowup] = useState(false)
  const [followupDone, setFollowupDone] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('INITIAL')
      setErrorMsg(null)
      setFollowupDone(false)
    }
  }, [isOpen])

  const handleSendSOS = async () => {
    setStep('SENDING')
    setErrorMsg(null)

    // Quick Geolocation check (with 3.5s timeout so it NEVER blocks SOS)
    let lat = -6.9932
    let lng = 110.4203
    let accuracy: number | null = null
    let locationAvailable = false

    try {
      if ('geolocation' in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 3500,
            maximumAge: 10000,
          })
        }).catch(() => null)

        if (pos) {
          lat = pos.coords.latitude
          lng = pos.coords.longitude
          accuracy = pos.coords.accuracy
          locationAvailable = true
          setHasGps(true)
          setCoords({ lat, lng, accuracy })
        } else {
          setHasGps(false)
        }
      }
    } catch {
      setHasGps(false)
    }

    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          location_accuracy: accuracy,
          location_available: locationAvailable,
          client_session_id: `sos-session-${Date.now()}`,
          district_name: 'Kota Semarang',
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSosCode(data.sos_code || 'SOS-DARURAT')
        setSosId(data.data?.id || data.sos_code)
        setStep('SENT')

        // Trigger vibration if supported on mobile
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([200, 100, 200])
          } catch {
            // Ignore vibrate errors
          }
        }
      } else {
        setErrorMsg(data.error || 'Gagal mengirimkan sinyal darurat.')
        setStep('INITIAL')
      }
    } catch (err: any) {
      console.error('SOS submit error:', err)
      setErrorMsg('Koneksi darurat terganggu. Panggilan 112 disarankan.')
      setStep('INITIAL')
    }
  }

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sosId) return

    setIsUpdatingFollowup(true)
    try {
      await fetch(`/api/sos/${sosId}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_name: reporterName,
          reporter_phone: reporterPhone,
          description: description,
          photo_url: photoPreview,
        }),
      })
      setFollowupDone(true)
    } catch (err) {
      console.warn('Followup update error:', err)
    } finally {
      setIsUpdatingFollowup(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#f0e6e5] overflow-hidden flex flex-col">
        {/* Top Emergency Header */}
        <div className="bg-gradient-to-r from-[#1f0621] via-[#3a0e30] to-[#1f0621] text-white px-5 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#cc4117] flex items-center justify-center text-white shadow-sm shrink-0 ring-2 ring-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#fca5a5] bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                  Kritis • Prioritas Tinggi
                </span>
              </div>
              <h2 className="text-base font-bold font-display text-white tracking-tight mt-0.5">
                Sinyal Darurat SOS
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup dialog SOS"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'INITIAL' && (
            <div className="flex flex-col items-center text-center gap-4">
              {/* Context Alert Card */}
              <div className="w-full text-left p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900/90 leading-relaxed font-normal">
                  Gunakan saat terjadi kondisi darurat kritis (terjebak banjir tinggi, longsor, butuh evakuasi). Sinyal langsung diteruskan ke petugas <strong>BPBD Kota Semarang</strong>.
                </p>
              </div>

              {/* Contained, Premium Emergency Button with Controlled Ripple */}
              <div className="relative my-2 flex items-center justify-center">
                {/* Soft outer aura ring */}
                <div className="absolute w-44 h-44 rounded-full bg-red-500/15 animate-ping pointer-events-none opacity-60"></div>
                <div className="absolute w-48 h-48 rounded-full bg-red-500/10 pointer-events-none"></div>

                {/* Main SOS Trigger Button */}
                <button
                  type="button"
                  onClick={handleSendSOS}
                  className="relative z-10 w-40 h-40 rounded-full bg-gradient-to-tr from-[#991b1b] via-[#dc2626] to-[#ea580c] hover:from-[#7f1d1d] hover:via-[#b91c1c] hover:to-[#c2410c] active:scale-95 text-white flex flex-col items-center justify-center gap-1.5 shadow-[0_8px_30px_rgba(220,38,38,0.45)] hover:shadow-[0_12px_40px_rgba(220,38,38,0.6)] transition-all cursor-pointer border-4 border-white/30 group select-none"
                >
                  <Radio className="w-7 h-7 text-white animate-pulse" />
                  <span className="text-xl font-extrabold font-display tracking-wide uppercase text-white drop-shadow-sm">
                    KIRIM SOS
                  </span>
                  <span className="text-[9px] tracking-wider uppercase font-semibold text-white/90 bg-black/20 px-2.5 py-0.5 rounded-full">
                    1-Klik ke BPBD
                  </span>
                </button>
              </div>

              {/* GPS Telemetry Note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#696969]">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Koordinat GPS Anda dilampirkan otomatis untuk respon cepat</span>
              </div>

              {/* Action Buttons Footer */}
              <div className="w-full pt-3 mt-1 border-t border-[#f0f0f0] flex items-center gap-2.5">
                <a
                  href="tel:112"
                  className="flex-1 h-10 px-4 rounded-xl bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#cc4117]" />
                  <span>Telepon 112 Langsung</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-xl border border-[#e6e6e6] hover:bg-gray-50 text-xs font-semibold text-[#696969] hover:text-[#1d1d1d] transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {step === 'SENDING' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"></div>
                <Radio className="w-6 h-6 text-red-600 absolute animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d1d1d]">Mengirimkan Sinyal Darurat...</h3>
                <p className="text-xs text-[#696969] max-w-xs mt-1 leading-relaxed">
                  Menghubungkan ke Command Center BPBD Kota Semarang & memverifikasi koordinat lokasi.
                </p>
              </div>
            </div>
          )}

          {step === 'SENT' && (
            <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Sinyal SOS Diterima Command Center!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    Petugas tanggap darurat telah menerima sinyal darurat Anda. Harap tetap berada di titik yang aman.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 font-mono text-xs font-bold text-emerald-800 shadow-2xs">
                    <span>KODE: {sosCode}</span>
                    {hasGps && <span className="text-emerald-600 font-semibold">• GPS Aktif</span>}
                  </div>
                </div>
              </div>

              {/* Optional follow-up form */}
              {!followupDone ? (
                <form onSubmit={handleFollowupSubmit} className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#fcfaf8] border border-[#eee5dc]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1d]">
                      Informasi Tambahan (Opsional)
                    </span>
                    <span className="text-[10px] text-[#888]">Membantu Tim Lapangan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Pelapor"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="text-xs px-3 py-2 rounded-xl border border-[#e6e6e6] bg-white focus:border-[#4a154b] focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Nomor HP / WhatsApp"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="text-xs px-3 py-2 rounded-xl border border-[#e6e6e6] bg-white focus:border-[#4a154b] focus:outline-none"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Kondisi (misal: Air 1 meter di RT 03, butuh perahu karet lansia)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-[#e6e6e6] bg-white focus:border-[#4a154b] focus:outline-none resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <label className="text-[11px] font-semibold text-[#4a154b] hover:text-[#611f69] flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-[#e6e6e6] shadow-2xs">
                      <Camera className="w-3.5 h-3.5 text-[#4a154b]" />
                      <span>{photoPreview ? 'Foto Terlampir ✓' : 'Lampirkan Foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isUpdatingFollowup}
                      className="h-8 px-4 rounded-xl bg-[#4a154b] text-white hover:bg-[#611f69] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isUpdatingFollowup ? 'Mengirim...' : 'Kirim Detail'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 text-xs text-emerald-800 font-semibold text-center border border-emerald-200">
                  ✅ Informasi tambahan telah berhasil diteruskan ke operator.
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-[#f0f0f0]">
                <a
                  href="tel:112"
                  className="flex-1 h-10 px-4 rounded-xl bg-[#cc4117] text-white hover:bg-[#b03713] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Hubungi 112</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-10 px-4 rounded-xl bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
