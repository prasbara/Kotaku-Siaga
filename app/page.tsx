import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Map,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Video,
  ExternalLink,
  ChevronRight,
  Waves,
  Sparkles,
  PhoneCall,
  Activity,
  FileCheck2,
  HelpCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Megaphone,
} from 'lucide-react'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { PublicDisasterRiskWidget } from '@/components/public/PublicDisasterRiskWidget'
import { EmergencyLiteModeManager } from '@/components/public/EmergencyLiteModeManager'

export const metadata: Metadata = {
  title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
  description:
    'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV, data cuaca, dan pusat kendali.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app',
  },
  openGraph: {
    title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    description:
      'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV, data cuaca, dan pusat kendali.',
    url: 'https://kotaku-siaga.vercel.app',
    siteName: 'KotaKu Siaga',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    description:
      'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV, data cuaca, dan pusat kendali.',
  },
}

export default async function LandingPage() {
  const cctvCount = PANTAUSEMAR_CCTV_POINTS.length

  return (
    <EmergencyLiteModeManager>
      <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen">
      {/* 1. HERO SECTION WITH PASTEL MESH ATMOSPHERE */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#e6e6e6]">
        {/* Pastel Mesh Background Layers */}
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <div className="absolute -top-32 -left-20 w-[550px] h-[550px] rounded-full bg-[#f4ede4] blur-3xl opacity-70"></div>
          <div className="absolute top-10 -right-20 w-[500px] h-[500px] rounded-full bg-[#f9f0ff] blur-3xl opacity-80"></div>
          <div className="absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full bg-[#fdf2e9] blur-3xl opacity-60"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[90px] bg-white border border-[#e6e6e6] shadow-subtle mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
            <span className="text-xs font-semibold text-[#4a154b]">
              Sistem Pemantauan Terpadu
            </span>
            <span className="text-[#696969]">•</span>
            <span className="text-xs text-[#696969]">Kota Semarang & Pesisir Pantura</span>
          </div>

          {/* Editorial Display Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1d1d1d] tracking-[-0.768px] leading-[1.12] max-w-4xl">
            Pemantauan Banjir &amp; Rob <span className="text-[#4a154b]">Kota Semarang</span> Terpadu
          </h1>

          {/* Body Description */}
          <p className="mt-6 text-lg sm:text-xl text-[#696969] leading-[1.55] max-w-2xl">
            KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV PantauSemar, data cuaca BMKG, dan pusat kendali terpadu.
          </p>

          {/* Action CTAs (Pill System: Over-padded 90px radius) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/laporan/baru"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] active:bg-[#611f69] text-white font-bold text-sm tracking-wide shadow-[0_5px_20px_rgba(0,0,0,0.1)] flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Megaphone className="w-5 h-5 shrink-0" />
              Laporkan Genangan Air
            </Link>

            <Link
              href="/peta"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#f9f0ff] hover:bg-[#eddcf7] text-[#1d1d1d] font-bold text-sm tracking-wide flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Map className="w-4 h-4 text-[#4a154b]" />
              Buka Peta Pemantauan
            </Link>

            <Link
              href="/dashboard"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-white hover:bg-[#f9f0ff] text-[#4a154b] border-2 border-[#4a154b] font-bold text-sm tracking-wide flex items-center gap-2 transition-all"
            >
              Pusat Kendali
              <ArrowRight className="w-4 h-4 text-[#4a154b]" />
            </Link>
          </div>

          {/* Telemetry Strip */}
          <div className="mt-10 w-full max-w-4xl p-3.5 rounded-[16px] bg-white/90 backdrop-blur-sm border border-[#e6e6e6] shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#f4ede4]">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">Stasiun Cuaca BMKG:</span>
              <span className="text-[11px] text-[#1d1d1d] font-semibold">Tanjung Emas (-6.96, 110.42)</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f9f0ff]">
              <Video className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">Kamera Pemantau:</span>
              <span className="text-[11px] text-[#1d1d1d] font-semibold">{cctvCount} Titik Terpantau</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4ede4] hidden sm:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a]" />
              <span className="text-[11px] font-bold text-[#007a5a]">Data Terbuka & Terverifikasi</span>
            </div>
          </div>

          {/* Floating Product UI Mockup (Slacc Signature 3:2 Aspect on Pastel Mesh) */}
          <div className="mt-14 w-full max-w-5xl rounded-[12px] overflow-hidden bg-white border border-[#e6e6e6] shadow-[0_0_32px_rgba(0,0,0,0.08)] text-left min-h-[440px]">
            {/* Chrome Top Bar */}
            <div className="bg-[#f4ede4] px-4 py-3 border-b border-[#e6e6e6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#cc4117]/80"></span>
                <span className="w-3 h-3 rounded-full bg-[#d97706]/80"></span>
                <span className="w-3 h-3 rounded-full bg-[#007a5a]/80"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#4a154b] text-white">
                  ANALISIS VISUAL AKTIF
                </span>
                <span className="text-[11px] font-mono text-[#007a5a] font-semibold">Kecepatan: 40 FPS</span>
              </div>
            </div>

            {/* Inner Dashboard Preview Grid */}
            <div className="p-6 bg-[#fdfbf9] grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Telemetry Panel */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="rounded-[12px] p-4 bg-white border border-[#e6e6e6]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b]">KAMERA PEMANTAU AKTIF</span>
                  <div className="font-bold text-sm text-[#1d1d1d] mt-1">Underpass Kaligawe (KM 4)</div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#696969]">Status Kamera:</span>
                    <span className="font-bold text-[#007a5a]">Beroperasi Normal</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#696969]">Ketinggian Muka Air:</span>
                    <span className="font-bold text-[#1d1d1d]">+14 cm dpl</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#696969]">Permukaan Jalan:</span>
                    <span className="font-bold text-[#007a5a]">Kering (Bebas Genangan)</span>
                  </div>
                </div>

                <div className="rounded-[12px] p-4 bg-[#f9f0ff] border border-[#eddcf7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b]">INDIKATOR RISIKO GENANGAN</span>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#1d1d1d]">Cakupan Area Basah</span>
                        <span className="font-bold text-[#4a154b]">Rendah (2%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-[#4a154b] rounded-full" style={{ width: '6%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#1d1d1d]">Stabilitas Pemantauan</span>
                        <span className="font-bold text-[#007a5a]">Stabil</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-[#007a5a] rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Live Visual Simulation */}
              <div className="md:col-span-8 rounded-[12px] overflow-hidden bg-[#1d1d1d] text-white p-4 flex flex-col justify-between min-h-[280px] sm:min-h-[320px] relative group border border-[#e6e6e6]/20">
                {/* Background CCTV Live Feed Image */}
                <Image
                  src="/images/cctv-kaligawe-preview.jpg"
                  alt="Siaran Langsung Kamera CCTV Underpass Kaligawe"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 640px"
                  quality={75}
                  priority
                  className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Subtle CCTV dark gradient & vignette overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

                {/* Top Overlay Badge & Time */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-mono border border-white/10 shadow-sm">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007a5a] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#007a5a]"></span>
                    </span>
                    <span className="font-bold text-white">Kamera Kaligawe 01</span>
                    <span className="text-white/40">•</span>
                    <span className="text-[#007a5a] font-bold">Siaran Langsung</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-[#007a5a] px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white shadow-sm border border-white/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      STATUS: AMAN
                    </span>
                    <Link
                      href="/peta"
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-bold text-white/90 bg-black/60 hover:bg-[#4a154b] px-2.5 py-1 rounded-full border border-white/15 transition-colors"
                      title="Buka 70 CCTV di Peta"
                    >
                      <span>70 CCTV</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Bottom Overlay Info Banner */}
                <div className="z-10 mt-auto pt-16">
                  <div className="border border-[#007a5a]/70 rounded-[10px] p-3 bg-black/75 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#007a5a] shrink-0"></span>
                      <span className="font-medium text-white">Verifikasi Visual Multi-Bingkai: Kondisi Normal</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                      <span className="text-white/70">Elevasi Muka Air: <b className="text-white">+14 cm</b></span>
                      <span className="px-2 py-0.5 rounded bg-[#007a5a]/25 text-[#007a5a] border border-[#007a5a]/40 font-bold">
                        Akurasi: 94%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5. Real-Time Public Disaster Risk & Citizen Safety Widget (Requirement #1 & #12) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4 -mb-8">
        <PublicDisasterRiskWidget />
      </section>

      {/* 2. STATS & SITUATIONAL OVERVIEW (Slacc card-stat Pattern with 50px Aubergine Numerals) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col gap-2 mb-12 text-center sm:text-left">
          <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
            Ringkasan Situasi Terkini
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d] tracking-[-0.256px]">
            Status Pantauan Banjir & Rob Semarang
          </h2>
          <p className="text-base text-[#696969] leading-[1.55] max-w-2xl">
            Kombinasi laporan warga terverifikasi, data observasi cuaca BMKG maritim, dan status operasional infrastruktur pengendali banjir Kota Semarang.
          </p>
        </div>

        {/* 4-Up Grid of Slacc card-stat Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-[0_5px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">KAMERA PEMANTAU</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-[#4a154b] leading-[1.12] tracking-[-0.6px]">
                {cctvCount}
              </div>
              <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Titik CCTV Aktif</p>
              <p className="text-xs text-[#696969] mt-1">Terhubung ke PantauSemar Diskominfo</p>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Pembaruan Data</span>
              <span className="font-bold text-[#007a5a]">Waktu Nyata</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-[0_5px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">VERIFIKASI LAPORAN</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-[#4a154b] leading-[1.12] tracking-[-0.6px]">
                3 Lapis
              </div>
              <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Validasi Bertingkat</p>
              <p className="text-xs text-[#696969] mt-1">Pemeriksaan GPS, Data Cuaca, dan Anti-Spam</p>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Metode Penilaian</span>
              <span className="font-bold text-[#007a5a]">Transparan & Terbuka</span>
            </div>
          </div>

          {/* Stat 3: Featured Aubergine Card (Slacc card-pricing-featured equivalent) */}
          <div className="rounded-[16px] p-8 bg-[#4a154b] text-white border border-[#481a54] shadow-[0_5px_20px_rgba(74,21,75,0.15)] flex flex-col justify-between relative overflow-hidden">
            <span className="text-xs font-bold text-[#d9bdde] uppercase tracking-wider">ELEVASI PASANG AIR LAUT</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-white leading-[1.12] tracking-[-0.6px]">
                +85<span className="text-2xl font-normal text-[#d9bdde]">cm</span>
              </div>
              <p className="text-sm text-white font-semibold mt-2">Perairan Tanjung Emas & Kaligawe</p>
              <p className="text-xs text-[#d9bdde] mt-1">Stasiun Pasut BMKG Maritim</p>
            </div>
            <div className="pt-3 border-t border-[#592466] flex items-center justify-between text-xs text-[#f4ede4]">
              <span>Tingkat Risiko</span>
              <span className="font-bold px-2 py-0.5 rounded-full bg-white/20">WASPADA ROB</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-[0_5px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">RUMAH POMPA & POLDER</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-[#4a154b] leading-[1.12] tracking-[-0.6px]">
                5
              </div>
              <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Stasiun Polder Utama</p>
              <p className="text-xs text-[#696969] mt-1">Sringin, Tenggang, BKB, BKT, Kalibaru</p>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Total Kapasitas Pembuangan</span>
              <span className="font-bold text-[#4a154b]">&gt; 35.000 L/detik</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section className="py-16 bg-white border-t border-b border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
                Layanan Utama Platform
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight mt-1">
                Akses Informasi Cepat untuk Warga & Petugas
              </h2>
            </div>
            <Link
              href="/laporan"
              className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1.5 transition-colors"
            >
              Lihat Seluruh Laporan Warga →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-[16px] p-8 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-6">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">Peta Pemantauan Interaktif</h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Visualisasi sebaran titik banjir, lokasi kamera CCTV, perkiraan luas genangan, dan rumah pompa secara langsung di peta geospasial.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                <Link href="/peta" className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1 transition-colors">
                  Buka Peta Pemantauan →
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[16px] p-8 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-center text-[#4a154b] mb-6">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">Verifikasi Laporan Berlapis</h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Setiap laporan warga divalidasi melalui koordinat GPS, pengecekan data cuaca sekitar, dan penyaringan laporan duplikat untuk akurasi data.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                <Link href="/laporan/baru" className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1 transition-colors">
                  Kirim Laporan Genangan →
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[16px] p-8 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">Matriks Prioritas Penanganan</h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Kalkulasi terbuka untuk memprioritaskan penanganan wilayah terdampak berdasarkan ketinggian air, fasilitas vital, dan jumlah warga terdampak.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                <Link href="/priorities" className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1 transition-colors">
                  Lihat Matriks Prioritas →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPREHENSIVE CONTENT SEO: PANDUAN LENGKAP RISIKO BANJIR & ROB SEMARANG */}
      <section className="py-20 bg-white border-t border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 mb-12 text-center sm:text-left">
            <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
              Edukasi &amp; Literasi Kebencanaan
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d] tracking-tight">
              Memahami Pemantauan Risiko Banjir &amp; Rob Kota Semarang
            </h2>
            <p className="text-base text-[#696969] leading-relaxed max-w-3xl">
              Panduan terpadu bagi warga, relawan, dan pemangku kepentingan untuk membaca dinamika genangan air, cuaca ekstrem, dan pasang surut laut di pesisir Pantura Semarang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Apa itu KotaKu Siaga */}
            <article className="rounded-[16px] p-6 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1d1d1d] mb-2">
                  Apa itu Platform KotaKu Siaga?
                </h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  KotaKu Siaga adalah platform pemantauan risiko banjir dan rob terbuka berbasis spasial untuk wilayah Kota Semarang. Sistem ini menghubungkan data telemetri cuaca, stasiun pasut maritim, jaringan CCTV PantauSemar, dan laporan partisipatif warga ke dalam satu sistem peringatan dini yang transparan.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e6e6e6]/80 text-xs">
                <Link href="/edukasi" className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1">
                  Pelajari Selengkapnya →
                </Link>
              </div>
            </article>

            {/* Card 2: Bagaimana memantau banjir */}
            <article className="rounded-[16px] p-6 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-center text-[#4a154b] mb-4">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1d1d1d] mb-2">
                  Bagaimana KotaKu Siaga Memantau Banjir?
                </h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Pemantauan dilakukan secara terpadu melalui tiga pilar: sensor muka air dan pasang laut BMKG Maritim Tanjung Emas, siaran visual 70+ titik CCTV PantauSemar di persimpangan jalan utama dan underpass, serta verifikasi laporan lapangan warga dengan validasi geolokasi GPS real-time.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e6e6e6]/80 text-xs">
                <Link href="/peta" className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1">
                  Buka Titik Pantau Peta →
                </Link>
              </div>
            </article>

            {/* Card 3: Bagaimana warga melapor */}
            <article className="rounded-[16px] p-6 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1d1d1d] mb-2">
                  Bagaimana Warga Melaporkan Genangan?
                </h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Setiap warga dapat berkontribusi melalui fitur <Link href="/laporan/baru" className="text-[#4a154b] font-bold underline">Lapor Genangan</Link>. Pengguna memilih lokasi di peta, menentukan estimasi ketinggian genangan air, melampirkan foto bukti lapangan, dan mengirimkan laporan yang akan segera divalidasi sistem.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e6e6e6]/80 text-xs">
                <Link href="/laporan/baru" className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1">
                  Kirim Laporan Warga →
                </Link>
              </div>
            </article>

            {/* Card 4: Apa yang dimaksud risiko banjir dan rob */}
            <article className="rounded-[16px] p-6 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-center text-[#4a154b] mb-4">
                  <Waves className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1d1d1d] mb-2">
                  Apa Perbedaan Banjir Limpasan &amp; Banjir Rob?
                </h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Banjir limpasan terjadi saat intensitas curah hujan di hulu (Ungaran/Semarang Atas) melebihi daya tampung sungai dan saluran drainase kota. Sedangkan banjir rob adalah pasang air laut yang merembes ke daratan pesisir utara Semarang akibat gravitasi bulan dan penurunan muka tanah geologis.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e6e6e6]/80 text-xs">
                <Link href="/edukasi" className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1">
                  Baca Karakteristik Rob →
                </Link>
              </div>
            </article>

            {/* Card 5: Cara membaca peta risiko */}
            <article className="rounded-[16px] p-6 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-4">
                  <Map className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1d1d1d] mb-2">
                  Bagaimana Cara Membaca Peta Risiko?
                </h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Peta menggunakan pewarnaan standar mitigasi: status Hijau (Aman/Normal), Kuning (Waspada genangan 10-30 cm), Oranye (Siaga genangan 31-70 cm), dan Merah (Bahaya genangan &gt;70 cm). Ikon kamera menunjukkan CCTV aktif, dan penanda radar menampilkan sebaran genangan di titik vital.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e6e6e6]/80 text-xs">
                <Link href="/peta" className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1">
                  Eksplorasi Peta Interaktif →
                </Link>
              </div>
            </article>

            {/* Card 6: Penggunaan data pemantauan */}
            <article className="rounded-[16px] p-6 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:shadow-subtle transition-all">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-center text-[#4a154b] mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#1d1d1d] mb-2">
                  Bagaimana Data Digunakan Petugas &amp; Warga?
                </h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Bagi warga, data memberi kepastian rute perjalanan bebas genangan saat berangkat atau pulang kerja. Bagi tim BPBD dan Dinas PU, sistem <Link href="/priorities" className="text-[#4a154b] font-bold underline">Matriks Prioritas</Link> memandu pengerahan pompa bergerak, penutupan pintu air, dan bantuan logistik cepat.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#e6e6e6]/80 text-xs">
                <Link href="/dashboard" className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1">
                  Pusat Kendali Data →
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 5. LOCAL SEO: 16 KECAMATAN INDEKS RISIKO KOTA SEMARANG */}
      <section className="py-16 bg-[#fdfbf9] border-b border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
                Cakupan Wilayah Geografis
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight mt-1">
                Pemantauan Risiko Banjir &amp; Rob Per Kecamatan Kota Semarang
              </h2>
              <p className="text-sm text-[#696969] mt-2 max-w-2xl">
                Akses matriks risiko spesifik, kondisi drainase, stasiun pompa, dan laporan warga di seluruh 16 wilayah kecamatan di Kota Semarang.
              </p>
            </div>
            <Link
              href="/priorities"
              className="text-xs font-bold text-[#4a154b] hover:text-[#3b0f3c] uppercase tracking-wider flex items-center gap-1 shrink-0"
            >
              Lihat Matriks Lengkap →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { slug: 'genuk', name: 'Kecamatan Genuk', tag: 'Kawasan Rob & Kaligawe', alert: 'Prioritas Tinggi' },
              { slug: 'semarang-utara', name: 'Kecamatan Semarang Utara', tag: 'Pesisir Tanjung Emas', alert: 'Prioritas Tinggi' },
              { slug: 'semarang-timur', name: 'Kecamatan Semarang Timur', tag: 'DAS Banjir Kanal Timur', alert: 'Prioritas Sedang' },
              { slug: 'gayamsari', name: 'Kecamatan Gayamsari', tag: 'DAS Kali Tenggang', alert: 'Prioritas Tinggi' },
              { slug: 'semarang-barat', name: 'Kecamatan Semarang Barat', tag: 'Hilir Banjir Kanal Barat', alert: 'Prioritas Sedang' },
              { slug: 'tugu', name: 'Kecamatan Tugu', tag: 'Pesisir Mangkang & Rob', alert: 'Prioritas Sedang' },
              { slug: 'pedurungan', name: 'Kecamatan Pedurungan', tag: 'Genangan Saluran Tersier', alert: 'Prioritas Sedang' },
              { slug: 'semarang-tengah', name: 'Kecamatan Semarang Tengah', tag: 'Kawasan Perkotaan Pusat', alert: 'Prioritas Normal' },
              { slug: 'semarang-selatan', name: 'Kecamatan Semarang Selatan', tag: 'Kawasan Simpang Lima', alert: 'Prioritas Normal' },
              { slug: 'candisari', name: 'Kecamatan Candisari', tag: 'Kawasan Perbukitan Kota', alert: 'Prioritas Normal' },
              { slug: 'gajahmungkur', name: 'Kecamatan Gajahmungkur', tag: 'Kawasan Lereng Curam', alert: 'Prioritas Normal' },
              { slug: 'tembalang', name: 'Kecamatan Tembalang', tag: 'Hulu DAS Sigarbencah', alert: 'Prioritas Normal' },
              { slug: 'banyumanik', name: 'Kecamatan Banyumanik', tag: 'Kawasan Semarang Atas', alert: 'Prioritas Normal' },
              { slug: 'gunungpati', name: 'Kecamatan Gunungpati', tag: 'Kawasan Resapan DAS', alert: 'Prioritas Normal' },
              { slug: 'ngaliyan', name: 'Kecamatan Ngaliyan', tag: 'Kawasan Industri & DAS', alert: 'Prioritas Normal' },
              { slug: 'mijen', name: 'Kecamatan Mijen', tag: 'Hulu Resapan Barat', alert: 'Prioritas Normal' },
            ].map((district) => (
              <Link
                key={district.slug}
                href={`/priorities/${district.slug}`}
                className="group p-4 rounded-[12px] bg-white border border-[#e6e6e6] hover:border-[#4a154b] shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b]">
                      {district.alert}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#696969] group-hover:text-[#4a154b] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm text-[#1d1d1d] group-hover:text-[#4a154b] transition-colors">
                    {district.name}
                  </h3>
                  <p className="text-xs text-[#696969] mt-1 leading-snug">
                    {district.tag}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-[#1264a3] mt-3 block group-hover:underline">
                  Pantau Wilayah Ini →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION DENGAN SCHEMA JSON-LD STRUCTURED DATA */}
      <section className="py-20 bg-white border-b border-[#e6e6e6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
              Tanya Jawab Publik
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d] tracking-tight mt-1">
              Pertanyaan Umum Kesiapsiagaan Banjir Semarang
            </h2>
            <p className="text-base text-[#696969] mt-2">
              Informasi praktis seputar pemantauan, pelaporan genangan, dan mitigasi darurat.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Apakah informasi di KotaKu Siaga dapat diakses secara gratis oleh seluruh warga?',
                a: 'Ya. Seluruh informasi di KotaKu Siaga, termasuk visual CCTV PantauSemar, peta sebaran genangan, data cuaca BMKG, dan data polder pompa terbuka penuh untuk publik tanpa dipungut biaya.',
              },
              {
                q: 'Berapa lama laporan genangan warga diverifikasi sebelum tampil di peta?',
                a: 'Laporan warga diproses secara otomatis oleh sistem penyaring geospasial dalam hitungan menit untuk mencocokkan koordinat dengan stasiun cuaca terdekat, sebelum diverifikasi manual oleh petugas posko siaga.',
              },
              {
                q: 'Wilayah mana saja di Semarang yang paling rawan terdampak rob dan banjir?',
                a: 'Kawasan pesisir utara dan dataran rendah seperti Kecamatan Genuk (khususnya ruas Kaligawe dan Muktiharjo), Kecamatan Semarang Utara (kawasan pelabuhan dan Bandarharjo), Gayamsari, serta Semarang Timur adalah kawasan dengan kerentanan pasang rob dan limpasan tertinggi.',
              },
              {
                q: 'Bagaimana cara menghubungi petugas evakuasi saat kondisi banjir mendesak?',
                a: 'Untuk keadaan darurat yang membutuhkan evakuasi perahu karet, pertolongan medis, atau logistik darurat, hubungi Layanan Tanggap Darurat Kota Semarang di nomor telepon 112 atau Posko Siaga Bencana BPBD Kota Semarang.',
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="group rounded-[12px] bg-[#fdfbf9] border border-[#e6e6e6] p-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer font-bold text-sm sm:text-base text-[#1d1d1d] group-hover:text-[#4a154b] transition-colors">
                  <span>{item.q}</span>
                  <span className="ml-4 shrink-0 transition-transform group-open:rotate-180 text-[#696969]">
                    ▼
                  </span>
                </summary>
                <p className="mt-3 text-sm text-[#696969] leading-relaxed border-t border-[#e6e6e6]/80 pt-3">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          {/* Inline Schema.org FAQPage for Google & Search Engine Indexing */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Apakah informasi di KotaKu Siaga dapat diakses secara gratis oleh seluruh warga?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Ya. Seluruh informasi di KotaKu Siaga, termasuk visual CCTV PantauSemar, peta sebaran genangan, data cuaca BMKG, dan data polder pompa terbuka penuh untuk publik tanpa dipungut biaya.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Berapa lama laporan genangan warga diverifikasi sebelum tampil di peta?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Laporan warga diproses secara otomatis oleh sistem penyaring geospasial dalam hitungan menit untuk mencocokkan koordinat dengan stasiun cuaca terdekat, sebelum diverifikasi manual oleh petugas posko siaga.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Wilayah mana saja di Semarang yang paling rawan terdampak rob dan banjir?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Kawasan pesisir utara dan dataran rendah seperti Kecamatan Genuk (khususnya ruas Kaligawe dan Muktiharjo), Kecamatan Semarang Utara (kawasan pelabuhan dan Bandarharjo), Gayamsari, serta Semarang Timur adalah kawasan dengan kerentanan pasang rob dan limpasan tertinggi.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Bagaimana cara menghubungi petugas evakuasi saat kondisi banjir mendesak?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Untuk keadaan darurat yang membutuhkan evakuasi perahu karet, pertolongan medis, atau logistik darurat, hubungi Layanan Tanggap Darurat Kota Semarang di nomor telepon 112 atau Posko Siaga Bencana BPBD Kota Semarang.',
                    },
                  },
                ],
              }),
            }}
          />
        </div>
      </section>

      {/* 7. E-E-A-T & TRUST: TRANSPARANSI SUMBER DATA & DISKLAIMER KEBENCANAAN */}
      <section className="py-12 bg-[#f4ede4]/40 border-b border-[#e6e6e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#696969]">
            <div className="p-4 rounded-[12px] bg-white border border-[#e6e6e6]">
              <h3 className="font-bold text-[#1d1d1d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#007a5a]" />
                Integritas &amp; Sumber Data Terbuka
              </h3>
              <p className="leading-relaxed">
                Data observasi bersumber dari Stasiun Meteorologi Maritim BMKG Tanjung Emas, jaringan kamera PantauSemar Dinas Komunikasi dan Informatika Kota Semarang, serta pos pantau pintu air Dinas Pekerjaan Umum.
              </p>
              <Link href="/data" className="inline-block mt-2 font-bold text-[#1264a3] hover:underline">
                Audit Silsilah Data (Lineage) →
              </Link>
            </div>

            <div className="p-4 rounded-[12px] bg-white border border-[#e6e6e6]">
              <h3 className="font-bold text-[#1d1d1d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-[#cc4117]" />
                Kontak Darurat Kota Semarang
              </h3>
              <p className="leading-relaxed">
                Panggilan Darurat Bebas Pulsa: <strong>112</strong> (BPBD &amp; Ambulans Hebat). Posko Siaga Bencana Kota Semarang: (024) 3550222 / 3584000. Untuk kebutuhan evakuasi darurat, segera hubungi petugas resmi.
              </p>
              <span className="inline-block mt-2 font-semibold text-[#cc4117]">
                Tersedia 24 Jam Bebas Pulsa
              </span>
            </div>

            <div className="p-4 rounded-[12px] bg-white border border-[#e6e6e6]">
              <h3 className="font-bold text-[#1d1d1d] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4a154b]" />
                Tentang Platform &amp; Disklaimer
              </h3>
              <p className="leading-relaxed">
                Platform KotaKu Siaga dikembangkan sebagai inisiatif kesiapsiagaan sipil cerdas guna mendukung ketahanan iklim Kota Semarang. Informasi risiko ditujukan sebagai referensi kesiapsiagaan publik mandiri.
              </p>
              <Link href="/edukasi" className="inline-block mt-2 font-bold text-[#4a154b] hover:underline">
                Panduan Kesiapsiagaan Bencana →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CALL TO ACTION SECTION */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[24px] p-10 sm:p-14 bg-[#4a154b] text-white text-center flex flex-col items-center shadow-card relative overflow-hidden">
            {/* Background mesh glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#611f69] rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3b0f3c] rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center max-w-2xl">
              <span className="text-xs uppercase text-[#d9bdde] font-bold tracking-wider mb-3">
                Partisipasi Warga Semarang
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Menemukan Genangan atau Kerusakan Drainase?
              </h2>
              <p className="mt-4 text-base text-[#d9bdde] leading-relaxed">
                Laporkan kondisi lapangan di sekitar Anda. Informasi dari Anda membantu mempercepat tindakan penanganan oleh petugas dan memberi peringatan dini bagi warga lain.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/laporan/baru"
                  className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-white text-[#4a154b] hover:bg-[#f9f0ff] font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
                >
                  Kirim Laporan Genangan
                </Link>
                <Link
                  href="/edukasi"
                  className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#592466] text-white hover:bg-[#611f69] font-bold text-sm border border-white/20 transition-all active:scale-[0.98]"
                >
                  Panduan Kesiapsiagaan Bencana
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </EmergencyLiteModeManager>
  )
}
