'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReportCategory, UrgencyLevel, Report } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS } from '@/types'
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
  Bot,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'

const CATEGORIES = [
  {
    value: 'banjir' as ReportCategory,
    label: 'Banjir Rob Pesisir',
    code: 'ROB-HYDRO',
    desc: 'Air laut meluap di Tanjung Emas, Kaligawe, Genuk & sekitarnya.',
    icon: Waves,
  },
  {
    value: 'genangan' as ReportCategory,
    label: 'Genangan Drainase',
    code: 'DRAIN-FL',
    desc: 'Antrean air hujan/saluran kota tumpah menggenangi badan jalan protokol.',
    icon: Droplets,
  },
  {
    value: 'longsor' as ReportCategory,
    label: 'Longsor Tebing',
    code: 'SLOPE-GEO',
    desc: 'Rekahan tanah & lereng rawan runtuh di wilayah perbukitan Candisari/Gombel.',
    icon: Mountain,
  },
  {
    value: 'pohon_tumbang' as ReportCategory,
    label: 'Pohon Tumbang',
    code: 'VEG-BLOCK',
    desc: 'Dahan patah/batang menimpa kabel PLN atau menutup arus evakuasi jalan.',
    icon: AlertTriangle,
  },
  {
    value: 'drainase_tersumbat' as ReportCategory,
    label: 'Saluran Tersumbat',
    code: 'TRASH-CLOG',
    desc: 'Sampah atau sedimen lumpur menyumbat gorong-gorong drainase pemukiman.',
    icon: Wrench,
  },
]

const WATER_LEVELS = [
  { label: 'Semata Kaki (10 - 25 cm)', desc: 'Jalan masih bisa dilewati perlahan', icon: 'directions_walk' },
  { label: 'Selutut (30 - 50 cm)', desc: 'Kendaraan roda dua rawan mogok, air masuk teras', icon: 'accessible' },
  { label: 'Sedada / Arus Kuat (>80 cm)', desc: 'Akses terputus total, butuh perahu evakuasi BPBD', icon: 'pool' },
]

