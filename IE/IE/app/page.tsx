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
  title: 'KotaKu Siaga — Pemantauan Risiko Banjir & Rob Kota Semarang',
  description: 'Platform kolaboratif pemantauan risiko banjir, rob pesisir, dan kesiapsiagaan cuaca Kota Semarang dengan data terbuka dan partisipasi warga.',
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
              Sistem Pemantauan Terpadu
            </span>
            <span className="text-[#696969]">•</span>
            <span className="text-xs text-[#696969]">Kota Semarang & Pesisir Pantura</span>
          </div>

          {/* Editorial Display Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1d1d1d] tracking-[-0.768px] leading-[1.12] max-w-4xl">
            Informasi Banjir Terbuka.{' '}
            <span className="text-[#4a154b]">Respons Cepat.</span> Kota Lebih Tangguh.
          </h1>

          {/* Body Description */}
          <p className="mt-6 text-lg sm:text-xl text-[#696969] leading-[1.55] max-w-2xl">
            KotaKu Siaga mengintegrasikan laporan warga, pemantauan banjir rob pesisir, data cuaca BMKG, dan {cctvCount} titik CCTV PantauSemar untuk mendukung kesiapsiagaan Kota Semarang.
          </p>

          {/* Action CTAs (Pill System: Over-padded 90px radius) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/laporan/baru"
              className="min-h-[48px] px-8 py-3.5 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] active:bg-[#611f69] text-white font-bold text-sm tracking-wide shadow-[0_5px_20px_rgba(0,0,0,0.1)] flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[20px]">campaign</span>
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
                  <h3 className="font-bold text-sm text-[#1d1d1d] mt-1">Underpass Kaligawe (KM 4)</h3>
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
              <div className="md:col-span-8 rounded-[12px] overflow-hidden bg-[#1d1d1d] text-white p-4 flex flex-col justify-between min-h-[220px] relative">
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-ping"></span>
                    Kamera Kaligawe 01 • Siaran Langsung
                  </div>
                  <span className="bg-[#4a154b] px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white">
                    STATUS: AMAN
                  </span>
                </div>

                {/* Simulated Non-YOLO Waterline Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#4a154b]/40 via-transparent to-black/30 pointer-events-none"></div>
                <div className="absolute bottom-6 left-6 right-6 border border-[#007a5a]/70 rounded-[8px] p-2.5 bg-black/50 backdrop-blur-sm flex items-center justify-between text-xs z-10">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#f4ede4] text-[18px]">verified</span>
                    <span>Verifikasi Multi-Frame: Kondisi Normal</span>
                  </div>
                  <span className="font-mono text-[#f4ede4] font-bold">Tingkat Keyakinan: 94%</span>
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
  )
}
