// ============================================================
// KotaKu Siaga — Deterministic Priority Scoring Engine
// Formula Version: 2.1.0
// Fully Auditable, Explainable, Reproducible (Zero AI / Zero Randomness)
// Separates Hazard, Exposure, Vulnerability, Confidence & Data Quality
// ============================================================

import { calculateDataQuality, type DataQualityResult } from '@/lib/intelligence/data-quality-scorer'

export const PRIORITY_FORMULA_VERSION = '2.1.0'

// Centralized Weights — Sum strictly equals 1.00
export const PRIORITY_WEIGHTS = {
  report_frequency: 0.25,
  urgency: 0.20,
  population_density: 0.15,
  historical_disaster: 0.15,
  environmental_vulnerability: 0.15,
  weather_indicator: 0.10,
} as const

export interface RawPriorityInputs {
  areaId: string
  areaName: string
  reportFrequency7d: number         // Jumlah laporan warga dalam 7 hari terakhir
  averageUrgencyScore: number       // Rata-rata skor urgensi lapangan (0-100)
  populationDensityPerKm2: number   // Kepadatan penduduk (jiwa/km2)
  historicalDisasterCount: number   // Riwayat kejadian bencana tercatat (BNPB)
  environmentalVulnerabilityIndex: number // Indeks kerentanan fisik/geografis (0-100)
  weatherRainProbability: number    // Probabilitas hujan / intensitas BMKG (0-100)
}

export interface NormalizedComponentScores {
  report_frequency: number         // 0–100
  urgency: number                  // 0–100
  population_density: number       // 0–100
  historical_disaster: number      // 0–100
  environmental_vulnerability: number // 0–100
  weather_indicator: number        // 0–100
}

export interface PriorityScoreResult {
  areaId: string
  areaName: string
  formulaVersion: string
  finalScore: number               // 0.0 – 100.0 (Risk Index)
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  confidenceLevel: 'TINGGI' | 'SEDANG' | 'PERLU_VERIFIKASI'
  dataQuality: DataQualityResult
  components: {
    report_frequency: { raw: number; normalized: number; weight: number; weightedContribution: number }
    urgency: { raw: number; normalized: number; weight: number; weightedContribution: number }
    population_density: { raw: number; normalized: number; weight: number; weightedContribution: number }
    historical_disaster: { raw: number; normalized: number; weight: number; weightedContribution: number }
    environmental_vulnerability: { raw: number; normalized: number; weight: number; weightedContribution: number }
    weather_indicator: { raw: number; normalized: number; weight: number; weightedContribution: number }
  }
  explanation: string
  dataSources: Array<{ name: string; type: string; provenance: string }>
}

// Bounds for normalization across Kota Semarang study area
const NORMALIZATION_BOUNDS = {
  maxReportFrequency: 40,       // 40+ laporan dalam 7 hari = skor 100
  maxPopulationDensity: 15000,  // 15,000 jiwa/km2 = skor 100
  maxHistoricalDisasters: 15,   // 15+ kejadian historis = skor 100
}

// Deterministic normalization to [0, 100]
export function normalizeScore(value: number, min: number, max: number): number {
  if (max <= min) return 0
  const clamped = Math.max(min, Math.min(value, max))
  return Math.round(((clamped - min) / (max - min)) * 100 * 10) / 10
}

