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
  Clock,
  Radio,
  ExternalLink,
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

    // Quick Geolocation check (with 3-second timeout so it NEVER blocks SOS)
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

        // Try vibration if supported on mobile
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl border-2 border-[#cc4117] overflow-hidden">
        {/* Top Emergency Header */}
        <div className="bg-[#cc4117] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                Sinyal Darurat Prioritas Tinggi
              </span>
              <h2 className="text-xl font-bold font-display">SOS KOTA SEMARANG</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-[12px] bg-[#fff1f0] border border-[#ffccc7] text-xs text-[#cc4117] font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'INITIAL' && (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              <div className="p-4 rounded-2xl bg-[#fff5f2] border border-[#ffd8cf] max-w-md">
                <p className="text-xs text-[#8c2b0e] leading-relaxed font-medium">
                  Gunakan tombol ini saat terjadi kondisi darurat kritis (banjir bandang mendadak, terjebak air tinggi, longsor). Sinyal akan langsung masuk ke layar petugas BPBD tanpa hambatan formulir panjang.
                </p>
              </div>

              {/* Big Pulsing Emergency Button */}
              <button
                type="button"
                onClick={handleSendSOS}
                className="relative group w-48 h-48 rounded-full bg-[#cc4117] hover:bg-[#b03713] active:scale-95 text-white flex flex-col items-center justify-center gap-2 shadow-[0_0_50px_rgba(204,65,23,0.5)] transition-all cursor-pointer"
              >
                <span className="absolute inset-0 rounded-full border-4 border-[#cc4117] animate-ping opacity-60 pointer-events-none"></span>
                <Radio className="w-10 h-10 text-white animate-pulse" />
                <span className="text-2xl font-black font-display tracking-tight uppercase">
                  KIRIM SOS
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-white/90">
                  1-KLIK KE COMMAND CENTER
                </span>
              </button>

              <div className="flex items-center gap-2 text-xs text-[#696969]">
                <MapPin className="w-3.5 h-3.5 text-[#cc4117]" />
                <span>Koordinat GPS Anda akan otomatis dilampirkan jika diizinkan</span>
              </div>

              <div className="w-full pt-4 border-t border-[#e6e6e6] flex items-center justify-between">
                <a
                  href="tel:112"
                  className="px-4 py-2.5 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-[#cc4117]" />
                  Hubungi 112 Langsung
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-[#696969] hover:text-[#1d1d1d]"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {step === 'SENDING' && (
            <div className="flex flex-col items-center text-center gap-4 py-12">
              <div className="w-16 h-16 rounded-full border-4 border-[#cc4117] border-t-transparent animate-spin"></div>
              <h3 className="text-lg font-bold text-[#1d1d1d]">Mengirim Sinyal Darurat...</h3>
              <p className="text-xs text-[#696969] max-w-xs">
                Menghubungkan ke Command Center BPBD Kota Semarang dan mengambil koordinat lokasi terdekat.
              </p>
            </div>
          )}

          {step === 'SENT' && (
            <div className="flex flex-col gap-5 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-[16px] bg-[#ecfdf5] border border-[#a7f3d0] flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-[#007a5a] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#007a5a]">
                    SOS BERHASIL TERKIRIM KE COMMAND CENTER!
                  </h3>
                  <p className="text-xs text-[#065f46] mt-0.5">
                    Petugas tanggap darurat telah menerima sinyal Anda. Harap tetap berada di tempat yang aman.
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-[#a7f3d0] font-mono text-xs font-bold text-[#007a5a]">
                    <span>ID: {sosCode}</span>
                    {hasGps && <span>• GPS Terverifikasi</span>}
                  </div>
                </div>
              </div>

              {/* Optional follow-up form */}
              {!followupDone ? (
                <form onSubmit={handleFollowupSubmit} className="flex flex-col gap-3 p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e8ded2]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1d]">
                      Informasi Tambahan (Opsional)
                    </span>
                    <span className="text-[10px] text-[#696969]">Membantu Petugas Lapangan</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama Anda (Opsional)"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="text-xs px-3 py-2 rounded-[10px] border border-[#e6e6e6] focus:border-[#cc4117] focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Nomor HP (08...)"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="text-xs px-3 py-2 rounded-[10px] border border-[#e6e6e6] focus:border-[#cc4117] focus:outline-none"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Rincian kondisi (cth: Air naik 1 meter, butuh evakuasi lansia)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-xs px-3 py-2 rounded-[10px] border border-[#e6e6e6] focus:border-[#cc4117] focus:outline-none resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <label className="text-[11px] font-semibold text-[#4a154b] hover:underline flex items-center gap-1.5 cursor-pointer">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{photoPreview ? 'Foto Terlampir' : 'Lampirkan Foto'}</span>
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
                      className="px-4 py-2 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      {isUpdatingFollowup ? 'Menyimpan...' : 'Kirim Tambahan'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 rounded-[12px] bg-[#f4ede4] text-xs text-[#1d1d1d] font-semibold text-center">
                  ✅ Informasi tambahan telah diterima oleh operator.
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <a
                  href="tel:112"
                  className="px-5 py-2.5 rounded-[90px] bg-[#cc4117] text-white hover:bg-[#b03713] font-bold text-xs flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  Telepon 112
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs"
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
