import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Map,
  ArrowRight,
  AlertTriangle,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Droplets,
  Radio,
  FileSpreadsheet,
  LifeBuoy,
  Video,
} from 'lucide-react'
import { AnimatedSeal } from '@/components/visuals/AnimatedSeal'
import { AnimatedRadar } from '@/components/visuals/AnimatedRadar'
import { FALLBACK_SEMARANG_REPORTS } from '@/lib/data/reports'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'

export const metadata: Metadata = {
  title: 'KotaKu Siaga — Civic Climate Intelligence & Resiliensi Semarang',
  description: 'Platform kolaboratif monitoring risiko hidrometeorologis, rob pesisir, dan resiliensi iklim Kota Semarang dengan prinsip transparansi data terbuka.',
}

export default function LandingPage() {
  const totalReports = FALLBACK_SEMARANG_REPORTS.length
  const criticalReports = FALLBACK_SEMARANG_REPORTS.filter((r) => r.urgency === 'kritis').length
  const activeReports = FALLBACK_SEMARANG_REPORTS.filter((r) => r.status !== 'resolved').length
  const cctvCount = PANTAUSEMAR_CCTV_POINTS.length

  return (
    <div className="flex flex-col w-full text-on-surface bg-surface min-h-screen">
      {/* 1. OPERATIONAL TELEMETRY RIBBON & HERO */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 pb-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Gotong Royong Header Banner */}
        <div className="p-4 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 border border-outline-variant/30 p-1 flex items-center justify-center">
              <AnimatedSeal className="w-14 h-14" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                  Gotong Royong Resiliensi Kota Semarang
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-secondary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                  Kolaboratif Warga & Pemkot
                </span>
              </div>
              <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Informasi Publik Siaga Bencana untuk Seluruh Warga • Pemantauan Terbuka, Transparan & Tanggap Bersama
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center gap-2 text-xs text-on-surface-variant font-mono">
              <span className="material-symbols-outlined text-secondary text-[18px]">volunteer_activism</span>
              <span className="text-on-surface font-medium">Mitigasi Siaga Warga Semarang</span>
            </div>
          </div>
        </div>

        {/* Top System Telemetry Bar (Real Data Sources) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">TELEMETRI CUACA WMO:</span>
              <span className="font-mono text-secondary font-semibold">STASIUN SEMARANG (-6.96, 110.42)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">PANTAUSEMAR CCTV:</span>
              <span className="font-mono text-primary font-semibold">{cctvCount} TITIK PRIORITAS</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">HISTORIS INARISK:</span>
              <span className="font-mono text-on-surface font-semibold">BNPB GEOPORTAL</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-container hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">OSM OVERPASS:</span>
              <span className="font-mono text-tertiary font-semibold">KORIDOR AIR SEMARANG</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-mono text-[10px] text-secondary font-bold">100% DATA TERBUKA</span>
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
          </div>
        </div>

        {/* 4 Critical Real-Time Metric Pillars (Calculated from Real Ground-Truth) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Total Reports */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                LAPORAN WARGA AKTIF
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high font-mono text-[10px] text-primary">
                TERVERIFIKASI
              </span>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-on-surface">{totalReports}</span>
              <span className="font-mono text-xs text-secondary flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ground-Truth
              </span>
            </div>
            <div className="flex flex-col gap-0.5 text-xs text-on-surface-variant">
              <div className="flex items-center justify-between">
                <span>Status Aktif</span>
                <span className="text-primary font-mono font-medium">{activeReports} Laporan</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-secondary font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validasi spasial koordinat</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Critical Active */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-error uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                KRITIS AKTIF
              </span>
              <span className="px-2 py-0.5 rounded bg-error/20 font-mono text-[10px] text-error font-bold">
                URGENT
              </span>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-error">{criticalReports}</span>
              <span className="font-mono text-xs text-error flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[16px]">priority_high</span> Prioritas
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Wilayah Dampak Utama</span>
              <span className="text-error font-mono font-semibold">Genuk & Smg Utara</span>
            </div>
          </div>

          {/* Pillar 3: CCTV Titik Prioritas */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                TITIK CCTV PRIORITAS
              </span>
              <span className="px-2 py-0.5 rounded bg-secondary/10 font-mono text-[10px] text-secondary font-semibold">
                PANTAUSEMAR
              </span>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <span className="font-mono text-3xl font-bold text-secondary">{cctvCount}</span>
              <span className="font-mono text-xs text-secondary flex items-center gap-1 font-semibold">
                <Video className="w-4 h-4" /> Titik Kunci
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Cakupan Pemantauan</span>
              <span className="text-on-surface font-mono font-semibold">Polder & Titik Genangan</span>
            </div>
          </div>

          {/* Pillar 4: Wilayah Pemantauan */}
          <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:bg-surface-container transition-colors">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-tertiary uppercase tracking-wider font-semibold">
                CAKUPAN ADMINISTRATIF
              </span>
              <span className="px-2 py-0.5 rounded bg-tertiary-container/30 font-mono text-[10px] text-tertiary font-bold">
                KOTA SEMARANG
              </span>
            </div>
            <div className="my-3 flex flex-col">
              <span className="font-headline text-2xl text-on-surface font-bold">16 Kecamatan</span>
              <span className="font-mono text-xs text-tertiary mt-0.5">Model ISO 37120 Deterministik</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>Sumber Geospasial</span>
              <span className="text-primary font-mono font-semibold">Peta Spasial Kota</span>
            </div>
          </div>
        </div>

        {/* HERO INTERACTIVE CENTERPIECE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          {/* Left Column: Mission & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-widest px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
                  TACTICAL CIVIC INTELLIGENCE
                </span>
                <span className="font-mono text-xs text-on-surface-variant">ISO 37120 ALGORITHM</span>
              </div>
              <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
                Pantau Rob, Resiliensi Iklim & Mitigasi Bersama Warga.
              </h1>
              <p className="font-body text-base text-on-surface-variant leading-relaxed max-w-2xl">
                KotaKu Siaga menggabungkan sensor hidrometeorologis BMKG, radar debit air polder, dan laporan cepat warga untuk melindungi pemukiman, kawasan industri, dan infrastruktur pesisir Kota Semarang.
              </p>
            </div>

            {/* Tactical Action Buttons */}
            <div className="flex flex-wrap gap-3.5 items-center">
              <Link
                href="/peta"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_16px_rgba(76,215,246,0.35)] transition-all"
              >
                <Map className="w-4 h-4" />
                <span>Buka Peta Spasial Live</span>
              </Link>
              <Link
                href="/laporan/baru"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-surface-container-high border border-outline-variant/60 text-on-surface font-semibold text-xs uppercase tracking-wider hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">campaign</span>
                <span>Lapor Cepat (Tanpa Login)</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg text-primary hover:text-primary-fixed text-xs font-mono font-semibold transition-colors"
              >
                <span>Command Center EOC</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Live Status Indicators Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-outline-variant/30">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Wilayah Pantau</span>
                <span className="font-headline text-lg font-bold text-on-surface">16 Kecamatan</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">CCTV Prioritas</span>
                <span className="font-headline text-lg font-bold text-secondary">{cctvCount} Titik Pantau</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Formula Terbuka</span>
                <span className="font-headline text-lg font-bold text-primary">Deterministik</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase">Transparansi</span>
                <span className="font-headline text-lg font-bold text-tertiary">Zero-Monopoli</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Radar & Illustration Showcase */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-2xl bg-surface-container-low border border-outline-variant/40 p-4 shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Radar Background animation */}
              <AnimatedRadar className="w-full h-full" />
              
              {/* Overlay quick stats pill */}
              <div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/40 rounded-xl p-3 flex items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-error animate-ping"></span>
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">Stasiun Tanjung Emas</span>
                    <span className="font-mono text-xs text-error font-bold">Pasang Maks: +1.12m MSL</span>
                  </div>
                </div>
                <Link
                  href="/peta"
                  className="px-2.5 py-1 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold uppercase hover:bg-primary hover:text-on-primary transition-colors"
                >
                  Lihat Titik
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PANDUAN AWAM: 3 MENIT PAHAM RISIKO SEMARANG */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-10 bg-surface-container-low border-y border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">lightbulb</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                  Panduan Inklusif Warga
                </span>
                <h2 className="font-headline text-xl text-on-surface font-bold">
                  3 Menit Paham Risiko & Kesiapsiagaan Semarang
                </h2>
              </div>
            </div>
            <span className="font-body text-xs text-on-surface-variant">
              Bahasa santun, tidak panik, tanggap, dan siap siaga bersama warga
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/30 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-error-container text-on-error flex items-center justify-center font-mono text-sm font-bold">
                  1
                </span>
                <h3 className="font-headline text-sm font-bold text-on-surface">
                  Kenali Bahaya Wilayahmu
                </h3>
              </div>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Pesisir utara (Genuk & Smg Utara) dominan terdampak pasang rob laut, sedangkan area perbukitan (Candisari & Gajahmungkur) lebih waspada luapan lereng saat hujan deras berjam-jam.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/30 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-mono text-sm font-bold">
                  2
                </span>
                <h3 className="font-headline text-sm font-bold text-on-surface">
                  Arti Label Warna Risiko
                </h3>
              </div>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                <strong className="text-error">Kritis/Merah:</strong> pompa dan evakuasi darurat aktif. <strong className="text-tertiary">Tinggi/Kuning:</strong> antisipasi genangan jalur jalan. <strong className="text-secondary">Sedang/Hijau:</strong> aliran lancar dan aman beraktivitas.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/30 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center font-mono text-sm font-bold">
                  3
                </span>
                <h3 className="font-headline text-sm font-bold text-on-surface">
                  Langkah Cepat Tindakan
                </h3>
              </div>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Amankan dokumen berharga ke lantai 2, laporkan genangan via tombol <strong>Lapor Cepat</strong> atau WhatsApp 112 BPBD. Seluruh data dihitung adil tanpa kepentingan komersial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 4 PILAR TEKNOLOGI CIVIC INTELLIGENCE */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2 text-center items-center">
            <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider px-3 py-1 rounded bg-primary/10 border border-primary/30">
              ARSITEKTUR TERBUKA & RESILIENSI
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface">
              Teknologi Kota Cerdas untuk Kesejahteraan Warga
            </h2>
            <p className="font-body text-sm text-on-surface-variant max-w-2xl">
              Dibangun dengan standar internasional ISO 37120 untuk memastikan data transparan, bebas biaya lisensi proprietary, dan berorientasi pada keselamatan publik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="font-headline text-base font-bold text-on-surface">Peta Spasial Real-time</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Visualisasi titik genangan, sensor AWLR BBWS, kamera pemantau CCTV Dishub, dan radius polder sungai Semarang.
              </p>
              <Link href="/peta" className="text-xs font-mono text-primary font-semibold hover:underline mt-auto flex items-center gap-1">
                Eksplorasi Peta <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-headline text-base font-bold text-on-surface">Matriks Deterministik</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Kalkulasi bobot risiko 16 kecamatan berdasarkan 6 parameter matematis terbuka: Laporan, Urgensi, Populasi, Histori, Elevasi, dan Curah Hujan.
              </p>
              <Link href="/priorities" className="text-xs font-mono text-secondary font-semibold hover:underline mt-auto flex items-center gap-1">
                Buka Matriks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary/10 border border-tertiary/30 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[22px]">campaign</span>
              </div>
              <h3 className="font-headline text-base font-bold text-on-surface">Audit Trail Pelaporan</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Setiap laporan warga diverifikasi petugas EOC dan terdata pada log audit publik transparan untuk memastikan penanganan tepat sasaran.
              </p>
              <Link href="/laporan/baru" className="text-xs font-mono text-tertiary font-semibold hover:underline mt-auto flex items-center gap-1">
                Kirim Laporan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h3 className="font-headline text-base font-bold text-on-surface">Edukasi & Resiliensi</h3>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Panduan praktis mitigasi genangan, jalur evakuasi aman saat pasang rob, dan langkah darurat perlindungan keluarga.
              </p>
              <Link href="/edukasi" className="text-xs font-mono text-primary font-semibold hover:underline mt-auto flex items-center gap-1">
                Baca Edukasi <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION BANNER */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto w-full">
        <div className="rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high border border-outline-variant/40 p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col gap-3 max-w-2xl relative z-10">
            <span className="font-mono text-xs font-bold text-secondary uppercase tracking-wider">
              SUARA ANDA MELINDUNGI SEMARANG
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
              Temukan Genangan atau Saluran Tersumbat di Dekat Anda?
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
              Kirimkan laporan langsung dalam 1 menit tanpa perlu login. Tim pompa dan relawan BPBD siap merespons cepat berdasarkan koordinat yang Anda laporkan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 shrink-0 relative z-10 w-full lg:w-auto">
            <Link
              href="/laporan/baru"
              className="inline-flex items-center justify-center px-6 py-3.5 min-h-[44px] rounded-lg bg-primary text-on-primary font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-lg transition-all text-center"
            >
              Lapor Kondisi Sekarang
            </Link>
            <a
              href="tel:112"
              className="inline-flex items-center justify-center px-5 py-3.5 min-h-[44px] rounded-lg bg-error-container/50 border border-error/60 text-error font-mono font-bold text-xs uppercase tracking-wider hover:bg-error-container transition-colors text-center"
            >
              Telepon 112 BPBD
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