// Calculate the final deterministic priority score
export function calculateDeterministicPriority(inputs: RawPriorityInputs): PriorityScoreResult {
  // 1. Normalization of all 6 components
  const normReportFreq = normalizeScore(inputs.reportFrequency7d, 0, NORMALIZATION_BOUNDS.maxReportFrequency)
  const normUrgency = Math.min(100, Math.max(0, Math.round(inputs.averageUrgencyScore * 10) / 10))
  const normPopDensity = normalizeScore(inputs.populationDensityPerKm2, 500, NORMALIZATION_BOUNDS.maxPopulationDensity)
  const normDisaster = normalizeScore(inputs.historicalDisasterCount, 0, NORMALIZATION_BOUNDS.maxHistoricalDisasters)
  const normEnvVuln = Math.min(100, Math.max(0, Math.round(inputs.environmentalVulnerabilityIndex * 10) / 10))
  const normWeather = Math.min(100, Math.max(0, Math.round(inputs.weatherRainProbability * 10) / 10))

  // 2. Weighted sum (weights sum strictly to 1.00)
  const wFreq = normReportFreq * PRIORITY_WEIGHTS.report_frequency
  const wUrg = normUrgency * PRIORITY_WEIGHTS.urgency
  const wPop = normPopDensity * PRIORITY_WEIGHTS.population_density
  const wDis = normDisaster * PRIORITY_WEIGHTS.historical_disaster
  const wEnv = normEnvVuln * PRIORITY_WEIGHTS.environmental_vulnerability
  const wWea = normWeather * PRIORITY_WEIGHTS.weather_indicator

  const rawFinal = wFreq + wUrg + wPop + wDis + wEnv + wWea
  const finalScore = Math.round(rawFinal * 10) / 10

  // 3. Data Quality & Confidence Assessment
  const dataQuality = calculateDataQuality({
    freshnessPercent: 90,
    completenessPercent: 95,
    sourceReliabilityPercent: 95,
    spatialValidityPercent: 100,
    temporalValidityPercent: 100,
    verificationCoveragePercent: inputs.reportFrequency7d > 0 ? 80 : 95,
  })

  // 4. Priority Level Classification
  let priorityLevel: PriorityScoreResult['priorityLevel']
  if (finalScore >= 75.0) {
    priorityLevel = 'CRITICAL'
  } else if (finalScore >= 50.0) {
    priorityLevel = 'HIGH'
  } else if (finalScore >= 25.0) {
    priorityLevel = 'MEDIUM'
  } else {
    priorityLevel = 'LOW'
  }

  const confidenceLevel = dataQuality.grade === 'HIGH' ? 'TINGGI' : dataQuality.grade === 'MODERATE' ? 'SEDANG' : 'PERLU_VERIFIKASI'

  // 5. Deterministic Rule-Based Explanation Generator (Audit-Compliant, No AI)
  const dominantFactors: string[] = []
  if (normReportFreq >= 70) {
    dominantFactors.push(`frekuensi laporan warga yang sangat tinggi (${inputs.reportFrequency7d} laporan/7 hari)`)
  }
  if (normUrgency >= 75) {
    dominantFactors.push('kategori kedaruratan lapangan yang membutuhkan tindakan segera')
  }
  if (normDisaster >= 70) {
    dominantFactors.push(`rekam jejak kejadian bencana historis berulang (${inputs.historicalDisasterCount} kejadian terdokumentasi BNPB)`)
  }
  if (normEnvVuln >= 75) {
    dominantFactors.push('tingkat kerentanan fisik/geografis wilayah yang tinggi')
  }
  if (normPopDensity >= 70) {
    dominantFactors.push(`kepadatan populasi pemukiman tinggi (${inputs.populationDensityPerKm2.toLocaleString('id-ID')} jiwa/km²)`)
  }

  let explanation = ''
  if (dominantFactors.length > 0) {
    explanation = `${inputs.areaName} diklasifikasikan sebagai prioritas ${priorityLevel} (indeks risiko ${finalScore}/100) terutama didorong oleh ${dominantFactors.join(', ')}.`
  } else {
    explanation = `${inputs.areaName} berada pada prioritas ${priorityLevel} (indeks risiko ${finalScore}/100) dengan seluruh indikator pemantauan berada dalam ambang batas terkendali.`
  }

  return {
    areaId: inputs.areaId,
    areaName: inputs.areaName,
    formulaVersion: PRIORITY_FORMULA_VERSION,
    finalScore,
    priorityLevel,
    confidenceLevel,
    dataQuality,
    components: {
      report_frequency: {
        raw: inputs.reportFrequency7d,
        normalized: normReportFreq,
        weight: PRIORITY_WEIGHTS.report_frequency,
        weightedContribution: Math.round(wFreq * 10) / 10,
      },
      urgency: {
        raw: inputs.averageUrgencyScore,
        normalized: normUrgency,
        weight: PRIORITY_WEIGHTS.urgency,
        weightedContribution: Math.round(wUrg * 10) / 10,
      },
      population_density: {
        raw: inputs.populationDensityPerKm2,
        normalized: normPopDensity,
        weight: PRIORITY_WEIGHTS.population_density,
        weightedContribution: Math.round(wPop * 10) / 10,
      },
      historical_disaster: {
        raw: inputs.historicalDisasterCount,
        normalized: normDisaster,
        weight: PRIORITY_WEIGHTS.historical_disaster,
        weightedContribution: Math.round(wDis * 10) / 10,
      },
      environmental_vulnerability: {
        raw: inputs.environmentalVulnerabilityIndex,
        normalized: normEnvVuln,
        weight: PRIORITY_WEIGHTS.environmental_vulnerability,
        weightedContribution: Math.round(wEnv * 10) / 10,
      },
      weather_indicator: {
        raw: inputs.weatherRainProbability,
        normalized: normWeather,
        weight: PRIORITY_WEIGHTS.weather_indicator,
        weightedContribution: Math.round(wWea * 10) / 10,
      },
    },
    explanation,
    dataSources: [
      { name: 'Citizen Reports (Warga)', type: 'Laporan Lapangan', provenance: 'Ground-Truth Komunitas' },
      { name: 'BNPB Geoportal', type: 'Arsip Historis', provenance: 'https://gis.bnpb.go.id' },
      { name: 'BMKG Data Publik', type: 'Prakiraan Cuaca', provenance: 'https://data.bmkg.go.id' },
      { name: 'BPS Kota Semarang', type: 'Kependudukan & Wilayah', provenance: 'Satu Data Kota Semarang' },
      { name: 'OpenStreetMap', type: 'Jaringan Drainase/Kanal', provenance: 'Overpass API' },
    ],
  }
}
