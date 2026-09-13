'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, PhoneCall, Bot, ShieldAlert, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Beranda', href: '/' },
  { label: 'Peta Spasial', href: '/peta', badgeDot: true },
  { label: 'Lapor Cepat', href: '/laporan/baru', isHighlight: true },
  { label: 'Matriks Risiko', href: '/priorities' },
  { label: 'Data & Audit', href: '/data' },
  { label: 'Edukasi Iklim', href: '/edukasi' },
  { label: 'Command Center', href: '/dashboard' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
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

  return (
    <header className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="absolute w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 animate-ping"></span>
              <span className="absolute w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-primary/40 animate-pulse"></span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center relative z-10 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-headline text-base sm:text-xl text-on-surface font-bold tracking-tight truncate">
                  KotaKu Siaga
                </span>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase px-1.5 sm:px-2 py-0.5 rounded bg-surface-container-highest text-primary border border-outline-variant/50 flex items-center gap-1 font-semibold whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  <span className="hidden sm:inline">Civic Radar </span>v1.1
                </span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant tracking-wider uppercase hidden sm:inline truncate">
                Civic Climate Intelligence Semarang
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
                  className="font-body text-xs bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold px-3.5 py-1.5 rounded shadow-sm hover:brightness-110 transition-all ml-1 mr-1 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">campaign</span>
                  {item.label}
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'font-body text-xs px-3 py-1.5 transition-colors rounded relative flex items-center gap-1.5',
                  isActive
                    ? 'bg-surface-container-highest text-primary border-b-2 border-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                )}
              >
                {item.label}
                {item.badgeDot && (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Live Rob Marine Telemetry Pill */}
          <div className="hidden 2xl:flex items-center gap-2 bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/40">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
            <div className="flex flex-col">
              <span className="font-mono text-[9px] text-tertiary uppercase font-bold tracking-wider">
                Tanjung Emas Rob
              </span>
              <span className="font-mono text-xs text-on-surface font-semibold">
                +85cm Waspada
              </span>
            </div>
          </div>

          {/* Real-time Clock */}
          <div className="hidden 2xl:flex flex-col text-right pr-2">
            <span className="font-mono text-[9px] text-on-surface-variant uppercase">Waktu EOC</span>
            <span className="font-mono text-xs text-on-surface font-semibold">{currentTime || 'WIB'}</span>
          </div>

          {/* Emergency 112 Dispatch Button */}
          <a
            href="tel:112"
            className="min-h-[38px] sm:min-h-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded bg-error-container/40 border border-error/50 text-error hover:bg-error-container font-mono text-xs font-bold tracking-wider transition-colors"
            title="Call BPBD EOC 112"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">112 BPBD</span>
          </a>

          {/* Operator / Profile Icon */}
          <Link
            href="/dashboard"
            className="w-9 h-9 sm:w-8 sm:h-8 shrink-0 overflow-hidden rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-colors"
            title="Control Center"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden w-9 h-9 flex items-center justify-center rounded bg-surface-container text-on-surface-variant hover:text-on-surface focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-outline-variant/30 bg-surface-container-low/98 backdrop-blur-2xl px-4 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150">
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
                  'min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between',
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                )}
              >
                <span>{item.label}</span>
                {item.badgeDot && (
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                )}
              </Link>
            )
          })}
          <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-mono text-xs text-tertiary">Rob Tg Emas: +85cm</span>
            </div>
            <a
              href="tel:112"
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-error/20 text-error border border-error/40 font-mono text-xs font-bold flex items-center justify-center"
            >
              112 DARURAT
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
