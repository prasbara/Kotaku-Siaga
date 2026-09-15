import { NextRequest, NextResponse } from 'next/server'
import { disasterIntelligenceEngine } from '@/lib/intelligence/disaster-risk-engine'
import { getUserRole } from '@/lib/auth/session'

// GET /api/disaster-intelligence?area=semarang-utara
// Role-based disaster intelligence output:
// - Role 'public' receives sanitized, actionable public-safe information (Requirement #1 & #12).
// - Role 'admin' / 'officer' receives full technical scoring breakdown, data gaps, and lineage (Requirement #2 & #8).
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const areaParam = searchParams.get('area') || undefined
  const forceRole = searchParams.get('role') // Optional manual role preview if authorized

  const callerRole = await getUserRole(request)
  const effectiveRole = callerRole === 'admin' && forceRole ? (forceRole as any) : callerRole

  try {
    const operatorAssessment = await disasterIntelligenceEngine.evaluateDistrictRisk(areaParam)

    if (effectiveRole === 'admin' || effectiveRole === 'officer') {
      return NextResponse.json(
        {
          success: true,
          authorizedRole: effectiveRole,
          dataMode: 'PRODUCTION_INTELLIGENCE_ENGINE',
          assessment: operatorAssessment,
        },
        {
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      )
    }

    // Public / Warga Safe Payload
    const publicSummary = disasterIntelligenceEngine.toPublicSummary(operatorAssessment)
    return NextResponse.json(
      {
        success: true,
        authorizedRole: 'public',
        dataMode: 'PUBLIC_SAFE_INFORMATION',
        summary: publicSummary,
      },
      {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    )
  } catch (err: any) {
    console.error('Disaster Intelligence calculation failed:', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Engine evaluasi risiko bencana sedang mengalami gangguan sementara.',
        detail: effectiveRole === 'admin' ? err?.message : undefined,
      },
      { status: 500 }
    )
  }
}
