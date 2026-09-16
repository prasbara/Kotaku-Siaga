import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import {
  Map,
  ArrowRight,
  ShieldCheck,
  Video,
  ChevronRight,
  Waves,
  PhoneCall,
  Activity,
  FileCheck2,
  CheckCircle2,
  MapPin,
  Megaphone,
  Radio,
  Clock,
  Gauge,
  CloudRain,
  ExternalLink,
} from 'lucide-react'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { PublicDisasterRiskWidget } from '@/components/public/PublicDisasterRiskWidget'
import { EmergencyLiteModeManager } from '@/components/public/EmergencyLiteModeManager'

export const metadata: Metadata = {
  title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
  description:
    'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV PantauSemar, data cuaca BMKG, dan pusat kendali terpadu.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app',
  },
  openGraph: {
    title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    description:
      'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV PantauSemar, data cuaca BMKG, dan pusat kendali terpadu.',
    url: 'https://kotaku-siaga.vercel.app',
    siteName: 'KotaKu Siaga',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    description:
      'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV PantauSemar, data cuaca BMKG, dan pusat kendali terpadu.',
  },
}

export default async function LandingPage() {
  const cctvCount = PANTAUSEMAR_CCTV_POINTS.length

  return (
    <EmergencyLiteModeManager>
      <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen">
        
        {/* =========================================================================
            1. REFINED OPERATIONAL HERO SECTION
            - Balanced vertical spacing
            - Professional typography hierarchy
            - Crystal-clear action priority
            - Seamless live monitoring & CCTV preview integration
           ========================================================================= */}
        <section className="relative overflow-hidden pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-18 border-b border-[#e6e6e6] bg-gradient-to-b from-white via-[#fdfbf9] to-[#f9f5f0]">
          {/* Subtle Ambient Atmosphere Glow */}
          <div className="absolute inset-0 pointer-events-none opacity-60">
            <div className="absolute -top-24 -left-16 w-[450px] h-[450px] rounded-full bg-[#f4ede4] blur-3xl opacity-60" />
            <div className="absolute top-8 -right-16 w-[400px] h-[400px] rounded-full bg-[#f9f0ff] blur-3xl opacity-70" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            
            {/* Real-time System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e6e6e6] shadow-2xs mb-4 sm:mb-5 animate-in fade-in duration-200">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4a154b]">
                Sistem Pemantauan Terpadu
              </span>
              <span className="text-[#696969] text-xs">•</span>
              <span className="text-xs text-[#696969] font-medium">Kota Semarang &amp; Pesisir Pantura</span>
            </div>

            {/* Operational Display Heading */}
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-[#1d1d1d] tracking-tight leading-[1.18] max-w-3xl">
              Pemantauan Risiko Banjir &amp; Rob <span className="text-[#4a154b]">Kota Semarang</span> Terpadu
            </h1>

            {/* Operational Mission Statement */}
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-[#696969] leading-relaxed max-w-2xl font-normal">
              Akses informasi geospasial real-time berbasis jaringan sensor pasut BMKG Maritim Tanjung Emas, 70 CCTV PantauSemar, laporan warga terverifikasi, dan koordinasi posko darurat BPBD.
            </p>

            {/* Clear Primary & Secondary Action Hub */}
            <div className="mt-6 sm:mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xl">
              <Link
                href="/peta"
                className="min-h-[44px] sm:min-h-[46px] px-5 sm:px-6 py-2.5 rounded-full bg-[#4a154b] hover:bg-[#3d123e] active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Map className="w-4 h-4 text-[#f4ede4]" />
                <span>Buka Peta Pemantauan</span>
              </Link>

              <Link
                href="/laporan/baru"
                className="min-h-[44px] sm:min-h-[46px] px-5 sm:px-6 py-2.5 rounded-full bg-[#f9f0ff] hover:bg-[#eddcf7] active:scale-[0.98] text-[#4a154b] border border-[#eddcf7] font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Megaphone className="w-4 h-4 text-[#4a154b]" />
                <span>Laporkan Genangan</span>
              </Link>

              <Link
                href="/dashboard"
                className="min-h-[44px] sm:min-h-[46px] px-4 sm:px-5 py-2.5 rounded-full bg-white hover:bg-[#f4ede4] text-[#1d1d1d] border border-[#e6e6e6] font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-1.5 transition-all shrink-0"
              >
                <span>Pusat Kendali</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#696969]" />
              </Link>
            </div>

            {/* Telemetry Strip Banner */}
            <div className="mt-6 sm:mt-8 w-full max-w-4xl p-2.5 sm:p-3 rounded-2xl bg-white/95 border border-[#e6e6e6] shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4ede4]/80 text-[#1d1d1d]">
                <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">BMKG Maritim:</span>
                <span className="text-[10px] sm:text-[11px] font-semibold">Tanjung Emas (-6.96, 110.42)</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#f9f0ff]/80 text-[#1d1d1d]">
                <Video className="w-3.5 h-3.5 text-[#4a154b] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">PantauSemar:</span>
                <span className="text-[10px] sm:text-[11px] font-semibold">{cctvCount} Titik Terkoneksi</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebf7f3] text-[#007a5a] hidden sm:flex">
                <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold">Data Terbuka &amp; Terverifikasi</span>
              </div>
            </div>

            {/* Integrated Live Monitoring Preview Card */}
            <div className="mt-6 sm:mt-8 w-full max-w-5xl rounded-2xl overflow-hidden bg-white border border-[#e6e6e6] shadow-card text-left">
              
              {/* Card Header Bar */}
              <div className="bg-[#f4ede4]/70 px-4 sm:px-5 py-3 border-b border-[#e6e6e6] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse" />
                  <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                    Siaran CCTV Pemantauan &amp; Kondisi Lapangan
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-[#4a154b] text-white">
                    PantauSemar Diskominfo
                  </span>
                  <Link
                    href="/peta"
                    className="font-semibold text-[#1264a3] hover:underline flex items-center gap-1 ml-1"
                  >
                    <span>70 Titik Peta</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Inner Preview Content Grid */}
              <div className="p-4 sm:p-6 bg-[#fdfbf9] grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                
                {/* Left Telemetry Overview */}
                <div className="lg:col-span-4 flex flex-col gap-3.5 justify-between">
                  <div className="rounded-xl p-4 bg-white border border-[#e6e6e6] shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b]">
                        Titik Pengamatan Utama
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#007a5a] bg-[#ebf7f3] px-2 py-0.5 rounded-full">
                        LIVE
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-[#1d1d1d]">Underpass Kaligawe (KM 4)</div>
                      <span className="text-[11px] text-[#696969]">Kecamatan Genuk / Koridor Utama Pantura</span>
                    </div>

                    <div className="pt-1 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#696969]">Status Kamera:</span>
                        <span className="font-bold text-[#007a5a]">Beroperasi Normal</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#696969]">Ketinggian Muka Air:</span>
                        <span className="font-bold text-[#1d1d1d]">+14 cm dpl</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#696969]">Permukaan Jalan:</span>
                        <span className="font-bold text-[#007a5a]">Kering (Bebas Genangan)</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 bg-[#f9f0ff] border border-[#eddcf7] shadow-2xs space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b] block">
                      Status Rumah Pompa Terdekat
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#1d1d1d] font-medium">Polder Kali Sringin</span>
                        <span className="font-bold text-[#007a5a] text-[11px] bg-white px-2 py-0.5 rounded">
                          Siaga Normal
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#1d1d1d] font-medium">Polder Kali Tenggang</span>
                        <span className="font-bold text-[#007a5a] text-[11px] bg-white px-2 py-0.5 rounded">
                          Siaga Normal
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/peta"
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-[#f4ede4] border border-[#e6e6e6] text-[#4a154b] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Video className="w-3.5 h-3.5 text-[#4a154b]" />
                    <span>Lihat Semua Kamera CCTV di Peta</span>
                  </Link>
                </div>

                {/* Right CCTV Feed Simulation Card */}
                <div className="lg:col-span-8 rounded-xl overflow-hidden bg-[#1d1d1d] text-white p-4 flex flex-col justify-between min-h-[260px] sm:min-h-[300px] relative group border border-[#e6e6e6]/20">
                  {/* Background CCTV Image */}
                  <Image
                    src="/images/cctv-kaligawe-preview.jpg"
                    alt="Siaran Kamera CCTV Underpass Kaligawe Semarang"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 640px"
                    quality={80}
                    priority
                    className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
                  />

                  {/* Legibility Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60 pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />

                  {/* Top Feed Overlay */}
                  <div className="flex items-center justify-between z-10 gap-2">
                    <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono border border-white/15 shadow-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007a5a] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007a5a]" />
                      </span>
                      <span className="font-bold text-white text-[11px]">Kamera Kaligawe 01</span>
                      <span className="text-white/40">•</span>
                      <span className="text-[#007a5a] font-bold text-[11px]">Siaran Langsung</span>
                    </div>

                    <span className="bg-[#007a5a] px-3 py-1 rounded-full text-[11px] font-mono font-bold text-white shadow-xs border border-white/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      STATUS: AMAN
                    </span>
                  </div>

                  {/* Bottom Telemetry Overlay */}
                  <div className="z-10 mt-auto pt-12">
                    <div className="border border-[#007a5a]/60 rounded-xl p-3 bg-black/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#007a5a] shrink-0" />
                        <span className="font-medium text-white">Verifikasi Visual Multikanal: Kondisi Normal</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                        <span className="text-white/80">Elevasi Air: <b className="text-white">+14 cm</b></span>
                        <span className="px-2 py-0.5 rounded bg-[#007a5a]/30 text-[#007a5a] border border-[#007a5a]/50 font-bold">
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

        {/* =========================================================================
            2. REAL-TIME PUBLIC DISASTER RISK & CITIZEN SAFETY WIDGET
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6 mb-12 sm:mt-8 sm:mb-16">
          <PublicDisasterRiskWidget />
        </section>

        {/* =========================================================================
            3. KEY OPERATIONAL METRICS (4-UP CARD GRID)
           ========================================================================= */}
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-[#e6e6e6]">
          <div className="flex flex-col gap-2 mb-10 text-center sm:text-left">
            <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
              Ringkasan Situasi &amp; Kapasitas Operasional
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight">
              Status Pantauan Banjir &amp; Rob Semarang
            </h2>
            <p className="text-sm sm:text-base text-[#696969] leading-relaxed max-w-2xl">
              Integrasi telemetri cuaca maritim BMKG, validasi laporan lapangan warga, dan kesiapan infrastruktur polder pengendali banjir Kota Semarang.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            
            {/* Stat 1: CCTV Nodes */}
            <div className="rounded-2xl p-6 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-2xs flex flex-col justify-between hover:border-[#4a154b]/30 transition-all">
              <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">KAMERA PEMANTAU</span>
              <div className="my-4">
                <div className="font-display text-4xl sm:text-5xl font-bold text-[#4a154b] leading-none tracking-tight">
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

            {/* Stat 2: Verification Layers */}
            <div className="rounded-2xl p-6 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-2xs flex flex-col justify-between hover:border-[#4a154b]/30 transition-all">
              <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">VERIFIKASI LAPORAN</span>
              <div className="my-4">
                <div className="font-display text-4xl sm:text-5xl font-bold text-[#4a154b] leading-none tracking-tight">
                  3 Lapis
                </div>
                <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Validasi Bertingkat</p>
                <p className="text-xs text-[#696969] mt-1">Pemeriksaan GPS, Data Cuaca, dan Anti-Spam</p>
              </div>
              <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
                <span>Metode Penilaian</span>
                <span className="font-bold text-[#007a5a]">Transparan &amp; Terbuka</span>
              </div>
            </div>

            {/* Stat 3: Sea Water Level & Rob Risk */}
            <div className="rounded-2xl p-6 bg-[#4a154b] text-white border border-[#481a54] shadow-md flex flex-col justify-between relative overflow-hidden">
              <span className="text-xs font-bold text-[#d9bdde] uppercase tracking-wider">ELEVASI PASANG AIR LAUT</span>
              <div className="my-4">
                <div className="font-display text-4xl sm:text-5xl font-bold text-white leading-none tracking-tight">
                  +85<span className="text-xl font-normal text-[#d9bdde]">cm</span>
                </div>
                <p className="text-sm text-white font-semibold mt-2">Perairan Tanjung Emas &amp; Kaligawe</p>
                <p className="text-xs text-[#d9bdde] mt-1">Stasiun Pasut BMKG Maritim</p>
              </div>
              <div className="pt-3 border-t border-[#592466] flex items-center justify-between text-xs text-[#f4ede4]">
                <span>Tingkat Risiko</span>
                <span className="font-bold px-2 py-0.5 rounded-full bg-white/20 text-[11px]">WASPADA ROB</span>
              </div>
            </div>

            {/* Stat 4: Polder Pump Infrastructure */}
            <div className="rounded-2xl p-6 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-2xs flex flex-col justify-between hover:border-[#4a154b]/30 transition-all">
              <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">RUMAH POMPA &amp; POLDER</span>
              <div className="my-4">
                <div className="font-display text-4xl sm:text-5xl font-bold text-[#4a154b] leading-none tracking-tight">
                  5
                </div>
                <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Stasiun Polder Utama</p>
                <p className="text-xs text-[#696969] mt-1">Sringin, Tenggang, BKB, BKT, Kalibaru</p>
              </div>
              <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
                <span>Total Kapasitas</span>
                <span className="font-bold text-[#4a154b]">&gt; 35.000 L/detik</span>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            4. CORE FEATURES & CITIZEN SERVICES
           ========================================================================= */}
        <section className="py-14 sm:py-16 bg-white border-t border-b border-[#e6e6e6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
                  Layanan Utama Platform
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight mt-1">
                  Akses Cepat Informasi bagi Warga &amp; Relawan
                </h2>
              </div>
              <Link
                href="/laporan"
                className="text-xs sm:text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1.5 transition-colors"
              >
                <span>Lihat Seluruh Laporan Warga</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Feature 1: Interactive Map */}
              <div className="rounded-2xl p-7 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 hover:shadow-2xs transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-5">
                    <Map className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1d1d1d] mb-2">Peta Pemantauan Interaktif</h3>
                  <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
                    Visualisasi sebaran genangan air, posisi 70 CCTV aktif PantauSemar, radius pasang surut rob, dan status pintu air secara langsung di peta spasial.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                  <Link href="/peta" className="text-xs font-bold text-[#4a154b] hover:underline flex items-center gap-1.5">
                    <span>Buka Peta Geospasial</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 2: Multi-layer Citizen Reports */}
              <div className="rounded-2xl p-7 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 hover:shadow-2xs transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-center text-[#4a154b] mb-5">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1d1d1d] mb-2">Verifikasi Laporan Berlapis</h3>
                  <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
                    Setiap laporan warga divalidasi silang melalui koordinat GPS akurat, sensor cuaca sekitar, dan penyaringan spam sebelum dipublikasikan.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                  <Link href="/laporan/baru" className="text-xs font-bold text-[#4a154b] hover:underline flex items-center gap-1.5">
                    <span>Kirim Laporan Lapangan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 3: Priority Risk Matrix */}
              <div className="rounded-2xl p-7 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 hover:shadow-2xs transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-5">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1d1d1d] mb-2">Matriks Prioritas Penanganan</h3>
                  <p className="text-xs sm:text-sm text-[#696969] leading-relaxed">
                    Perhitungan terukur untuk memprioritaskan evakuasi, pengerahan pompa bergerak, dan distribusi logistik berdasarkan kerentanan wilayah.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                  <Link href="/priorities" className="text-xs font-bold text-[#4a154b] hover:underline flex items-center gap-1.5">
                    <span>Akses Matriks Prioritas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            5. GEOGRAPHIC COVERAGE (16 KECAMATAN KOTA SEMARANG)
           ========================================================================= */}
        <section className="py-14 sm:py-16 bg-[#fdfbf9] border-b border-[#e6e6e6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
                  Cakupan Wilayah Administratif
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight mt-1">
                  Pemantauan Risiko Banjir &amp; Rob Per Kecamatan Kota Semarang
                </h2>
                <p className="text-xs sm:text-sm text-[#696969] mt-1.5 max-w-2xl">
                  Akses matriks risiko spesifik, kondisi drainase, stasiun pompa, dan laporan warga di seluruh 16 wilayah kecamatan Kota Semarang.
                </p>
              </div>
              <Link
                href="/priorities"
                className="text-xs font-bold text-[#4a154b] hover:underline uppercase tracking-wider flex items-center gap-1.5 shrink-0"
              >
                <span>Lihat Matriks Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
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
                  className="group p-4 rounded-xl bg-white border border-[#e6e6e6] hover:border-[#4a154b] shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b]">
                        {district.alert}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#696969] group-hover:text-[#4a154b] transition-colors" />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#1d1d1d] group-hover:text-[#4a154b] transition-colors">
                      {district.name}
                    </h3>
                    <p className="text-[11px] text-[#696969] mt-0.5 leading-snug">
                      {district.tag}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1264a3] mt-3 flex items-center gap-1 group-hover:underline">
                    <span>Pantau Wilayah Ini</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. DATA INTEGRITY, TRANSPARENCY, & EMERGENCY CONTACTS
           ========================================================================= */}
        <section className="py-12 bg-[#f4ede4]/50 border-b border-[#e6e6e6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-[#696969]">
              
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#e6e6e6] shadow-2xs space-y-2">
                <h3 className="font-bold text-[#1d1d1d] uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#007a5a]" />
                  Integritas &amp; Sumber Data Terbuka
                </h3>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  Data observasi bersumber dari Stasiun Meteorologi Maritim BMKG Tanjung Emas, jaringan kamera PantauSemar Diskominfo Kota Semarang, dan sensor pos pantau pintu air DPU.
                </p>
                <Link href="/data" className="inline-flex items-center gap-1 font-bold text-[#1264a3] hover:underline pt-1">
                  <span>Audit Silsilah Data (Lineage)</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#e6e6e6] shadow-2xs space-y-2">
                <h3 className="font-bold text-[#1d1d1d] uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <PhoneCall className="w-4 h-4 text-[#cc4117]" />
                  Kontak Darurat Kota Semarang
                </h3>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  Panggilan Darurat Bebas Pulsa: <strong>112</strong> (BPBD &amp; Ambulans Hebat). Posko Siaga Bencana Kota Semarang: (024) 3550222 / 3584000. Tersedia 24 jam nonstop.
                </p>
                <a href="tel:112" className="inline-flex items-center gap-1 font-bold text-[#cc4117] hover:underline pt-1">
                  <span>Hubungi 112 Bebas Pulsa</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#e6e6e6] shadow-2xs space-y-2">
                <h3 className="font-bold text-[#1d1d1d] uppercase tracking-wider flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#4a154b]" />
                  Tentang Platform &amp; Literasi Bencana
                </h3>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  Platform KotaKu Siaga dikembangkan sebagai inisiatif kesiapsiagaan sipil cerdas guna mendukung ketahanan iklim Semarang berstandar ISO 37120.
                </p>
                <Link href="/edukasi" className="inline-flex items-center gap-1 font-bold text-[#4a154b] hover:underline pt-1">
                  <span>Panduan Kesiapsiagaan Bencana</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            7. CITIZEN CALL TO ACTION SECTION
           ========================================================================= */}
        <section className="py-14 sm:py-18 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl p-8 sm:p-12 bg-[#4a154b] text-white text-center flex flex-col items-center shadow-md relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-[#611f69] rounded-full blur-3xl opacity-50 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#3b0f3c] rounded-full blur-3xl opacity-50 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center max-w-2xl">
                <span className="text-xs uppercase text-[#d9bdde] font-bold tracking-wider mb-2">
                  Partisipasi Warga Semarang
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Menemukan Genangan atau Kerusakan Drainase?
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-[#d9bdde] leading-relaxed">
                  Laporkan kondisi lapangan di sekitar Anda. Informasi dari Anda membantu mempercepat tindakan pengerahan pompa oleh petugas dan memberi peringatan dini bagi warga lain.
                </p>
                
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/laporan/baru"
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-white text-[#4a154b] hover:bg-[#f9f0ff] font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98]"
                  >
                    Kirim Laporan Genangan
                  </Link>
                  <Link
                    href="/edukasi"
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#592466] text-white hover:bg-[#611f69] font-bold text-xs sm:text-sm border border-white/20 transition-all active:scale-[0.98]"
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
