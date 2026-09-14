import Link from 'next/link'
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
} from 'lucide-react'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'

export const metadata: Metadata = {
  title: 'KotaKu Siaga — Civic Climate Intelligence & Resiliensi Semarang',
  description: 'Platform kolaboratif monitoring risiko hidrometeorologis, rob pesisir, dan kesiapsiagaan iklim Kota Semarang dengan prinsip transparansi data terbuka.',
}

export default async function LandingPage() {
  const cctvCount = PANTAUSEMAR_CCTV_POINTS.length

  return (
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
              Civic Climate Radar v1.1
            </span>
            <span className="text-[#696969]">•</span>
            <span className="text-xs text-[#696969]">Kota Semarang & Pesisir Pantura</span>
          </div>

          {/* Editorial Display Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1d1d1d] tracking-[-0.768px] leading-[1.12] max-w-4xl">
            Data Lingkungan Terbuka.{' '}
            <span className="text-[#4a154b]">Respons Cepat.</span> Kota Lebih Tangguh.
          </h1>

          {/* Body Description */}
          <p className="mt-6 text-lg sm:text-xl text-[#696969] leading-[1.55] max-w-2xl">
            KotaKu Siaga menghubungkan laporan warga, pemetaan spasial rob pesisir, telemetri cuaca BMKG, dan 70 titik CCTV PantauSemar untuk resiliensi iklim Kota Semarang.
          </p>

          {/* Action CTAs (Pill System: Over-padded 90px radius) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/laporan/baru"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] active:bg-[#611f69] text-white font-bold text-sm tracking-wide shadow-[0_5px_20px_rgba(0,0,0,0.1)] flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">campaign</span>
              Laporkan Kejadian Lapangan
            </Link>

            <Link
              href="/peta"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#f9f0ff] hover:bg-[#eddcf7] text-[#1d1d1d] font-bold text-sm tracking-wide flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Map className="w-4 h-4 text-[#4a154b]" />
              Buka Peta Spasial
            </Link>

            <Link
              href="/dashboard"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-white hover:bg-[#f9f0ff] text-[#4a154b] border-2 border-[#4a154b] font-bold text-sm tracking-wide flex items-center gap-2 transition-all"
            >
              Command Center
              <ArrowRight className="w-4 h-4 text-[#4a154b]" />
            </Link>
          </div>

          {/* Telemetry Strip */}
          <div className="mt-10 w-full max-w-4xl p-3.5 rounded-[16px] bg-white/90 backdrop-blur-sm border border-[#e6e6e6] shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#f4ede4]">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">Telemetri BMKG:</span>
              <span className="text-[11px] text-[#1d1d1d] font-semibold">Tanjung Emas (-6.96, 110.42)</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f9f0ff]">
              <Video className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">CCTV Non-YOLO:</span>
              <span className="text-[11px] text-[#1d1d1d] font-semibold">{cctvCount} Titik Terpantau</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4ede4] hidden sm:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a]" />
              <span className="text-[11px] font-bold text-[#007a5a]">100% Deterministic & Open</span>
            </div>
          </div>

          {/* Floating Product UI Mockup (Slacc Signature 3:2 Aspect on Pastel Mesh) */}
          <div className="mt-14 w-full max-w-5xl rounded-[12px] overflow-hidden bg-white border border-[#e6e6e6] shadow-[0_0_32px_rgba(0,0,0,0.08)] text-left">
            {/* Chrome Top Bar */}
            <div className="bg-[#f4ede4] px-4 py-3 border-b border-[#e6e6e6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#cc4117]/80"></span>
                <span className="w-3 h-3 rounded-full bg-[#d97706]/80"></span>
                <span className="w-3 h-3 rounded-full bg-[#007a5a]/80"></span>
                <span className="ml-2 font-mono text-[11px] text-[#696969]">kotakusiaga.semarangkota.go.id/radar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#4a154b] text-white">
                  NON-YOLO CV ONLINE
                </span>
                <span className="text-[11px] font-mono text-[#007a5a] font-semibold">40.3 FPS</span>
              </div>
            </div>

            {/* Inner Dashboard Preview Grid */}
            <div className="p-6 bg-[#fdfbf9] grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Telemetry Panel */}
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="rounded-[12px] p-4 bg-white border border-[#e6e6e6]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b]">FOKUS CCTV AKTIF</span>
                  <h3 className="font-bold text-sm text-[#1d1d1d] mt-1">Underpass Kaligawe (KM 4)</h3>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#696969]">Kesehatan Kamera:</span>
                    <span className="font-bold text-[#007a5a]">ONLINE (Sharpness 34.2)</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#696969]">Waterline Elevation:</span>
                    <span className="font-bold text-[#1d1d1d]">+14 cm MSL</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#696969]">Tekstur Aspal:</span>
                    <span className="font-bold text-[#007a5a]">Aggregated (Non-Water)</span>
                  </div>
                </div>

                <div className="rounded-[12px] p-4 bg-[#f9f0ff] border border-[#eddcf7]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a154b]">MULTI-SIGNAL GAUGES</span>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#1d1d1d]">Water Area Ratio</span>
                        <span className="font-bold text-[#4a154b]">0.02 / 0.35</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-[#4a154b] rounded-full" style={{ width: '6%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#1d1d1d]">Temporal Persistence</span>
                        <span className="font-bold text-[#007a5a]">100% Stabil</span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full bg-[#007a5a] rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Live Visual Simulation */}
              <div className="md:col-span-8 rounded-[12px] overflow-hidden bg-[#1d1d1d] text-white p-4 flex flex-col justify-between min-h-[220px] relative">
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-ping"></span>
                    CAM-KLG-01 • RTMP/HLS STREAM
                  </div>
                  <span className="bg-[#4a154b] px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white">
                    STATE: NORMAL
                  </span>
                </div>

                {/* Simulated Non-YOLO Waterline Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#4a154b]/40 via-transparent to-black/30 pointer-events-none"></div>
                <div className="absolute bottom-6 left-6 right-6 border border-[#007a5a]/70 rounded-[8px] p-2.5 bg-black/50 backdrop-blur-sm flex items-center justify-between text-xs z-10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f4ede4] text-[18px]">verified</span>
                    <span>Zero False Alarm Verification: 15/15 frames normal</span>
                  </div>
                  <span className="font-mono text-[#f4ede4] font-bold">Confidence: 94.2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & SITUATIONAL OVERVIEW (Slacc card-stat Pattern with 50px Aubergine Numerals) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col gap-2 mb-12 text-center sm:text-left">
          <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
            Situational Awareness & Statistics
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d] tracking-[-0.256px]">
            Pemantauan Risiko Terkini Kota Semarang
          </h2>
          <p className="text-base text-[#696969] leading-[1.55] max-w-2xl">
            Integrasi langsung antara laporan warga deterministik, telemetri hidrometeorologi BMKG, dan infrastruktur pengendali banjir pesisir.
          </p>
        </div>

        {/* 4-Up Grid of Slacc card-stat Components */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-[0_5px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">CCTV NON-YOLO</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-[#4a154b] leading-[1.12] tracking-[-0.6px]">
                {cctvCount}
              </div>
              <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Titik Kamera Terkalibrasi</p>
              <p className="text-xs text-[#696969] mt-1">PantauSemar Diskominfo Kota Semarang</p>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Throughput Realtime</span>
              <span className="font-bold text-[#007a5a]">40.3 FPS CPU</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-[0_5px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">VERIFIKASI LAPIS TIGA</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-[#4a154b] leading-[1.12] tracking-[-0.6px]">
                100%
              </div>
              <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Deterministik & Terbuka</p>
              <p className="text-xs text-[#696969] mt-1">Cross-check GPS, BMKG, & Anti-Bot Trap</p>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Integritas Skor</span>
              <span className="font-bold text-[#007a5a]">Zero Black Box</span>
            </div>
          </div>

          {/* Stat 3: Featured Aubergine Card (Slacc card-pricing-featured equivalent) */}
          <div className="rounded-[16px] p-8 bg-[#4a154b] text-white border border-[#481a54] shadow-[0_5px_20px_rgba(74,21,75,0.15)] flex flex-col justify-between relative overflow-hidden">
            <span className="text-xs font-bold text-[#d9bdde] uppercase tracking-wider">STATUS ELEVASI ROB</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-white leading-[1.12] tracking-[-0.6px]">
                +85<span className="text-2xl font-normal text-[#d9bdde]">cm</span>
              </div>
              <p className="text-sm text-white font-semibold mt-2">Tanjung Emas & Kaligawe</p>
              <p className="text-xs text-[#d9bdde] mt-1">Stasiun Pasut BMKG Maritim</p>
            </div>
            <div className="pt-3 border-t border-[#592466] flex items-center justify-between text-xs text-[#f4ede4]">
              <span>Kategori Status</span>
              <span className="font-bold px-2 py-0.5 rounded-full bg-white/20">WASPADA ROB</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-[0_5px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">POLDER & DRAINASE</span>
            <div className="my-4">
              <div className="font-display text-[50px] font-bold text-[#4a154b] leading-[1.12] tracking-[-0.6px]">
                5
              </div>
              <p className="text-sm text-[#1d1d1d] font-semibold mt-2">Rumah Pompa Terkoneksi</p>
              <p className="text-xs text-[#696969] mt-1">Sringin, Tenggang, BKB, BKT, Kalibaru</p>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Kapasitas Pembuangan</span>
              <span className="font-bold text-[#4a154b]">&gt; 35.000 L/s</span>
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
                Fitur Utama Platform
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight mt-1">
                Alat Kolaborasi Warga & Pengambil Keputusan
              </h2>
            </div>
            <Link
              href="/laporan"
              className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1.5 transition-colors"
            >
              Jelajahi Seluruh Laporan Warga →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-[16px] p-8 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-6">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">Peta Spasial Interaktif</h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Visualisasi titik kejadian banjir, sebaran CCTV, layer genangan air, dan stasiun polder pompa secara geospasial real-time.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                <Link href="/peta" className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1 transition-colors">
                  Buka Peta Interaktif →
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-[16px] p-8 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#f4ede4] border border-[#e8ded2] flex items-center justify-center text-[#4a154b] mb-6">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">Verifikasi Bukti Berlapis</h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Setiap laporan divalidasi via Anti-Bot Trap, cross-reference GPS, deteksi hash duplikat, dan sinkronisasi observasi cuaca BMKG.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                <Link href="/laporan/baru" className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1 transition-colors">
                  Kirim Laporan Baru →
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-[16px] p-8 bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col justify-between hover:border-[#4a154b]/40 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">Matriks Prioritas Terbuka</h3>
                <p className="text-sm text-[#696969] leading-relaxed">
                  Formula deterministik transparan untuk menghitung skor kerentanan per kecamatan tanpa monopoli vendor proprietary.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#e6e6e6]">
                <Link href="/priorities" className="text-sm font-semibold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1 transition-colors">
                  Lihat Skor Matriks →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION SECTION */}
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
                Lihat Genangan atau Kerusakan Drainase di Sekitar Anda?
              </h2>
              <p className="mt-4 text-base text-[#d9bdde] leading-relaxed">
                Laporkan kondisi lapangan dalam hitungan detik. Laporan Anda langsung diteruskan ke sistem verifikasi dan dashboard penanganan dinas terkait.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/laporan/baru"
                  className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-white text-[#4a154b] hover:bg-[#f9f0ff] font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
                >
                  Kirim Laporan Sekarang
                </Link>
                <Link
                  href="/edukasi"
                  className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#592466] text-white hover:bg-[#611f69] font-bold text-sm border border-white/20 transition-all active:scale-[0.98]"
                >
                  Pelajari Mitigasi Bencana
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
