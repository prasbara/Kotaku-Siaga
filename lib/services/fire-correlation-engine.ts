// ============================================================
// KotaKu Siaga — Fire Early Detection & Multi-Source Correlation Engine
// Correlates: NASA FIRMS (VIIRS/MODIS) + SiPongi+ + Citizen Reports + CCTV
// Spatial Window: <= 3.0 km | Temporal Window: <= 6 Hours
// Source Independence Enforced · Deterministic Detection Priority
// ============================================================

import type { Report } from '@/types'
import type {
  FireObservation,
  FireInvestigationCase,
  DetectionPriority,
} from '@/types/fire'
import { localFireStore } from './local-fire-store'
import { localReportStore } from './local-report-store'
import { PANTAUSEMAR_CCTV_POINTS } from '@/lib/data/cctv-pantausemar'
import { isActiveFireReport } from './fire-status'

/**
 * Haversine formula to compute great-circle distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function calculateDetectionPriority(
  observation: FireObservation,
  correlatedReports: Report[],
  distanceKm: number
): { priority: DetectionPriority; score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // 1. Source Confidence (VIIRS / MODIS)
  if (observation.confidence === 'high' || (typeof observation.confidence === 'number' && observation.confidence >= 80)) {
    score += 30
    reasons.push('NASA FIRMS high confidence thermal anomaly (+30)')
  } else if (observation.confidence === 'nominal' || (typeof observation.confidence === 'number' && observation.confidence >= 50)) {
    score += 15
    reasons.push('NASA FIRMS nominal confidence (+15)')
  } else {
    score += 5
    reasons.push('NASA FIRMS low confidence (+5)')
  }

  // 2. Freshness
  const ageHours = (Date.now() - new Date(observation.observed_at).getTime()) / (1000 * 60 * 60)
  if (ageHours <= 2) {
    score += 25
    reasons.push(`Fresh observation (${ageHours.toFixed(1)} jam lalu) (+25)`)
  } else if (ageHours <= 6) {
    score += 15
    reasons.push(`Recent observation (${ageHours.toFixed(1)} jam lalu) (+15)`)
  } else if (ageHours <= 24) {
    score += 5
    reasons.push(`Aging observation (${ageHours.toFixed(1)} jam lalu) (+5)`)
  }

  // 3. Fire Radiative Power (FRP)
  if (observation.frp && observation.frp > 20) {
    score += 25
    reasons.push(`High Fire Radiative Power (${observation.frp.toFixed(1)} MW) (+25)`)
  } else if (observation.frp && observation.frp > 10) {
    score += 15
    reasons.push(`Moderate FRP (${observation.frp.toFixed(1)} MW) (+15)`)
  } else if (observation.frp && observation.frp > 0) {
    score += 5
    reasons.push(`Low FRP (${observation.frp.toFixed(1)} MW) (+5)`)
  }

  // 4. Spatial & Temporal Citizen Report Corroboration
  if (correlatedReports.length > 0) {
    score += 30
    reasons.push(`Corroborated by ${correlatedReports.length} citizen report(s) within ${distanceKm.toFixed(1)} km (+30)`)
  }

  // 5. Settlement / Population Density Proximity
  if (observation.proximity_settlement_meters && observation.proximity_settlement_meters <= 1500) {
    score += 10
    reasons.push(`Close to dense settlement (${observation.proximity_settlement_meters} m) (+10)`)
  }

  let priority: DetectionPriority = 'LOW'
  if (score >= 70) priority = 'CRITICAL'
  else if (score >= 50) priority = 'HIGH'
  else if (score >= 30) priority = 'MEDIUM'

  return { priority, score, reasons }
}

export class FireCorrelationEngine {
  private static instance: FireCorrelationEngine

  private constructor() {}

  public static getInstance(): FireCorrelationEngine {
    if (!FireCorrelationEngine.instance) {
      FireCorrelationEngine.instance = new FireCorrelationEngine()
    }
    return FireCorrelationEngine.instance
  }

  /**
   * Run full correlation between satellite observations and citizen fire reports
   */
  public async executeCorrelation(): Promise<{
    processed_observations: number
    generated_cases: FireInvestigationCase[]
  }> {
    const observations = localFireStore.getObservations({ limit: 100 })
    const { data: allReports } = localReportStore.getAll({ limit: 200 })

    // Filter only active, verified/investigating fire reports (strictly exclude rejected/resolved)
    const fireCitizenReports = allReports.filter(isActiveFireReport)

    const generatedCases: FireInvestigationCase[] = []
    const nowIso = new Date().toISOString()

    for (const obs of observations) {
      // Find correlated citizen reports: within 3.0 km and 6 hours
      const obsTime = new Date(obs.observed_at).getTime()
      let nearestDistKm = 999
      const matchedReports: Report[] = []

      for (const report of fireCitizenReports) {
        const repTime = new Date(report.created_at).getTime()
        const timeDiffHours = Math.abs(obsTime - repTime) / (1000 * 60 * 60)

        if (timeDiffHours <= 6) {
          const dist = calculateHaversineDistanceKm(
            obs.latitude,
            obs.longitude,
            report.latitude,
            report.longitude
          )
          if (dist <= 3.0) {
            matchedReports.push(report)
            if (dist < nearestDistKm) nearestDistKm = dist
          }
        }
      }

      // Check nearby CCTV PantauSemar
      const nearbyCctvs = PANTAUSEMAR_CCTV_POINTS.filter((cctv) => {
        const d = calculateHaversineDistanceKm(obs.latitude, obs.longitude, cctv.latitude, cctv.longitude)
        return d <= 2.5
      }).map((c) => c.id)

      const { priority, reasons } = calculateDetectionPriority(
        obs,
        matchedReports,
        nearestDistKm < 999 ? nearestDistKm : 0
      )

      // Check if an investigation case already contains this observation
      const existingCases = localFireStore.getCases()
      const existingCase = existingCases.find((c) =>
        c.signals.some((s) => s.id === obs.id) ||
        (calculateHaversineDistanceKm(c.latitude, c.longitude, obs.latitude, obs.longitude) <= 1.5 && c.status !== 'RESOLVED' && c.status !== 'DISMISSED')
      )

      if (existingCase) {
        // Update existing case
        const hasSig = existingCase.signals.some((s) => s.id === obs.id)
        if (!hasSig) {
          existingCase.signals.push(obs)
          existingCase.timeline.push({
            time: nowIso,
            label: `Sinyal baru ${obs.source} (${obs.satellite}) dikorelasikan ke kasus ini`,
            actor: 'Fire Correlation Engine',
            details: `Confidence: ${obs.confidence}, FRP: ${obs.frp || 0} MW`,
          })
        }
        // Update citizen reports in case
        for (const rep of matchedReports) {
          if (!existingCase.citizen_reports.some((r) => r.id === rep.id)) {
            existingCase.citizen_reports.push(rep)
            existingCase.timeline.push({
              time: nowIso,
              label: `Laporan warga #${rep.report_code || rep.id.slice(0, 8)} dikorelasikan ke kasus ini`,
              actor: 'Fire Correlation Engine',
              details: `Lokasi: ${rep.address || rep.district_name}`,
            })
          }
        }
        existingCase.detection_priority = priority
        existingCase.updated_at = nowIso
        localFireStore.saveCase(existingCase)
        generatedCases.push(existingCase)
      } else {
        // Create new investigation case
        const caseCode = `CASE-FIRE-${Date.now().toString().slice(-6)}`
        const newCase: FireInvestigationCase = {
          id: `case-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          case_code: caseCode,
          created_at: obs.observed_at || nowIso,
          updated_at: nowIso,
          district_name: obs.district_name || 'Kota Semarang',
          latitude: obs.latitude,
          longitude: obs.longitude,
          detection_priority: priority,
          status: matchedReports.length > 0 ? 'CORRELATED' : 'NEW',
          confidence_level: obs.confidence === 'high' ? 'HIGH' : obs.confidence === 'nominal' ? 'MODERATE' : 'LIMITED',
          signals: [obs],
          citizen_reports: matchedReports,
          related_cctv_ids: nearbyCctvs,
          correlation_reasons: reasons,
          timeline: [
            {
              time: obs.observed_at,
              label: `Sinyal termal satelit terdeteksi oleh ${obs.source} (${obs.satellite})`,
              actor: obs.source,
              details: `Koordinat: [${obs.latitude.toFixed(4)}, ${obs.longitude.toFixed(4)}]`,
            },
            {
              time: obs.retrieved_at,
              label: 'Data telemetri berhasil di-ingest ke sistem KotaKu Siaga',
              actor: 'Data Ingestion Engine',
            },
            ...(matchedReports.length > 0
              ? [
                  {
                    time: nowIso,
                    label: `Korelasi spasial-temporal terdeteksi dengan ${matchedReports.length} laporan warga`,
                    actor: 'Fire Correlation Engine',
                    details: reasons.join(' · '),
                  },
                ]
              : []),
          ],
        }

        localFireStore.saveCase(newCase)
        generatedCases.push(newCase)

        // Update observation status
        if (matchedReports.length > 0) {
          localFireStore.updateObservationStatus(obs.id, 'CORRELATED')
        }
      }
    }

    return {
      processed_observations: observations.length,
      generated_cases: generatedCases,
    }
  }
}

export const fireCorrelationEngine = FireCorrelationEngine.getInstance()
