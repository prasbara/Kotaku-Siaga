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
    color: 'text-primary',
  },
  {
    value: 'genangan' as ReportCategory,
    label: 'Genangan Drainase',
    code: 'DRAIN-FL',
    desc: 'Antrean air hujan/saluran kota tumpah menggenangi badan jalan protokol.',
    icon: Droplets,
    color: 'text-secondary',
  },
  {
    value: 'longsor' as ReportCategory,
    label: 'Longsor Tebing',
    code: 'SLOPE-GEO',
    desc: 'Rekahan tanah & lereng rawan runtuh di wilayah perbukitan Candisari/Gombel.',
    icon: Mountain,
    color: 'text-tertiary',
  },
  {
    value: 'pohon_tumbang' as ReportCategory,
    label: 'Pohon Tumbang',
    code: 'VEG-BLOCK',
    desc: 'Dahan patah/batang menimpa kabel PLN atau menutup arus evakuasi jalan.',
    icon: AlertTriangle,
    color: 'text-error',
  },
  {
    value: 'drainase_tersumbat' as ReportCategory,
    label: 'Saluran Tersumbat',
    code: 'TRASH-CLOG',
    desc: 'Sampah atau sedimen lumpur menyumbat gorong-gorong drainase pemukiman.',
    icon: Wrench,
    color: 'text-primary',
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
  const [trackingCode, setTrackingCode] = useState<string>('')
  const [gettingLocation, setGettingLocation] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [honeypotWebsite, setHoneypotWebsite] = useState<string>('')
  const [verificationSummary, setVerificationSummary] = useState<{
    score: number
    confidence_level: string
    positive_evidence: string[]
    warnings: string[]
  } | null>(null)
  const [aiTriage, setAiTriage] = useState<{
    classification: string
    severity: string
    confidence: number
    summary: string
    recommended_action: string
  } | null>(null)
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)

  // Public Audit Trail reports feed
  const [publicReports, setPublicReports] = useState<Report[]>([])

  useEffect(() => {
    fetch('/api/reports?limit=10')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPublicReports(data.data)
      })
      .catch((err) => console.error(err))
  }, [])

  const handleGetLocation = () => {
    setGettingLocation(true)
    if (navigator.geolocation) {
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

      const payload = {
        category,
        description: `[${waterDepth}] ${description}`,
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
    } catch (err) {
      toast({
        title: 'Terjadi kesalahan sistem',
        description: 'Silakan coba beberapa saat lagi.',
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
    <div className="flex flex-col w-full bg-surface text-on-surface min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        {/* BANNER KONSISTENSI CIVIC INCLUSIVITY */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low border border-outline-variant/30 p-6 sm:p-8 shadow-md">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 rounded bg-secondary-container/20 text-secondary border border-secondary/30 font-bold">
                  Gotong Royong Warga
                </span>
                <span className="font-mono text-xs text-on-surface-variant">
                  • Tanpa Perlu Login • Anonimitas Aman Terjamin
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  Pelaporan Cepat Tanggap Iklim & Rob Semarang
                </h1>
                <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  Kepedulian Anda menyelamatkan sesama. Laporan lapangan Anda memandu pompa air BBWS dan relawan evakuasi BPBD bergerak dalam hitungan menit secara deterministik.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs">
                  <span className="material-symbols-outlined text-secondary text-[18px]">volunteer_activism</span>
                  <span className="font-medium text-on-surface">Inklusif & Ramah Warga</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                  <span className="font-medium text-on-surface">Standar ISO 37120 / BPBD EOC</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">speed</span>
                  <span className="font-medium text-on-surface">SLA Verifikasi &lt;15 Mnt</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative overflow-hidden rounded-xl border border-outline-variant/40 shadow-xl group h-56 lg:h-64 bg-surface-container flex items-center justify-center">
                <Image
                  src="/images/civic-illustration.png"
                  alt="Semarang Bersama Warga Tanggap Bencana"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent flex items-end p-3">
                  <div className="flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-lg text-secondary border border-secondary/30 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    Semarang Tangguh & Siaga Bersama
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIEW 1: STEPPER FORM WIZARD */}
        {!submitSuccess ? (
          <div className="flex flex-col gap-6">
            {/* STEP INDICATOR */}
            <div className="w-full bg-surface-container-low rounded-xl p-2 sm:p-4 border border-outline-variant/30 shadow-sm">
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[
                  { step: 1, label: 'Langkah 1', name: 'Kategori' },
                  { step: 2, label: 'Langkah 2', name: 'Tingkat Bahaya' },
                  { step: 3, label: 'Langkah 3', name: 'Geolokasi' },
                  { step: 4, label: 'Langkah 4', name: 'Foto & Catatan' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    type="button"
                    className={`min-h-[44px] flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 p-1.5 sm:p-3 rounded-lg text-left transition-all ${
                      currentStep === s.step
                        ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                        : currentStep > s.step
                        ? 'bg-surface-container text-primary font-semibold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full font-mono text-xs flex items-center justify-center font-bold shrink-0 ${
                        currentStep === s.step
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-highest text-on-surface'
                      }`}
                    >
                      {currentStep > s.step ? '✓' : s.step}
                    </span>
                    <div className="hidden sm:flex flex-col">
                      <span className="font-mono text-[9px] uppercase tracking-wider">{s.label}</span>
                      <span className="text-xs truncate">{s.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* TIP BANNER */}
            <div className="flex items-center justify-between gap-3 p-3 px-4 bg-secondary/10 border border-secondary/30 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                <span className="text-on-surface font-semibold">Tip Warga:</span>
                <span className="text-on-surface-variant">
                  Cukup 1 menit untuk melapor. Tidak perlu registrasi data sensitif.
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase font-bold text-secondary hidden sm:inline">
                Mudah & Cepat
              </span>
            </div>

            {/* STEP CONTENTS CONTAINER */}
            <div className="bg-surface-container-low rounded-xl p-5 sm:p-8 border border-outline-variant/30 shadow-xl min-h-[420px] flex flex-col justify-between relative">
              {/* Anti-Bot Honeypot Field (Invisible to human users, accessible only to bots) */}
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
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">category</span>
                      <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                        Pilih Kategori Kejadian Lapangan
                      </h2>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant">
                      Klasifikasikan temuan langsung Anda untuk memicu disposisi armada pompa atau unit penanganan dinas terkait.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isSelected = category === cat.value
                      return (
                        <label
                          key={cat.value}
                          onClick={() => setCategory(cat.value)}
                          className={`cursor-pointer relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-surface-container-high border-primary shadow-[0_0_14px_rgba(76,215,246,0.2)]'
                              : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                          }`}
                        >
                          <div>
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                                isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-primary'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-headline text-sm font-bold text-on-surface">{cat.label}</h3>
                            <p className="font-body text-xs text-on-surface-variant mt-1 leading-relaxed">
                              {cat.desc}
                            </p>
                          </div>
                          <div className="mt-4 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] text-primary font-semibold">
                              KODE: {cat.code}
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-primary" />}
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
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary">water</span>
                      <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                        Perkiraan Ketinggian Air & Tingkat Bahaya
                      </h2>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant">
                      Pilih ketinggian air saat ini untuk menentukan prioritas unit pompa dan armada evakuasi perahu.
                    </p>
                  </div>

                  {/* Water Levels */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {WATER_LEVELS.map((w) => {
                      const isSelected = waterDepth === w.label
                      return (
                        <div
                          key={w.label}
                          onClick={() => setWaterDepth(w.label)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-surface-container-high border-tertiary shadow-[0_0_14px_rgba(245,158,11,0.2)]'
                              : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                              <span className="material-symbols-outlined text-[22px]">{w.icon}</span>
                            </div>
                            <h4 className="font-headline text-sm font-bold text-on-surface">{w.label}</h4>
                            <p className="font-body text-xs text-on-surface-variant leading-relaxed">{w.desc}</p>
                          </div>
                          {isSelected && (
                            <div className="mt-3 text-right">
                              <span className="font-mono text-[10px] text-tertiary font-bold uppercase">Dipilih</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Urgency Pickers */}
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
                      Tingkat Urgensi Warga:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(['rendah', 'sedang', 'tinggi', 'kritis'] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUrgency(u)}
                          className={`py-2 px-3 rounded-lg font-mono text-xs font-bold uppercase border transition-all ${
                            urgency === u
                              ? u === 'kritis'
                                ? 'bg-error text-on-error border-error'
                                : u === 'tinggi'
                                ? 'bg-tertiary text-on-tertiary border-tertiary'
                                : 'bg-primary text-on-primary border-primary'
                              : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:text-on-surface'
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
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">pin_drop</span>
                      <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                        Tentukan Titik Lokasi Kejadian
                      </h2>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant">
                      Pilih kecamatan dan gunakan titik GPS untuk akurasi respons lapangan BPBD.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
                        Kecamatan di Semarang
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-primary font-body"
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
                          <option key={d} value={d} className="bg-surface-container-low text-on-surface">
                            Kecamatan {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
                        Patokan / Nama Jalan
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Contoh: Jl. Kaligawe Raya KM 4, Depan RSI Sultan Agung"
                        className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-primary font-body"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates Box */}
                  <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-primary uppercase font-bold">
                          Koordinat Geospasial
                        </span>
                        {accuracy !== null && (
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                            accuracy <= 100
                              ? 'bg-secondary/15 text-secondary border border-secondary/30'
                              : 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                          }`}>
                            ±{Math.round(accuracy)}m (Akurat)
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-on-surface mt-0.5">
                        Latitude: {lat.toFixed(5)}, Longitude: {lng.toFixed(5)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary font-mono text-xs font-bold uppercase hover:bg-primary hover:text-on-primary transition-all flex items-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{gettingLocation ? 'Membaca GPS...' : 'Gunakan Lokasi Saya'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: FOTO & CATATAN */}
              {currentStep === 4 && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-150">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">notes</span>
                      <h2 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                        Foto Bukti & Catatan Kejadian
                      </h2>
                    </div>
                    <p className="font-body text-xs text-on-surface-variant">
                      Unggah foto situasi langsung jika ada, dan tambahkan catatan detail untuk petugas EOC.
                    </p>
                  </div>

                  {/* Description input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
                      Catatan Situasi Lapangan *
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Jelaskan kondisi: contohnya debit air terus meninggi sejak 1 jam lalu, arus gorong-gorong tersumbat sampah ranting pohon..."
                      className="w-full p-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface text-xs focus:outline-none focus:border-primary font-body"
                    />
                  </div>

                  {/* Photo Upload Area */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
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
                      <div className="relative h-44 w-full sm:w-72 rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container">
                        <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setPhoto(null)
                            setPhotoPreview(null)
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-surface-container-lowest/80 text-on-surface hover:bg-error hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 rounded-xl border border-dashed border-outline-variant/50 hover:border-primary bg-surface-container/50 hover:bg-surface-container flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Camera className="w-6 h-6 text-primary" />
                        <span className="text-xs text-on-surface font-medium">Klik untuk memilih atau memotret foto</span>
                        <span className="font-mono text-[10px] text-on-surface-variant">Maksimal 5MB (JPG/PNG)</span>
                      </button>
                    )}
                  </div>

                  {/* Anonymity toggle */}
                  <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-on-surface font-bold">Kirim Secara Anonim</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Identitas pribadi Anda tidak akan disimpan atau dipublikasikan.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* WIZARD NAVIGATION CONTROLS */}
              <div className="flex items-center justify-between gap-3 pt-6 border-t border-outline-variant/30 mt-6 flex-wrap sm:flex-nowrap">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface font-mono text-xs font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali</span>
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="min-h-[44px] px-4 sm:px-6 py-2.5 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                  >
                    <span>Lanjut Langkah {currentStep + 1}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-h-[44px] px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-[0_0_16px_rgba(76,215,246,0.35)] transition-all flex items-center gap-2 ml-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                        <span>Mengirim Laporan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Kirim Laporan Siaga</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION SCREEN */
          <div className="p-8 sm:p-12 rounded-2xl bg-surface-container-low border border-secondary/40 shadow-2xl flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center text-secondary">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="flex flex-col gap-2 max-w-lg">
              <span className="font-mono text-xs font-bold text-secondary uppercase tracking-widest">
                LAPORAN BERHASIL TERSIMPAN DI EOC
              </span>
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                Terima Kasih Atas Kepedulian Anda!
              </h2>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Laporan Anda telah tercatat dengan nomor pelacakan berikut dan segera diverifikasi oleh tim siaga BPBD Kota Semarang.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/40 flex flex-col items-center gap-2 w-full max-w-lg">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">Kode Pelacakan Laporan Publik</span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-wider">
                {trackingCode}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-secondary/15 text-secondary border border-secondary/30 font-bold uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Dalam Verifikasi EOC
                </span>
                {verificationSummary && (
                  <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-semibold border border-outline-variant/30">
                    Skor Kredibilitas: {verificationSummary.score}/100
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant text-center mt-1">
                Laporan tercatat tanpa perlu login. Tim tanggap darurat EOC akan memverifikasi bukti koordinat dan citra visual.
              </p>
            </div>

            {/* AI TRIAGE CLASSIFICATION CARD */}
            <div className="w-full max-w-lg p-4 rounded-xl bg-surface-container border border-primary/30 text-left flex flex-col gap-2.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs font-bold text-primary uppercase">
                    Triase Cepat AI (OpenRouter Free Models Router)
                  </span>
                </div>
                {isAnalyzingAi ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                    Menganalisis...
                  </span>
                ) : (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30 font-semibold">
                    AI VERIFIED
                  </span>
                )}
              </div>

              {isAnalyzingAi ? (
                <div className="py-4 text-center text-xs text-on-surface-variant font-mono animate-pulse">
                  Memproses deskripsi laporan menggunakan model openrouter/free...
                </div>
              ) : aiTriage ? (
                <div className="flex flex-col gap-2 text-xs font-body">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-on-surface-variant">Klasifikasi AI:</span>
                    <span className="font-bold text-on-surface uppercase">{aiTriage.classification}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-on-surface-variant">Tingkat Keparahan:</span>
                    <span className={`font-bold uppercase px-2 py-0.5 rounded ${
                      aiTriage.severity === 'critical' ? 'bg-error/20 text-error' :
                      aiTriage.severity === 'high' ? 'bg-tertiary/20 text-tertiary' :
                      'bg-primary/20 text-primary'
                    }`}>
                      {aiTriage.severity} ({Math.round(aiTriage.confidence * 100)}% keyakinan)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface leading-relaxed text-[11px]">
                    <span className="font-mono font-semibold text-primary block mb-0.5">Ringkasan Situasi:</span>
                    {aiTriage.summary}
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface leading-relaxed text-[11px]">
                    <span className="font-mono font-semibold text-secondary block mb-0.5">Rekomendasi Tindakan:</span>
                    {aiTriage.recommended_action}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-on-surface-variant font-body">
                  Analisis awal AI telah dikirimkan ke dashboard komando BPBD.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center justify-center pt-2">
              <Link
                href="/peta"
                className="px-6 py-3 rounded-lg bg-primary text-on-primary font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Pantau di Peta Spasial
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface font-mono text-xs font-semibold uppercase hover:bg-surface-container-high transition-colors"
              >
                Kirim Laporan Lain
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: PUBLIC AUDIT TRAIL & RIWAYAT VERIFIKASI WARGA */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                  Audit Trail Publik Transparan
                </span>
                <h3 className="font-headline text-lg font-bold text-on-surface">
                  Riwayat Verifikasi & Eskalasi Laporan Warga
                </h3>
              </div>
            </div>
            <span className="font-mono text-xs text-secondary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              SLA Respons Rerata &lt;15 Menit
            </span>
          </div>

          <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container border-b border-outline-variant/30 font-mono text-[10px] text-on-surface-variant uppercase">
                  <tr>
                    <th className="py-3 px-4">Kode Laporan</th>
                    <th className="py-3 px-4">Kategori & Masalah</th>
                    <th className="py-3 px-4">Wilayah</th>
                    <th className="py-3 px-4">Urgensi</th>
                    <th className="py-3 px-4">Status BPBD</th>
                    <th className="py-3 px-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {publicReports.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {r.report_code || 'SMG-ALERT'}
                      </td>
                      <td className="py-3 px-4 text-on-surface max-w-xs truncate font-medium">
                        {r.description || r.category}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {r.district_name || 'Semarang'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            r.urgency === 'kritis'
                              ? 'bg-error/20 text-error'
                              : r.urgency === 'tinggi'
                              ? 'bg-tertiary/20 text-tertiary'
                              : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {r.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-secondary font-semibold">
                        {r.status === 'resolved'
                          ? '✓ Selesai Penanganan'
                          : r.status === 'in_progress'
                          ? '⚡ Tim Lapangan Aktif'
                          : r.status === 'verified'
                          ? '◉ Terverifikasi EOC'
                          : '○ Menunggu Verifikasi'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                        {formatRelativeTime(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
