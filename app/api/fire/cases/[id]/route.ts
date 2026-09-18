// ============================================================
// KotaKu Siaga — Fire Investigation Case Detail & Update Route
// GET: Fetch single case
// PATCH: Update case status (UNDER_REVIEW, REJECTED, RESOLVED, DISMISSED)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { localFireStore } from '@/lib/services/local-fire-store'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const caseItem = localFireStore.getCaseById(id)

    if (!caseItem) {
      return NextResponse.json(
        { success: false, error: 'Fire investigation case not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: caseItem,
    })
  } catch (err: any) {
    console.error('Error fetching fire case:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch fire case' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const updated = localFireStore.updateCaseStatus(
      id,
      body.status,
      body.notes,
      body.actor || 'Petugas Operator Damkar/BPBD'
    )

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Fire investigation case not found' },
        { status: 404 }
      )
    }

    // If case is rejected/dismissed, synchronize Supabase database reports as well
    if ((body.status === 'REJECTED' || body.status === 'DISMISSED') && updated.citizen_reports?.length > 0) {
      try {
        const { createAdminClient, isSupabaseConfigured } = await import('@/lib/supabase/server')
        if (isSupabaseConfigured()) {
          const supabase = await createAdminClient()
          const ids = updated.citizen_reports.map((cr) => cr.id)
          await supabase.from('reports').update({
            status: 'rejected',
            verification_status: 'rejected',
            updated_at: new Date().toISOString(),
          }).in('id', ids)
        }
      } catch (syncErr) {
        console.warn('Failed to sync rejected status to Supabase reports:', syncErr)
      }
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Status kasus berhasil diperbarui menjadi ${body.status}`,
    })
  } catch (err: any) {
    console.error('Error updating fire case:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update fire case' },
      { status: 500 }
    )
  }
}
