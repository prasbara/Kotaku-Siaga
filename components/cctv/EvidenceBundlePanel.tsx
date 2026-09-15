'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { EvidenceBundle, CCTVEvidenceRecord, EvidenceStrength } from '@/lib/services/evidence-collector'

// ============================================================
// TYPES
// ============================================================

interface EvidenceBundlePanelProps {
  reportId: string
  reportCode?: string
  /** Auto-fetch on mount */
  autoFetch?: boolean
  className?: string
}

// ============================================================
// STRENGTH CONFIG
// ============================================================

const STRENGTH_CONFIG: Record<
  EvidenceStrength,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string; description: string }
> = {
  STRONG: {
    label: 'Kuat',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: '🟢',
    description: 'Beberapa CCTV mengkonfirmasi genangan',
  },
  MODERATE: {
    label: 'Sedang',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    icon: '🟡',
    description: 'Satu CCTV menunjukkan indikasi',
  },
  WEAK: {
    label: 'Lemah',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: 'rgba(107, 114, 128, 0.4)',
    icon: '⚪',
    description: 'Data tidak cukup konklusif',
  },
  NEUTRAL: {
    label: 'Netral',
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    icon: '🔵',
    description: 'Tidak ada sinyal genangan',
  },
  CONFLICTING: {
    label: 'Bertentangan',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    icon: '🔴',
    description: 'CCTV menunjukkan kondisi normal',
  },
  NO_DATA: {
    label: 'Tidak Ada Data',
    color: '#9ca3af',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
    icon: '⚫',
    description: 'CCTV offline atau belum diobservasi',
  },
}

const FLOOD_STATE_LABELS: Record<string, { label: string; color: string }> = {
  FLOOD_CONFIRMED: { label: 'Banjir Terkonfirmasi', color: '#ef4444' },
  FLOOD_SUSPECTED: { label: 'Diduga Banjir', color: '#f97316' },
  WATER_SUSPECTED: { label: 'Terdeteksi Genangan', color: '#f59e0b' },
  NORMAL: { label: 'Normal', color: '#10b981' },
  FLOOD_RESOLVED: { label: 'Sudah Surut', color: '#6b7280' },
}

const TIMESTAMP_CORR_LABELS: Record<CCTVEvidenceRecord['timestamp_correlation'], string> = {
  WITHIN_5MIN: '≤5 menit',
  WITHIN_30MIN: '≤30 menit',
  WITHIN_1HOUR: '≤1 jam',
  STALE: 'Data lama',
  NO_DATA: 'Tidak ada data',
}

// ============================================================
// HELPER: format ISO to WIB
// ============================================================
function toWib(iso: string | null): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  } catch {
    return iso
  }
}

