'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert, PhoneCall, Building2, Waves, ArrowRight } from 'lucide-react'

export function Footer() {
  const pathname = usePathname()

  // Sesuai kebutuhan: footer hanya muncul di Beranda (home page '/')
  if (pathname !== '/') {
    return null
  }

  return (
    <footer className="w-full bg-[#4a154b] text-white border-t border-[#481a54] py-14 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Top Header Row with SDGs */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-8 border-b border-[#592466]">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-white/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-[#f4ede4]" />
              </div>
              <span className="font-display font-bold text-2xl text-[#f4ede4]">KotaKu Siaga</span>
              <span className="text-[10px] uppercase px-3 py-0.5 rounded-full bg-[#592466] text-[#d9bdde] font-bold tracking-wider">
                Resiliensi Kota
              </span>
            </div>
            <p className="text-sm text-[#d9bdde] leading-relaxed mt-1">
              Platform kolaboratif pemantauan banjir rob, genangan air, dan kesiapsiagaan iklim Kota Semarang berbasis data terbuka dan laporan warga terverifikasi.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/10">
              <Building2 className="w-5 h-5 text-[#f4ede4]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-[#d9bdde] uppercase font-bold">SDG GOAL 11</span>
                <span className="text-xs text-white font-semibold">Kota Berkelanjutan</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/10">
              <Waves className="w-5 h-5 text-[#f4ede4]" />
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-[#d9bdde] uppercase font-bold">SDG GOAL 13</span>
                <span className="text-xs text-white font-semibold">Aksi Iklim Terpadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs uppercase text-[#f4ede4] font-bold tracking-wider">
              Transparansi & Akuntabilitas
            </span>
            <p className="text-[#d9bdde] text-xs leading-relaxed">
              Formula pembobotan risiko terbuka berstandar ISO 37120. Seluruh perhitungan dapat diaudit publik demi memastikan penanganan yang adil dan objektif.
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#f4ede4]">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
              <span className="font-mono">Formula Terbuka & Data Transparan</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs uppercase text-[#f4ede4] font-bold tracking-wider">
              Sumber Data Publik Terintegrasi
            </span>
            <p className="text-[#d9bdde] text-xs leading-relaxed">
              Terhubung dengan BMKG Maritim Tanjung Emas, OpenStreetMap, Katalog BNPB, CCTV PantauSemar Diskominfo, dan Portal Satu Data Kota Semarang.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link href="/data" className="text-xs text-[#f4ede4] hover:underline font-semibold flex items-center gap-1.5">
                <span>Periksa Asal-Usul Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs uppercase text-[#f4ede4] font-bold tracking-wider">
              Kontak Tanggap Darurat
            </span>
            <div className="flex flex-col gap-1.5 text-xs text-[#d9bdde]">
              <a href="tel:112" className="inline-flex items-center gap-2 text-[#f4ede4] font-bold hover:text-white">
                <PhoneCall className="w-3.5 h-3.5 text-[#cc4117]" />
                BPBD Kota Semarang: Layanan Darurat 112 (Bebas Pulsa)
              </a>
              <span>DPU Bidang SDA & Drainase: (024) 7605655</span>
              <span>Posko Bencana Tanjung Emas: Jl. Coaster No. 1</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#592466] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#d9bdde]">
          <span>© {new Date().getFullYear()} KotaKu Siaga — Inisiatif Kesiapsiagaan Bencana Iklim Kota Semarang.</span>
          <div className="flex items-center gap-6">
            <Link href="/peta" className="hover:text-white transition-colors">Peta</Link>
            <Link href="/laporan" className="hover:text-white transition-colors">Laporan</Link>
            <Link href="/priorities" className="hover:text-white transition-colors">Prioritas</Link>
            <Link href="/data" className="hover:text-white transition-colors">Integritas Data</Link>
            <Link href="/edukasi" className="hover:text-white transition-colors">Edukasi</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
