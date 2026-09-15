// ============================================================
// KotaKu Siaga — Weather Corroboration Engine
// Cross-references reports with live meteorological observations in Semarang
// ============================================================

import type { WeatherCorroborationResult } from './types'

export async function checkWeatherCorroboration(
  category: string,
  latitude?: number,
  longitude?: number
): Promise<WeatherCorroborationResult> {
  const lat = latitude || -6.9667
  const lon = longitude || 110.4167

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=Asia%2FJakarta`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'KotaKuSiaga-CivicRadar/1.1' },
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      return { weatherEvidence: 'unknown', weatherSnapshot: null }
    }

    const data = await res.json()
    const current = data.current
    if (!current) {
      return { weatherEvidence: 'unknown', weatherSnapshot: null }
    }

    const precipitationMm = current.precipitation ?? 0
    const rainMm = current.rain ?? 0
    const tempC = current.temperature_2m ?? 30
    const windKmh = current.wind_speed_10m ?? 10
    const weatherCode = current.weather_code ?? 0

    let condition = 'Cerah'
    if (weatherCode >= 80) condition = 'Hujan Deras / Badai'
    else if (weatherCode >= 60) condition = 'Hujan'
    else if (weatherCode >= 50) condition = 'Gerimis'
    else if (weatherCode >= 3) condition = 'Berawan Tebal'

    let floodRisk = 'Rendah'
    if (precipitationMm >= 20 || weatherCode >= 80) floodRisk = 'Kritis / Awas'
    else if (precipitationMm >= 5 || weatherCode >= 63) floodRisk = 'Siaga'
    else if (precipitationMm > 0 || weatherCode >= 51) floodRisk = 'Waspada'

    // Determine if weather corroborates category
    const isWaterRelated = ['banjir', 'genangan', 'drainase_tersumbat'].includes(category.toLowerCase())
    let weatherEvidence: 'positive' | 'neutral' | 'unknown' = 'neutral'

    if (isWaterRelated && (precipitationMm > 0 || weatherCode >= 51)) {
      weatherEvidence = 'positive'
    } else if (category.toLowerCase() === 'pohon_tumbang' && windKmh >= 25) {
      weatherEvidence = 'positive'
    }

    const now = new Date()
    const timeWib =
      now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' WIB'

    return {
      weatherEvidence,
      weatherSnapshot: {
        condition,
        precipitationMm,
        temperatureC: tempC,
        windSpeedKmh: windKmh,
        floodRiskLevel: floodRisk,
        retrievedAtWib: timeWib,
      },
    }
  } catch {
    clearTimeout(timeoutId)
    // External service down or timeout: gracefully mark as unknown without penalty
    return {
      weatherEvidence: 'unknown',
      weatherSnapshot: null,
    }
  }
}
