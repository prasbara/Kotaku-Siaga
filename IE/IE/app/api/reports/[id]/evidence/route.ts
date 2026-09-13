// ============================================================
// GET /api/reports/[id]/evidence
// Mengembalikan Evidence Bundle CCTV untuk laporan tertentu
// CPU-Only · Vercel-Compatible · No Telegram · No Simulation
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'
import { collectEvidenceBundle } from '@/lib/services/evidence-collector'

// PRODUCTION: citizen reports come from the real database only.
// No hardcoded citizen reports are used as fallback data.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID diperlukan.' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured.' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const radiusKm = parseFloat(searchParams.get('radius_km') || '1.5')
    const clampedRadius = Math.min(Math.max(radiusKm, 0.5), 5.0) // 0.5km – 5km

    // 1. Cari report dari Supabase
    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('reports')
      .select('id, report_code, latitude, longitude, created_at, category, title')
      .or(`id.eq.${reportId},report_code.eq.${reportId}`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
      }
      console.error('GET /api/reports/[id]/evidence database error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed.', detail: error.message },
        { status: 503 }
      )
    }

    if (!data) {
      return NextResponse.json({ error: 'Laporan tidak ditemukan.' }, { status: 404 })
    }

    const report = data

    if (!report.latitude || !report.longitude) {
      return NextResponse.json({ error: 'Laporan tidak memiliki koordinat yang valid.' }, { status: 422 })
    }

    // 2. Collect evidence bundle
    const bundle = await collectEvidenceBundle({
      report_id: report.id,
      report_code: report.report_code,
      report_lat: report.latitude,
      report_lng: report.longitude,
      report_submitted_at: report.created_at,
      radius_km: clampedRadius,
    })

    return NextResponse.json(
      {
        success: true,
        data: bundle,
        meta: {
          report_id: report.id,
          report_code: report.report_code,
          radius_km: clampedRadius,
          cctv_count: bundle.nearby_cctv.length,
          evidence_strength: bundle.evidence_strength_overall,
          bundle_sha256: bundle.bundle_sha256,
        },
      },
      {
        headers: {
          // Cache for max 2 minutes; fresh data is more important than caching
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('GET /api/reports/[id]/evidence error:', error)
    return NextResponse.json({ error: 'Gagal mengumpulkan evidence.' }, { status: 500 })
  }
}
