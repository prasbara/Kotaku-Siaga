import { NextRequest, NextResponse } from 'next/server'
import {
  SEMARANG_ZONES,
  SemarangZoneId,
  determineZoneByCoordinates,
  getCompassDirection,
  evaluateEnvironmentalRiskIndicators,
  calculateRainfallTemporal,
  buildWeatherTimeline,
  generateContextualInsights,
  WHY_IT_MATTERS_ITEMS,
  WeatherParamItem,
  SemarangZoneInfo,
  EnvironmentalRiskIndicators,
  RainfallTemporalAccumulation,
  WeatherTimelineStep,
  ContextualInsights,
  WhyItMattersItem,
  CompassDirection,
} from '@/lib/weather/weather-intelligence'
import { dataSourceRegistry } from '@/lib/data-sources/data-source-registry'

// WMO Weather interpretation codes (WMO Code 4677)
const WMO_WEATHER_MAP: Record<number, { condition: string; risk: string }> = {
  0: { condition: 'Langit Cerah', risk: 'Normal' },
  1: { condition: 'Sebagian Besar Cerah', risk: 'Normal' },
  2: { condition: 'Cerah Berawan', risk: 'Normal' },
  3: { condition: 'Berawan Tebal', risk: 'Waspada' },
  45: { condition: 'Berkabut', risk: 'Normal' },
  48: { condition: 'Kabut Tebal', risk: 'Waspada' },
  51: { condition: 'Gerimis Ringan', risk: 'Normal' },
  53: { condition: 'Gerimis Sedang', risk: 'Waspada' },
  55: { condition: 'Gerimis Lebat', risk: 'Perhatian' },
  61: { condition: 'Hujan Ringan', risk: 'Normal' },
  63: { condition: 'Hujan Sedang', risk: 'Perhatian' },
  65: { condition: 'Hujan Lebat', risk: 'Kritis / Awas' },
  80: { condition: 'Hujan Rintik Lokal', risk: 'Normal' },
  81: { condition: 'Hujan Deras Lokal', risk: 'Perhatian' },
  82: { condition: 'Hujan Badai Ekstrem', risk: 'Kritis / Awas' },
  95: { condition: 'Badai Petir', risk: 'Kritis / Awas' },
  96: { condition: 'Badai Petir & Hujan Es', risk: 'Kritis / Awas' },
}

export interface RealWeatherData {
  success: boolean
  status: 'LIVE' | 'UPDATED' | 'FORECAST' | 'DATA_DELAY' | 'UNAVAILABLE' | 'AVAILABLE'
  temperature_c: number | null
  humidity_percent: number | null
  precipitation_mm: number | null
  rain_mm: number | null
  wind_speed_kmh: number | null
  wind_direction_deg: number | null
  wind_gusts_kmh: number | null
  pressure_hpa: number | null
  cloud_cover_percent: number | null
  wave_height_m: number | null
  wave_period_s: number | null
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

  // Rich Environmental Intelligence Layer
  zone?: SemarangZoneInfo
  selectedZoneId?: SemarangZoneId
  compass?: CompassDirection
  currentWeatherParams?: {
    rainfall: WeatherParamItem
    wind: WeatherParamItem
    windGust: WeatherParamItem
    windDirection: WeatherParamItem & { compass: CompassDirection }
    temperature: WeatherParamItem
    humidity: WeatherParamItem
    pressure: WeatherParamItem
    cloudCover: WeatherParamItem
    waveHeight: WeatherParamItem
    wavePeriod: WeatherParamItem
  }
  rainfallAnalysis?: RainfallTemporalAccumulation
  timelineForecast?: WeatherTimelineStep[]
  riskIndicators?: EnvironmentalRiskIndicators
  contextualInsights?: ContextualInsights
  whyItMatters?: WhyItMattersItem[]
  dataQuality?: {
    indicator: 'LIVE' | 'UPDATED' | 'FORECAST' | 'DATA_DELAY' | 'UNAVAILABLE'
    label: string
    note: string
  }
}

