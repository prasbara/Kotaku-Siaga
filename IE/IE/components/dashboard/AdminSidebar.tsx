'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardCheck,
  TableProperties,
  Database,
  History,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Radio,
  X,
  ShieldCheck,
  PhoneCall,
  Activity,
  Video,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type DashboardTab = 'overview' | 'reports' | 'priorities' | 'cctv' | 'data' | 'audit'

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

  // Listen to Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onMobileClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen, onMobileClose])

  const navItems = [
    {
      id: 'overview' as DashboardTab,
      label: 'Ringkasan Krisis',
      sublabel: 'Overview & Tren',
      icon: LayoutDashboard,
    },
    {
      id: 'reports' as DashboardTab,
      label: 'Antrean Verifikasi Tindakan',
      sublabel: 'Verifikasi Laporan',
      icon: ClipboardCheck,
      count: pendingReportsCount,
      countAriaLabel: `${pendingReportsCount} laporan menunggu verifikasi`,
    },
    {
      id: 'priorities' as DashboardTab,
      label: 'Matriks 16 Kecamatan',
      sublabel: 'Intervention Matrix',
      icon: TableProperties,
    },
    {
      id: 'cctv' as DashboardTab,
      label: 'Monitoring CCTV & Flood AI',
      sublabel: '70 Titik PantauSemar & YOLO',
      icon: Video,
      count: 70,
    },
    {
      id: 'data' as DashboardTab,
      label: 'Pemantauan Data Ingestion',
      sublabel: 'Sensor Uptime',
      icon: Database,
    },
    {
      id: 'audit' as DashboardTab,
      label: 'Log Audit Publik',
      sublabel: 'Audit Trail',
      icon: History,
    },
  ]

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-surface-container-low border-r border-outline-variant/30 text-on-surface">
      {/* Top Section */}
      <div className="flex flex-col gap-6 px-3">
        {/* Brand Header */}
        <div className="px-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center shrink-0 text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-headline font-bold text-sm text-on-surface leading-tight truncate">
                  KotaKu Siaga
                </span>
                <span className="font-mono text-[10px] text-primary tracking-wider uppercase font-semibold">
                  EOC Control Desk
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            title={collapsed ? 'Perluas Menu' : 'Perkecil Menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {!collapsed && (
            <span className="font-mono text-[9px] text-on-surface-variant uppercase px-3 tracking-wider font-semibold">
              Operasional Spasial EOC
            </span>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onTabChange(item.id)
                  if (isMobileOpen) onMobileClose()
                }}
                className={cn(
                  'w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body transition-all text-left group relative',
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-on-primary-container' : 'text-on-surface-variant group-hover:text-primary')} />
                {!collapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-error text-on-error font-mono text-[10px] font-bold">
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section: Live Pump Widget & Emergency Dispatch */}
      <div className="flex flex-col gap-3 px-3 pt-4 border-t border-outline-variant/30">
        {!collapsed ? (
          <>
            {/* Live Pump Status Card */}
            <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">Status Pompa</span>
                <span className="font-mono text-[10px] text-secondary font-bold">52/54 AKTIF</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '96%' }}></div>
              </div>
              <span className="font-mono text-[9px] text-on-surface-variant">Sringin & Tenggang Normal</span>
            </div>

            {/* Emergency Dispatch Button */}
            <a
              href="tel:112"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-error-container/40 border border-error/50 text-error hover:bg-error-container font-mono text-xs font-bold uppercase transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Dispatch Darurat 112
            </a>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-mono text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar Control Desk</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <a
              href="tel:112"
              className="p-2 rounded bg-error-container/40 text-error hover:bg-error-container"
              title="Dispatch 112"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-on-surface-variant hover:text-error rounded"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-300 z-30 sticky top-20 h-[calc(100vh-80px)]',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            <button
              onClick={onMobileClose}
              className="absolute top-3.5 right-3.5 w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container z-20"
              aria-label="Tutup menu navigasi"
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
