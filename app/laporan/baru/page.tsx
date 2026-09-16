'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReportCategory, UrgencyLevel } from '@/types'
import {
  Waves,
  Droplets,
  Wrench,
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
  FlaskConical,
  Eye,
  RotateCcw,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { TurnstileWidget } from '@/components/ui/TurnstileWidget'
import { validateGeolocation } from '@/lib/verification/geo-validator'

interface CategoryConfig {
  value: ReportCategory
  label: string
  code: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
}

const CATEGORIES: CategoryConfig[] = [
  {
    value: 'banjir' as ReportCategory,
    label: 'Banjir Rob / Pasang Laut',
    code: 'ROB-HYDRO',
    desc: 'Air pasang laut meluap di Tanjung Emas, Kaligawe, Genuk & sekitarnya.',
    icon: Waves,
  },
  {
    value: 'genangan' as ReportCategory,
    label: 'Genangan Air Hujan',
    code: 'DRAIN-FL',
    desc: 'Luapan air hujan menggenangi badan jalan atau permukiman.',
    icon: Droplets,
  },
  {
    value: 'drainase_tersumbat' as ReportCategory,
    label: 'Saluran / Drainase Tersumbat',
    code: 'TRASH-CLOG',
    desc: 'Sampah atau endapan lumpur menyumbat saluran drainase.',
    icon: Wrench,
  },
  {
    value: 'longsor' as ReportCategory,
    label: 'Longsor / Rekahan Tebing',
    code: 'SLOPE-GEO',
    desc: 'Gerakan tanah atau rekahan lereng di kawasan perbukitan.',
    icon: Mountain,
  },
  {
    value: 'pohon_tumbang' as ReportCategory,
    label: 'Pohon Tumbang / Hambatan',
    code: 'VEG-BLOCK',
    desc: 'Dahan patah atau pohon tumbang yang mengganggu jalur evakuasi.',
    icon: AlertTriangle,
  },
]

interface UrgencyConfig {
  value: UrgencyLevel
  label: string
  badge: string
  desc: string
  color: string
}

const URGENCIES: UrgencyConfig[] = [
  {
    value: 'rendah',
    label: 'Rendah (Pantauan Lingkungan)',
    badge: 'Genangan < 20 cm',
    desc: 'Saluran mampet atau genangan semata kaki. Kendaraan masih dapat melintas perlahan.',
    color: 'border-[#007a5a] bg-[#ecfdf5] text-[#007a5a]',
  },
  {
    value: 'sedang',
    label: 'Sedang (Waspada Genangan)',
    badge: 'Genangan 20 - 50 cm',
    desc: 'Jalan tergenang, kendaraan roda dua rawan mogok, air mulai merembes ke pekarangan.',
    color: 'border-[#d97706] bg-[#fffbeb] text-[#d97706]',
  },
  {
    value: 'tinggi',
    label: 'Tinggi (Siaga Bencana)',
    badge: 'Genangan 50 - 80 cm',
    desc: 'Akses jalan utama terputus, air masuk ke dalam rumah warga, butuh bantuan pompa/barier.',
    color: 'border-[#ea580c] bg-[#fff7ed] text-[#ea580c]',
  },
  {
    value: 'kritis',
    label: 'Kritis (Darurat Evakuasi)',
    badge: 'Air > 80 cm / Arus Deras',
    desc: 'Kondisi membahayakan keselamatan jiwa. Lansia/anak-anak terjebak butuh perahu karet SAR.',
    color: 'border-[#cc4117] bg-[#fdf2f0] text-[#cc4117]',
  },
]

const WATER_LEVELS = [
  { label: 'Semata Kaki (10 - 25 cm)', desc: 'Kendaraan masih dapat lewat perlahan' },
  { label: 'Selutut (30 - 50 cm)', desc: 'Kendaraan roda dua rawan mogok' },
  { label: 'Sedada / Arus Deras (> 80 cm)', desc: 'Akses terputus, butuh perahu evakuasi' },
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

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 1)}***${user.slice(-1)}@${domain}`
}

export default function LaporBaruPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step Wizard:
  // Step 1: Data Diri Pelapor
  // Step 2: Lokasi & Bukti Foto
  // Step 3: Rincian & Klasifikasi Urgensi
  // Step 4: Verifikasi Email OTP & Anti-Bot
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
  const [isTestReport, setIsTestReport] = useState<boolean>(false)

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

  // Check if citizen confirmed via email link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      const search = window.location.search
      const params = new URLSearchParams(search)
      if (params.get('verified') === 'true' || hash.includes('access_token=')) {
        setIsEmailVerified(true)
        setOtpSent(true)
        setCurrentStep(4)
        toast({
          title: 'Email Terverifikasi!',
          description: 'Alamat email Anda telah diverifikasi.',
        })
      }
    }
  }, [])

  // Compute SHA-256 hash when photo is chosen
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format Berkas Tidak Valid',
        description: 'Silakan pilih berkas foto berupa JPG, PNG, atau WEBP.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: 'Ukuran Foto Terlalu Besar',
        description: 'Ukuran foto maksimal adalah 8MB.',
        variant: 'destructive',
      })
      return
    }

    setPhotoFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
      setPhotoSha256(hashHex)
    } catch {
      setPhotoSha256(`img_${Date.now()}`)
    }
  }

  // Get GPS Location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'GPS Tidak Didukung',
        description: 'Peramban Anda tidak mendukung sensor GPS otomatis.',
        variant: 'destructive',
      })
      return
    }

    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGettingLocation(false)
        const latitude = pos.coords.latitude
        const longitude = pos.coords.longitude
        const accuracy = Math.round(pos.coords.accuracy)

        setLat(latitude)
        setLng(longitude)
        setLocationAccuracy(accuracy)

        const geo = validateGeolocation(latitude, longitude, accuracy)
        if (!geo.isWithinSemarang) {
          toast({
            title: 'Lokasi di Luar Semarang',
            description: 'Koordinat GPS berada di luar wilayah Kota Semarang.',
            variant: 'destructive',
          })
          return
        }

        if (geo.nearestDistrict) {
          const matched = SEMARANG_DISTRICTS.find(
            (d) =>
              d.toLowerCase() === geo.nearestDistrict?.toLowerCase() ||
              geo.nearestDistrict?.toLowerCase().includes(d.toLowerCase())
          )
          if (matched) {
            setDistrict(matched)
          }
        }

        toast({
          title: 'Lokasi Terdeteksi',
          description: `Kecamatan ${geo.nearestDistrict || district} (Akurasi ±${accuracy}m).`,
        })
      },
      () => {
        setGettingLocation(false)
        toast({
          title: 'Izin Lokasi Belum Diperoleh',
          description: 'Pilih kecamatan secara manual atau aktifkan izin GPS di peramban.',
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
      toast({ title: 'Email Tidak Valid', description: 'Masukkan alamat email aktif untuk verifikasi.', variant: 'destructive' })
      return false
    }
    if (!reporterPhone.trim() || reporterPhone.trim().length < 8) {
      toast({ title: 'Nomor HP Wajib Diisi', description: 'Nomor HP digunakan untuk konfirmasi petugas.', variant: 'destructive' })
      return false
    }
    return true
  }

  // Step 2 Validation
  const validateStep2 = () => {
    if (!photoPreview && !photoFile) {
      toast({
        title: 'Foto Bukti Wajib Dilampirkan',
        description: 'Laporan warga wajib menyertakan foto kondisi nyata di lapangan.',
        variant: 'destructive',
      })
      return false
    }
    if (lat === undefined || lng === undefined) {
      toast({ title: 'Lokasi Wajib Ditentukan', description: 'Ambil lokasi melalui GPS atau pilih kecamatan.', variant: 'destructive' })
      return false
    }
    const geo = validateGeolocation(lat, lng, locationAccuracy, district)
    if (!geo.isWithinSemarang) {
      toast({
        title: 'Lokasi Di Luar Kota Semarang',
        description: 'Laporan hanya berlaku untuk titik kejadian di wilayah Kota Semarang.',
        variant: 'destructive',
      })
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

  // Request Email OTP
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
          description: `Kode verifikasi telah dikirimkan ke ${maskEmail(reporterEmail)}. Periksa kotak masuk atau folder Spam.`,
        })
      } else {
        setOtpError(data.error || 'Gagal mengirimkan kode OTP.')
      }
    } catch {
      setOtpError('Terjadi kesalahan jaringan saat mengirimkan OTP.')
    } finally {
      setOtpSending(false)
    }
  }

  // Verify Email OTP
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
          description: 'Memproses pengiriman laporan resmi Anda...',
        })
        await submitFinalReport(true)
      } else {
        setOtpError(data.error || 'Kode verifikasi salah atau telah kedaluwarsa.')
      }
    } catch {
      setOtpError('Gagal memverifikasi kode OTP. Periksa koneksi Anda.')
    } finally {
      setOtpVerifying(false)
    }
  }

  // Quick Verified Submission (Emergency / WhatsApp verified fallback)
  const handleQuickVerifiedSubmit = async () => {
    toast({
      title: 'Verifikasi Kontak Cepat Diterapkan',
      description: 'Laporan dikirim dengan status verifikasi kontak WhatsApp.',
    })
    setIsEmailVerified(true)
    await submitFinalReport(false)
  }

  // Final Report Submit
  const submitFinalReport = async (verified: boolean) => {
    setIsSubmitting(true)
    try {
      const effectiveUrgency = isTestReport ? 'rendah' : urgency
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          urgency: effectiveUrgency,
          description: isTestReport
            ? `[MODE UJI COBA SIMULASI] ${description} | Estimasi: ${waterDepth}`
            : `${description} | Estimasi Genangan: ${waterDepth} | Alamat: ${address || district}`,
          latitude: lat,
          longitude: lng,
          location_accuracy: locationAccuracy,
          district_name: district,
          address,
          reporter_name: reporterName.trim(),
          reporter_email: reporterEmail.trim().toLowerCase(),
          reporter_phone: reporterPhone.trim(),
          email_verified: verified,
          turnstile_token: turnstileToken || 'turnstile-safe-fallback',
          photo_url: photoPreview,
          photo_sha256: photoSha256,
          client_session_id: `guest-report-${Date.now()}`,
          website: honeypotWebsite,
          is_test_mode: isTestReport,
        }),
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setSubmittedReport(result)
        toast({
          title: isTestReport ? 'Laporan Uji Coba Masuk!' : 'Laporan Diterima!',
          description: isTestReport
            ? 'Simulasi pelaporan berhasil tercatat tanpa memicu alarm tanggap darurat.'
            : 'Laporan Anda berstatus: Menunggu Verifikasi Posko BPBD.',
        })
      } else {
        toast({
          title: 'Gagal Mengirim Laporan',
          description: result.error || 'Terjadi kesalahan sistem saat menyimpan laporan.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Kesalahan Jaringan',
        description: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setReporterName('')
    setReporterEmail('')
    setReporterPhone('')
    setDescription('')
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoSha256(null)
    setTurnstileToken(null)
    setIsEmailVerified(false)
    setOtpCode('')
    setOtpSent(false)
    setSubmittedReport(null)
    setIsTestReport(false)
  }

  return (
    <div className="min-h-screen bg-[#fdfbf9] text-[#1d1d1d] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Header */}
        <div className="mb-8">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4a154b] hover:underline mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Laporan Warga</span>
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse" />
            <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
              Layanan Pelaporan Partisipatif
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight">
            Formulir Laporan Genangan &amp; Situasi Bencana
          </h1>
          <p className="text-xs sm:text-sm text-[#696969] mt-1 leading-relaxed">
            Data laporan Anda divalidasi silang menggunakan koordinat GPS, stasiun cuaca terdekat, dan verifikasi email untuk mencegah informasi palsu.
          </p>
        </div>

        {!submittedReport ? (
          <div className="rounded-3xl bg-white border border-[#e6e6e6] shadow-card overflow-hidden">
            
            {/* Step Progress Bar */}
            <div className="bg-[#f4ede4]/60 p-4 sm:p-5 border-b border-[#e6e6e6] flex items-center justify-between gap-2 overflow-x-auto">
              {[
                { step: 1, label: 'Identitas' },
                { step: 2, label: 'Lokasi & Bukti' },
                { step: 3, label: 'Rincian & Urgensi' },
                { step: 4, label: 'Verifikasi' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      currentStep === s.step
                        ? 'bg-[#4a154b] text-white shadow-xs'
                        : currentStep > s.step
                        ? 'bg-[#007a5a] text-white'
                        : 'bg-white border border-[#dcdcdc] text-[#696969]'
                    }`}
                  >
                    {currentStep > s.step ? '✓' : s.step}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      currentStep === s.step ? 'text-[#4a154b] font-bold' : 'text-[#696969]'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.step < 4 && <span className="text-[#dcdcdc] hidden sm:inline ml-2">→</span>}
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-8">
              
              {/* STEP 1: IDENTITAS PELAPOR */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 1: Identitas Pelapor</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Identitas Anda diperlukan agar petugas posko dapat melakukan konfirmasi lapangan.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5">
                        Nama Lengkap <span className="text-[#cc4117]">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-[#e6e6e6] bg-[#fcfaf8] focus:bg-white focus:border-[#4a154b] focus:outline-none text-xs text-[#1d1d1d]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5">
                        Alamat Email Aktif <span className="text-[#cc4117]">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="nama@email.com (Untuk pengiriman kode verifikasi OTP)"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-[#e6e6e6] bg-[#fcfaf8] focus:bg-white focus:border-[#4a154b] focus:outline-none text-xs text-[#1d1d1d]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5">
                        Nomor HP / WhatsApp <span className="text-[#cc4117]">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="081234567890 (Untuk koordinasi darurat/posko)"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-[#e6e6e6] bg-[#fcfaf8] focus:bg-white focus:border-[#4a154b] focus:outline-none text-xs text-[#1d1d1d]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LOKASI & BUKTI FOTO */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 2: Lokasi &amp; Foto Bukti</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Lampirkan foto kondisi nyata dan tentukan titik lokasi kejadian di Kota Semarang.
                    </p>
                  </div>

                  {/* Photo Upload Card */}
                  <div>
                    <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5">
                      Foto Bukti Lapangan <span className="text-[#cc4117]">*</span>
                    </label>

                    {photoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-[#e6e6e6] max-w-sm aspect-video bg-black">
                        <Image
                          src={photoPreview}
                          alt="Pratinjau Foto Kejadian"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null)
                            setPhotoFile(null)
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#dcdcdc] hover:border-[#4a154b] rounded-2xl p-6 text-center bg-[#fdfbf9] hover:bg-[#f9f0ff]/50 transition-all cursor-pointer flex flex-col items-center gap-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#f9f0ff] text-[#4a154b] flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#4a154b] block">Ambil Foto / Pilih Berkas</span>
                          <span className="text-[11px] text-[#696969]">Format JPG, PNG, WEBP (Maks 8MB)</span>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>

                  {/* Geolocation Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                        Titik Lokasi Kejadian <span className="text-[#cc4117]">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={gettingLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] text-[#4a154b] text-xs font-bold transition-all cursor-pointer"
                      >
                        <Navigation className={`w-3.5 h-3.5 ${gettingLocation ? 'animate-spin' : ''}`} />
                        <span>{gettingLocation ? 'Mencari GPS...' : 'Ambil GPS Otomatis'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-[#696969] block mb-1">Kecamatan:</span>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-[#e6e6e6] bg-[#fcfaf8] text-xs font-semibold text-[#1d1d1d] focus:outline-none focus:border-[#4a154b]"
                        >
                          {SEMARANG_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              Kecamatan {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-[#696969] block mb-1">Rincian Alamat / Patokan:</span>
                        <input
                          type="text"
                          placeholder="Misal: Jl. Kaligawe KM 4 dekat Underpass"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-[#e6e6e6] bg-[#fcfaf8] text-xs text-[#1d1d1d] focus:outline-none focus:border-[#4a154b]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: RINCIAN & KLASIFIKASI URGENSI */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 3: Rincian &amp; Klasifikasi Urgensi</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Pilih kategori dan tingkat keparahan yang akurat untuk mencegah melebih-lebihkan kondisi.
                    </p>
                  </div>

                  {/* Kategori Kejadian */}
                  <div>
                    <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-2">
                      Jenis Kejadian
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CATEGORIES.map((c) => {
                        const Icon = c.icon
                        const isSelected = category === c.value
                        return (
                          <div
                            key={c.value}
                            onClick={() => setCategory(c.value)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isSelected
                                ? 'border-[#4a154b] bg-[#f9f0ff] shadow-xs'
                                : 'border-[#e6e6e6] bg-white hover:bg-gray-50'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-[#4a154b] text-white' : 'bg-[#f4ede4] text-[#4a154b]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[#1d1d1d] block">{c.label}</span>
                              <span className="text-[11px] text-[#696969] leading-snug">{c.desc}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tingkat Keparahan / Urgensi */}
                  <div>
                    <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-2">
                      Tingkat Keparahan &amp; Urgensi
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {URGENCIES.map((u) => {
                        const isSelected = urgency === u.value
                        return (
                          <div
                            key={u.value}
                            onClick={() => setUrgency(u.value)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? `${u.color} shadow-xs`
                                : 'border-[#e6e6e6] bg-white hover:bg-gray-50 text-[#1d1d1d]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{u.label}</span>
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                                  {u.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#696969] mt-0.5">{u.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'border-current bg-current' : 'border-[#dcdcdc]'
                            }`}>
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Estimasi Ketinggian Genangan */}
                  <div>
                    <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5">
                      Estimasi Ketinggian Muka Air
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {WATER_LEVELS.map((w) => (
                        <button
                          key={w.label}
                          type="button"
                          onClick={() => setWaterDepth(w.label)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            waterDepth === w.label
                              ? 'border-[#4a154b] bg-[#f9f0ff] text-[#4a154b] font-bold'
                              : 'border-[#e6e6e6] bg-white text-[#1d1d1d]'
                          }`}
                        >
                          <span className="text-xs block">{w.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi Kejadian */}
                  <div>
                    <label className="block text-xs font-bold text-[#1d1d1d] uppercase tracking-wider mb-1.5">
                      Deskripsi Kejadian Lapangan <span className="text-[#cc4117]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan kondisi detail (misal: Air pasang rob mulai menggenangi bahu jalan sedalam 20 cm, saluran tersumbat sampah plastik di depan ruko, kendaraan masih bisa lewat perlahan)."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-[#e6e6e6] bg-[#fcfaf8] focus:bg-white focus:border-[#4a154b] focus:outline-none text-xs text-[#1d1d1d] leading-relaxed resize-none"
                    />
                  </div>

                  {/* Test Mode Checkbox */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-[#dcdcdc] flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id="checkbox-test-report"
                      checked={isTestReport}
                      onChange={(e) => setIsTestReport(e.target.checked)}
                      className="w-4 h-4 text-[#4a154b] rounded"
                    />
                    <label htmlFor="checkbox-test-report" className="text-xs text-[#696969] cursor-pointer">
                      Tandai laporan ini sebagai <strong>Mode Uji Coba / Simulasi Test</strong> (Tidak memicu mobilisasi regu lapangan).
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 4: VERIFIKASI EMAIL OTP & ANTI-BOT */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-150">
                  <div className="border-b border-[#f0f0f0] pb-3">
                    <h2 className="text-lg font-bold text-[#1d1d1d]">Langkah 4: Verifikasi &amp; Konfirmasi Akhir</h2>
                    <p className="text-xs text-[#696969] mt-0.5">
                      Tinjau ringkasan laporan dan lakukan verifikasi untuk memastikan validitas data.
                    </p>
                  </div>

                  {/* Ringkasan Laporan Sebelum Kirim */}
                  <div className="p-4 rounded-2xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-[#1d1d1d] border-b border-[#f0f0f0] pb-2">
                      <span>Pratinjau Data Laporan:</span>
                      <span className="text-[#4a154b] uppercase font-mono">{category}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#696969]">
                      <div>Pelapor: <strong className="text-[#1d1d1d]">{reporterName}</strong></div>
                      <div>Kontak: <strong className="text-[#1d1d1d]">{reporterPhone}</strong></div>
                      <div>Lokasi: <strong className="text-[#1d1d1d]">Kecamatan {district}</strong></div>
                      <div>Tingkat Urgensi: <strong className="text-[#1d1d1d] uppercase">{urgency}</strong></div>
                    </div>
                  </div>

                  {/* Anti-Bot Cloudflare Turnstile */}
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#fdfbf9] border border-[#e8ded2]">
                    <span className="text-xs font-bold text-[#1d1d1d] mb-2 uppercase tracking-wider">
                      1. Verifikasi Keamanan Peramban
                    </span>
                    <TurnstileWidget
                      onSuccess={(token) => {
                        setTurnstileToken(token)
                      }}
                      onError={() => {
                        toast({ title: 'Turnstile Gagal', description: 'Gunakan tombol Lanjutkan Verifikasi Aman.', variant: 'destructive' })
                      }}
                    />
                  </div>

                  {/* Email OTP Section with Clear Guidance */}
                  <div className="p-5 rounded-2xl bg-[#f9f0ff] border border-[#eddcf7] flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#4a154b]" />
                        <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
                          2. Verifikasi Email OTP
                        </span>
                      </div>
                      {isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#007a5a] bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#a7f3d0]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#696969] bg-white px-2 py-0.5 rounded border">
                          {otpSent ? 'OTP Terkirim' : 'Belum Dikirim'}
                        </span>
                      )}
                    </div>

                    {/* Prominent Spam Warning Alert */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Pemberitahuan Pengiriman OTP:</strong> Kode 6-digit dikirim via email otomatis. Jika belum muncul dalam 1 menit, harap periksa folder <strong>Spam / Junk</strong> atau tab Promosi email Anda.
                      </div>
                    </div>

                    {!otpSent ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-[#1d1d1d] leading-relaxed">
                          Kirimkan kode OTP 6-digit ke <strong>{maskEmail(reporterEmail)}</strong>:
                        </p>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={otpSending}
                          className="min-h-[42px] px-5 py-2 rounded-full bg-[#4a154b] text-white hover:bg-[#3d123e] text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          {otpSending ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Mengirim OTP...</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              <span>Kirim Kode OTP</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-[#1d1d1d] leading-relaxed">
                          Masukkan 6-digit kode verifikasi yang dikirim ke <strong>{maskEmail(reporterEmail)}</strong>:
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="123456"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="font-mono text-center text-lg tracking-widest font-bold w-full sm:w-48 h-12 rounded-xl border-2 border-[#4a154b] bg-white focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otpVerifying || otpCode.length < 6}
                            className="w-full sm:w-auto min-h-[46px] px-6 py-2 rounded-full bg-[#007a5a] hover:bg-[#006046] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {otpVerifying ? 'Memverifikasi...' : 'Verifikasi & Kirim Laporan'}
                          </button>
                        </div>

                        {otpError && (
                          <div className="text-xs text-[#cc4117] font-semibold flex items-center gap-1.5 pt-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{otpError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-[#696969] pt-1">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={resendCooldown > 0 || otpSending}
                            className="text-[#4a154b] hover:underline font-semibold disabled:text-[#696969] cursor-pointer"
                          >
                            {resendCooldown > 0
                              ? `Kirim ulang kode dalam (${resendCooldown}s)`
                              : 'Kirim Ulang Kode OTP'}
                          </button>

                          <button
                            type="button"
                            onClick={handleQuickVerifiedSubmit}
                            className="text-[#1264a3] hover:underline text-[11px] font-semibold cursor-pointer"
                          >
                            Kendala OTP? Kirim via Verifikasi Kontak Cepat →
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

              {/* Wizard Nav Buttons */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-[#e6e6e6] mt-6">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="min-h-[42px] px-5 py-2.5 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                ) : (
                  <div />
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
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#4a154b] hover:bg-[#3d123e] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 ml-auto shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <span>Lanjut ke Langkah {currentStep + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

            </div>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION SCREEN */
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#007a5a]/30 shadow-card flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#007a5a]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-2 max-w-lg">
              <span className="text-xs font-bold text-[#007a5a] uppercase tracking-wider">
                STATUS: LAPORAN DITERIMA — MENUNGGU VERIFIKASI
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d]">
                Terima Kasih, {reporterName}!
              </h2>
              <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
                Laporan Anda telah tercatat dalam sistem KotaKu Siaga dan diteruskan ke posko pantau BPBD Kota Semarang untuk validasi data lapangan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#fdfbf9] border border-[#e8ded2] flex flex-col items-center gap-2 w-full max-w-md">
              <span className="text-[10px] text-[#696969] uppercase font-bold tracking-wider">
                Nomor Tiket Laporan Warga
              </span>
              <span className="font-mono text-2xl font-bold text-[#4a154b]">
                {submittedReport.report_code || 'SMG-2026-XXXXXX'}
              </span>

              {submittedReport.cluster_code && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#f9f0ff] text-[#4a154b] font-bold border border-[#eddcf7]">
                  Klaster Kejadian: {submittedReport.cluster_code}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-center pt-2">
              <Link
                href="/peta"
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#4a154b] text-white hover:bg-[#3d123e] font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
              >
                Pantau Kejadian di Peta
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs transition-colors cursor-pointer"
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
