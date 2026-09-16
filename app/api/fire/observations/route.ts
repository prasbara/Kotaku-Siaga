// ============================================================
// KotaKu Siaga — Fire Observations API Route
// GET: Fetch raw satellite & early thermal observations
// POST: Ingest observation or trigger NASA FIRMS sync
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { localFireStore } from '@/lib/services/local-fire-store'
import { nasaFirmsService } from '@/lib/services/nasa-firms'
import { fireCorrelationEngine } from '@/lib/services/fire-correlation-engine'
import type { FireObservation } from '@/types/fire'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const district = searchParams.get('district') || undefined
    const status = searchParams.get('status') || undefined
    const freshness = searchParams.get('freshness') || undefined
    const isSimStr = searchParams.get('is_simulation')
    const limitStr = searchParams.get('limit')
    const sync = searchParams.get('sync') === 'true'

    if (sync) {
      // Ingest live from NASA FIRMS
      const ingestRes = await nasaFirmsService.fetchFirmsObservations(1)
      if (ingestRes.observations.length > 0) {
        localFireStore.addObservations(ingestRes.observations)
        await fireCorrelationEngine.executeCorrelation()
      }
    }

    const isSimulation = isSimStr !== null ? isSimStr === 'true' : undefined
    const limit = limitStr ? parseInt(limitStr, 10) : 100

    const observations = localFireStore.getObservations({
      district,
      status,
      freshness,
      is_simulation: isSimulation,
      limit,
    })

    return NextResponse.json({
      success: true,
      data: observations,
      count: observations.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('Error fetching fire observations:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch fire observations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate minimal observation payload
    if (!body.source || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: source, latitude, and longitude are required.' },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    const obs: FireObservation = {
      id: body.id || `fire-obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: body.source,
      source_record_id: body.source_record_id || `MANUAL_${Date.now()}`,
      latitude: body.latitude,
      longitude: body.longitude,
      observed_at: body.observed_at || nowIso,
      retrieved_at: nowIso,
      satellite: body.satellite || 'VIIRS NOAA-20',
      instrument: body.instrument || 'VIIRS',
      confidence: body.confidence || 'nominal',
      frp: typeof body.frp === 'number' ? body.frp : undefined,
      day_night: body.day_night || 'D',
      brightness_temp_k: body.brightness_temp_k,
      district_name: body.district_name || 'Kota Semarang',
      proximity_settlement_meters: body.proximity_settlement_meters || 500,
      freshness_status: 'FRESH',
      quality_status: body.confidence === 'high' ? 'HIGH' : 'MODERATE',
      verification_status: 'SIGNAL_DETECTED',
      is_simulation: Boolean(body.is_simulation),
      created_at: nowIso,
      updated_at: nowIso,
    }

    const saved = localFireStore.addObservation(obs)

    // Trigger correlation immediately
    await fireCorrelationEngine.executeCorrelation()

    return NextResponse.json({
      success: true,
      data: saved,
      message: 'Fire observation ingested and correlated successfully.',
    })
  } catch (err: any) {
    console.error('Error ingesting fire observation:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to ingest fire observation' },
      { status: 500 }
    )
  }
}
