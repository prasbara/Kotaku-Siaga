/**
 * ============================================================
 * KotaKu Siaga - Multi-Report Corroboration & Incident Clustering Engine
 * ============================================================
 * Handles:
 * 1. Geographic & Temporal Incident Clustering (Radius <= 250m, Window <= 30min)
 * 2. Independent Reporter Deduplication Logic (10 submissions from same email/phone/device != 10 people)
 * 3. Abuse Scoring (0-100)
 * 4. Automatic Corroboration Promotion (CORROBORATED / CONFIRMED_BY_CORROBORATION)
 */

import { calculateDistanceMeters } from './geo-validator'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

export const CLUSTER_RADIUS_METERS = 250
export const CLUSTER_TIME_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

export interface ReportIdentityInput {
  reporterName?: string | null
  reporterEmail?: string | null
  reporterPhone?: string | null
  clientSessionId?: string | null
  clientIpHash?: string | null
  photoHash?: string | null
  photoUrl?: string | null
  category: string
  latitude: number
  longitude: number
  reportedAt?: string
  districtName?: string | null
}

export interface AbuseScoreInput {
  honeypotTriggered?: boolean
  hasPhoto?: boolean
  photoTimeMismatch?: boolean
  isOutsideSemarang?: boolean
  duplicatePhotoCount?: number
  isRapidSubmission?: boolean
  emailVerified?: boolean
}

export interface IncidentCluster {
  id: string
  cluster_code: string
  category: string
  district_name?: string | null
  latitude: number
  longitude: number
  radius_m: number
  report_count: number
  independent_reporter_count: number
  corroboration_score: number
  confidence_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONFIRMED'
  status:
    | 'NEW'
    | 'CORROBORATED'
    | 'CONFIRMED_BY_CORROBORATION'
    | 'ADMIN_CONFIRMED'
    | 'FALSE_REPORT'
    | 'REQUIRES_REVIEW'
    | 'DUPLICATE'
    | 'RESOLVED'
    | 'CLOSED'
  first_reported_at: string
  last_reported_at: string
  evidence_photos: string[]
}

// In-memory fallback cluster store for local development / testing
const localClusterStore = new Map<string, IncidentCluster>()

/**
 * 1. Compute Abuse Score (0 to 100)
 */
export function calculateAbuseScore(input: AbuseScoreInput): number {
  let score = 0

  if (input.honeypotTriggered) score += 50
  if (!input.hasPhoto) score += 20
  if (input.photoTimeMismatch) score += 20
  if (input.isOutsideSemarang) score += 25
  if (input.duplicatePhotoCount && input.duplicatePhotoCount > 0) {
    score += Math.min(35, input.duplicatePhotoCount * 15)
  }
  if (input.isRapidSubmission) score += 30
  if (!input.emailVerified) score += 15

  return Math.min(100, Math.max(0, score))
}

/**
 * 2. Calculate Independent Reporter Count from an array of reports
 * Deduplicates by unique tuple (email, phone, session, ip, photo_hash)
 */
export function countIndependentReporters(
  reports: Array<{
    reporter_email?: string | null
    reporter_phone?: string | null
    client_session_id?: string | null
    client_ip_hash?: string | null
    photo_hash?: string | null
  }>
): number {
  if (!reports || reports.length === 0) return 0

  const uniqueIdentities = new Set<string>()

  reports.forEach((r, idx) => {
    // Generate canonical composite fingerprint
    const emailKey = r.reporter_email?.trim().toLowerCase()
    const phoneKey = r.reporter_phone?.replace(/\D/g, '')
    const sessionKey = r.client_session_id?.trim()
    const ipKey = r.client_ip_hash?.trim()
    const photoKey = r.photo_hash?.trim()

    // Primary unique identity is email or phone; secondary is session or ip
    const primaryKey = emailKey || phoneKey || photoKey || sessionKey || ipKey || `anon-${idx}`
    uniqueIdentities.add(primaryKey)
  })

  return uniqueIdentities.size
}

