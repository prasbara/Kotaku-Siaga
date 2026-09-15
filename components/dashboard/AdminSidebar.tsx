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
  X,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  Video,
  Activity,
  Radio,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type DashboardTab = 'operations' | 'sos' | 'overview' | 'reports' | 'clusters' | 'priorities' | 'cctv' | 'data' | 'audit'

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

  const navItems = [
    {
      id: 'operations' as DashboardTab,
      label: 'Pusat Operasi Bencana',
      sublabel: 'EOC Decision Center & Timeline',
      icon: ShieldAlert,
    },
    {
      id: 'sos' as DashboardTab,
      label: '🚨 Sinyal SOS Darurat',
      sublabel: 'Pemantauan 1-Klik Warga',
      icon: Radio,
    },
    {
      id: 'overview' as DashboardTab,
      label: 'Ringkasan Situasi',
      sublabel: 'Overview & Tren',
      icon: LayoutDashboard,
    },
    {
      id: 'reports' as DashboardTab,
      label: 'Moderasi Laporan Warga',
      sublabel: 'Verifikasi & Validasi Data',
      icon: ClipboardCheck,
      count: pendingReportsCount,
      countAriaLabel: `${pendingReportsCount} laporan menunggu verifikasi`,
    },
    {
      id: 'clusters' as DashboardTab,
      label: 'Klaster & Koroborasi',
      sublabel: 'Multi-Report Intelligence',
      icon: Layers,
    },
    {
      id: 'priorities' as DashboardTab,
      label: 'Matriks Prioritas Wilayah',
      sublabel: '16 Kecamatan',
      icon: TableProperties,
    },
    {
      id: 'cctv' as DashboardTab,
      label: 'Pemantauan CCTV',
      sublabel: '70 Titik PantauSemar',
      icon: Video,
      count: 70,
    },
    {
      id: 'data' as DashboardTab,
      label: 'Konektivitas & Observabilitas',
      sublabel: 'Health Check & Telemetri 8 API',
      icon: Activity,
    },
    {
      id: 'audit' as DashboardTab,
      label: 'Jejak Audit Publik',
      sublabel: 'Transparansi Sistem',
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
    <div className="h-full flex flex-col justify-between py-6 px-3 bg-[#4a154b] text-white select-none">
      {/* Top Section */}
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="px-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white group-hover:bg-white group-hover:text-[#4a154b] transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-base text-[#f4ede4] leading-tight truncate">
                  KotaKu Siaga
                </span>
                <span className="text-[10px] text-[#d9bdde] tracking-wider uppercase font-semibold">
                  Pusat Kendali Operasi
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-[#d9bdde] hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'Perluas Menu' : 'Perkecil Menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {!collapsed && (
            <span className="text-[10px] font-bold text-[#d9bdde] uppercase px-3 tracking-wider">
              Menu Kendali
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
                  'w-full min-h-[48px] flex items-center gap-3 px-3.5 py-2.5 rounded-[90px] text-xs font-semibold transition-all text-left group relative',
                  isActive
                    ? 'bg-white text-[#4a154b] font-bold shadow-sm'
                    : 'text-[#d9bdde] hover:bg-[#592466] hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#4a154b]' : 'text-[#d9bdde] group-hover:text-white')} />
                {!collapsed && (
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span
                        className={cn(
                          'ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
                          isActive ? 'bg-[#4a154b] text-white' : 'bg-[#cc4117] text-white'
                        )}
                      >
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

      {/* Bottom Section */}
      <div className="flex flex-col gap-2 pt-4 border-t border-[#592466]">
        {/* Emergency Call Pill */}
        <a
          href="tel:112"
          className="min-h-[48px] w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[90px] bg-[#cc4117] text-white font-bold text-xs hover:bg-[#b03713] transition-colors shadow-sm"
        >
          <PhoneCall className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Panggilan Darurat 112</span>}
        </a>

        {/* Return to Portal */}
        <Link
          href="/"
          className="min-h-[44px] w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[90px] text-[#d9bdde] hover:bg-[#592466] hover:text-white text-xs font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          {!collapsed && <span>Kembali ke Beranda</span>}
        </Link>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="min-h-[44px] w-full flex items-center gap-2.5 px-3.5 py-2 rounded-[90px] text-[#d9bdde] hover:bg-[#592466] hover:text-white text-xs font-medium transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{isLoggingOut ? 'Sedang Keluar...' : 'Keluar'}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block shrink-0 transition-all duration-200 border-r border-[#481a54] sticky top-0 h-screen',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-4 right-3 text-white p-2 rounded-full hover:bg-white/10"
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
