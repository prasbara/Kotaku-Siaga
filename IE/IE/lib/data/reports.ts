// ============================================================
// KotaKu Siaga — Citizen Reports Data Module
// PRODUCTION: Reports berasal dari database Supabase nyata
// File ini tidak mengandung demo/fallback/hardcoded data
// ============================================================

import type { Report } from '@/types'

/**
 * PRODUCTION MODE: Array ini SENGAJA KOSONG.
 * Semua laporan warga berasal dari database Supabase (tabel `reports`).
 * Tidak ada fallback hardcoded ke data demo/testing.
 *
 * Jika database tidak dikonfigurasi, API akan return error eksplisit —
 * bukan fake data yang menyesatkan operator EOC.
 */
export const FALLBACK_SEMARANG_REPORTS: Report[] = []

/**
 * findFallbackReport — hanya untuk kompatibilitas backward.
 * PRODUCTION: Selalu return undefined karena array kosong.
 * Caller harus menggunakan Supabase query langsung.
 */
export function findFallbackReport(idOrCode: string): Report | undefined {
  return FALLBACK_SEMARANG_REPORTS.find(
    (r) => r.id === idOrCode || r.report_code === idOrCode
  )
}
