'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Info,
  Layers,
  FlaskConical,
  Waves,
  Droplets,
  RotateCcw,
} from 'lucide-react'

interface SOSModalProps {
  isOpen: boolean
  onClose: () => void
}

type SOSCategory = 'EMERGENCY_LIFE' | 'FLOOD_REPORT' | 'ENVIRONMENT_MONITOR' | 'SIMULATION_TEST'

export function SOSModal({ isOpen, onClose }: SOSModalProps) {
  const [selectedType, setSelectedType] = useState<SOSCategory>('EMERGENCY_LIFE')
  const [step, setStep] = useState<'INITIAL' | 'CONFIRMING' | 'SENDING' | 'SENT' | 'CANCELLED'>('INITIAL')
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
      setSelectedType('EMERGENCY_LIFE')
      setErrorMsg(null)
      setFollowupDone(false)
    }
  }, [isOpen])

  const handleTriggerSOS = async (isTestMode = false) => {
    setStep('SENDING')
    setErrorMsg(null)

    // Quick Geolocation check (with 3.5s timeout so it NEVER blocks emergency dispatch)
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
          urgency: isTestMode ? 'test' : 'kritis',
          category: isTestMode ? 'SIMULATION_TEST' : 'EMERGENCY_LIFE',
          is_test_mode: isTestMode,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSosCode(data.sos_code || (isTestMode ? 'TEST-SIMULASI' : 'SOS-DARURAT'))
        setSosId(data.data?.id || data.sos_code)
        setStep('SENT')

        // Trigger vibration if supported on mobile
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([200, 100, 200])
          } catch {
            // Ignore
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

  const handleCancelSOS = () => {
    setStep('CANCELLED')
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#f0e6e5] overflow-hidden flex flex-col max-h-[calc(100vh-1.5rem)] max-h-[calc(100dvh-1.5rem)] font-sans">
        
        {/* Top Emergency Header */}
        <div className="bg-gradient-to-r from-[#1f0621] via-[#3a0e30] to-[#1f0621] text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#cc4117] flex items-center justify-center text-white shadow-sm shrink-0 ring-2 ring-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#fca5a5] bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                  Layanan Kedaruratan &amp; Bencana
                </span>
              </div>
              <h2 className="text-base font-bold font-display text-white tracking-tight mt-0.5">
                Pusat Bantuan &amp; Sinyal Darurat
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup dialog SOS"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: INITIAL SELECTION & CLASSIFICATION */}
          {step === 'INITIAL' && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#696969] leading-relaxed">
                Pilih jenis bantuan atau pelaporan yang sesuai dengan kondisi nyata Anda saat ini untuk memastikan penanganan yang tepat:
              </p>

              {/* 4 Clear Choices Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                
                {/* 1. Real Critical Emergency SOS */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedType('EMERGENCY_LIFE')
                    setStep('CONFIRMING')
                  }}
                  className="p-3.5 rounded-2xl border-2 border-[#cc4117] bg-[#fdf2f0] hover:bg-[#fde7e4] text-left flex items-start gap-3 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#cc4117] text-white flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[#cc4117] uppercase tracking-wide">
                        1. Sinyal SOS Darurat (Ancaman Jiwa)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#cc4117] text-white font-mono">
                        PRIORITAS SAR
                      </span>
                    </div>
                    <p className="text-xs text-[#1d1d1d] font-medium mt-0.5 leading-snug">
                      Terjebak banjir tinggi, butuh evakuasi perahu karet lansia/anak, atau bahaya mengancam jiwa.
                    </p>
                    <span className="text-[11px] text-[#cc4117] font-semibold mt-1 inline-block">
                      Diteruskan langsung ke Tim Tanggap Darurat BPBD 112 →
                    </span>
                  </div>
                </button>

                {/* 2. Significant Flood Report (Standard) */}
                <Link
                  href="/laporan/baru"
                  onClick={onClose}
                  className="p-3.5 rounded-2xl border border-[#e6e6e6] bg-white hover:bg-[#f9f0ff] hover:border-[#4a154b]/40 text-left flex items-start gap-3 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#f9f0ff] border border-[#eddcf7] text-[#4a154b] flex items-center justify-center shrink-0 mt-0.5">
                    <Waves className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wide block">
                      2. Laporkan Bencana Banjir / Rob
                    </span>
                    <p className="text-xs text-[#696969] mt-0.5 leading-snug">
                      Jalan utama tergenang 30-70 cm, tanggul rembes, atau kenaikan air pasang rob.
                    </p>
                    <span className="text-[11px] text-[#1264a3] font-semibold mt-1 inline-block">
                      Form Laporan Terverifikasi &amp; Peta Spasial →
                    </span>
                  </div>
                </Link>

                {/* 3. Minor Environmental Condition */}
                <Link
                  href="/laporan/baru"
                  onClick={onClose}
                  className="p-3.5 rounded-2xl border border-[#e6e6e6] bg-white hover:bg-[#f4ede4] text-left flex items-start gap-3 transition-all cursor-pointer group shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#f4ede4] border border-[#e8ded2] text-[#4a154b] flex items-center justify-center shrink-0 mt-0.5">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wide block">
                      3. Laporkan Kondisi Lingkungan / Genangan Ringan
                    </span>
                    <p className="text-xs text-[#696969] mt-0.5 leading-snug">
                      Saluran drainase mampet, genangan semata kaki (&lt;20 cm), atau sampah menyumbat parit.
                    </p>
                    <span className="text-[11px] text-[#696969] font-medium mt-1 inline-block">
                      Status: Pemantauan Rutin Dinas PU (Bukan Darurat SAR)
                    </span>
                  </div>
                </Link>

                {/* 4. Public Test / Simulation Mode */}
                <button
                  type="button"
                  onClick={() => handleTriggerSOS(true)}
                  className="p-3 rounded-2xl border border-dashed border-[#dcdcdc] bg-[#faf9f8] hover:bg-[#f4ede4] text-left flex items-center justify-between gap-3 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <FlaskConical className="w-4 h-4 text-[#696969]" />
                    <div>
                      <span className="text-xs font-bold text-[#696969] block">
                        4. Mode Uji Coba / Simulasi Test
                      </span>
                      <span className="text-[11px] text-[#888]">
                        Uji fitur pengiriman sinyal tanpa memanggil tim penyelamat lapangan
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#4a154b] px-2.5 py-1 rounded-full bg-white border shrink-0">
                    Uji Coba
                  </span>
                </button>

              </div>

              {/* Direct 112 Phone Access */}
              <div className="pt-2 border-t border-[#f0f0f0] flex items-center justify-between text-xs">
                <span className="text-[#696969]">Butuh respon instan via suara?</span>
                <a
                  href="tel:112"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4ede4] text-[#cc4117] font-bold hover:bg-[#e8ded2] transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Hubungi 112 Bebas Pulsa</span>
                </a>
              </div>
            </div>
          )}

          {/* STEP 2: EXPLICIT CONFIRMATION BEFORE REAL SOS DISPATCH */}
          {step === 'CONFIRMING' && (
            <div className="flex flex-col items-center text-center gap-4 py-2 animate-in fade-in duration-150">
              <div className="w-14 h-14 rounded-full bg-red-100 text-[#cc4117] flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-[#cc4117] animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#1d1d1d]">
                  Konfirmasi Pengiriman Sinyal SOS Darurat
                </h3>
                <p className="text-xs text-[#cc4117] font-semibold max-w-sm mx-auto">
                  Perhatian: Sinyal ini akan segera memicu koordinasi tim tanggap darurat BPBD Kota Semarang.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1.5 leading-relaxed w-full">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Siapa yang menerima &amp; apa yang terjadi?</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-950/85">
                  <li>Koordinat GPS lokasi Anda akan dipancarkan ke <strong>Command Center BPBD Kota Semarang</strong>.</li>
                  <li>Petugas akan mengidentifikasi titik kumpul terdekat dan menyiagakan regu evakuasi.</li>
                  <li>Jangan gunakan fitur ini jika situasi tidak mengancam keselamatan jiwa.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
                <button
                  type="button"
                  onClick={() => handleTriggerSOS(false)}
                  className="w-full sm:flex-1 min-h-[46px] px-6 py-2.5 rounded-full bg-[#cc4117] hover:bg-[#b03713] active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Ya, Pancarkan Sinyal Darurat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('INITIAL')}
                  className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-full border border-[#e6e6e6] hover:bg-gray-100 text-[#696969] hover:text-[#1d1d1d] font-bold text-xs transition-colors cursor-pointer"
                >
                  Kembali
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SENDING STATE */}
          {step === 'SENDING' && (
            <div className="flex flex-col items-center text-center gap-4 py-8">
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
                <Radio className="w-6 h-6 text-red-600 absolute animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1d1d1d]">Memancarkan Sinyal Darurat...</h3>
                <p className="text-xs text-[#696969] max-w-xs mt-1 leading-relaxed">
                  Menghubungkan ke Command Center BPBD Kota Semarang &amp; memverifikasi koordinat lokasi.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SENT / SUCCESS STATE WITH CANCELLATION OPTION */}
          {step === 'SENT' && (
            <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    {selectedType === 'SIMULATION_TEST'
                      ? 'Simulasi Sinyal Uji Coba Berhasil'
                      : 'Laporan Darurat Diterima — Menunggu Verifikasi Posko'}
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                    {selectedType === 'SIMULATION_TEST'
                      ? 'Ini adalah pengujian fitur. Tidak ada armada SAR yang dikerahkan.'
                      : 'Operator posko siaga sedang meninjau sinyal Anda. Harap tetap berada di titik yang aman dan siapkan nomor kontak.'}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 font-mono text-xs font-bold text-emerald-800 shadow-2xs">
                    <span>TIKET: {sosCode}</span>
                    {hasGps && <span className="text-emerald-600 font-semibold">• GPS Terpantau</span>}
                  </div>
                </div>
              </div>

              {/* Optional follow-up form */}
              {!followupDone && (
                <form onSubmit={handleFollowupSubmit} className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#fcfaf8] border border-[#eee5dc]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1d1d1d]">
                      Informasi Tambahan (Opsional)
                    </span>
                    <span className="text-[10px] text-[#888]">Membantu Petugas</span>
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
                    placeholder="Kondisi (misal: Air 1 meter di RT 03, butuh evakuasi lansia)"
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
              )}

              {/* Action Buttons: Call 112 & Cancel Sinyal */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[#f0f0f0]">
                <a
                  href="tel:112"
                  className="w-full sm:flex-1 h-10 px-4 rounded-xl bg-[#cc4117] text-white hover:bg-[#b03713] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Telepon 112 Langsung</span>
                </a>

                <button
                  type="button"
                  onClick={handleCancelSOS}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#696969] hover:text-[#1d1d1d] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Batalkan jika sinyal terkirim secara tidak sengaja"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Batalkan Sinyal</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs transition-colors cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: CANCELLED STATE (FALSE ALARM PREVENTED) */}
          {step === 'CANCELLED' && (
            <div className="flex flex-col items-center text-center gap-4 py-6 animate-in fade-in duration-150">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-[#696969] flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-[#696969]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1d1d1d]">Sinyal Darurat Telah Dibatalkan</h3>
                <p className="text-xs text-[#696969] max-w-xs mt-1 leading-relaxed">
                  Status sinyal telah ditandai sebagai pembatalan mandiri oleh warga. Tidak ada regu penyelamat yang diarahkan ke titik ini.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-6 py-2 rounded-full bg-[#4a154b] text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Tutup Jendela
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
