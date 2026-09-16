'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Radio,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Send,
  User,
  Camera,
  Check,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface SOSEvent {
  id: string
  sos_code: string
  latitude: number
  longitude: number
  location_accuracy?: number | null
  location_available: boolean
  district_name?: string | null
  status: 'NEW' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED' | 'FALSE_ALARM'
  priority: 'CRITICAL'
  reporter_name?: string | null
  reporter_phone?: string | null
  reporter_email?: string | null
  description?: string | null
  photo_url?: string | null
  created_at: string
}

export function SOSEmergencyView() {
  const [sosList, setSosList] = useState<SOSEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSos, setSelectedSos] = useState<SOSEvent | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchSosList = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/sos')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setSosList(data.data)
        setSelectedSos((current) => {
          if (!current) return data.data[0] || null
          const found = data.data.find((s: SOSEvent) => s.id === current.id || s.sos_code === current.sos_code)
          return found || data.data[0] || null
        })
      }
    } catch (err) {
      console.warn('Failed to fetch SOS list:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSosList()
    // Auto-refresh every 8 seconds for realtime dashboard updates
    const interval = setInterval(fetchSosList, 8000)
    return () => clearInterval(interval)
  }, [fetchSosList])

  const handleUpdateStatus = async (status: string) => {
    if (!selectedSos) return
    const targetId = selectedSos.id || selectedSos.sos_code
    setIsUpdating(true)

    // Optimistic UI state update
    setSelectedSos((prev) => (prev ? { ...prev, status: status as any } : null))
    setSosList((prev) =>
      prev.map((item) =>
        item.id === selectedSos.id || item.sos_code === selectedSos.sos_code
          ? { ...item, status: status as any }
          : item
      )
    )

    try {
      const res = await fetch(`/api/sos/${encodeURIComponent(targetId)}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await res.json()
      if (res.ok && result.data) {
        setSelectedSos(result.data)
      }
    } catch (err) {
      console.warn('Update SOS status error:', err)
    } finally {
      setIsUpdating(false)
      fetchSosList()
    }
  }

  const activeCount = sosList.filter((s) => s.status === 'NEW' || s.status === 'ACKNOWLEDGED').length

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 rounded-[24px] bg-[#cc4117] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold">PUSAT PANTAU SINYAL SOS DARURAT</span>
              {activeCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[#cc4117] text-xs font-black font-mono animate-bounce">
                  {activeCount} AKTIF
                </span>
              )}
            </div>
            <span className="text-xs text-white/90">
              Sinyal darurat 1-klik warga Kota Semarang yang memerlukan respon tanggap darurat segera.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSosList}
          disabled={isLoading}
          className="min-h-[42px] px-5 py-2 rounded-[90px] bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
            Daftar Sinyal Masuk ({sosList.length})
          </span>

          {sosList.length === 0 ? (
            <div className="p-12 rounded-[20px] bg-white border border-[#e6e6e6] text-center flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-[#007a5a]" />
              <span className="text-sm font-bold text-[#1d1d1d]">Tidak Ada Sinyal SOS Aktif</span>
              <span className="text-xs text-[#696969]">Seluruh wilayah Kota Semarang terpantau aman terkendali.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
              {sosList.map((sos) => {
                const isSelected = selectedSos?.id === sos.id
                const isNew = sos.status === 'NEW'

                return (
                  <button
                    key={sos.id}
                    type="button"
                    onClick={() => setSelectedSos(sos)}
                    className={`p-4 rounded-[16px] text-left border transition-all flex flex-col gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#fff5f2] border-[#cc4117] ring-2 ring-[#cc4117]/20 shadow-sm'
                        : 'bg-white border-[#e6e6e6] hover:bg-[#fdfbf9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isNew && <span className="w-2.5 h-2.5 rounded-full bg-[#cc4117] animate-ping"></span>}
                        <span className="font-mono text-xs font-extrabold text-[#cc4117]">
                          {sos.sos_code}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#cc4117]/10 text-[#cc4117]">
                        {sos.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#1d1d1d] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#cc4117] shrink-0" />
                      <span className="truncate">{sos.district_name || 'Kota Semarang'}</span>
                      <span className="text-[#696969] font-mono text-[11px]">
                        ({sos.latitude?.toFixed(4)}, {sos.longitude?.toFixed(4)})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#696969] pt-1 border-t border-[#f0f0f0]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(sos.created_at)}
                      </span>
                      <span>
                        {sos.location_accuracy ? `Akurasi ±${Math.round(sos.location_accuracy)}m` : 'GPS Estimasi'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Detail Panel */}
        <div className="lg:col-span-7">
          {selectedSos ? (
            <div className="p-6 rounded-[24px] bg-white border border-[#e6e6e6] shadow-card flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#cc4117] tracking-wider">
                    Detail Sinyal Darurat
                  </span>
                  <h3 className="text-xl font-bold font-mono text-[#1d1d1d]">{selectedSos.sos_code}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#cc4117] text-white text-xs font-bold uppercase">
                    PRIORITAS {selectedSos.priority}
                  </span>
                </div>
              </div>

              {/* Coordinates Card */}
              <div className="p-4 rounded-[16px] bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fff1f0] flex items-center justify-center text-[#cc4117]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1d1d1d]">
                      Koordinat: {selectedSos.latitude}, {selectedSos.longitude}
                    </span>
                    <span className="text-[11px] text-[#696969]">
                      Wilayah: {selectedSos.district_name || 'Kota Semarang'} | Akurasi: {selectedSos.location_accuracy ? `±${Math.round(selectedSos.location_accuracy)} m` : 'Estimasi Wilayah'}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps?q=${selectedSos.latitude},${selectedSos.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-[90px] bg-[#4a154b] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#481a54] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka di Google Maps
                </a>
              </div>

              {/* Reporter Info (If Provided in Followup) */}
              <div className="p-4 rounded-[16px] bg-[#f9f0ff] border border-[#eddcf7] flex flex-col gap-2">
                <span className="text-xs font-bold text-[#4a154b] uppercase tracking-wider">
                  Informasi Kontak Pelapor Lapangan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    Nama: <strong>{selectedSos.reporter_name || 'Warga Anonim (1-Klik SOS)'}</strong>
                  </div>
                  <div>
                    Kontak: <strong>{selectedSos.reporter_phone || 'Tidak dicantumkan'}</strong>
                  </div>
                </div>
                {selectedSos.description && (
                  <div className="text-xs text-[#1d1d1d] mt-1 pt-2 border-t border-[#eddcf7]/60">
                    Keterangan: &ldquo;{selectedSos.description}&rdquo;
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e6e6e6]">
                <div className="flex items-center gap-2">
                  <a
                    href="tel:112"
                    className="min-h-[42px] px-5 py-2.5 rounded-[90px] bg-[#cc4117] text-white hover:bg-[#b03713] font-bold text-xs flex items-center gap-2 shadow-sm"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Dispatch Tim BPBD 112
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('DISPATCHED')}
                    disabled={isUpdating}
                    className={`min-h-[42px] px-4 py-2 rounded-[90px] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedSos.status === 'DISPATCHED'
                        ? 'bg-[#007a5a] text-white ring-2 ring-[#007a5a]/30 shadow-sm'
                        : 'bg-[#007a5a] text-white hover:bg-[#006046]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedSos.status === 'DISPATCHED' ? 'Tim di Lapangan' : 'Tandai Tim Terjun'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    disabled={isUpdating}
                    className={`min-h-[42px] px-4 py-2 rounded-[90px] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedSos.status === 'RESOLVED'
                        ? 'bg-[#007a5a] text-white ring-2 ring-[#007a5a]/30'
                        : 'bg-[#f4ede4] hover:bg-[#e8ded2] text-[#1d1d1d]'
                    }`}
                  >
                    {selectedSos.status === 'RESOLVED' && <Check className="w-4 h-4" />}
                    <span>{selectedSos.status === 'RESOLVED' ? 'Selesai Ditangani' : 'Selesai'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-[24px] bg-white border border-[#e6e6e6] text-center text-xs text-[#696969]">
              Pilih salah satu sinyal SOS pada daftar di sebelah kiri untuk melihat detail koordinat dan tindakan dispatch.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
