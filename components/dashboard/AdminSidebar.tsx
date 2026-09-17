'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardCheck,
  TableProperties,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  Video,
  Activity,
  Radio,
  Layers,
  Monitor,
  Globe,
  Flame,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type DashboardTab =
  | 'command-center'
  | 'operations'
  | 'fire'
  | 'sos'
  | 'overview'
  | 'reports'
  | 'clusters'
  | 'priorities'
  | 'cctv'
  | 'data'
  | 'audit'

interface NavItem {
  id: DashboardTab
  label: string
  sublabel: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  badgeVariant?: 'critical' | 'neutral'
}

interface NavGroup {
  id: string
  title: string
  items: NavItem[]
}

interface AdminSidebarProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  pendingReportsCount?: number
  isMobileOpen: boolean
  onMobileClose: () => void
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  pendingReportsCount = 0,
  isMobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onMobileClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen, onMobileClose])

  const navGroups: NavGroup[] = [
    {
      id: 'command',
      title: 'Operasional & Komando',
      items: [
        {
          id: 'command-center',
          label: 'Layar Command Center',
          sublabel: 'Display Kiosk & Monitor Besar',
          icon: Monitor,
        },
        {
          id: 'operations',
          label: 'Pusat Operasi Bencana',
          sublabel: 'EOC Decision & Timeline',
          icon: ShieldAlert,
        },
        {
          id: 'fire',
          label: 'Deteksi Dini Kebakaran',
          sublabel: 'FIRMS · SiPongi+ · Kasus',
          icon: Flame,
        },
        {
          id: 'sos',
          label: 'Sinyal SOS Darurat',
          sublabel: 'Pemantauan 1-Klik Warga',
          icon: Radio,
        },
        {
          id: 'overview',
          label: 'Ringkasan Situasi',
          sublabel: 'Overview & Tren Bencana',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: 'data',
      title: 'Data & Verifikasi',
      items: [
        {
          id: 'reports',
          label: 'Moderasi Laporan Warga',
          sublabel: 'Verifikasi & Validasi',
          icon: ClipboardCheck,
          count: pendingReportsCount,
          badgeVariant: 'critical',
        },
        {
          id: 'clusters',
          label: 'Klaster & Koroborasi',
          sublabel: 'Multi-Report Intelligence',
          icon: Layers,
        },
        {
          id: 'priorities',
          label: 'Matriks Prioritas Wilayah',
          sublabel: '16 Kecamatan Semarang',
          icon: TableProperties,
        },
      ],
    },
    {
      id: 'observability',
      title: 'Observabilitas & Audit',
      items: [
        {
          id: 'cctv',
          label: 'Pemantauan CCTV',
          sublabel: '70 Titik PantauSemar',
          icon: Video,
          count: 70,
          badgeVariant: 'neutral',
        },
        {
          id: 'data',
          label: 'Konektivitas & Telemetri',
          sublabel: 'Health Check 8 Sumber API',
          icon: Activity,
        },
        {
          id: 'audit',
          label: 'Jejak Audit Publik',
          sublabel: 'Transparansi Sistem ISO',
          icon: History,
        },
      ],
    },
  ]

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' },
      })
    } catch (err) {
      console.warn('Logout network error, forcing client cleanup:', err)
    } finally {
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.clear()
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (
              key &&
              (key.includes('supabase') ||
                key.includes('sb-') ||
                key.includes('kotaku') ||
                key.includes('auth'))
            ) {
              keysToRemove.push(key)
            }
          }
          keysToRemove.forEach((k) => localStorage.removeItem(k))
        }
      } catch {
        // Storage access fallback
      }

      // Use replace to strip dashboard from browser history stack
      window.location.replace('/login?logout=success')
    }
  }

  const renderNavButton = (item: NavItem) => {
    const isActive = activeTab === item.id
    const Icon = item.icon

    if (collapsed) {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onTabChange(item.id)
            if (isMobileOpen) onMobileClose()
          }}
          aria-label={item.label}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'w-11 h-11 mx-auto flex items-center justify-center rounded-xl transition-all relative group cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none',
            isActive
              ? 'bg-white/20 text-white border border-white/30 shadow-xs'
              : 'text-[#d9bdde] hover:bg-white/10 hover:text-white'
          )}
        >
          <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />

          {/* Mini notification dot for count */}
          {typeof item.count === 'number' && item.count > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono text-white ring-2 ring-[#4a154b]',
                item.badgeVariant === 'critical' ? 'bg-[#cc4117]' : 'bg-[#1264a3]'
              )}
            >
              {item.count > 99 ? '99+' : item.count}
            </span>
          )}

          {/* Accessible Floating Tooltip */}
          <div
            role="tooltip"
            className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 ease-out bg-[#1f0d26] text-white border border-[#592466] px-3 py-1.5 rounded-lg shadow-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2"
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' && item.count > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono text-white',
                  item.badgeVariant === 'critical' ? 'bg-[#cc4117]' : 'bg-[#1264a3]'
                )}
              >
                {item.count}
              </span>
            )}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1f0d26]" />
          </div>
        </button>
      )
    }

    // Expanded Nav Button
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onTabChange(item.id)
          if (isMobileOpen) onMobileClose()
        }}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'w-full min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left group relative cursor-pointer focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none',
          isActive
            ? 'bg-white/15 text-white font-bold border border-white/20 shadow-xs backdrop-blur-xs'
            : 'text-[#d9bdde] hover:bg-white/10 hover:text-white'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
            isActive ? 'bg-white text-[#4a154b]' : 'bg-white/5 text-[#d9bdde] group-hover:text-white group-hover:bg-white/10'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="truncate leading-tight text-[12px]">{item.label}</span>
            <span className="text-[10px] text-[#d9bdde]/70 truncate font-normal">{item.sublabel}</span>
          </div>

          {typeof item.count === 'number' && item.count > 0 && (
            <span
              className={cn(
                'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0 text-white',
                item.badgeVariant === 'critical' ? 'bg-[#cc4117]' : 'bg-[#1264a3]'
              )}
            >
              {item.count}
            </span>
          )}
        </div>
      </button>
    )
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#4a154b] text-white select-none">
      {/* Top Section: Brand & Toggle */}
      <div className="p-3 border-b border-white/10">
        <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between px-1')}>
          <Link href="/" className="flex items-center gap-2.5 group min-w-0" title="KotaKu Siaga">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#cc4117] to-[#801b44] border border-white/20 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition-transform shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-display font-extrabold text-sm text-[#f4ede4] leading-tight truncate">
                  KotaKu Siaga
                </span>
                <span className="text-[9px] text-[#d9bdde] tracking-wider uppercase font-semibold">
                  Pusat Kendali Operasi
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Perluas Menu Sidebar' : 'Perkecil Menu Sidebar'}
            className={cn(
              'hidden md:flex p-1.5 rounded-lg text-[#d9bdde] hover:text-white hover:bg-white/10 transition-colors cursor-pointer',
              collapsed && 'mt-2 mx-auto'
            )}
            title={collapsed ? 'Perluas Menu' : 'Perkecil Menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Middle Section: Scrollable Nav Groups */}
      <nav
        aria-label="Navigasi Pusat Kendali"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 custom-scrollbar"
      >
        {navGroups.map((group, groupIdx) => (
          <div key={group.id} className="space-y-1">
            {!collapsed ? (
              <span className="text-[10px] font-mono font-bold text-[#d9bdde]/60 uppercase tracking-widest px-2.5 mb-1 block">
                {group.title}
              </span>
            ) : groupIdx > 0 ? (
              <div className="h-[1px] bg-white/10 my-2 mx-2" />
            ) : null}

            <div className="space-y-1">{group.items.map(renderNavButton)}</div>
          </div>
        ))}
      </nav>

      {/* Bottom Section: Emergency 112, Portal Link, Logout */}
      <div className="p-3 border-t border-white/10 space-y-1.5 bg-black/10">
        {/* Emergency Call 112 */}
        {collapsed ? (
          <a
            href="tel:112"
            aria-label="Panggilan Darurat 112"
            className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl bg-[#cc4117] hover:bg-[#b03713] text-white shadow-sm transition-colors relative group"
          >
            <PhoneCall className="w-5 h-5" />
            <div
              role="tooltip"
              className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 ease-out bg-[#cc4117] text-white border border-white/20 px-3 py-1.5 rounded-lg shadow-2xl text-xs font-bold whitespace-nowrap"
            >
              <span>Panggilan Darurat 112 (Bebas Pulsa)</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#cc4117]" />
            </div>
          </a>
        ) : (
          <a
            href="tel:112"
            className="min-h-[42px] w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#cc4117] hover:bg-[#b03713] text-white font-bold text-xs shadow-sm transition-colors"
          >
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Panggilan Darurat 112</span>
          </a>
        )}

        {/* Return to Public Portal */}
        {collapsed ? (
          <Link
            href="/"
            aria-label="Kembali ke Beranda Publik"
            className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-[#d9bdde] hover:bg-white/10 hover:text-white transition-colors relative group"
          >
            <Globe className="w-5 h-5" />
            <div
              role="tooltip"
              className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 ease-out bg-[#1f0d26] text-white border border-[#592466] px-3 py-1.5 rounded-lg shadow-2xl text-xs font-semibold whitespace-nowrap"
            >
              <span>Kembali ke Beranda Publik</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1f0d26]" />
            </div>
          </Link>
        ) : (
          <Link
            href="/"
            className="min-h-[38px] w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#d9bdde] hover:bg-white/10 hover:text-white text-xs font-medium transition-colors"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Kembali ke Beranda</span>
          </Link>
        )}

        {/* Logout */}
        {collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Keluar dari Sesi Operator"
            className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-[#d9bdde] hover:bg-white/10 hover:text-white transition-colors relative group cursor-pointer disabled:opacity-60"
          >
            {isLoggingOut ? (
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            <div
              role="tooltip"
              className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-150 ease-out bg-[#1f0d26] text-white border border-[#592466] px-3 py-1.5 rounded-lg shadow-2xl text-xs font-semibold whitespace-nowrap"
            >
              <span>{isLoggingOut ? 'Sedang Keluar...' : 'Keluar'}</span>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1f0d26]" />
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="min-h-[38px] w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#d9bdde] hover:bg-white/10 hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            {isLoggingOut ? (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-amber-400" />
            ) : (
              <LogOut className="w-4 h-4 shrink-0" />
            )}
            <span>{isLoggingOut ? 'Sedang Keluar...' : 'Keluar'}</span>
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200 border-r border-[#481a54] sticky top-0 h-screen z-30',
          collapsed ? 'w-[72px]' : 'w-[264px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10">
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Tutup Menu"
              className="absolute top-3.5 right-3 text-white p-2 rounded-full hover:bg-white/10 transition-colors z-20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