export default function LaporCepatPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form Wizard State (Step 1-4)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [category, setCategory] = useState<ReportCategory>('banjir')
  const [urgency, setUrgency] = useState<UrgencyLevel>('sedang')
  const [waterDepth, setWaterDepth] = useState<string>('Semata Kaki (10 - 25 cm)')
  const [district, setDistrict] = useState<string>('Genuk')
  const [address, setAddress] = useState<string>('')
  const [lat, setLat] = useState<number>(-6.9667)
  const [lng, setLng] = useState<number>(110.4667)
  const [description, setDescription] = useState<string>('')
  const [reporterName, setReporterName] = useState<string>('')
  const [reporterContact, setReporterContact] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Honeypot Field for anti-bot trap
  const [honeypotWebsite, setHoneypotWebsite] = useState<string>('')

  // Geolocation helper state
  const [gettingLocation, setGettingLocation] = useState<boolean>(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
  const [trackingCode, setTrackingCode] = useState<string>('')
  const [verificationSummary, setVerificationSummary] = useState<any>(null)

  // AI Triage classification state
  const [aiTriage, setAiTriage] = useState<any>(null)
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false)

  // Public reports stream
  const [publicReports, setPublicReports] = useState<Report[]>([])

  useEffect(() => {
    fetch('/api/reports?limit=5')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setPublicReports(data.data)
        }
      })
      .catch((err) => console.warn('Gagal memuat feed laporan:', err))
  }, [])

  const isFloodCategory = category === 'banjir' || category === 'genangan'

  const handleGetLocation = () => {
    setGettingLocation(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
          setAccuracy(pos.coords.accuracy)
          setGettingLocation(false)
          toast({ title: `Koordinat GPS terbaca akurat (±${Math.round(pos.coords.accuracy)}m)` })
        },
        () => {
          setGettingLocation(false)
          setLat(-6.9667)
          setLng(110.4667)
          setAccuracy(null)
          toast({ title: 'Menggunakan koordinat pesisir Genuk/Semarang' })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setGettingLocation(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPhoto(file)
    setPhotoPreview(preview)
  }

  const handleSubmit = async () => {
    if (!description.trim() && description.length < 5) {
      toast({
        title: 'Deskripsi singkat diperlukan',
        description: 'Mohon tuliskan 1-2 kalimat mengenai kondisi lapangan.',
        variant: 'destructive',
      })
      setCurrentStep(4)
      return
    }

    setIsSubmitting(true)
    try {
      let photoUrl: string | null = null
      let photoDhash: string | null = null
      let photoSha256: string | null = null
      let photoTakenAt: string | null = null

      if (photo) {
        const fd = new FormData()
        fd.append('file', photo)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          photoUrl = uploadData.url
          photoDhash = uploadData.dhash || null
          photoSha256 = uploadData.sha256 || null
          photoTakenAt = uploadData.photo_taken_at || (photo ? new Date(photo.lastModified).toISOString() : null)
        }
      }

      const generatedCode = `SMG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
      const resolvedWaterDepth = isFloodCategory ? waterDepth : 'Tidak berlaku'

      const payload = {
        category,
        description: `[${resolvedWaterDepth}] ${description}`,
        latitude: lat,
        longitude: lng,
        location_accuracy: accuracy,
        urgency,
        reporter_name: isAnonymous ? 'Warga Semarang (Anonim)' : reporterName || 'Warga Semarang',
        reporter_contact: isAnonymous ? null : reporterContact || null,
        photo_url: photoUrl,
        photo_dhash: photoDhash,
        photo_sha256: photoSha256,
        photo_taken_at: photoTakenAt,
        district_name: district,
        address: address || `Kecamatan ${district}, Kota Semarang`,
        website: honeypotWebsite, // Anti-bot honeypot
        reported_at: new Date().toISOString(),
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.status === 429) {
        toast({
          title: 'Batas Pengiriman Tercapai',
          description: data.error || 'Terlalu banyak laporan dikirim dalam waktu singkat. Silakan coba kembali beberapa saat lagi.',
          variant: 'destructive',
        })
        return
      }

      if (data.success) {
        setTrackingCode(data.report_code || data.data?.report_code || generatedCode)
        if (data.verification_summary) {
          setVerificationSummary(data.verification_summary)
        }
        setSubmitSuccess(true)

        // Trigger AI triage classification via OpenRouter
        setIsAnalyzingAi(true)
        fetch('/api/ai/analyze-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            description: `[${waterDepth}] ${description}`,
            latitude: lat,
            longitude: lng,
            urgency,
          }),
        })
          .then((r) => r.json())
          .then((aiRes) => {
            if (aiRes.success && aiRes.analysis) {
              setAiTriage(aiRes.analysis)
            }
          })
          .catch((err) => console.warn('AI Triage error:', err))
          .finally(() => setIsAnalyzingAi(false))

        // Refresh public reports
        fetch('/api/reports?limit=10')
          .then((r) => r.json())
          .then((d) => d.success && setPublicReports(d.data))
      } else {
        toast({
          title: 'Gagal mengirim laporan',
          description: data.error || 'Terjadi gangguan koneksi.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Kesalahan Sistem',
        description: 'Terjadi kegagalan jaringan saat mengirim laporan.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setSubmitSuccess(false)
    setDescription('')
    setPhoto(null)
    setPhotoPreview(null)
    setAiTriage(null)
    setIsAnalyzingAi(false)
  }

  return (
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* BANNER CIVIC RESILIENCE with Pastel-Mesh Atmospheric Backdrop */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f4ede4] via-[#f9f0ff] to-[#f4ede4] border border-[#e6e6e6] p-6 sm:p-8 shadow-subtle">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] uppercase tracking-[0.96px] px-3.5 py-1 rounded-[90px] bg-white text-[#4a154b] border border-[#e6e6e6] font-bold shadow-2xs">
                  Gotong Royong Warga
                </span>
                <span className="text-xs text-[#696969] font-medium ml-1">
                  • Tanpa Perlu Login • Perlindungan Privasi
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[28px] sm:text-[34px] font-bold text-[#4a154b] tracking-[-0.6px] leading-[1.2]">
                  Pelaporan Cepat Tanggap Iklim & Rob Semarang
                </h1>
                <p className="text-[15px] sm:text-[16px] text-[#1d1d1d] leading-[1.55]">
                  Laporan Anda memandu pompa air polder dan relawan evakuasi BPBD bergerak dalam hitungan menit secara deterministik.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-[#e6e6e6] text-xs">
                  <span className="material-symbols-outlined text-[#007a5a] text-[18px]">volunteer_activism</span>
                  <span className="font-medium text-[#1d1d1d]">Inklusif Warga</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-[#e6e6e6] text-xs">
                  <span className="material-symbols-outlined text-[#4a154b] text-[18px]">verified</span>
                  <span className="font-medium text-[#1d1d1d]">Standar ISO 37120</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-full border border-[#e6e6e6] text-xs">
                  <span className="material-symbols-outlined text-[#b45309] text-[18px]">speed</span>
                  <span className="font-medium text-[#1d1d1d]">SLA Verifikasi &lt;15 Mnt</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative overflow-hidden rounded-[16px] border border-[#e6e6e6] shadow-sm group h-52 lg:h-60 bg-white flex items-center justify-center">
                <Image
                  src="/images/civic-illustration.png"
                  alt="Semarang Bersama Warga Tanggap Bencana"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                  <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[#4a154b] text-xs font-bold shadow-subtle">
                    <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
                    Semarang Siaga Bersama
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEPPER FORM WIZARD */}
        {!submitSuccess ? (
          <div className="flex flex-col gap-6">
            {/* STEP INDICATOR PILLS */}
            <div className="w-full bg-white rounded-[16px] p-2.5 sm:p-4 border border-[#e6e6e6] shadow-subtle">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                {[
                  { step: 1, label: 'Langkah 1', name: 'Kategori' },
                  { step: 2, label: 'Langkah 2', name: 'Bahaya' },
                  { step: 3, label: 'Langkah 3', name: 'Lokasi' },
                  { step: 4, label: 'Langkah 4', name: 'Foto & Bukti' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    type="button"
                    className={`min-h-[48px] flex items-center justify-center sm:justify-start gap-2 p-2 sm:p-3 rounded-[90px] text-left transition-all ${
                      currentStep === s.step
                        ? 'bg-[#4a154b] text-white font-bold shadow-sm'
                        : currentStep > s.step
                        ? 'bg-[#f9f0ff] text-[#4a154b] font-semibold'
                        : 'text-[#696969] hover:bg-[#f4ede4]'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-bold shrink-0 ${
                        currentStep === s.step
                          ? 'bg-white text-[#4a154b]'
                          : 'bg-[#f4ede4] text-[#1d1d1d]'
                      }`}
                    >
                      {currentStep > s.step ? '✓' : s.step}
                    </span>
                    <div className="hidden sm:flex flex-col min-w-0">
                      <span className="text-[10px] uppercase tracking-wider opacity-80">{s.label}</span>
                      <span className="text-xs truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="bg-white rounded-[16px] p-6 sm:p-10 border border-[#e6e6e6] shadow-card min-h-[420px] flex flex-col justify-between relative">
              {/* Anti-Bot Honeypot Field */}
              <input
                type="text"
                name="website"
                value={honeypotWebsite}
                onChange={(e) => setHoneypotWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  opacity: 0,
                  pointerEvents: 'none',
                  left: '-9999px',
                  width: '1px',
                  height: '1px',
                }}
              />

              {/* STEP 1: KATEGORI MASALAH */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1d1d1d]">
                      Pilih Kategori Kejadian Lapangan
                    </h2>
                    <p className="text-xs sm:text-sm text-[#696969] mt-1">
                      Pilih kategori yang paling sesuai dengan kejadian yang Anda saksikan di lapangan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isSelected = category === cat.value
                      return (
                        <label
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`cursor-pointer relative flex flex-col justify-between p-5 rounded-[16px] border transition-all ${
                            isSelected
                              ? 'bg-[#f9f0ff] border-[#4a154b] shadow-sm ring-1 ring-[#4a154b]'
                              : 'bg-white border-[#e6e6e6] hover:bg-[#fdfbf9]'
                          }`}
                        >
                          <div>
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                                isSelected ? 'bg-[#4a154b] text-white' : 'bg-[#f4ede4] text-[#4a154b]'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-base text-[#1d1d1d]">{cat.label}</h3>
                            <p className="text-xs text-[#696969] mt-1 leading-relaxed">
                              {cat.desc}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] text-[#4a154b] font-bold">
                              KODE: {cat.code}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#4a154b]" />}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: TINGKAT BAHAYA */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                  {isFloodCategory ? (
                    <>
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1d1d1d]">
                          Perkiraan Ketinggian Air Lapangan
                        </h2>
                        <p className="text-xs sm:text-sm text-[#696969] mt-1">
                          Tentukan ketinggian genangan air untuk memprioritaskan pompa air dan regu evakuasi BPBD.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {WATER_LEVELS.map((w) => {
                          const isSelected = waterDepth === w.label
                          return (
                            <div
                              key={w.label}
                              onClick={() => setWaterDepth(w.label)}
                              className={`cursor-pointer p-5 rounded-[16px] border transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#f9f0ff] border-[#4a154b] shadow-sm ring-1 ring-[#4a154b]'
                                  : 'bg-white border-[#e6e6e6] hover:bg-[#fdfbf9]'
                              }`}
                            >
                              <div className="flex flex-col gap-2">
                                <div className="w-10 h-10 rounded-xl bg-[#f4ede4] text-[#4a154b] flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[22px]">{w.icon}</span>
                                </div>
                                <h4 className="font-bold text-sm text-[#1d1d1d]">{w.label}</h4>
                                <p className="text-xs text-[#696969] leading-relaxed">{w.desc}</p>
                              </div>
                              {isSelected && (
                                <div className="mt-3 text-right">
                                  <span className="text-[10px] font-bold text-[#4a154b] uppercase">Dipilih</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[16px] border border-[#e6e6e6] bg-[#f4ede4] p-5">
                      <h2 className="font-bold text-base text-[#1d1d1d]">
                        Kategori Terpilih: {CATEGORY_LABELS[category]}
                      </h2>
                      <p className="text-xs text-[#696969] mt-1">
                        Pilihan ini tidak memerlukan estimasi kedalaman air. Lanjutkan dengan memilih tingkat urgensi penanganan.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5 pt-2">
                    <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Tingkat Urgensi Penanganan:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['rendah', 'sedang', 'tinggi', 'kritis'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUrgency(u)}
                          className={`min-h-[48px] py-2.5 px-4 rounded-[90px] text-xs font-bold uppercase transition-all ${
                            urgency === u
                              ? u === 'kritis'
                                ? 'bg-[#cc4117] text-white shadow-sm'
                                : u === 'tinggi'
                                ? 'bg-[#d97706] text-white shadow-sm'
                                : 'bg-[#4a154b] text-white shadow-sm'
                              : 'bg-[#f4ede4] text-[#1d1d1d] hover:bg-[#e8ded2]'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: GEOLOKASI */}
              {currentStep === 3 && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1d1d1d]">
                      Tentukan Titik Lokasi Kejadian
                    </h2>
                    <p className="text-xs sm:text-sm text-[#696969] mt-1">
                      Pilih kecamatan dan gunakan koordinat GPS untuk akurasi respons dinas terkait.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                        Kecamatan di Semarang
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-white border border-[#e6e6e6] text-[#1d1d1d] text-sm focus:outline-none focus:border-[#4a154b]"
                      >
                        {[
                          'Semarang Utara',
                          'Genuk',
                          'Semarang Timur',
                          'Gayamsari',
                          'Tembalang',
                          'Semarang Barat',
                          'Pedurungan',
                          'Candisari',
                          'Ngaliyan',
                          'Gajahmungkur',
                          'Semarang Tengah',
                          'Semarang Selatan',
                          'Banyumanik',
                          'Tugu',
                          'Gunungpati',
                          'Mijen',
                        ].map((d) => (
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
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Contoh: Depan RSI Sultan Agung, Jl. Kaligawe"
                        className="w-full h-12 px-4 rounded-xl bg-white border border-[#e6e6e6] text-[#1d1d1d] text-sm focus:outline-none focus:border-[#4a154b]"
                      />
                    </div>
                  </div>

                  {/* GPS Box */}
                  <div className="p-5 rounded-[16px] bg-[#f4ede4] border border-[#e8ded2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
                          Koordinat GPS
                        </span>
                        {accuracy !== null && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#007a5a] font-bold border border-[#d1fae5]">
                            ±{Math.round(accuracy)}m (Akurat)
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-[#1d1d1d] mt-1 font-semibold">
                        Lat: {lat.toFixed(5)}, Long: {lng.toFixed(5)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="min-h-[48px] px-5 py-2.5 rounded-[90px] bg-[#4a154b] text-white font-bold text-xs flex items-center gap-2 hover:bg-[#481a54] transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>{gettingLocation ? 'Membaca GPS...' : 'Ambil Lokasi Saya'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: FOTO & CATATAN */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1d1d1d]">
                      Foto Bukti & Catatan Kejadian
                    </h2>
                    <p className="text-xs sm:text-sm text-[#696969] mt-1">
                      Lampirkan foto situasi lapangan (jika ada) dan jelaskan kondisi secara ringkas.
                    </p>
                  </div>

                  {/* Description input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Catatan Situasi Lapangan *
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan kondisi: contoh debit air terus meninggi, arus deras menggenangi badan jalan, gorong-gorong tertutup sampah ranting..."
                      className="w-full p-4 rounded-xl bg-white border border-[#e6e6e6] text-[#1d1d1d] text-sm focus:outline-none focus:border-[#4a154b]"
                    />
                  </div>

                  {/* Photo Upload Area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                      Foto Bukti Lapangan (Opsional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />

                    {photoPreview ? (
                      <div className="relative h-48 w-full sm:w-80 rounded-[16px] overflow-hidden border border-[#e6e6e6] bg-[#f4ede4]">
                        <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null)
                            setPhotoPreview(null)
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-[#cc4117]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-8 rounded-[16px] border-2 border-dashed border-[#e6e6e6] hover:border-[#4a154b] bg-[#fdfbf9] hover:bg-[#f9f0ff] flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Camera className="w-7 h-7 text-[#4a154b]" />
                        <span className="text-sm text-[#1d1d1d] font-bold">Pilih atau Ambil Foto</span>
                        <span className="text-xs text-[#696969]">Maksimal 5MB (JPG/PNG)</span>
                      </button>
                    )}
                  </div>

                  {/* Anonymity toggle */}
                  <div className="p-4 rounded-[16px] bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1d1d1d]">Kirim Secara Anonim</span>
                      <p className="text-xs text-[#696969] mt-0.5">
                        Identitas pribadi Anda tidak akan disimpan atau dipublikasikan.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 accent-[#4a154b] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* WIZARD NAVIGATION CONTROLS */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-[#e6e6e6] mt-6 flex-wrap sm:flex-nowrap">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="min-h-[48px] px-6 py-3 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs flex items-center gap-2 transition-colors"
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
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 ml-auto transition-all active:scale-[0.98]"
                  >
                    Lanjut Langkah {currentStep + 1}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] text-white font-bold text-xs uppercase tracking-wider shadow-cta flex items-center gap-2 ml-auto transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        Mengirim Laporan...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Kirim Laporan Lapangan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION SCREEN */
          <div className="p-8 sm:p-14 rounded-[20px] bg-white border border-[#007a5a]/30 shadow-card flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#ecfdf5] border border-[#d1fae5] flex items-center justify-center text-[#007a5a]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="flex flex-col gap-2 max-w-lg">
              <span className="text-xs font-bold text-[#007a5a] uppercase tracking-wider">
                LAPORAN BERHASIL TERSIMPAN DI EOC
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d]">
                Terima Kasih Atas Partisipasi Anda!
              </h2>
              <p className="text-sm text-[#696969] leading-relaxed">
                Laporan Anda telah tercatat dengan nomor tiket resmi dan masuk dalam antrean verifikasi tim BPBD Kota Semarang.
              </p>
            </div>

            <div className="p-5 rounded-[16px] bg-[#f4ede4] border border-[#e8ded2] flex flex-col items-center gap-2 w-full max-w-md">
              <span className="text-[10px] text-[#696969] uppercase font-bold tracking-wider">
                Kode Pelacakan Laporan
              </span>
              <span className="font-mono text-2xl font-bold text-[#4a154b]">
                {trackingCode}
              </span>
              {verificationSummary && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-3 py-1 rounded-full bg-white text-[#007a5a] font-bold border border-[#d1fae5]">
                    Skor Kredibilitas: {verificationSummary.score}/100
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center pt-2">
              <Link
                href="/peta"
                className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                Pantau di Peta Spasial
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[48px] px-6 py-3 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-bold text-xs transition-colors"
              >
                Kirim Laporan Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
