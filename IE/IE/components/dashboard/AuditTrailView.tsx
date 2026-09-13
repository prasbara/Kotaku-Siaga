'use client'

import React from 'react'
import { History, CheckCircle2, ShieldCheck, FileCode, Scale } from 'lucide-react'

export function AuditTrailView() {
  const auditLogs = [
    {
      id: 'AUD-2026-004',
      timestamp: '2026-09-11 15:30:00 WIB',
      actor: 'System Priority Engine',
      action: 'Kalkulasi Ulang 16 Kecamatan Semarang',
      formula: 'Formula v2.4.0 (Deterministic ISO 37120 6-Factor)',
      status: 'VERIFIED_DETERMINISTIC',
      notes: 'Hasil: 2 Critical (Semarang Utara: 84.6, Genuk: 81.2), 4 High (Smg Timur, Gayamsari, Tembalang, Smg Barat), 10 Medium/Low.',
    },
    {
      id: 'AUD-2026-003',
      timestamp: '2026-09-11 14:00:00 WIB',
      actor: 'Public Data Ingestion Pipeline',
      action: 'Validasi Integritas Data Eksternal (BMKG, OSM, BNPB)',
      formula: 'Data Quality Auditor (0 Duplicate, 100% Provenance)',
      status: 'AUDIT_PASSED',
      notes: '184 record diproses: 100% koordinat spasial valid di dalam bounding box Semarang.',
    },
    {
      id: 'AUD-2026-002',
      timestamp: '2026-09-11 12:15:10 WIB',
      actor: 'Petugas EOC Dispatcher',
      action: 'Disposisi Laporan Rob Pesisir Kaligawe & Genuk',
      formula: 'Workflow Moderasi Lapangan',
      status: 'DISPATCHED_OPD',
      notes: 'Diteruskan ke Tim Reaksi Cepat BPBD Kota Semarang & Pompa Air Polder Sringin-Tenggang.',
    },
    {
      id: 'AUD-2026-001',
      timestamp: '2026-09-11 08:00:00 WIB',
      actor: 'System Spatial Classifier',
      action: 'Inisialisasi Bounding Box Kota Semarang (3374)',
      formula: 'Geospatial Bbox Filter [-7.115, -6.920, 110.270, 110.500]',
      status: 'INITIALIZED',
      notes: '16 Kecamatan terpetakan dalam kerangka batas administratif resmi Jawa Tengah.',
    },
  ]

  return (
    <div className="space-y-6 font-body text-on-surface">
      {/* Header */}
      <div className="pb-4 border-b border-outline-variant/30">
        <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold block mb-1">
          REPRODUSIBILITAS & AKUNTABILITAS ISO 37120
        </span>
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">
          Log Audit Publik, Provenance & Integritas Algoritma
        </h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Catatan riwayat verifikasi data, versi formula kalkulasi matematis, dan jejak asal data publik tanpa monopoli.
        </p>
      </div>

      {/* Audit List */}
      <div className="space-y-4">
        {auditLogs.map((log) => (
          <div key={log.id} className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-outline-variant/20 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-primary">{log.id}</span>
                <span className="text-on-surface font-semibold text-xs">{log.action}</span>
              </div>
              <span className="font-mono text-[11px] text-on-surface-variant">{log.timestamp}</span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed font-body">
              {log.notes}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 text-[11px] font-mono">
              <span className="text-primary font-semibold">Formula: {log.formula}</span>
              <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary border border-secondary/30 font-bold uppercase">
                {log.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