function truncateHash(hash: string | null): string {
  if (!hash) return '-'
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

// ============================================================
// CCTV EVIDENCE CARD
// ============================================================

function CCTVEvidenceCard({ ev }: { ev: CCTVEvidenceRecord }) {
  const [expanded, setExpanded] = useState(false)
  const sc = STRENGTH_CONFIG[ev.evidence_strength]
  const floodLabel = ev.flood_state ? FLOOD_STATE_LABELS[ev.flood_state] : null
  const corrLabel = TIMESTAMP_CORR_LABELS[ev.timestamp_correlation]

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${sc.borderColor}`,
        borderRadius: '12px',
        padding: '16px',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded((e) => !e)}
      role="button"
      aria-expanded={expanded}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Strength badge */}
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '20px',
            background: sc.bgColor,
            border: `1px solid ${sc.borderColor}`,
            color: sc.color,
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {sc.icon} {sc.label}
        </div>

        {/* CCTV info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9', marginBottom: '2px' }}>
            {ev.cctv_name}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>📍 {ev.distance_m}m {ev.direction_label}</span>
            <span>🏙️ {ev.cctv_district}</span>
            {ev.cctv_status !== 'online' && (
              <span style={{ color: '#ef4444' }}>⚠️ {ev.cctv_status.toUpperCase()}</span>
            )}
          </div>
        </div>

        {/* Flood state */}
        {floodLabel && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: floodLabel.color,
              background: `${floodLabel.color}22`,
              padding: '3px 8px',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          >
            {floodLabel.label}
          </div>
        )}

        {/* Chevron */}
        <div style={{ color: '#64748b', fontSize: '12px', flexShrink: 0, marginTop: '2px' }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Timestamp correlation row */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#94a3b8' }}>
        <span>
          ⏱️ Korelasi waktu:{' '}
          <span
            style={{
              color: ev.timestamp_correlation === 'WITHIN_5MIN' ? '#10b981' :
                ev.timestamp_correlation === 'WITHIN_30MIN' ? '#f59e0b' :
                ev.timestamp_correlation === 'STALE' ? '#ef4444' : '#94a3b8',
              fontWeight: 600,
            }}
          >
            {corrLabel}
          </span>
          {ev.timestamp_delta_minutes !== null && ` (${ev.timestamp_delta_minutes} menit)`}
        </span>
        {ev.visual_confidence !== null && (
          <span>
            🤖 Kepercayaan visual:{' '}
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>
              {(ev.visual_confidence * 100).toFixed(0)}%
            </span>
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '10px',
            fontSize: '12px',
          }}
        >
          <Detail label="Kode CCTV" value={ev.cctv_code} />
          <Detail label="Alamat" value={ev.cctv_address} />
          <Detail label="Arah" value={`${ev.bearing_deg}° ${ev.direction_label}`} />
          <Detail label="Jarak" value={`${ev.distance_m} meter`} />
          <Detail label="Observasi terakhir" value={toWib(ev.snapshot_captured_at)} />
          <Detail label="Status CCTV" value={ev.cctv_status.toUpperCase()} />
          {ev.sha256_hash && (
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#64748b', fontSize: '11px' }}>SHA-256 integritas: </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#a78bfa',
                  wordBreak: 'break-all',
                }}
              >
                {ev.sha256_hash}
              </span>
            </div>
          )}
          {ev.stream_url && (
            <div style={{ gridColumn: '1 / -1' }}>
              <a
                href={ev.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#60a5fa', fontSize: '12px' }}
                onClick={(e) => e.stopPropagation()}
              >
                🎥 Buka stream CCTV
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: '#64748b', fontSize: '11px', marginBottom: '2px' }}>{label}</div>
      <div style={{ color: '#e2e8f0', fontWeight: 500 }}>{value || '-'}</div>
    </div>
  )
}

// ============================================================
// SUMMARY STATS BAR
// ============================================================

function SummaryBar({ bundle }: { bundle: EvidenceBundle }) {
  const total = bundle.nearby_cctv.length
  if (total === 0) return null

  const bars = [
    { label: 'Mendukung', count: bundle.supporting_cctv_count, color: '#10b981' },
    { label: 'Bertentangan', count: bundle.conflicting_cctv_count, color: '#ef4444' },
    { label: 'Netral', count: bundle.neutral_cctv_count, color: '#60a5fa' },
    { label: 'Offline', count: bundle.offline_cctv_count, color: '#6b7280' },
  ]

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {bars.map((b) => (
        <div
          key={b.label}
          style={{
            background: `${b.color}22`,
            border: `1px solid ${b.color}44`,
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '12px',
            color: b.color,
            fontWeight: 600,
          }}
        >
          {b.label}: {b.count}
        </div>
      ))}
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function EvidenceBundlePanel({
  reportId,
  reportCode,
  autoFetch = true,
  className,
}: EvidenceBundlePanelProps) {
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetched, setFetched] = useState(false)

  const fetchEvidence = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${reportId}/evidence?radius_km=1.5`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat evidence.')
      setBundle(json.data)
      setFetched(true)
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }, [reportId, loading])

  useEffect(() => {
    if (autoFetch && !fetched) {
      fetchEvidence()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch])

  const sc = bundle ? STRENGTH_CONFIG[bundle.evidence_strength_overall] : null

  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
            🎥 Evidence CCTV Terdekat
          </h3>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Radius 1.5km dari lokasi laporan · PantauSemar Kota Semarang
          </div>
          {reportCode && (
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
              Laporan: <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{reportCode}</span>
            </div>
          )}
        </div>

        {!fetched && !loading && (
          <button
            onClick={fetchEvidence}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: '#818cf8',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Muat Evidence
          </button>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⟳</div>
          <div style={{ fontSize: '14px' }}>Menganalisis CCTV terdekat…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px',
            padding: '16px',
            color: '#f87171',
            fontSize: '14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={fetchEvidence}
            style={{
              marginLeft: 'auto',
              padding: '4px 12px',
              borderRadius: '6px',
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── Bundle ── */}
      {bundle && !loading && (
        <>
          {/* Overall Strength Banner */}
          {sc && (
            <div
              style={{
                background: sc.bgColor,
                border: `1px solid ${sc.borderColor}`,
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '28px', flexShrink: 0 }}>{sc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: sc.color, fontSize: '15px', marginBottom: '4px' }}>
                  Kekuatan Evidence: {sc.label}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  {bundle.operator_note}
                </div>
              </div>
              {/* SHA-256 of bundle */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: '#475569', marginBottom: '2px' }}>Bundle SHA-256</div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748b' }}>
                  {truncateHash(bundle.bundle_sha256)}
                </div>
              </div>
            </div>
          )}

          {/* Summary stats */}
          <SummaryBar bundle={bundle} />

          {/* CCTV Cards */}
          {bundle.nearby_cctv.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📡</div>
              <div>Tidak ada CCTV PantauSemar dalam radius 1.5km dari lokasi laporan.</div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#475569' }}>
                Total {bundle.total_cctv_searched} titik CCTV dicek di seluruh Kota Semarang.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bundle.nearby_cctv.map((ev) => (
                <CCTVEvidenceCard key={ev.cctv_id} ev={ev} />
              ))}
            </div>
          )}

          {/* Methodology footer */}
          <div
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#475569',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>📋 Catatan Metodologi</div>
            {bundle.methodology_note}
            <div style={{ marginTop: '6px', color: '#374151' }}>
              Diperbarui: {toWib(bundle.created_at)} · {bundle.total_cctv_searched} CCTV dikaji
            </div>
          </div>
        </>
      )}
    </div>
  )
}
