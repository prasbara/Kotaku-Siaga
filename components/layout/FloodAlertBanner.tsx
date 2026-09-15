'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AlertTriangle, MapPin, Eye, X, ChevronRight, Video } from 'lucide-react'
import type { FloodEvent } from '@/types/flood-event'

export function FloodAlertBanner() {
  const [activeEvents, setActiveEvents] = useState<FloodEvent[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchActiveEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/flood-events')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const confirmedOrSuspected = data.data.filter(
          (e: FloodEvent) => e.status === 'confirmed' || e.status === 'suspected'
        )
        setActiveEvents(confirmedOrSuspected)
      }
    } catch {
      // Silently handle offline/failure
    }
  }, [])

  useEffect(() => {
    fetchActiveEvents()
    const timer = setInterval(fetchActiveEvents, 20000)
    return () => clearInterval(timer)
  }, [fetchActiveEvents])

  if (dismissed || activeEvents.length === 0) return null

  const currentEvent = activeEvents[currentIndex % activeEvents.length]
  const isConfirmed = currentEvent.status === 'confirmed'

  return (
    <div
      role="alert"
      className="relative z-40 w-full bg-gradient-to-r from-red-950 via-[#1f0b12] to-red-950 border-b border-red-700/60 text-white px-3 sm:px-4 py-2.5 shadow-lg transition-all animate-fade-in"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Left: Alert Information */}
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-600/30 border border-red-500/60 shrink-0 mt-0.5 sm:mt-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-600 text-white tracking-wider">
                {isConfirmed ? 'FLOOD CONFIRMED' : 'WATER SUSPECTED'}
              </span>
              <span className="font-headline font-bold text-xs sm:text-sm text-red-200 truncate">
                {currentEvent.district_name}, Kota Semarang
              </span>
              <span className="text-[10px] font-mono text-red-300/80 hidden md:inline">
                &bull; CCTV: {currentEvent.camera_name} ({currentEvent.camera_code})
              </span>
            </div>
            <p className="text-[11px] text-red-200/90 truncate mt-0.5 font-sans">
              Detected by CCTV PantauSemar &bull; Conf: <b className="font-mono text-emerald-400">{(currentEvent.model_confidence * 100).toFixed(0)}%</b> &bull; Severity: <b className="capitalize text-amber-300">{currentEvent.estimated_visual_severity}</b>
              {currentEvent.citizen_reports_count > 0 && ` &bull; ${currentEvent.citizen_reports_count} Laporan Warga`}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {activeEvents.length > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeEvents.length)}
              className="text-[10px] font-mono text-red-300 hover:text-white px-2 py-1 rounded bg-red-900/40 border border-red-700/40"
            >
              {currentIndex + 1}/{activeEvents.length} Berikutnya
            </button>
          )}

          <Link
            href="/peta"
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Lihat di Peta</span>
          </Link>

          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-700/40 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail EOC</span>
          </Link>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Tutup Alert"
            className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
