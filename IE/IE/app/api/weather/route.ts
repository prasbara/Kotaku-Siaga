import { NextResponse } from 'next/server'

// WMO Weather interpretation codes (WMO Code 4677)
const WMO_WEATHER_MAP: Record<number, { condition: string; risk: string }> = {
  0: { condition: 'Langit Cerah', risk: 'Aman' },
  1: { condition: 'Sebagian Besar Cerah', risk: 'Aman' },
  2: { condition: 'Cerah Berawan', risk: 'Aman' },
  3: { condition: 'Berawan Tebal', risk: 'Waspada' },
  45: { condition: 'Berkabut', risk: 'Aman' },
  48: { condition: 'Kabut Tebal', risk: 'Waspada' },
  51: { condition: 'Gerimis Ringan', risk: 'Waspada Rendah' },
  53: { condition: 'Gerimis Sedang', risk: 'Waspada' },
  55: { condition: 'Gerimis Lebat', risk: 'Waspada Sedang' },
  61: { condition: 'Hujan Ringan', risk: 'Waspada Sedang' },
  63: { condition: 'Hujan Sedang', risk: 'Siaga' },
  65: { condition: 'Hujan Lebat', risk: 'Kritis / Awas' },
  80: { condition: 'Hujan Rintik Lokal', risk: 'Waspada' },
  81: { condition: 'Hujan Deras Lokal', risk: 'Siaga' },
  82: { condition: 'Hujan Badai Ekstrem', risk: 'Kritis / Awas' },
  95: { condition: 'Badai Petir', risk: 'Kritis / Awas' },
  96: { condition: 'Badai Petir & Hujan Es', risk: 'Kritis / Awas' },
}

export interface RealWeatherData {
  success: boolean
  status: 'AVAILABLE' | 'UNAVAILABLE'
  temperature_c: number | null
  humidity_percent: number | null
  precipitation_mm: number | null
  rain_mm: number | null
  wind_speed_kmh: number | null
  wind_direction_deg: number | null
  weather_code: number | null
  weather_condition: string
  flood_risk_level: string
  source: string
  coordinates: {
    latitude: number
    longitude: number
    location_name: string
  }
  retrieved_at: string
  retrieved_at_wib: string
  error?: string
}

// GET /api/weather — Real live meteorological telemetry for Kota Semarang
export async function GET() {
  const lat = -6.9667
  const lon = 110.4167
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia%2FJakarta`

  const now = new Date()
  const timeWib = now.toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }) + ' WIB'

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    const current = data.current || {}
    const wmo = WMO_WEATHER_MAP[current.weather_code] || {
      condition: 'Kondisi Termonitor',
      risk: 'Normal',
    }

    const weatherPayload: RealWeatherData = {
      success: true,
      status: 'AVAILABLE',
      temperature_c: current.temperature_2m ?? null,
      humidity_percent: current.relative_humidity_2m ?? null,
      precipitation_mm: current.precipitation ?? 0,
      rain_mm: current.rain ?? 0,
      wind_speed_kmh: current.wind_speed_10m ?? null,
      wind_direction_deg: current.wind_direction_10m ?? null,
      weather_code: current.weather_code ?? null,
      weather_condition: wmo.condition,
      flood_risk_level: wmo.risk,
      source: 'Open-Meteo & WMO Meteorological Observation (Kota Semarang)',
      coordinates: {
        latitude: lat,
        longitude: lon,
        location_name: 'Pusat Pemantauan Iklim Kota Semarang',
      },
      retrieved_at: now.toISOString(),
      retrieved_at_wib: timeWib,
    }

    return NextResponse.json(weatherPayload)
  } catch (err: any) {
    console.error('Telemetri cuaca gagal diambil dari sumber:', err?.message || err)
    
    // HONEST ERROR STATE — Strictly ZERO fake numbers or Math.random
    const unavailablePayload: RealWeatherData = {
      success: false,
      status: 'UNAVAILABLE',
      temperature_c: null,
      humidity_percent: null,
      precipitation_mm: null,
      rain_mm: null,
      wind_speed_kmh: null,
      wind_direction_deg: null,
      weather_code: null,
      weather_condition: 'DATA UNAVAILABLE',
      flood_risk_level: 'STATUS TIDAK TERSEDIA',
      source: 'Open-Meteo & WMO Meteorological Observation',
      coordinates: {
        latitude: lat,
        longitude: lon,
        location_name: 'Pusat Pemantauan Iklim Kota Semarang',
      },
      retrieved_at: now.toISOString(),
      retrieved_at_wib: timeWib,
      error: 'Sumber data telemetri cuaca tidak dapat diakses saat ini. Periksa koneksi jaringan.',
    }

    return NextResponse.json(unavailablePayload, { status: 503 })
  }
}
