'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Menu,
  X,
  PhoneCall,
  ShieldCheck,
  Radio,
  Megaphone,
  MapPin,
  Clock,
  Compass,
  FileText,
  Activity,
  Database,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SOSModal } from '@/components/sos/SOSModal'
import { EmergencyLiteModeToggle } from '@/components/layout/EmergencyLiteModeToggle'

interface NavLinkItem {
  label: string
  href: string
  badgeDot?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

const mainNavLinks: NavLinkItem[] = [
  { label: 'Beranda', href: '/', icon: Compass },
  { label: 'Peta Pemantauan', href: '/peta', badgeDot: true, icon: MapPin },
  { label: 'Laporan Warga', href: '/laporan', icon: FileText },
  { label: 'Matriks Risiko', href: '/priorities', icon: Activity },
  { label: 'Integritas Data', href: '/data', icon: Database },
  { label: 'Edukasi Bencana', href: '/edukasi', icon: BookOpen },
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

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#e6e6e6] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 lg:gap-4">
          
          {/* Brand Logo & Editorial Title */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-[#4a154b] rounded-xl p-0.5"
              aria-label="Kembali ke Beranda KotaKu Siaga"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#4a154b] flex items-center justify-center text-white shadow-sm group-hover:bg-[#3d123e] transition-colors shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#f4ede4]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-base sm:text-lg text-[#1d1d1d] tracking-tight leading-none group-hover:text-[#4a154b] transition-colors">
                    KotaKu Siaga
                  </span>
                  <span className="hidden xl:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#f4ede4] text-[#4a154b]">
                    Semarang
                  </span>
                </div>
                <span className="text-[10px] text-[#696969] tracking-tight hidden md:inline truncate font-medium mt-0.5">
                  Pemantauan Risiko Banjir &amp; Rob Terpadu
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links (Clean, Uncluttered 6-Item Public Navigation) */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden lg:flex items-center gap-1 xl:gap-1.5"
          >
            {mainNavLinks.map((item) => {
              const active = isLinkActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'min-h-[36px] px-3 xl:px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 flex items-center gap-1.5 select-none',
                    active
                      ? 'bg-[#f4ede4] text-[#4a154b] font-bold shadow-2xs'
                      : 'text-[#1d1d1d]/90 hover:text-[#4a154b] hover:bg-[#f9f0ff]'
                  )}
                >
                  <span>{item.label}</span>
                  {item.badgeDot && (
                    <span
                      className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse shrink-0"
                      title="Data Langsung"
                      aria-label="Status data langsung aktif"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Header Right Action & Utility Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Citizen Action: Lapor Genangan */}
            <Link
              href="/laporan/baru"
              className="hidden sm:inline-flex min-h-[38px] px-3.5 sm:px-4 py-2 rounded-full bg-[#4a154b] text-white hover:bg-[#3d123e] active:scale-[0.98] font-bold text-xs shadow-xs items-center gap-1.5 transition-all"
              title="Kirim Laporan Genangan Banjir Baru"
            >
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>Lapor Genangan</span>
            </Link>

            {/* Emergency Lite Mode Toggle */}
            <EmergencyLiteModeToggle />

            {/* Emergency SOS Button */}
            <button
              type="button"
              onClick={() => setIsSosOpen(true)}
              className="min-h-[38px] px-2.5 sm:px-3.5 py-2 rounded-full bg-[#cc4117] text-white hover:bg-[#b03713] active:scale-[0.98] text-xs font-extrabold tracking-wide flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Kirim Sinyal SOS Darurat 1-Klik"
              aria-label="Kirim Sinyal SOS Darurat 1-Klik"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span className="uppercase">SOS</span>
            </button>

            {/* BPBD 112 Dispatch Hotline */}
            <a
              href="tel:112"
              className="hidden md:inline-flex min-h-[38px] px-3 py-2 rounded-full bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] text-xs font-bold items-center gap-1.5 shadow-2xs transition-all"
              title="Hubungi Panggilan Darurat BPBD 112 Bebas Pulsa"
              aria-label="Panggilan Darurat BPBD 112 Bebas Pulsa"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#cc4117]" />
              <span>112</span>
            </a>

            {/* Operational Dashboard Link */}
            <Link
              href="/dashboard"
              className="w-9 h-9 sm:w-9.5 sm:h-9.5 shrink-0 rounded-full bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b] hover:bg-[#4a154b] hover:text-white transition-all shadow-2xs"
              title="Akses Pusat Kendali Operasi"
              aria-label="Akses Pusat Kendali Operasi"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-[#f4ede4] text-[#1d1d1d] hover:bg-[#f9f0ff] focus:outline-none cursor-pointer transition-colors"
              aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4.5 w-4.5 text-[#4a154b]" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Categorized Drawer Navigation */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[#e6e6e6] bg-white px-4 py-5 max-h-[calc(100dvh-4.25rem)] overflow-y-auto pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
            
            {/* Quick Urgent Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/laporan/baru"
                onClick={() => setMobileOpen(false)}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#4a154b] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Megaphone className="w-4 h-4" />
                <span>Lapor Genangan</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  setIsSosOpen(true)
                }}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#cc4117] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>SOS DARURAT</span>
              </button>
            </div>

            {/* Public Navigation List */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-[#696969] px-2 tracking-wider">
                Navigasi Publik
              </span>
              <div className="flex flex-col gap-1 pt-1">
                {mainNavLinks.map((item) => {
                  const active = isLinkActive(item.href)
                  const Icon = item.icon || Compass
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between',
                        active
                          ? 'bg-[#4a154b] text-white font-bold'
                          : 'text-[#1d1d1d] hover:bg-[#f4ede4]'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn('w-4 h-4', active ? 'text-white' : 'text-[#4a154b]')} />
                        <span>{item.label}</span>
                      </div>
                      {item.badgeDot && (
                        <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Responders & Operational Center */}
            <div className="space-y-1 pt-2 border-t border-[#e6e6e6]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#696969] px-2 tracking-wider">
                Pusat Kendali &amp; Kedaruratan
              </span>
              <div className="flex flex-col gap-1 pt-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#f9f0ff] border border-[#eddcf7] text-[#4a154b] font-bold text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-[#4a154b]" />
                    <span>Pusat Kendali Operasi</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#4a154b] text-white">
                    Operator
                  </span>
                </Link>

                <a
                  href="tel:112"
                  className="min-h-[42px] px-3.5 py-2.5 rounded-xl bg-[#f4ede4] text-[#1d1d1d] font-bold text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <PhoneCall className="w-4 h-4 text-[#cc4117]" />
                    <span>Hotline Darurat BPBD Semarang</span>
                  </div>
                  <span className="font-mono font-bold text-[#cc4117]">112</span>
                </a>
              </div>
            </div>

            {/* System Status & Time */}
            <div className="pt-2 border-t border-[#e6e6e6] flex items-center justify-between text-xs text-[#696969] px-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4a154b]" />
                <span className="font-mono text-[11px]">{currentTime || 'WIB'}</span>
              </div>
              <span className="text-[10px] font-medium text-[#007a5a] bg-[#ebf7f3] px-2 py-0.5 rounded-full">
                Sistem Aktif &amp; Terbuka
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Emergency SOS Modal Container */}
      <SOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />
    </>
  )
}
