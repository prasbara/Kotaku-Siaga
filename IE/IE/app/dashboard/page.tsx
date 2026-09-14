'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { RefreshCw, Menu, Droplets, CheckCircle2, ArrowRight, ShieldAlert, PhoneCall, Waves, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { Report } from '@/types'
import { AdminSidebar, type DashboardTab } from '@/components/dashboard/AdminSidebar'
import { ReportModerationView } from '@/components/dashboard/ReportModerationView'
import { InterventionMatrixView } from '@/components/dashboard/InterventionMatrixView'
import { CCTVMonitoringView } from '@/components/dashboard/CCTVMonitoringView'
import { DataIngestionView } from '@/components/dashboard/DataIngestionView'
import { AuditTrailView } from '@/components/dashboard/AuditTrailView'

interface Stats {
  total: number
  active: number
  critical: number
  resolved: number
}

interface TrendPoint {
  date: string
  count: number
}

const POLDER_STATIONS = [
  { name: 'Rumah Pompa Sringin', capacity: '5x 2.000 L/dtk', status: '100% AKTIF', health: 'NORMAL' },
  { name: 'Rumah Pompa Tenggang', capacity: '6x 2.000 L/dtk', status: '100% AKTIF', health: 'NORMAL' },
  { name: 'Polder BKB (Banjir Kanal Barat)', capacity: '4x 1.500 L/dtk', status: '100% AKTIF', health: 'NORMAL' },
  { name: 'Polder BKT (Banjir Kanal Timur)', capacity: '4x 2.000 L/dtk', status: '3/4 AKTIF', health: 'WASPADA' },
  { name: 'Polder Kalibaru', capacity: '2x 1.000 L/dtk', status: '100% AKTIF', health: 'NORMAL' },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, critical: 0, resolved: 0 })
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [latestReports, setLatestReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [isLocalStore, setIsLocalStore] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setDashboardError(null)

    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/reports?limit=100'),
      ])

      const statsData = await statsRes.json()
      const reportsData = await reportsRes.json()

      if (statsData.is_local_store || reportsData.is_local_store) {
        setIsLocalStore(true)
      }

      if (!statsRes.ok || !statsData.success) {
        setDashboardError(statsData.error || 'Gagal memuat statistik sistem dari database.')
      } else {
        setStats(statsData.stats)
        if (statsData.trend) {
          setTrend(
            statsData.trend.map((t: { date: string; count: number }) => ({
              date: t.date.slice(5),
              count: t.count,
            }))
          )
        }
      }

      if (reportsRes.ok && reportsData.success) {
        setLatestReports(reportsData.data || [])
      }
    } catch (err: any) {
      console.error('Gagal mengambil data dashboard:', err)
      setDashboardError('Koneksi ke backend atau database terputus. Silakan periksa konfigurasi database.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const pendingReportsCount = latestReports.filter((r) => r.status === 'submitted').length
  const resolvedPercent = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#fdfbf9] text-[#1d1d1d] font-sans flex flex-col md:flex-row">
      {/* 1. Tactical Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingReportsCount={pendingReportsCount}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fdfbf9]">
        {/* Mobile Header Bar */}
        <div className="md:hidden border-b border-[#e6e6e6] bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-subtle">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-[90px] bg-[#f4ede4] text-[#4a154b] flex items-center gap-2 text-xs font-bold"
          >
            <Menu className="h-4 w-4" />
            <span>Menu Kendali</span>
          </button>
          <span className="font-display font-bold text-sm text-[#1d1d1d]">
            Pusat Kendali
          </span>
        </div>

        {/* Dynamic Tab Views */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Title & Refresh Bar with Pastel-Mesh Atmospheric Backdrop */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#f4ede4] via-[#f9f0ff] to-[#f4ede4] border border-[#e6e6e6] shadow-subtle flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#007a5a] animate-pulse"></span>
                    <span className="text-[12px] font-mono font-bold text-[#4a154b] uppercase tracking-[0.96px]">
                      STATUS OPERASIONAL WAKTU NYATA
                    </span>
                    {isLocalStore && (
                      <span className="text-[11px] font-mono font-bold text-[#007a5a] bg-[#007a5a]/10 px-2.5 py-0.5 rounded-full border border-[#007a5a]/30">
                        • Basis Data Pengujian Lokal (.data/reports.json)
                      </span>
                    )}
                  </div>
                  <h1 className="text-[28px] sm:text-[32px] font-bold text-[#4a154b] tracking-[-0.256px] leading-[1.2]">
                    Pusat Kendali Pemantauan Banjir Semarang
                  </h1>
                  <p className="text-[15px] sm:text-[16px] text-[#1d1d1d] leading-[1.55]">
                    Pemantauan terpadu laporan warga, ketinggian air pasang laut, kesiapan 5 rumah pompa utama, dan status kerentanan wilayah.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchData}
                    disabled={isLoading}
                    className="min-h-[44px] px-6 py-3 rounded-[90px] bg-white hover:bg-[#f9f0ff] text-[#4a154b] font-bold text-xs flex items-center gap-2 transition-colors border border-[#4a154b]/30 shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Perbarui Data</span>
                  </button>
                </div>
              </div>

              {/* Explicit Database/Error State Banner */}
              {dashboardError && (
                <div className="p-6 rounded-[16px] bg-[#fef2f2] border border-[#fecaca] text-[#cc4117] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold">Koneksi Database Tidak Tersedia</h4>
                      <p className="text-xs mt-0.5 opacity-90">
                        {dashboardError} — Sistem tidak menampilkan data perkiraan. Pastikan koneksi database aktif.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchData}
                    className="min-h-[40px] px-5 py-2 rounded-[90px] bg-[#cc4117] text-white font-bold text-xs hover:bg-[#b03713] transition-colors shrink-0 cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* 4 Primary Metric Cards (Slacc card-stat pattern) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Reports */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#696969] font-bold uppercase tracking-wider mb-2">
                      <span>TOTAL LAPORAN</span>
                      <Waves className="w-4 h-4 text-[#4a154b]" />
                    </div>
                    <div className="text-[46px] sm:text-[50px] font-bold text-[#4a154b] tracking-[-0.6px] leading-[1.12] mb-1">
                      {isLoading ? '...' : dashboardError ? 'N/A' : stats.total}
                    </div>
                  </div>
                  <span className="text-xs text-[#696969] pt-2 border-t border-[#e6e6e6]">Total laporan yang masuk</span>
                </div>

                {/* Active Incidents */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#696969] font-bold uppercase tracking-wider mb-2">
                      <span>LAPORAN AKTIF</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] animate-pulse"></span>
                    </div>
                    <div className="text-[46px] sm:text-[50px] font-bold text-[#d97706] tracking-[-0.6px] leading-[1.12] mb-1">
                      {isLoading ? '...' : dashboardError ? 'N/A' : stats.active}
                    </div>
                  </div>
                  <span className="text-xs text-[#696969] pt-2 border-t border-[#e6e6e6]">Sedang diverifikasi / ditangani</span>
                </div>

                {/* Critical Reports */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#cc4117] font-bold uppercase tracking-wider mb-2">
                      <span>KONDISI DARURAT</span>
                      <ShieldAlert className="w-4 h-4 text-[#cc4117]" />
                    </div>
                    <div className="text-[46px] sm:text-[50px] font-bold text-[#cc4117] tracking-[-0.6px] leading-[1.12] mb-1">
                      {isLoading ? '...' : dashboardError ? 'N/A' : stats.critical}
                    </div>
                  </div>
                  <span className="text-xs text-[#696969] pt-2 border-t border-[#e6e6e6]">Memerlukan penanganan segera</span>
                </div>

                {/* Resolved Percent */}
                <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#e6e6e6] shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#007a5a] font-bold uppercase tracking-wider mb-2">
                      <span>SELESAI DITANGANI</span>
                      <CheckCircle2 className="w-4 h-4 text-[#007a5a]" />
                    </div>
                    <div className="text-[46px] sm:text-[50px] font-bold text-[#007a5a] tracking-[-0.6px] leading-[1.12] mb-1">
                      {isLoading ? '...' : dashboardError ? 'N/A' : `${resolvedPercent}%`}
                    </div>
                  </div>
                  <span className="text-xs text-[#696969] pt-2 border-t border-[#e6e6e6]">
                    {stats.resolved} dari {stats.total} laporan selesai
                  </span>
                </div>
              </div>

              {/* Chart & Polder Status Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 30-Day Trend Chart */}
                <div className="lg:col-span-8 p-6 sm:p-8 rounded-[16px] bg-white border border-[#e6e6e6] shadow-subtle flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-[#1d1d1d]">Tren Kejadian 30 Hari Terakhir</h3>
                      <p className="text-xs text-[#696969]">Grafik frekuensi laporan genangan air</p>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-4">
                    {trend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend}>
                          <defs>
                            <linearGradient id="aubergineGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4a154b" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#4a154b" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="#696969" fontSize={11} tickLine={false} />
                          <YAxis stroke="#696969" fontSize={11} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e6e6e6',
                              borderRadius: '12px',
                              fontSize: '12px',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#4a154b"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#aubergineGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#696969]">
                        {isLoading ? 'Memuat data grafik tren...' : 'Belum ada data tren untuk periode ini.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Polder Pump Stations Health */}
                <div className="lg:col-span-4 p-6 sm:p-8 rounded-[16px] bg-[#f4ede4] border border-[#e8ded2] shadow-subtle flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-base text-[#1d1d1d]">Status 5 Rumah Pompa Utama</h3>
                      <Droplets className="w-4 h-4 text-[#4a154b]" />
                    </div>
                    <div className="space-y-3">
                      {POLDER_STATIONS.map((p) => (
                        <div key={p.name} className="p-3 rounded-xl bg-white border border-[#e8ded2] text-xs">
                          <div className="flex items-center justify-between font-bold text-[#1d1d1d]">
                            <span>{p.name}</span>
                            <span className={p.health === 'NORMAL' ? 'text-[#007a5a]' : 'text-[#d97706]'}>
                              {p.health}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[#696969] mt-1 text-[11px]">
                            <span>{p.capacity}</span>
                            <span>{p.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[#e8ded2]">
                    <Link
                      href="/peta"
                      className="text-xs font-bold text-[#1264a3] hover:text-[#3860be] hover:underline flex items-center gap-1"
                    >
                      Lihat Lokasi Pompa di Peta →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <ReportModerationView
              reports={latestReports}
              onRefresh={fetchData}
              onReportUpdated={fetchData}
            />
          )}

          {activeTab === 'priorities' && <InterventionMatrixView />}

          {activeTab === 'cctv' && <CCTVMonitoringView />}

          {activeTab === 'data' && <DataIngestionView />}

          {activeTab === 'audit' && <AuditTrailView />}
        </div>
      </div>
    </div>
  )
}
