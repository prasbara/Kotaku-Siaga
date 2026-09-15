'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShieldAlert, Menu, X, PhoneCall, ShieldCheck, Radio, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SOSModal } from '@/components/sos/SOSModal'
import { EmergencyLiteModeToggle } from '@/components/layout/EmergencyLiteModeToggle'

const navItems = [
  { label: 'Beranda', href: '/' },
  { label: 'Peta Pemantauan', href: '/peta', badgeDot: true },
  { label: 'Laporan Warga', href: '/laporan' },
  { label: 'Lapor Genangan', href: '/laporan/baru', isHighlight: true },
  { label: 'Matriks Risiko', href: '/priorities' },
  { label: 'Integritas Data', href: '/data' },
  { label: 'Edukasi Bencana', href: '/edukasi' },
  { label: 'Pusat Kendali', href: '/dashboard' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSosOpen, setIsSosOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB'
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-close mobile drawer when pathname changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
    <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#e6e6e6] shadow-subtle transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Editorial Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#4a154b] rounded-xl p-1"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] bg-[#4a154b] flex items-center justify-center text-white shadow-subtle group-hover:bg-[#481a54] transition-colors shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-[#f4ede4]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg sm:text-xl text-[#1d1d1d] tracking-tight leading-none group-hover:text-[#4a154b] transition-colors">
                KotaKu Siaga
              </span>
              <span className="text-[10px] sm:text-[11px] text-[#696969] tracking-normal hidden md:inline truncate font-medium">
                Pemantauan Risiko Banjir &amp; Rob Kota Semarang
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            if (item.isHighlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="min-h-[42px] px-5 py-2 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] active:bg-[#611f69] font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all ml-1.5 mr-1 active:scale-[0.98]"
                >
                  <Megaphone className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-[90px] transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#f4ede4] text-[#4a154b] font-bold shadow-subtle'
                    : 'text-[#1d1d1d] hover:text-[#4a154b] hover:bg-[#f9f0ff]'
                )}
              >
                {item.label}
                {item.badgeDot && (
                  <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Emergency Lite Mode Switch */}
          <EmergencyLiteModeToggle />

          {/* EOC Clock */}
          <div className="hidden 2xl:flex flex-col text-right pr-2">
            <span className="text-[9px] font-mono text-[#696969] uppercase font-bold tracking-wider">WAKTU SISTEM</span>
            <span className="text-xs font-mono text-[#1d1d1d] font-semibold">{currentTime || 'WIB'}</span>
          </div>

          {/* SOS Emergency Button */}
          <button
            type="button"
            onClick={() => setIsSosOpen(true)}
            className="min-h-[40px] sm:min-h-[48px] px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-[90px] bg-[#b91c1c] text-white hover:bg-[#991b1b] active:bg-[#7f1d1d] text-[11px] sm:text-xs font-bold tracking-wide flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all active:scale-[0.98] animate-pulse cursor-pointer"
            title="Kirim Sinyal SOS Darurat 1-Klik"
            aria-label="Kirim Sinyal SOS Darurat 1-Klik"
          >
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="font-extrabold uppercase">SOS</span>
          </button>

          {/* Emergency 112 Dispatch Button */}
          <a
            href="tel:112"
            className="hidden sm:inline-flex min-h-[48px] px-4 py-2.5 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] text-xs font-bold tracking-wide items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            title="Hubungi Panggilan Darurat BPBD 112"
            aria-label="Hubungi Panggilan Darurat BPBD 112"
          >
            <PhoneCall className="w-4 h-4 text-[#cc4117]" />
            <span>112</span>
          </a>

          {/* Operator / Profile Icon */}
          <Link
            href="/dashboard"
            className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-[90px] bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] hover:bg-[#4a154b] hover:text-white transition-all shadow-subtle"
            title="Masuk ke Pusat Kendali"
            aria-label="Masuk ke Pusat Kendali Operator"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-[90px] bg-[#f4ede4] text-[#1d1d1d] hover:bg-[#f9f0ff] focus:outline-none cursor-pointer"
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5 text-[#4a154b]" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-[#e6e6e6] bg-white px-4 py-4 max-h-[calc(100dvh-4.5rem)] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-2 shadow-card animate-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'min-h-[48px] px-4 py-3 rounded-[90px] text-sm font-semibold transition-colors flex items-center justify-between',
                  isActive
                    ? 'bg-[#4a154b] text-white font-bold'
                    : item.isHighlight
                    ? 'bg-[#f9f0ff] text-[#4a154b] border border-[#eddcf7]'
                    : 'text-[#1d1d1d] hover:bg-[#f4ede4]'
                )}
              >
                <span>{item.label}</span>
                {item.badgeDot && (
                  <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse"></span>
                )}
              </Link>
            )
          })}
          <div className="pt-3 mt-1 border-t border-[#e6e6e6] flex items-center justify-between">
            <span className="text-xs font-mono text-[#696969]">Waktu Operasional: {currentTime}</span>
            <a
              href="tel:112"
              className="min-h-[48px] px-5 py-2.5 rounded-[90px] bg-[#cc4117] text-white font-bold text-xs flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              112 DARURAT
            </a>
          </div>
        </div>
      )}
    </header>
    <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </>
  )
}
