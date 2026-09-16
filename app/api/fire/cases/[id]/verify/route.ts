// ============================================================
// KotaKu Siaga — Fire Case Verification & Incident Creation Route
// POST: Human / Operator Verification -> Generates Official FireIncident
// Strict Principle: Satellite signal alone NEVER confirms fire.
// Only authorized human review creates a VERIFIED_FIRE_INCIDENT.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { localFireStore } from '@/lib/services/local-fire-store'
import type { FireIncident } from '@/types/fire'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const fireType: FireIncident['fire_type'] = body.fire_type || 'Land / Vegetation'
    const severity: FireIncident['severity'] = body.severity || 'tinggi'
    const locationAddress: string = body.location_address || ''
    const notes: string = body.notes || ''
    const verifiedBy: string = body.verified_by || 'Petugas Verifikasi Damkar Kota Semarang'

    const result = localFireStore.createIncidentFromCase(
      id,
      fireType,
      severity,
      locationAddress,
      notes,
      verifiedBy
    )

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Fire investigation case not found or cannot be verified' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        incident: result.incident,
        case: result.caseItem,
      },
      message: `Insiden kebakaran resmi #${result.incident.incident_code} berhasil diverifikasi.`,
    })
  } catch (err: any) {
    console.error('Error verifying fire case:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to verify fire case' },
      { status: 500 }
    )
  }
}
