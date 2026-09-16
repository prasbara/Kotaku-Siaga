import Link from 'next/link'
import {
  Compass,
  Map,
  Megaphone,
  Activity,
  Database,
  BookOpen,
  PhoneCall,
  Home,
  ShieldAlert,
} from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-[#fdfbf9] text-[#1d1d1d]">
      <div className="max-w-xl w-full flex flex-col items-center gap-6 p-8 sm:p-10 rounded-3xl bg-white border border-[#e6e6e6] shadow-card">
        
        {/* Icon & 404 Badge */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b]">
            <Compass className="w-10 h-10 animate-pulse text-[#4a154b]" />
          </div>
          <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-[#4a154b] text-white text-[10px] font-mono font-bold">
            STATUS: 404
          </span>
        </div>

        {/* Heading & Information */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1d1d1d] tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-[#696969] leading-relaxed max-w-md mx-auto">
            Halaman yang Anda tuju belum tersedia, sedang dalam pembaruan data, atau tautan telah berpindah. Silakan akses fitur pemantauan utama berikut:
          </p>
        </div>

        {/* Quick Navigation Directory Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left pt-2">
          <Link
            href="/"
            className="p-3 rounded-xl bg-[#fdfbf9] hover:bg-[#f9f0ff] border border-[#e6e6e6] hover:border-[#4a154b]/30 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1d] transition-all group"
          >
            <Home className="w-4 h-4 text-[#4a154b]" />
            <span className="group-hover:text-[#4a154b]">Beranda Utama</span>
          </Link>

          <Link
            href="/peta"
            className="p-3 rounded-xl bg-[#fdfbf9] hover:bg-[#f9f0ff] border border-[#e6e6e6] hover:border-[#4a154b]/30 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1d] transition-all group"
          >
            <Map className="w-4 h-4 text-[#4a154b]" />
            <span className="group-hover:text-[#4a154b]">Peta Pemantauan</span>
          </Link>

          <Link
            href="/laporan/baru"
            className="p-3 rounded-xl bg-[#fdfbf9] hover:bg-[#f9f0ff] border border-[#e6e6e6] hover:border-[#4a154b]/30 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1d] transition-all group"
          >
            <Megaphone className="w-4 h-4 text-[#4a154b]" />
            <span className="group-hover:text-[#4a154b]">Lapor Genangan Air</span>
          </Link>

          <Link
            href="/priorities"
            className="p-3 rounded-xl bg-[#fdfbf9] hover:bg-[#f9f0ff] border border-[#e6e6e6] hover:border-[#4a154b]/30 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1d] transition-all group"
          >
            <Activity className="w-4 h-4 text-[#4a154b]" />
            <span className="group-hover:text-[#4a154b]">Matriks Risiko 16 Wilayah</span>
          </Link>

          <Link
            href="/data"
            className="p-3 rounded-xl bg-[#fdfbf9] hover:bg-[#f9f0ff] border border-[#e6e6e6] hover:border-[#4a154b]/30 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1d] transition-all group"
          >
            <Database className="w-4 h-4 text-[#4a154b]" />
            <span className="group-hover:text-[#4a154b]">Integritas &amp; Sumber Data</span>
          </Link>

          <Link
            href="/edukasi"
            className="p-3 rounded-xl bg-[#fdfbf9] hover:bg-[#f9f0ff] border border-[#e6e6e6] hover:border-[#4a154b]/30 flex items-center gap-2.5 text-xs font-semibold text-[#1d1d1d] transition-all group"
          >
            <BookOpen className="w-4 h-4 text-[#4a154b]" />
            <span className="group-hover:text-[#4a154b]">Edukasi Kebencanaan</span>
          </Link>
        </div>

        {/* Emergency Hotline Strip */}
        <div className="w-full pt-4 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[#696969]">Keadaan darurat mendesak?</span>
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#fdf2f0] text-[#cc4117] hover:bg-[#fde7e4] font-bold border border-[#fecaca] transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Panggilan Darurat BPBD 112</span>
          </a>
        </div>

      </div>
    </div>
  )
}