/**
 * Normalize category for clustering matching
 */
function areCategoriesCompatible(cat1: string, cat2: string): boolean {
  const norm1 = cat1.toLowerCase().trim()
  const norm2 = cat2.toLowerCase().trim()
  if (norm1 === norm2) return true

  const waterGroup = ['banjir', 'genangan', 'drainase_tersumbat', 'rob', 'inundation', 'flood']
  if (waterGroup.includes(norm1) && waterGroup.includes(norm2)) {
    return true
  }

  return false
}

/**
 * 3. Process Report into Incident Cluster & Corroborate
 */
export async function processReportClustering(
  newReport: ReportIdentityInput & { id?: string; report_code: string }
): Promise<{
  clusterId: string
  clusterCode: string
  independentReporterCount: number
  totalReportsInCluster: number
  corroborationStatus: string
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONFIRMED'
}> {
  const now = new Date()
  const reportTimeMs = newReport.reportedAt ? new Date(newReport.reportedAt).getTime() : now.getTime()

  // If Supabase is available, perform database clustering
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createAdminClient()
      const timeThreshold = new Date(reportTimeMs - CLUSTER_TIME_WINDOW_MS).toISOString()

      // Fetch active clusters from the last 2 hours
      const { data: activeClusters } = await supabase
        .from('incident_clusters')
        .select('*')
        .gte('last_reported_at', timeThreshold)
        .not('status', 'in', '("RESOLVED","CLOSED","FALSE_REPORT")')

      let matchedCluster: any = null

      if (activeClusters && Array.isArray(activeClusters)) {
        for (const cluster of activeClusters) {
          const dist = calculateDistanceMeters(
            newReport.latitude,
            newReport.longitude,
            cluster.latitude,
            cluster.longitude
          )

          if (dist <= CLUSTER_RADIUS_METERS && areCategoriesCompatible(newReport.category, cluster.category)) {
            matchedCluster = cluster
            break
          }
        }
      }

      if (matchedCluster) {
        // Fetch existing reports in this cluster to re-evaluate independent reporter count
        const { data: clusterReports } = await supabase
          .from('reports')
          .select('reporter_email, reporter_phone, client_session_id, client_ip_hash, photo_hash')
          .eq('incident_cluster_id', matchedCluster.id)

        const allReports = [
          ...(clusterReports || []),
          {
            reporter_email: newReport.reporterEmail,
            reporter_phone: newReport.reporterPhone,
            client_session_id: newReport.clientSessionId,
            client_ip_hash: newReport.clientIpHash,
            photo_hash: newReport.photoHash,
          },
        ]

        const independentCount = countIndependentReporters(allReports)
        const totalCount = (matchedCluster.report_count || 1) + 1

        let confidence: 'LOW' | 'MEDIUM' | 'HIGH' | 'CONFIRMED' = 'MEDIUM'
        let newStatus = matchedCluster.status

        if (independentCount >= 10) {
          confidence = 'CONFIRMED'
          newStatus = 'CONFIRMED_BY_CORROBORATION'
        } else if (independentCount >= 3) {
          confidence = 'HIGH'
          newStatus = 'CORROBORATED'
        } else if (independentCount >= 2) {
          confidence = 'MEDIUM'
          newStatus = 'CORROBORATED'
        }

        const updatedPhotos = matchedCluster.evidence_photos || []
        if (newReport.photoUrl && !updatedPhotos.includes(newReport.photoUrl)) {
          updatedPhotos.push(newReport.photoUrl)
        }

        await supabase
          .from('incident_clusters')
          .update({
            report_count: totalCount,
            independent_reporter_count: independentCount,
            corroboration_score: Math.min(100, independentCount * 12 + totalCount * 5),
            confidence_level: confidence,
            status: newStatus,
            last_reported_at: now.toISOString(),
            evidence_photos: updatedPhotos.slice(0, 10),
            updated_at: now.toISOString(),
          })
          .eq('id', matchedCluster.id)

        return {
          clusterId: matchedCluster.id,
          clusterCode: matchedCluster.cluster_code,
          independentReporterCount: independentCount,
          totalReportsInCluster: totalCount,
          corroborationStatus: newStatus,
          confidenceLevel: confidence,
        }
      } else {
        // Create new cluster
        const clusterNum = Date.now().toString().slice(-6)
        const clusterCode = `INC-2026-${clusterNum}`

        const { data: newCluster, error } = await supabase
          .from('incident_clusters')
          .insert({
            cluster_code: clusterCode,
            category: newReport.category,
            district_name: newReport.districtName || 'Kota Semarang',
            latitude: newReport.latitude,
            longitude: newReport.longitude,
            radius_m: CLUSTER_RADIUS_METERS,
            time_window_minutes: 30,
            report_count: 1,
            independent_reporter_count: 1,
            corroboration_score: 20,
            confidence_level: 'LOW',
            status: 'NEW',
            first_reported_at: now.toISOString(),
            last_reported_at: now.toISOString(),
            evidence_photos: newReport.photoUrl ? [newReport.photoUrl] : [],
          })
          .select()
          .single()

        if (!error && newCluster) {
          return {
            clusterId: newCluster.id,
            clusterCode: newCluster.cluster_code,
            independentReporterCount: 1,
            totalReportsInCluster: 1,
            corroborationStatus: 'NEW',
            confidenceLevel: 'LOW',
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Clustering Engine] Database cluster error, using local fallback:', dbErr)
    }
  }

  // Local in-memory cluster fallback for tests / offline mode
  let matchedLocal: IncidentCluster | null = null
  for (const cluster of Array.from(localClusterStore.values())) {
    const dist = calculateDistanceMeters(
      newReport.latitude,
      newReport.longitude,
      cluster.latitude,
      cluster.longitude
    )
    if (dist <= CLUSTER_RADIUS_METERS && areCategoriesCompatible(newReport.category, cluster.category)) {
      matchedLocal = cluster
      break
    }
  }

  if (matchedLocal) {
    matchedLocal.report_count += 1
    matchedLocal.independent_reporter_count += 1
    matchedLocal.last_reported_at = now.toISOString()
    if (matchedLocal.independent_reporter_count >= 3) {
      matchedLocal.status = 'CORROBORATED'
      matchedLocal.confidence_level = 'HIGH'
    }
    if (newReport.photoUrl) matchedLocal.evidence_photos.push(newReport.photoUrl)

    return {
      clusterId: matchedLocal.id,
      clusterCode: matchedLocal.cluster_code,
      independentReporterCount: matchedLocal.independent_reporter_count,
      totalReportsInCluster: matchedLocal.report_count,
      corroborationStatus: matchedLocal.status,
      confidenceLevel: matchedLocal.confidence_level,
    }
  } else {
    const clusterId = `cluster-${Date.now()}`
    const clusterCode = `INC-2026-${Date.now().toString().slice(-6)}`
    const newCluster: IncidentCluster = {
      id: clusterId,
      cluster_code: clusterCode,
      category: newReport.category,
      district_name: newReport.districtName || 'Kota Semarang',
      latitude: newReport.latitude,
      longitude: newReport.longitude,
      radius_m: CLUSTER_RADIUS_METERS,
      report_count: 1,
      independent_reporter_count: 1,
      corroboration_score: 25,
      confidence_level: 'LOW',
      status: 'NEW',
      first_reported_at: now.toISOString(),
      last_reported_at: now.toISOString(),
      evidence_photos: newReport.photoUrl ? [newReport.photoUrl] : [],
    }
    localClusterStore.set(clusterId, newCluster)

    return {
      clusterId,
      clusterCode,
      independentReporterCount: 1,
      totalReportsInCluster: 1,
      corroborationStatus: 'NEW',
      confidenceLevel: 'LOW',
    }
  }
}
