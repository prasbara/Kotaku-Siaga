// ============================================================
// KotaKu Siaga — Public Data Ingestion Types
// Strict Data Provenance & Open Data Standards
// ============================================================

export type DataSourceProvider = 'BNPB' | 'BMKG' | 'OpenStreetMap' | 'BPS_Semarang' | 'Citizen'

export type SourceType = 'official_open_data' | 'public_api' | 'overpass_osm' | 'citizen_report'

export interface DataProvenance {
  provider: DataSourceProvider
  source_type: SourceType
  source_reference: string
  retrieved_at: string
  external_id?: string
  license: string
  access_method: 'PUBLIC_NO_AUTH'
}

export interface IngestedWeatherPoint {
  id: string
  area_id: string
  area_name: string
  temperature_c: number
  humidity_percent: number
  rain_probability_percent: number
  weather_condition: string
  forecast_time: string
  provenance: DataProvenance
}

export interface IngestedSpatialFeature {
  id: string
  osm_id: string
  name: string
  feature_type: 'river' | 'canal' | 'drain' | 'dike' | 'hospital' | 'emergency' | 'road'
  latitude: number
  longitude: number
  area_id?: string
  area_name?: string
  provenance: DataProvenance
}

export interface IngestedDisasterEvent {
  id: string
  external_id: string
  event_type: 'banjir' | 'banjir_rob' | 'longsor' | 'cuaca_ekstrem'
  event_date: string
  location_name: string
  latitude: number
  longitude: number
  affected_people: number
  fatalities: number
  damaged_houses: number
  description: string
  provenance: DataProvenance
}

export interface AdministrativeArea {
  id: string
  slug: string
  name: string
  city: string
  province: string
  center_lat: number
  center_lng: number
  population: number
  area_km2: number
  population_density: number // jiwa per km2
  elevation_avg_m: number
  flood_vulnerability_index: number // 0-100
  provenance: DataProvenance
}
