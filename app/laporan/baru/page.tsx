'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReportCategory, UrgencyLevel } from '@/types'
import {
  Waves,
  Droplets,
  Wrench,
  Trash2,
  TreePine,
  AlertTriangle,
  Mountain,
  Camera,
  Navigation,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  ExternalLink,
  MapPin,
  PhoneCall,
  CheckCircle2,
  Lock,
  Mail,
  RefreshCw,
  Info,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { TurnstileWidget } from '@/components/ui/TurnstileWidget'

const CATEGORIES = [
  {
    value: 'banjir' as ReportCategory,
    label: 'Banjir Rob / Pasang Laut',
    code: 'ROB-HYDRO',
    desc: 'Air laut meluap di Tanjung Emas, Kaligawe, Genuk & sekitarnya.',
    icon: Waves,
  },
  {
    value: 'genangan' as ReportCategory,
    label: 'Genangan Air Hujan',
    code: 'DRAIN-FL',
    desc: 'Antrean air hujan atau saluran meluap menggenangi badan jalan protokol.',
    icon: Droplets,
  },
  {
    value: 'drainase_tersumbat' as ReportCategory,
    label: 'Saluran / Drainase Tersumbat',
    code: 'TRASH-CLOG',
    desc: 'Sampah atau sedimen lumpur menyumbat saluran drainase pemukiman.',
    icon: Wrench,
  },
  {
    value: 'longsor' as ReportCategory,
    label: 'Longsor / Rekahan Tebing',
    code: 'SLOPE-GEO',
    desc: 'Rekahan tanah & lereng rawan runtuh di wilayah perbukitan Candisari/Gombel.',
    icon: Mountain,
  },
  {
    value: 'pohon_tumbang' as ReportCategory,
    label: 'Pohon Tumbang / Hambatan',
    code: 'VEG-BLOCK',
    desc: 'Dahan patah atau pohon menimpa kabel PLN atau menutup jalan evakuasi.',
    icon: AlertTriangle,
  },
]

const WATER_LEVELS = [
  { label: 'Semata Kaki (10 - 25 cm)', desc: 'Jalan masih dapat dilewati kendaraan secara perlahan' },
  { label: 'Selutut (30 - 50 cm)', desc: 'Kendaraan roda dua rawan mogok, air mulai masuk pekarangan' },
  { label: 'Sedada / Arus Deras (>80 cm)', desc: 'Akses jalan terputus, membutuhkan evakuasi perahu karet' },
]

const SEMARANG_DISTRICTS = [
  'Genuk',
  'Semarang Utara',
  'Semarang Timur',
  'Gayamsari',
  'Pedurungan',
  'Semarang Tengah',
  'Semarang Barat',
  'Semarang Selatan',
  'Gajahmungkur',
  'Candisari',
  'Tembalang',
  'Banyumanik',
  'Gunungpati',
  'Mijen',
  'Ngaliyan',
  'Tugu',
]

// Mask email e.g. nabiel@gmail.com -> n***@gmail.com
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`
}

export default function LaporBaruPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1: Data Diri Pelapor
  // Step 2: Lokasi & Bukti Foto
  // Step 3: Rincian Kejadian
  // Step 4: Turnstile & Supabase Email OTP
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Form Fields
  const [reporterName, setReporterName] = useState<string>('')
  const [reporterEmail, setReporterEmail] = useState<string>('')
  const [reporterPhone, setReporterPhone] = useState<string>('')
  const [category, setCategory] = useState<ReportCategory>('banjir')
  const [urgency, setUrgency] = useState<UrgencyLevel>('sedang')
  const [waterDepth, setWaterDepth] = useState<string>('Semata Kaki (10 - 25 cm)')
  const [district, setDistrict] = useState<string>('Genuk')
  const [address, setAddress] = useState<string>('')
  const [lat, setLat] = useState<number>(-6.9667)
  const [lng, setLng] = useState<number>(110.4667)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [description, setDescription] = useState<string>('')

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoSha256, setPhotoSha256] = useState<string | null>(null)

  // Security & Verification state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false)
  const [otpCode, setOtpCode] = useState<string>('')
  const [otpSent, setOtpSent] = useState<boolean>(false)
  const [otpSending, setOtpSending] = useState<boolean>(false)
  const [otpVerifying, setOtpVerifying] = useState<boolean>(false)
  const [resendCooldown, setResendCooldown] = useState<number>(0)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submittedReport, setSubmittedReport] = useState<any>(null)
  const [gettingLocation, setGettingLocation] = useState<boolean>(false)

  // Honeypot field
  const [honeypotWebsite, setHoneypotWebsite] = useState<string>('')

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Compute SHA-256 hash when photo is chosen
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format Berkas Tidak Didukung',
        description: 'Harap unggah berkas gambar foto (JPG/PNG/WEBP).',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran Foto Terlalu Besar',
        description: 'Ukuran foto maksimal adalah 5MB.',
        variant: 'destructive',
      })
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setPhotoPreview(dataUrl)

      try {
        const arrayBuffer = await file.arrayBuffer()
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
        setPhotoSha256(hashHex)
      } catch (hashErr) {
        console.warn('Could not compute SHA-256 hash:', hashErr)
      }
    }
    reader.readAsDataURL(file)
  }

  // Geolocation trigger
  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: 'GPS Tidak Didukung',
        description: 'Perangkat atau peramban Anda tidak mendukung sensor geolokasi.',
        variant: 'destructive',
      })
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)))
        setLng(Number(pos.coords.longitude.toFixed(6)))
        setLocationAccuracy(Math.round(pos.coords.accuracy))
        setGettingLocation(false)
        toast({
          title: 'Lokasi Berhasil Terdeteksi',
          description: `Akurasi GPS ±${Math.round(pos.coords.accuracy)} meter (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}).`,
        })
      },
      (err) => {
        setGettingLocation(false)
        toast({
          title: 'Izin Lokasi Belum Diperoleh',
          description: 'Aktifkan izin GPS atau pilih titik lokasi secara manual pada daftar kecamatan.',
          variant: 'destructive',
        })
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Step 1 Validation
  const validateStep1 = () => {
    if (!reporterName.trim() || reporterName.trim().length < 2) {
      toast({ title: 'Nama Lengkap Wajib Diisi', description: 'Masukkan nama Anda untuk identitas pelapor.', variant: 'destructive' })
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!reporterEmail.trim() || !emailRegex.test(reporterEmail.trim())) {
      toast({ title: 'Email Tidak Valid', description: 'Masukkan alamat email aktif untuk verifikasi OTP.', variant: 'destructive' })
      return false
    }
    if (!reporterPhone.trim() || reporterPhone.trim().length < 8) {
      toast({ title: 'Nomor HP Wajib Diisi', description: 'Nomor HP digunakan petugas untuk koordinasi darurat.', variant: 'destructive' })
      return false
    }
    return true
  }

  // Step 2 Validation
  const validateStep2 = () => {
    if (!photoPreview && !photoFile) {
      toast({
        title: 'Foto Bukti Wajib Dilampirkan',
        description: 'Laporan warga standar wajib menyertakan foto kondisi nyata di lapangan.',
        variant: 'destructive',
      })
      return false
    }
    if (lat === undefined || lng === undefined) {
      toast({ title: 'Lokasi Wajib Ditentukan', description: 'Ambil lokasi melalui GPS atau pilih kecamatan.', variant: 'destructive' })
      return false
    }
    return true
  }

  // Step 3 Validation
  const validateStep3 = () => {
    if (!description.trim() || description.trim().length < 10) {
      toast({
        title: 'Deskripsi Terlalu Singkat',
        description: 'Jelaskan kondisi secara rinci (minimal 10 karakter).',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  // Request Supabase Email OTP
  const handleSendOtp = async () => {
    setOtpSending(true)
    setOtpError(null)

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: reporterEmail.trim().toLowerCase() }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setOtpSent(true)
        setResendCooldown(60)
        toast({
          title: 'Kode OTP Terkirim',
          description: `Kode 6-digit telah dikirimkan ke ${maskEmail(reporterEmail)}.`,
        })
      } else {
        setOtpError(data.error || 'Gagal mengirimkan kode OTP.')
      }
    } catch (err) {
      setOtpError('Terjadi kesalahan jaringan saat mengirimkan OTP.')
    } finally {
      setOtpSending(false)
    }
  }

  // Verify Supabase Email OTP
  const handleVerifyOtp = async () => {
    if (otpCode.trim().length < 6) {
      setOtpError('Masukkan 6-digit kode verifikasi OTP yang lengkap.')
      return
    }

    setOtpVerifying(true)
    setOtpError(null)

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reporterEmail.trim().toLowerCase(),
          token: otpCode.trim(),
        }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.email_verified) {
        setIsEmailVerified(true)
        toast({
          title: 'Email Terverifikasi!',
          description: 'Identitas Anda telah diverifikasi. Memproses pengiriman laporan...',
        })
        // Submit finalized report automatically
        await submitFinalReport(true)
      } else {
        setOtpError(data.error || 'Kode verifikasi salah atau kadaluarsa.')
      }
    } catch (err) {
      setOtpError('Gagal memverifikasi kode OTP. Periksa koneksi Anda.')
    } finally {
      setOtpVerifying(false)
    }
  }

  // Submit Final Report
  const submitFinalReport = async (verified: boolean) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          urgency,
          description: `${description} | Estimasi Genangan: ${waterDepth} | Alamat: ${address || district}`,
          latitude: lat,
          longitude: lng,
          location_accuracy: locationAccuracy,
          district_name: district,
          address,
          reporter_name: reporterName.trim(),
          reporter_email: reporterEmail.trim().toLowerCase(),
          reporter_phone: reporterPhone.trim(),
          email_verified: verified,
          turnstile_token: turnstileToken,
          photo_url: photoPreview,
          photo_sha256: photoSha256,
          client_session_id: `guest-report-${Date.now()}`,
          website: honeypotWebsite,
        }),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setSubmittedReport(result)
        toast({
          title: 'Laporan Berhasil Masuk!',
          description: `Tiket Laporan: ${result.report_code}`,
        })
      } else {
        toast({
          title: 'Gagal Mengirim Laporan',
          description: result.error || 'Terjadi kesalahan sistem saat menyimpan laporan.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Kesalahan Sistem',
        description: 'Koneksi terputus. Silakan coba kembali.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSubmittedReport(null)
    setCurrentStep(1)
    setDescription('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoSha256(null)
    setOtpCode('')
    setOtpSent(false)
    setIsEmailVerified(false)
  }

  return (
    <div className="min-h-screen bg-[#fdfbf9] py-8 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Header Title */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4ede4] border border-[#e8ded2] text-[#4a154b] text-xs font-bold w-fit">
            <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
            Pelaporan Warga Kota Semarang
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d] tracking-tight">
            Buat Laporan Kejadian
          </h1>
          <p className="text-sm text-[#696969] leading-relaxed">
            Laporkan genangan air, banjir rob, pohon tumbang, atau kerusakan infrastruktur tanpa perlu membuat akun atau kata sandi. Laporan Anda diverifikasi melalui email OTP dan anti-bot.
          </p>
        </div>

        {!submittedReport ? (
          <div className="bg-white rounded-[24px] border border-[#e6e6e6] shadow-card overflow-hidden">
            {/* Step Progress Indicator */}
            <div className="grid grid-cols-4 border-b border-[#e6e6e6] bg-[#fdfbf9] text-xs font-bold">
              {[
                { step: 1, label: 'Identitas' },
                { step: 2, label: 'Lokasi & Foto' },
                { step: 3, label: 'Detail' },
                { step: 4, label: 'Verifikasi' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`py-3.5 px-3 flex items-center justify-center gap-2 border-r border-[#e6e6e6] last:border-r-0 transition-colors ${
                    currentStep === s.step
                      ? 'bg-white text-[#4a154b] border-b-2 border-b-[#4a154b]'
                      : currentStep > s.step
                      ? 'text-[#007a5a] bg-[#ecfdf5]/40'
                      : 'text-[#696969] opacity-60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      currentStep > s.step
                        ? 'bg-[#007a5a] text-white'
                        : currentStep === s.step
                        ? 'bg-[#4a154b] text-white'
                        : 'bg-[#e6e6e6] text-[#696969]'
                    }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="p-6 sm:p-8 flex flex-col gap-6">
              {/* STEP 1: IDENTITAS PELAPOR */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#e6e6e6] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 1: Identitas Pelapor</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Data kontak digunakan petugas penanganan untuk konfirmasi di lapangan dan tidak dipublikasikan ke publik.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Nama Lengkap Pelapor <span className="text-[#cc4117]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Budi Prasetyo"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className="min-h-[46px] px-4 rounded-[12px] border border-[#e6e6e6] bg-[#fdfbf9] focus:bg-white focus:border-[#4a154b] focus:outline-none text-sm text-[#1d1d1d]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                        Alamat Email Aktif <span className="text-[#cc4117]">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="nama@email.com"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        className="min-h-[46px] px-4 rounded-[12px] border border-[#e6e6e6] bg-[#fdfbf9] focus:bg-white focus:border-[#4a154b] focus:outline-none text-sm text-[#1d1d1d]"
                      />
                      <span className="text-[11px] text-[#696969]">Kode verifikasi OTP akan dikirimkan ke email ini.</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                        Nomor HP / WhatsApp <span className="text-[#cc4117]">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="081234567890"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        className="min-h-[46px] px-4 rounded-[12px] border border-[#e6e6e6] bg-[#fdfbf9] focus:bg-white focus:border-[#4a154b] focus:outline-none text-sm text-[#1d1d1d]"
                      />
                      <span className="text-[11px] text-[#696969]">Untuk koordinasi tim BPBD/PU (Bukan publik).</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-[16px] bg-[#f4ede4] border border-[#e8ded2] flex items-center gap-3">
                    <Lock className="w-5 h-5 text-[#4a154b] shrink-0" />
                    <p className="text-xs text-[#1d1d1d] leading-relaxed">
                      <strong>Jaminan Privasi:</strong> Nama, nomor HP, dan email Anda tidak akan pernah ditampilkan pada peta publik atau diteruskan ke pihak luar.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: LOKASI & FOTO BUKTI */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#e6e6e6] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 2: Lokasi &amp; Foto Bukti</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Laporan standar wajib menyertakan bukti foto dan koordinat lokasi kejadian.
                    </p>
                  </div>

                  {/* Foto Upload */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider flex items-center justify-between">
                      <span>Foto Bukti Lapangan (Wajib) <span className="text-[#cc4117]">*</span></span>
                      {photoSha256 && <span className="font-mono text-[10px] text-[#007a5a]">SHA-256 Valid</span>}
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                    {photoPreview ? (
                      <div className="relative h-56 w-full rounded-[16px] overflow-hidden border-2 border-[#4a154b] bg-black/5">
                        <Image src={photoPreview} alt="Bukti Foto" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null)
                            setPhotoPreview(null)
                            setPhotoSha256(null)
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-[#cc4117] transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 rounded-[16px] border-2 border-dashed border-[#4a154b]/40 hover:border-[#4a154b] bg-[#f9f0ff]/50 hover:bg-[#f9f0ff] flex flex-col items-center justify-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#4a154b] text-white flex items-center justify-center shadow-sm">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-[#1d1d1d]">Ambil Foto Kamera atau Pilih Galeri</span>
                        <span className="text-xs text-[#696969]">Format JPG, PNG, WEBP (Maksimal 5MB)</span>
                      </button>
                    )}
                  </div>

                  {/* Lokasi & Kecamatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                        Kecamatan di Semarang <span className="text-[#cc4117]">*</span>
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="min-h-[46px] px-4 rounded-[12px] border border-[#e6e6e6] bg-[#fdfbf9] focus:bg-white focus:border-[#4a154b] text-sm text-[#1d1d1d] font-semibold"
                      >
                        {SEMARANG_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            Kecamatan {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                        Patokan / Nama Jalan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Depan RS Sultan Agung, Jl. Kaligawe"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="min-h-[46px] px-4 rounded-[12px] border border-[#e6e6e6] bg-[#fdfbf9] focus:bg-white focus:border-[#4a154b] text-sm text-[#1d1d1d]"
                      />
                    </div>
                  </div>

                  {/* GPS Button */}
                  <div className="p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#f4ede4] flex items-center justify-center text-[#4a154b]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1d1d1d]">
                          Koordinat: {lat}, {lng}
                        </span>
                        <span className="text-[11px] text-[#696969]">
                          {locationAccuracy ? `Akurasi GPS: ±${locationAccuracy} m` : 'Menggunakan perkiraan wilayah kecamatan'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="px-4 py-2 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {gettingLocation ? 'Mendeteksi...' : 'Ambil Lokasi GPS Saya'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DETAIL KEJADIAN */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#e6e6e6] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 3: Rincian Kejadian</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Pilih kategori kejadian dan tingkat keparahan genangan air.
                    </p>
                  </div>

                  {/* Kategori */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Kategori Kejadian <span className="text-[#cc4117]">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon
                        const isSelected = category === cat.value
                        return (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`p-3.5 rounded-[14px] text-left border transition-all flex items-start gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-[#f9f0ff] border-[#4a154b] ring-2 ring-[#4a154b]/20 shadow-subtle'
                                : 'bg-white border-[#e6e6e6] hover:bg-[#fdfbf9]'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-[10px] shrink-0 ${
                                isSelected ? 'bg-[#4a154b] text-white' : 'bg-[#f4ede4] text-[#4a154b]'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1d1d1d]">{cat.label}</span>
                              <span className="text-[11px] text-[#696969] leading-tight mt-0.5">{cat.desc}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Ketinggian Genangan */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Estimasi Ketinggian Air
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {WATER_LEVELS.map((level) => (
                        <button
                          key={level.label}
                          type="button"
                          onClick={() => setWaterDepth(level.label)}
                          className={`p-3 rounded-[12px] text-left border text-xs transition-all cursor-pointer ${
                            waterDepth === level.label
                              ? 'bg-[#f9f0ff] border-[#4a154b] font-bold text-[#4a154b]'
                              : 'bg-white border-[#e6e6e6] text-[#1d1d1d] hover:bg-[#fdfbf9]'
                          }`}
                        >
                          <div>{level.label}</div>
                          <div className="text-[10px] text-[#696969] mt-0.5 font-normal">{level.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Deskripsi Kejadian Lapangan <span className="text-[#cc4117]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan kondisi secara spesifik (cth: Genangan mulai meluap sejak pukul 15.30 WIB, arus deras dan saluran tersumbat sampah tebal)."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="p-3.5 rounded-[12px] border border-[#e6e6e6] bg-[#fdfbf9] focus:bg-white focus:border-[#4a154b] focus:outline-none text-sm text-[#1d1d1d] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: TURNSTILE & SUPABASE EMAIL OTP VERIFICATION */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#e6e6e6] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 4: Verifikasi Email OTP &amp; Keamanan</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Untuk mencegah laporan palsu dan bot spam, verifikasi alamat email Anda menggunakan kode OTP.
                    </p>
                  </div>

                  {/* Ringkasan Laporan Singkat */}
                  <div className="p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2 text-xs">
                    <div className="font-bold text-[#1d1d1d] flex items-center justify-between">
                      <span>Ringkasan Data Laporan:</span>
                      <span className="text-[#4a154b] uppercase font-mono">{category}</span>
                    </div>
                    <div className="text-[#696969]">
                      Pelapor: <strong className="text-[#1d1d1d]">{reporterName}</strong> ({maskEmail(reporterEmail)})
                    </div>
                    <div className="text-[#696969]">
                      Lokasi: <strong className="text-[#1d1d1d]">Kecamatan {district}</strong> ({lat}, {lng})
                    </div>
                  </div>

                  {/* Anti-Bot Cloudflare Turnstile */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e8ded2]">
                    <span className="text-xs font-bold text-[#1d1d1d] mb-2 uppercase tracking-wider">
                      1. Verifikasi Anti-Bot (Cloudflare Turnstile)
                    </span>
                    <TurnstileWidget
                      onSuccess={(token) => {
                        setTurnstileToken(token)
                        toast({ title: 'Tantangan Bot Lolos', description: 'Peramban Anda telah terverifikasi.' })
                      }}
                      onError={() => {
                        toast({ title: 'Turnstile Gagal', description: 'Gagal memuat verifikasi Cloudflare.', variant: 'destructive' })
                      }}
                    />
                  </div>

                  {/* Email OTP Section */}
                  <div className="p-5 rounded-[16px] bg-[#f9f0ff] border border-[#eddcf7] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#4a154b]" />
                        <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
                          2. Verifikasi Email OTP Supabase
                        </span>
                      </div>
                      {isEmailVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007a5a] bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#a7f3d0]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      )}
                    </div>

                    {!otpSent ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-[#1d1d1d] leading-relaxed">
                          Tekan tombol untuk mengirim kode OTP 6-digit ke <strong>{maskEmail(reporterEmail)}</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpSending}
                          className="min-h-[42px] px-5 py-2 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          {otpSending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Mengirim OTP...
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Kirim Kode OTP
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-[#1d1d1d]">
                          Masukkan 6 digit kode verifikasi yang telah dikirim ke <strong>{maskEmail(reporterEmail)}</strong>:
                        </p>

                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="font-mono text-center text-lg tracking-widest font-bold w-48 h-12 rounded-[12px] border-2 border-[#4a154b] bg-white focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otpVerifying || otpCode.length < 6}
                            className="min-h-[46px] px-6 py-2 rounded-[90px] bg-[#007a5a] hover:bg-[#006046] text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {otpVerifying ? 'Memverifikasi...' : 'Verifikasi & Kirim'}
                          </button>
                        </div>

                        {otpError && (
                          <span className="text-xs text-[#cc4117] font-semibold">{otpError}</span>
                        )}

                        <div className="flex items-center justify-between text-xs text-[#696969] pt-1">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={resendCooldown > 0 || otpSending}
                            className="text-[#4a154b] hover:underline font-semibold disabled:text-[#696969] cursor-pointer"
                          >
                            {resendCooldown > 0 ? `Kirim ulang kode dalam ${resendCooldown}s` : 'Kirim Ulang Kode OTP'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="hover:underline cursor-pointer"
                          >
                            Ubah Alamat Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Honeypot hidden input */}
                  <input
                    type="text"
                    name="website"
                    value={honeypotWebsite}
                    onChange={(e) => setHoneypotWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden opacity-0 pointer-events-none absolute"
                  />
                </div>
              )}

              {/* WIZARD NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-[#e6e6e6] mt-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="min-h-[44px] px-5 py-2.5 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1 && !validateStep1()) return
                      if (currentStep === 2 && !validateStep2()) return
                      if (currentStep === 3 && !validateStep3()) return
                      setCurrentStep(currentStep + 1)
                    }}
                    className="min-h-[46px] px-7 py-3 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 ml-auto shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Lanjut ke Langkah {currentStep + 1}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION SCREEN */
          <div className="p-8 sm:p-12 rounded-[24px] bg-white border border-[#007a5a]/30 shadow-card flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#007a5a]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-2 max-w-lg">
              <span className="text-xs font-bold text-[#007a5a] uppercase tracking-wider">
                LAPORAN RESMI BERHASIL DITERIMA
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d]">
                Terima Kasih, {reporterName}!
              </h2>
              <p className="text-sm text-[#696969] leading-relaxed">
                Laporan Anda telah terverifikasi via Supabase Email OTP dan diteruskan ke Command Center BPBD Kota Semarang.
              </p>
            </div>

            <div className="p-5 rounded-[16px] bg-[#fdfbf9] border border-[#e8ded2] flex flex-col items-center gap-2.5 w-full max-w-md">
              <span className="text-[10px] text-[#696969] uppercase font-bold tracking-wider">
                Nomor Tiket Laporan Warga
              </span>
              <span className="font-mono text-2xl font-bold text-[#4a154b]">
                {submittedReport.report_code || 'SMG-2026-XXXXXX'}
              </span>

              {submittedReport.cluster_code && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-xs px-3 py-1 rounded-full bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]">
                    Klaster Kejadian: {submittedReport.cluster_code}
                  </span>
                  <span className="text-[11px] text-[#007a5a] font-semibold">
                    👥 Terhubung dengan {submittedReport.independent_reporter_count || 1} Pelapor Independen
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center pt-2">
              <Link
                href="/peta"
                className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Pantau Kejadian di Peta
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[48px] px-6 py-3 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs transition-colors cursor-pointer"
              >
                Buat Laporan Baru
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
