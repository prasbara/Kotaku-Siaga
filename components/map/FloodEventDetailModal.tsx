'use client'

import React from 'react'
import { X, ExternalLink, ShieldCheck, Activity, Eye, Video, Clock, MapPin, Users, CloudRain, CheckCircle2 } from 'lucide-react'
import type { FloodEvent } from '@/types/flood-event'

interface FloodEventDetailModalProps {
  event: FloodEvent | null
  onClose: () => void
  onOpenCCTV?: (cameraId: string) => void
  onResolve?: (eventId: string) => void
}

export function FloodEventDetailModal({
  event,
  onClose,
  onOpenCCTV,
  onResolve,
}: FloodEventDetailModalProps) {
  if (!event) return null

  const isConfirmed = event.status === 'confirmed'
  const isResolved = event.status === 'resolved'
  const floodColor = isResolved ? '#10B981' : isConfirmed ? '#EF4444' : '#F59E0B'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: floodColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono tracking-tight">
                  {event.event_id}
                </h3>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    backgroundColor: `${floodColor}20`,
                    color: floodColor,
                    border: `1px solid ${floodColor}50`,
                  }}
                >
                  {event.status}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {event.state}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {event.district_name} &bull; {event.camera_name} ({event.camera_code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
          {/* Visual Evidence Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Visual Evidence (Snapshot CCTV Aktual)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Res: 1080p FHD &bull; YOLO Annotated
              </span>
            </div>
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-700/80 bg-black group">
              {event.evidence_url ? (
                <img
                  src={event.evidence_url}
                  alt={`Evidence ${event.event_id}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Video className="w-8 h-8 opacity-40" />
                  <span>Evidence frame sedang disinkronkan...</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono font-bold text-white border border-white/10">
                Kamera: {event.camera_code} &bull; {event.camera_name}
              </div>
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-emerald-400 border border-emerald-500/20">
                Confidence YOLO: {(event.model_confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Visual Severity
              </span>
              <span className="text-sm font-bold capitalize text-amber-400">
                {event.estimated_visual_severity}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                estimated_visual
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Event Confidence
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {(event.event_confidence * 100).toFixed(0)}%
              </span>
              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                Composite: {event.confidence_category}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Laporan Warga
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                {event.citizen_reports_count} Laporan
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                Radius 500 meter
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Korelasi Cuaca
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                {event.weather_corroboration === 'true' ? 'Hujan' : 'Unknown'}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                AWS Tg. Emas
              </span>
            </div>
          </div>

          {/* Multi-Source Corroboration Breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Formula Multi-Source Corroboration
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              EventConf = (0.50 &times; Model: {(event.model_confidence * 100).toFixed(0)}%) + (0.20 &times; Temporal: {event.state === 'FLOOD_CONFIRMED' ? '95%' : '65%'}) + (0.15 &times; Warga: {event.citizen_reports_count}) + (0.10 &times; CCTV Sekitar: {event.nearby_cctv_count}) + (0.05 &times; Cuaca: {event.weather_corroboration}) = <span className="text-emerald-400 font-bold">{(event.event_confidence * 100).toFixed(0)}% ({event.confidence_category})</span>
            </p>
          </div>

          {/* Event Timeline (Section 22) */}
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Event Timeline & Audit Trail
            </span>
            <div className="relative pl-5 border-l-2 border-slate-800 space-y-4">
              {event.timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-950 group-hover:bg-cyan-400 transition-colors" />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-cyan-400">
                      {item.time_wib}
                    </span>
                    {item.state && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.state}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-900/80">
          <div className="text-[11px] text-slate-500 font-mono">
            {isResolved ? `Selesai: ${new Date(event.resolved_at!).toLocaleString('id-ID')}` : `Aktif sejak: ${new Date(event.started_at).toLocaleTimeString('id-ID')} WIB`}
          </div>
          <div className="flex items-center gap-2">
            {!isResolved && onResolve && (
              <button
                onClick={() => onResolve(event.event_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Resolusi Event
              </button>
            )}
            {onOpenCCTV && (
              <button
                onClick={() => onOpenCCTV(event.camera_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                Buka Stream CCTV
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
