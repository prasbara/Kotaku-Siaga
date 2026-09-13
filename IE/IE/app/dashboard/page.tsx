'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { RefreshCw, Menu, Droplets, CheckCircle2, ArrowRight, ShieldAlert, PhoneCall, Wind, Video } from 'lucide-react'
import Link from 'next/link'
import type { Report } from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
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


  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/reports?limit=100'),
      ])

      const statsData = await statsRes.json()
      const reportsData = await reportsRes.json()

      if (statsData.success) {
        setStats(statsData.stats)
        if (statsData.trend) {
          setTrend(statsData.trend.map((t: { date: string; count: number }) => ({
            date: t.date.slice(5),
            count: t.count,
          })))
        }
      }

      if (reportsData.success) {
        setLatestReports(reportsData.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const pendingReportsCount = latestReports.filter(r => r.status === 'submitted').length

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body flex flex-col md:flex-row">
      {/* 1. Tactical Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingReportsCount={pendingReportsCount}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* Mobile Header Bar */}
        <div className="md:hidden border-b border-outline-variant/30 bg-surface-container px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded bg-surface-container-high border border-outline-variant/40 text-on-surface flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider"
          >
            <Menu className="h-4 w-4" />
            <span>Menu EOC</span>
          </button>
          <span className="font-headline font-bold text-sm text-on-surface">
            Control Desk
          </span>
        </div>

        {/* Dynamic Tab Views */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Title & Refresh Bar */}
              <div className="p-4 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-mono text-[10px] font-bold uppercase tracking-wider">
                      EOC EMERGENCY OPERATIONS DESK
                    </span>
                    <span className="font-mono text-xs text-secondary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      LIVE SINKRONISASI
                    </span>
                  </div>
                  <h1 className="font-headline text-2xl sm:text-3xl font-bold text-on-surface">
                    Pusat Komando & Respon Siaga Bencana
                  </h1>
                  <p className="font-body text-xs sm:text-sm text-on-surface-variant">
                    Sistem pemantauan telemetri terpadu untuk koordinasi armada pompa air, tanggul rob, dan respon aduan warga Kota Semarang.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Windy Radar — Link ke Peta Spasial */}
                  <Link
                    href="/peta"
                    className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-primary border border-primary/40 px-3.5 py-2 rounded-lg bg-primary/15 hover:bg-primary hover:text-on-primary transition-all"
                    title="Buka Radar Cuaca &amp; Angin Maritim Windy di Peta Spasial"
                  >
                    <Wind className="h-3.5 w-3.5" />
                    <span>Radar Windy</span>
                  </Link>

                  {/* CCTV PantauSemar Shortcut */}
                  <Link
                    href="/peta"
                    className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-secondary border border-secondary/40 px-3.5 py-2 rounded-lg bg-secondary/15 hover:bg-secondary hover:text-on-secondary transition-all"
                    title="Buka Titik Kamera CCTV PantauSemar di Peta"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span>CCTV PantauSemar</span>
                  </Link>

                  <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="min-h-[40px] inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-on-surface border border-outline-variant/50 px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'Sinkron...' : 'Sinkron Data'}</span>
                  </button>
                  <a
                    href="tel:112"
                    className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-error bg-error-container/40 border border-error/50 px-3.5 py-2 rounded-lg hover:bg-error-container transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Dispatch 112</span>
                  </a>
                </div>
              </div>

              {/* 4 Critical Metric Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1: Total Reports */}
                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    TOTAL LAPORAN MASUK
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-on-surface">{stats.total}</span>
                    <span className="font-mono text-xs text-secondary font-semibold">+18.4%</span>
                  </div>
                  <span className="text-xs text-on-surface-variant">24 Jam terakhir di 16 kecamatan</span>
                </div>

                {/* 2: Critical Active */}
                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                  <span className="font-mono text-[10px] text-error uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                    KRITIS AKTIF
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-error">{stats.critical}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-error/20 text-error font-bold">URGENT</span>
                  </div>
                  <span className="text-xs text-error">Butuh eskalasi tim pompa & perahu</span>
                </div>

                {/* 3: Resolved */}
                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    DISPOSISI SELESAI
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="font-mono text-3xl font-bold text-secondary">{stats.resolved}</span>
                    <span className="font-mono text-xs text-secondary font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 77.1%
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant">Rerata durasi penanganan 48 mnt</span>
                </div>

                {/* 4: Critical Hotspot */}
                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                  <span className="font-mono text-[10px] text-tertiary uppercase tracking-wider font-semibold">
                    HOTSPOT TERKRITIS
                  </span>
                  <div className="my-2 flex flex-col">
                    <span className="font-headline text-lg font-bold text-on-surface truncate">Genuk & Smg Utara</span>
                    <span className="font-mono text-xs text-tertiary">Skor Bahaya: 88.4 / 100</span>
                  </div>
                  <span className="text-xs text-primary font-mono">Pasang Rob +92cm (18:30 WIB)</span>
                </div>
              </div>

              {/* 30-Day Trend Chart & Live Pump Status */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Trend Chart (Col 8) */}
                <div className="lg:col-span-8 min-w-0 p-5 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] uppercase text-primary font-semibold tracking-wider block">
                        GRAFIK TREN KEJADIAN
                      </span>
                      <h2 className="font-headline text-lg font-bold text-on-surface">
                        Volume Laporan 30 Hari Terakhir
                      </h2>
                    </div>
                    <span className="font-mono text-xs text-on-surface-variant">Satuan: Laporan / Hari</span>
                  </div>

                  <div className="h-56 w-full pt-2">
                    {trend.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-on-surface-variant font-mono">
                        Memuat data deret waktu...
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            stroke="#869397"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#869397"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#141c29',
                              border: '1px solid #243654',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              color: '#dbe2f5',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#4cd7f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#cyanArea)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Live Polder Pump Status (Col 4) */}
                <div className="lg:col-span-4 min-w-0 p-5 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-secondary uppercase font-bold tracking-wider">
                      STASIUN POMPA POLDER
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[20px]">water</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {POLDER_STATIONS.map((st, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 flex items-center justify-between text-xs">
                        <div className="flex flex-col">
                          <span className="text-on-surface font-semibold">{st.name}</span>
                          <span className="font-mono text-[10px] text-on-surface-variant">{st.capacity}</span>
                        </div>
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${st.health === 'NORMAL' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                          {st.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                    <span className="font-mono text-[10px]">BBWS Pemali-Juana</span>
                    <span className="font-mono text-[10px] text-secondary font-semibold">Semua Polder Siaga</span>
                  </div>
                </div>
              </div>

              {/* Recent Incidents Moderation Fast Queue */}
              <div className="p-5 sm:p-6 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase text-primary font-semibold tracking-wider block">
                      FEED LAPORAN TERAKHIR
                    </span>
                    <h2 className="font-headline text-lg font-bold text-on-surface">
                      Antrean Laporan Masuk Warga
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-xs font-mono text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Buka Semua Antrean ({latestReports.length}) <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant/30 font-mono text-[10px] text-on-surface-variant uppercase">
                        <th className="py-2.5 px-3">Kode Laporan</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Wilayah</th>
                        <th className="py-2.5 px-3">Urgensi</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {latestReports.slice(0, 6).map((report) => (
                        <tr key={report.id} className="hover:bg-surface-container/60 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-semibold text-primary">
                            {report.report_code || 'SMG-ALERT'}
                          </td>
                          <td className="py-2.5 px-3 text-on-surface">
                            {CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category}
                          </td>
                          <td className="py-2.5 px-3 text-on-surface-variant">
                            {report.district_name || 'Kota Semarang'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              report.urgency === 'kritis'
                                ? 'bg-error/20 text-error'
                                : report.urgency === 'tinggi'
                                ? 'bg-tertiary/20 text-tertiary'
                                : 'bg-primary/20 text-primary'
                            }`}>
                              {report.urgency}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-secondary">
                            {report.status}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-on-surface-variant text-[11px]">
                            {formatRelativeTime(report.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ReportModerationView reports={latestReports} onReportUpdated={fetchData} onRefresh={fetchData} />
            </div>
          )}

          {activeTab === 'priorities' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <InterventionMatrixView />
            </div>
          )}

          {activeTab === 'cctv' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <CCTVMonitoringView />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <DataIngestionView />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AuditTrailView />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
