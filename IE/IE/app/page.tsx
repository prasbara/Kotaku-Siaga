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

          {/* Action CTAs (Pill System) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/laporan/baru"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] active:bg-[#611f69] text-white font-bold text-sm tracking-wide shadow-cta flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">campaign</span>
              Laporkan Kejadian Lapangan
            </Link>

            <Link
              href="/peta"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-white hover:bg-[#f9f0ff] active:bg-[#eddcf7] text-[#4a154b] border-2 border-[#4a154b] font-bold text-sm tracking-wide flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Map className="w-4 h-4" />
              Buka Peta Spasial
            </Link>

            <Link
              href="/dashboard"
              className="min-h-[48px] px-7 py-3 rounded-[90px] bg-[#f9f0ff] hover:bg-[#eddcf7] text-[#1d1d1d] font-semibold text-sm flex items-center gap-2 transition-all"
            >
              Command Center
              <ArrowRight className="w-4 h-4 text-[#4a154b]" />
            </Link>
          </div>

          {/* Telemetry Strip */}
          <div className="mt-12 w-full max-w-4xl p-3.5 rounded-[16px] bg-white/90 backdrop-blur-sm border border-[#e6e6e6] shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#f4ede4]">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">Telemetri BMKG:</span>
              <span className="text-[11px] text-[#1d1d1d] font-semibold">Tanjung Emas (-6.96, 110.42)</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f9f0ff]">
              <Video className="w-3.5 h-3.5 text-[#4a154b]" />
              <span className="text-[11px] font-bold text-[#4a154b] uppercase tracking-wider">PantauSemar CCTV:</span>
              <span className="text-[11px] text-[#1d1d1d] font-semibold">{cctvCount} Titik Terkoneksi</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f4ede4] hidden sm:flex">
              <ShieldCheck className="w-3.5 h-3.5 text-[#007a5a]" />
              <span className="text-[11px] font-bold text-[#007a5a]">100% Deterministic & Open</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & SITUATIONAL OVERVIEW */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col gap-2 mb-10 text-center sm:text-left">
          <span className="text-xs uppercase text-[#4a154b] font-bold tracking-wider">
            Situational Awareness
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight">
            Pemantauan Risiko Terkini Kota Semarang
          </h2>
          <p className="text-sm text-[#696969] max-w-2xl">
            Integrasi langsung antara laporan warga yang diverifikasi berlapis dan infrastruktur pengendali banjir pesisir.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Featured Aubergine */}
          <div className="rounded-[16px] p-8 bg-[#4a154b] text-white border border-[#481a54] shadow-card flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d9bdde] uppercase tracking-wider">STATUS PESISIR</span>
              <Waves className="w-5 h-5 text-[#f4ede4]" />
            </div>
            <div className="my-6">
              <div className="text-3xl font-display font-bold text-white tracking-tight">Waspada Rob</div>
              <div className="text-xs text-[#d9bdde] mt-1 font-medium">Kawasan Kaligawe & Pelabuhan</div>
            </div>
            <div className="pt-3 border-t border-[#592466] flex items-center justify-between text-xs text-[#f4ede4]">
              <span>Elevasi Pasang Air Laut</span>
              <span className="font-bold">+85 cm MSL</span>
            </div>
          </div>

          {/* Card 2: Cream Feature */}
          <div className="rounded-[16px] p-8 bg-[#f4ede4] text-[#1d1d1d] border border-[#e8ded2] shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">CCTV OPERASIONAL</span>
              <Video className="w-5 h-5 text-[#4a154b]" />
            </div>
            <div className="my-6">
              <div className="text-3xl font-display font-bold text-[#1d1d1d] tracking-tight">{cctvCount} Titik</div>
              <div className="text-xs text-[#696969] mt-1">PantauSemar CCTV Diskominfo</div>
            </div>
            <div className="pt-3 border-t border-[#e8ded2] flex items-center justify-between text-xs text-[#696969]">
              <span>Kamera Genangan & Pompa</span>
              <span className="font-bold text-[#007a5a]">Online 24/7</span>
            </div>
          </div>

          {/* Card 3: Lavender Feature */}
          <div className="rounded-[16px] p-8 bg-[#f9f0ff] text-[#1d1d1d] border border-[#eddcf7] shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">RUMAH POMPA</span>
              <Droplets className="w-5 h-5 text-[#4a154b]" />
            </div>
            <div className="my-6">
              <div className="text-3xl font-display font-bold text-[#1d1d1d] tracking-tight">5 Polder Utama</div>
              <div className="text-xs text-[#696969] mt-1">Sringin, Tenggang, BKB, BKT, Kalibaru</div>
            </div>
            <div className="pt-3 border-t border-[#eddcf7] flex items-center justify-between text-xs text-[#696969]">
              <span>Kapasitas Pembuangan</span>
              <span className="font-bold text-[#4a154b]">&gt; 35.000 L/dtk</span>
            </div>
          </div>

          {/* Card 4: White Subtle */}
          <div className="rounded-[16px] p-8 bg-white text-[#1d1d1d] border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">RESPONS DARURAT</span>
              <PhoneCall className="w-5 h-5 text-[#cc4117]" />
            </div>
            <div className="my-6">
              <div className="text-3xl font-display font-bold text-[#1d1d1d] tracking-tight">Call 112</div>
              <div className="text-xs text-[#696969] mt-1">EOC BPBD Kota Semarang</div>
            </div>
            <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969]">
              <span>Layanan Publik Darurat</span>
              <span className="font-bold text-[#cc4117]">Bebas Pulsa</span>
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
              className="text-sm font-bold text-[#4a154b] hover:text-[#611f69] flex items-center gap-1.5 transition-colors"
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
                <Link href="/peta" className="text-xs font-bold text-[#4a154b] hover:underline flex items-center gap-1">
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
                <Link href="/laporan/baru" className="text-xs font-bold text-[#4a154b] hover:underline flex items-center gap-1">
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
                <Link href="/priorities" className="text-xs font-bold text-[#4a154b] hover:underline flex items-center gap-1">
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
