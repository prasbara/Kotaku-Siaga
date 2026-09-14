'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { Report, ReportCategory, UrgencyLevel } from '@/types'
import { CATEGORY_LABELS, URGENCY_LABELS, STATUS_LABELS } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Waves,
  Camera,
} from 'lucide-react'
import Image from 'next/image'

export default function LaporanListPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedUrgency !== 'all') params.append('urgency', selectedUrgency)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (searchQuery.trim()) params.append('q', searchQuery.trim())
      params.append('limit', '100')

      const res = await fetch(`/api/reports?${params.toString()}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal memuat data laporan dari server.')
        setReports([])
      } else {
        setReports(data.data || [])
      }
    } catch (err: any) {
      console.error('Fetch reports error:', err)
      setErrorMessage('Koneksi ke sistem laporan terputus. Silakan coba lagi.')
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, selectedUrgency, selectedStatus, searchQuery])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const categoryOptions: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'banjir', label: 'Banjir Rob' },
    { value: 'genangan', label: 'Genangan' },
    { value: 'drainase_tersumbat', label: 'Saluran Tersumbat' },
    { value: 'pohon_tumbang', label: 'Pohon Tumbang' },
    { value: 'longsor', label: 'Longsor' },
  ]

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'submitted', label: 'Menunggu' },
    { value: 'verified', label: 'Tervalidasi' },
    { value: 'in_progress', label: 'Penanganan' },
    { value: 'resolved', label: 'Selesai' },
  ]

  return (
    <div className="min-h-screen bg-[#fdfbf9] text-[#1d1d1d] pb-24">
      {/* Top Header Section */}
      <section className="bg-white border-b border-[#e6e6e6] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4a154b] px-3 py-1 rounded-full bg-[#f9f0ff] border border-[#eddcf7]">
                Civic Ground-Truth
              </span>
              <span className="text-xs text-[#696969]">• Terbuka untuk Publik</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1d1d1d] tracking-tight">
              Daftar Laporan & Kejadian Warga
            </h1>
            <p className="text-sm text-[#696969] mt-1 max-w-2xl leading-relaxed">
              Pantau seluruh kejadian hidrometeorologis yang dilaporkan oleh warga Semarang dengan transparansi status penanganan dan verifikasi bukti lapangan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/laporan/baru"
              className="min-h-[48px] px-6 py-3 rounded-[90px] bg-[#4a154b] hover:bg-[#481a54] text-white font-bold text-sm tracking-wide shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Kirim Laporan Baru
            </Link>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-[#e6e6e6] shadow-subtle flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#696969]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode tiket (SMG-...), lokasi, atau kata kunci..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-[#e6e6e6] bg-[#fdfbf9] text-sm text-[#1d1d1d] focus:outline-none focus:border-[#4a154b] focus:ring-2 focus:ring-[#4a154b]/20"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-12 px-4 rounded-xl border border-[#e6e6e6] bg-[#fdfbf9] text-sm text-[#1d1d1d] font-medium focus:outline-none focus:border-[#4a154b] w-full md:w-auto"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-12 px-4 rounded-xl border border-[#e6e6e6] bg-[#fdfbf9] text-sm text-[#1d1d1d] font-medium focus:outline-none focus:border-[#4a154b] w-full md:w-auto"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchReports}
              className="h-12 px-4 rounded-xl border border-[#e6e6e6] bg-white hover:bg-[#f4ede4] text-[#4a154b] font-semibold text-sm flex items-center justify-center gap-2 transition-colors w-full md:w-auto"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="md:hidden">Muat Ulang</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Error State */}
        {errorMessage && (
          <div className="p-6 rounded-[16px] bg-[#fef2f2] border border-[#fecaca] text-[#cc4117] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Data Gagal Dimuat</h4>
                <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={fetchReports}
              className="min-h-[40px] px-5 py-2 rounded-[90px] bg-[#cc4117] text-white font-bold text-xs shrink-0 hover:bg-[#b03713] transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-[16px] p-6 bg-white border border-[#e6e6e6] shadow-subtle flex flex-col gap-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-[#f4ede4] rounded-full"></div>
                  <div className="h-4 w-16 bg-[#f4ede4] rounded-full"></div>
                </div>
                <div className="h-6 w-3/4 bg-[#f4ede4] rounded"></div>
                <div className="h-12 w-full bg-[#f4ede4] rounded"></div>
                <div className="h-4 w-1/2 bg-[#f4ede4] rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMessage && reports.length === 0 && (
          <div className="rounded-[16px] p-12 bg-white border border-[#e6e6e6] text-center flex flex-col items-center justify-center my-6">
            <div className="w-16 h-16 rounded-full bg-[#f9f0ff] flex items-center justify-center text-[#4a154b] mb-4">
              <Waves className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#1d1d1d]">Belum Ada Laporan Terdaftar</h3>
            <p className="text-sm text-[#696969] max-w-md mt-1 leading-relaxed">
              Tidak ada kejadian yang cocok dengan filter yang dipilih saat ini, atau belum ada laporan yang masuk ke database.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedUrgency('all')
                  setSelectedStatus('all')
                  setSearchQuery('')
                }}
                className="px-5 py-2.5 rounded-[90px] bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d] font-semibold text-xs transition-colors"
              >
                Reset Filter
              </button>
              <Link
                href="/laporan/baru"
                className="px-6 py-2.5 rounded-[90px] bg-[#4a154b] text-white hover:bg-[#481a54] font-bold text-xs shadow-sm transition-colors"
              >
                Kirim Laporan Baru
              </Link>
            </div>
          </div>
        )}

        {/* Reports Grid */}
        {!isLoading && !errorMessage && reports.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const categoryLabel = CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] || report.category
              const urgencyLabel = URGENCY_LABELS[report.urgency as keyof typeof URGENCY_LABELS] || report.urgency
              const statusLabel = STATUS_LABELS[report.status as keyof typeof STATUS_LABELS] || report.status

              const isCritical = (report.urgency as string) === 'kritis' || (report.urgency as string) === 'tinggi' || (report.urgency as string) === 'critical'
              const isResolved = report.status === 'resolved'

              return (
                <div
                  key={report.id}
                  className="rounded-[16px] p-6 bg-white border border-[#e6e6e6] shadow-subtle hover:shadow-card hover:border-[#4a154b]/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Ticket ID & Status Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-mono font-bold text-[#4a154b] px-2.5 py-0.5 rounded-full bg-[#f9f0ff] border border-[#eddcf7]">
                        {report.report_code || report.id.substring(0, 8)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          isResolved
                            ? 'bg-[#ecfdf5] text-[#007a5a] border-[#d1fae5]'
                            : isCritical
                            ? 'bg-[#fef2f2] text-[#cc4117] border-[#fecaca]'
                            : 'bg-[#f4ede4] text-[#1d1d1d] border-[#e8ded2]'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-[#1d1d1d] group-hover:text-[#4a154b] transition-colors line-clamp-1 mb-1.5">
                      {report.title || categoryLabel}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#696969] line-clamp-3 leading-relaxed mb-4">
                      {report.description}
                    </p>

                    {/* Photo preview if exists */}
                    {report.photo_url && (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-[#f4ede4] mb-4 border border-[#e6e6e6]">
                        <img
                          src={report.photo_url}
                          alt="Bukti Kejadian"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono flex items-center gap-1 backdrop-blur-sm">
                          <Camera className="w-3 h-3" /> Foto Bukti
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Meta & Action */}
                  <div className="pt-4 border-t border-[#e6e6e6] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs text-[#696969]">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#4a154b] shrink-0" />
                        <span className="truncate">{report.district_name || 'Kota Semarang'}</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] shrink-0">
                        <Clock className="w-3 h-3 text-[#696969]" />
                        {formatRelativeTime(report.created_at)}
                      </span>
                    </div>

                    <Link
                      href={`/laporan/${report.id}`}
                      className="w-full min-h-[40px] px-4 py-2 rounded-[90px] bg-[#f9f0ff] hover:bg-[#4a154b] text-[#4a154b] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      Detail Laporan & Audit
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
