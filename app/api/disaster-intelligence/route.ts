import { NextRequest, NextResponse } from 'next/server'
import { disasterIntelligenceEngine } from '@/lib/intelligence/disaster-risk-engine'
import { getUserRole } from '@/lib/auth/session'

// GET /api/disaster-intelligence?area=semarang-utara
// Role-based disaster intelligence output:
// - Role 'public' receives sanitized, actionable public-safe information.
// - Role 'admin' / 'officer' receives full technical scoring breakdown.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const areaParam = searchParams.get('area') || undefined
  const forceRole = searchParams.get('role')

  const callerRole = await getUserRole(request)
  const effectiveRole = callerRole === 'admin' && forceRole ? (forceRole as any) : callerRole

  try {
    // Wrap with 8s timeout to prevent cold-start hangs on Vercel Hobby
    const operatorAssessment = await Promise.race([
      disasterIntelligenceEngine.evaluateDistrictRisk(areaParam),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ENGINE_TIMEOUT')), 8000)
      ),
    ])

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
    const isTimeout = err?.message === 'ENGINE_TIMEOUT'
    console.error('[disaster-intelligence] Engine error:', isTimeout ? 'timeout' : err)

    // On timeout: return a degraded but valid public summary with safe defaults
    if (isTimeout) {
      const fallbackSummary = {
        areaId: areaParam || 'semarang-utara',
        areaName: 'Kota Semarang',
        currentRiskLevel: 'LOW' as const,
        riskScore: 0,
        simpleConfidence: 'PERLU_VERIFIKASI' as const,
        rainfallSummary: { rateMmH: 0, category: 'Data Sementara Tidak Tersedia', status: 'Memuat ulang...' },
        coastalRiskSummary: { waveHeightM: null, status: 'Memuat...', tideWarning: false },
        publicRecommendations: ['Hubungi posko siaga atau periksa aplikasi BMKG untuk informasi cuaca terkini.'],
        whySummary: ['Sistem pemantauan sedang memuat data. Silakan coba lagi dalam beberapa detik.'],
        roadsToAvoid: [],
        nearbyFacilities: ['Layanan Darurat: 112 (BPBD Kota Semarang)'],
        lastUpdate: new Date().toISOString(),
        lastUpdateWib: new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false }) + ' WIB',
      }
      return NextResponse.json(
        { success: true, authorizedRole: 'public', dataMode: 'DEGRADED_FALLBACK', summary: fallbackSummary },
        { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
    }

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
