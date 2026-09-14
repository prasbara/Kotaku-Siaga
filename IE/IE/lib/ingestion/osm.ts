// ============================================================
// KotaKu Siaga — OpenStreetMap (OSM) Public Feature Ingestion
// Provider: OpenStreetMap Contributors via Overpass API
// Access: Public API (TANPA LOGIN, TANPA API KEY, TANPA REGISTRASI)
// Study Area: Kota Semarang Bounding Box
// ============================================================

import type { IngestedSpatialFeature, DataProvenance } from './types'
import { STUDY_AREA_CONFIG } from './semarang-admin'

export async function fetchOSMWaterwaysAndFacilities(): Promise<IngestedSpatialFeature[]> {
  const provenance: DataProvenance = {
    provider: 'OpenStreetMap',
    source_type: 'overpass_osm',
    source_reference: 'https://overpass-api.de/api/interpreter',
    retrieved_at: new Date().toISOString(),
    license: 'Open Data Commons Open Database License (ODbL)',
    access_method: 'PUBLIC_NO_AUTH',
  }

  // Bounding box for Kota Semarang: (south, west, north, east)
  const { minLat, minLng, maxLat, maxLng } = STUDY_AREA_CONFIG.bbox
  const bboxStr = `${minLat},${minLng},${maxLat},${maxLng}`

  // Overpass QL Query for rivers, canals, drains, and critical emergency facilities in Semarang
  const overpassQuery = `
    [out:json][timeout:15];
    (
      node["waterway"~"river|canal|drain"](${bboxStr});
      node["amenity"~"hospital|clinic|fire_station"](${bboxStr});
    );
    out 50;
  `

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      const data = await res.json()
      if (data && data.elements && Array.isArray(data.elements) && data.elements.length > 0) {
        return data.elements.map((el: any) => {
          const tags = el.tags || {}
          let fType: IngestedSpatialFeature['feature_type'] = 'drain'
          if (tags.waterway === 'river') fType = 'river'
          else if (tags.waterway === 'canal') fType = 'canal'
          else if (tags.amenity === 'hospital' || tags.amenity === 'clinic') fType = 'hospital'
          else if (tags.amenity === 'fire_station') fType = 'emergency'

          return {
            id: `osm-${el.id}`,
            osm_id: String(el.id),
            name: tags.name || tags.waterway || tags.amenity || 'Fitur Spasial Semarang',
            feature_type: fType,
            latitude: el.lat,
            longitude: el.lon,
            provenance: {
              ...provenance,
              external_id: String(el.id),
            },
          }
        })
      }
    }
  } catch (err: any) {
    console.warn('Overpass API live fetch timed out or offline:', err?.message || err)
  }

  // Requirement: Do NOT fake or substitute offline API data with hardcoded data. Return empty array if offline.
  return []
}
