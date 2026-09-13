import { NextResponse } from 'next/server'
import { fetchBMKGPublicWeather } from '@/lib/ingestion/bmkg'
import { fetchOSMWaterwaysAndFacilities } from '@/lib/ingestion/osm'
import { fetchBNPBHistoricalDisasters } from '@/lib/ingestion/bnpb'
import { SEMARANG_KECAMATAN, STUDY_AREA_CONFIG } from '@/lib/ingestion/semarang-admin'
import { auditDatasetQuality } from '@/lib/audit/data-quality'

export async function POST() {
  try {
    const weather = await fetchBMKGPublicWeather()
    const osm = await fetchOSMWaterwaysAndFacilities()
    const bnpb = await fetchBNPBHistoricalDisasters()

    const osmAudit = auditDatasetQuality('OpenStreetMap', osm)
    const bnpbAudit = auditDatasetQuality('BNPB', bnpb)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      study_area: STUDY_AREA_CONFIG,
      ingested: {
        bmkg_weather_points: weather.length,
        osm_spatial_features: osm.length,
        bnpb_historical_events: bnpb.length,
        semarang_kecamatan_ref: SEMARANG_KECAMATAN.length,
      },
      audit: {
        osm: osmAudit,
        bnpb: bnpbAudit,
      },
      data: {
        weather,
        osm_features: osm,
        disaster_events: bnpb,
      },
    })
  } catch (err) {
    console.error('Ingestion error:', err)
    return NextResponse.json({ success: false, error: 'Gagal menjalankan pipeline data publik' }, { status: 500 })
  }
}