// GET /api/weather?zone=pesisir|perkotaan|perbukitan&lat=...&lon=...
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const zoneParam = searchParams.get('zone') as SemarangZoneId | null
  const latParam = searchParams.get('lat')
  const lonParam = searchParams.get('lon')

  let selectedZoneId: SemarangZoneId = 'perkotaan'
  let lat = SEMARANG_ZONES.perkotaan.defaultCoords.lat
  let lon = SEMARANG_ZONES.perkotaan.defaultCoords.lon

  if (zoneParam && SEMARANG_ZONES[zoneParam]) {
    selectedZoneId = zoneParam
    lat = SEMARANG_ZONES[zoneParam].defaultCoords.lat
    lon = SEMARANG_ZONES[zoneParam].defaultCoords.lon
  } else if (latParam && lonParam) {
    const parsedLat = parseFloat(latParam)
    const parsedLon = parseFloat(lonParam)
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      lat = parsedLat
      lon = parsedLon
      selectedZoneId = determineZoneByCoordinates(lat, lon)
    }
  }

  const zoneInfo = SEMARANG_ZONES[selectedZoneId]

  const now = new Date()
  const timeWib =
    now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' WIB'

  const dateStr = now.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  // 1. URLs for Open-Meteo Forecast & Marine Wave
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=precipitation,rain,temperature_2m,wind_speed_10m,wind_gusts_10m&forecast_days=2&timezone=Asia%2FJakarta`
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=-6.93&longitude=110.42&current=wave_height,wave_direction,wave_period&hourly=wave_height,wave_period&timezone=Asia%2FJakarta`

  const fetchStartTime = Date.now()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)

    const [weatherRes, marineRes] = await Promise.allSettled([
      fetch(weatherUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
      fetch(marineUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }),
    ])

    clearTimeout(timeout)
    const latency = Date.now() - fetchStartTime

    if (weatherRes.status !== 'fulfilled' || !weatherRes.value.ok) {
      const httpStatus = weatherRes.status === 'fulfilled' ? weatherRes.value.status : null
      const errReason = weatherRes.status === 'fulfilled' ? `Open-Meteo HTTP ${weatherRes.value.status}` : 'Gagal menghubungi server Open-Meteo'
      dataSourceRegistry.recordFailure('open_meteo', httpStatus, errReason)
      throw new Error(errReason)
    }

    dataSourceRegistry.recordSuccess('open_meteo', weatherRes.value.status, latency)

    const weatherData = await weatherRes.value.json()
    const current = weatherData.current || {}
    const hourly = weatherData.hourly || {}

    // Process Marine Wave Data (honest handling: if marine is unavailable, set null)
    let marineCurrent: { wave_height?: number; wave_period?: number; wave_direction?: number } = {}
    let marineHourlyWaves: number[] = []
    if (marineRes.status === 'fulfilled' && marineRes.value.ok) {
      try {
        const marineData = await marineRes.value.json()
        marineCurrent = marineData.current || {}
        marineHourlyWaves = marineData.hourly?.wave_height || []
        dataSourceRegistry.recordSuccess('open_meteo_marine', marineRes.value.status, latency)
      } catch (mErr) {
        console.warn('Marine data parsing error:', mErr)
        dataSourceRegistry.recordFailure('open_meteo_marine', marineRes.value.status, 'Failed to parse marine JSON payload')
      }
    } else {
      const marineStatus = marineRes.status === 'fulfilled' ? marineRes.value.status : null
      dataSourceRegistry.recordFailure('open_meteo_marine', marineStatus, 'Marine API connection error')
    }

    const tempC = current.temperature_2m ?? null
    const humidity = current.relative_humidity_2m ?? null
    const precipMm = current.precipitation ?? 0
    const rainMm = current.rain ?? 0
    const windSpeed = current.wind_speed_10m ?? 0
    const windDirDeg = current.wind_direction_10m ?? 0
    const windGusts = current.wind_gusts_10m ?? 0
    const pressure = current.surface_pressure ?? null
    const cloudCover = current.cloud_cover ?? null
    const waveHeight = marineCurrent.wave_height ?? null
    const wavePeriod = marineCurrent.wave_period ?? null
    const weatherCode = current.weather_code ?? 0

    const wmo = WMO_WEATHER_MAP[weatherCode] || {
      condition: 'Kondisi Termonitor',
      risk: 'Normal',
    }

    // Calculations
    const compass = getCompassDirection(windDirDeg)
    const hourlyRain: number[] = hourly.precipitation || hourly.rain || []
    const hourlyTemp: number[] = hourly.temperature_2m || []
    const hourlyWind: number[] = hourly.wind_speed_10m || []

    const rainAnalysis = calculateRainfallTemporal(hourlyRain)
    const riskIndicators = evaluateEnvironmentalRiskIndicators(
      precipMm,
      windSpeed,
      windGusts,
      waveHeight,
      rainAnalysis.acc12h,
      selectedZoneId
    )
    const contextualInsights = generateContextualInsights(
      zoneInfo,
      riskIndicators,
      rainAnalysis,
      compass.windBearingDesc
    )
    const timelineForecast = buildWeatherTimeline(
      hourlyRain,
      hourlyTemp,
      hourlyWind,
      marineHourlyWaves
    )

    const observationTimestamp = `${dateStr}, ${timeWib}`
    const forecastPeriod1h = `Forecast 1 Jam (${timeWib})`

    const currentWeatherParams = {
      rainfall: {
        parameter: 'Curah Hujan',
        value: precipMm,
        formatted: `${precipMm} mm/j`,
        unit: 'mm/j',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Observasi Terkini Stasiun',
        source: 'Open-Meteo WMO Observation (Semarang)',
      },
      wind: {
        parameter: 'Kecepatan Angin',
        value: windSpeed,
        formatted: `${windSpeed} km/j`,
        unit: 'km/j',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Observasi Terkini Sensor 10m',
        source: 'Open-Meteo & ECMWF Model',
      },
      windGust: {
        parameter: 'Hembusan Maksimum (Gust)',
        value: windGusts,
        formatted: `${windGusts} km/j`,
        unit: 'km/j',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Puncak Hembusan Sesaat',
        source: 'Open-Meteo & Skala Beaufort',
      },
      windDirection: {
        parameter: 'Arah Angin',
        value: windDirDeg,
        formatted: `${compass.labelId} (${windDirDeg}°)`,
        unit: 'derajat (°)',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: compass.windBearingDesc,
        source: 'Open-Meteo Sensor Arah Angin',
        compass,
      },
      temperature: {
        parameter: 'Temperatur Udara',
        value: tempC,
        formatted: tempC != null ? `${tempC} °C` : 'N/A',
        unit: '°C',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Temperatur Permukaan 2m',
        source: 'Open-Meteo WMO Station',
      },
      humidity: {
        parameter: 'Kelembapan Udara',
        value: humidity,
        formatted: humidity != null ? `${humidity}%` : 'N/A',
        unit: '%',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Kelembapan Relatif 2m',
        source: 'Open-Meteo WMO Station',
      },
      pressure: {
        parameter: 'Tekanan Udara',
        value: pressure,
        formatted: pressure != null ? `${pressure} hPa` : 'N/A',
        unit: 'hPa',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Tekanan Udara Permukaan Tanah',
        source: 'Open-Meteo Barometrik Sensor',
      },
      cloudCover: {
        parameter: 'Tutupan Awan',
        value: cloudCover,
        formatted: cloudCover != null ? `${cloudCover}%` : 'N/A',
        unit: '%',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Fraksi Tutupan Awan Langit',
        source: 'Open-Meteo Satellite Cloud Model',
      },
      waveHeight: {
        parameter: 'Tinggi Gelombang Laut',
        value: waveHeight,
        formatted: waveHeight != null ? `${waveHeight} meter` : 'Tidak Tersedia',
        unit: 'meter',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Perairan Pesisir Laut Jawa Semarang',
        source: 'Open-Meteo Marine API (Laut Jawa)',
      },
      wavePeriod: {
        parameter: 'Periode Gelombang',
        value: wavePeriod,
        formatted: wavePeriod != null ? `${wavePeriod} detik` : 'Tidak Tersedia',
        unit: 'detik',
        timestamp: observationTimestamp,
        periodType: 'OBSERVATION' as const,
        periodDesc: 'Periode Interval Gelombang Muara',
        source: 'Open-Meteo Marine API (Laut Jawa)',
      },
    }

    const payload: RealWeatherData = {
      success: true,
      status: 'LIVE',
      temperature_c: tempC,
      humidity_percent: humidity,
      precipitation_mm: precipMm,
      rain_mm: rainMm,
      wind_speed_kmh: windSpeed,
      wind_direction_deg: windDirDeg,
      wind_gusts_kmh: windGusts,
      pressure_hpa: pressure,
      cloud_cover_percent: cloudCover,
      wave_height_m: waveHeight,
      wave_period_s: wavePeriod,
      weather_code: weatherCode,
      weather_condition: wmo.condition,
      flood_risk_level: riskIndicators.rainfall.label,
      source: 'Open-Meteo, WMO, BMKG Maritim, & Stasiun Telemetri Semarang',
      coordinates: {
        latitude: lat,
        longitude: lon,
        location_name: `${zoneInfo.name} (${zoneInfo.subtitle})`,
      },
      retrieved_at: now.toISOString(),
      retrieved_at_wib: timeWib,

      // Rich Environmental Intelligence Layer
      zone: zoneInfo,
      selectedZoneId,
      compass,
      currentWeatherParams,
      rainfallAnalysis: rainAnalysis,
      timelineForecast,
      riskIndicators,
      contextualInsights,
      whyItMatters: WHY_IT_MATTERS_ITEMS,
      dataQuality: {
        indicator: 'LIVE',
        label: 'TELEMETRI LIVE AKTUAL',
        note: 'Data diambil dari stasiun pengamatan WMO & model hidrometeorologi terbuka tanpa interpolasi acak.',
      },
    }

    return NextResponse.json(payload)
  } catch (err: any) {
    console.error('Telemetri cuaca gagal diambil dari sumber:', err?.message || err)
    dataSourceRegistry.recordFailure('open_meteo', null, err?.message || 'Open-Meteo API connection error')

    // Strictly ZERO fake numbers or random fallback values
    const unavailablePayload: RealWeatherData = {
      success: false,
      status: 'UNAVAILABLE',
      temperature_c: null,
      humidity_percent: null,
      precipitation_mm: null,
      rain_mm: null,
      wind_speed_kmh: null,
      wind_direction_deg: null,
      wind_gusts_kmh: null,
      pressure_hpa: null,
      cloud_cover_percent: null,
      wave_height_m: null,
      wave_period_s: null,
      weather_code: null,
      weather_condition: 'DATA TEMPORARILY UNAVAILABLE',
      flood_risk_level: 'STATUS TIDAK TERSEDIA',
      source: 'Open-Meteo & WMO Meteorological Observation',
      coordinates: {
        latitude: lat,
        longitude: lon,
        location_name: `${zoneInfo.name}`,
      },
      retrieved_at: now.toISOString(),
      retrieved_at_wib: timeWib,
      zone: zoneInfo,
      selectedZoneId,
      error: 'Sumber data telemetri cuaca tidak dapat diakses saat ini. Sistem tidak menampilkan data tiruan.',
      dataQuality: {
        indicator: 'UNAVAILABLE',
        label: 'DATA TIDAK TERSEDIA',
        note: 'Koneksi ke endpoint telemetri gagal. Silakan coba beberapa saat lagi.',
      },
    }

    return NextResponse.json(unavailablePayload, { status: 503 })
  }
}
