// ============================================================
// KotaKu Siaga — Data Quality & Integrity Auditor
// Verification of Public Open Data, Deduplication, & Provenance
// ============================================================

import type { DataProvenance } from '../ingestion/types'
import { auditSpatialRecord } from '../spatial/enrichment'

export interface RecordQualityAudit {
  totalRecords: number
  validRecords: number
  spatiallyValidRecords: number
  missingCoordinates: number
  outsideStudyArea: number
  duplicatesDetected: number
  cleanProvenanceCount: number
  issues: string[]
}

export function auditDatasetQuality<T extends { latitude?: number | null; longitude?: number | null; provenance?: DataProvenance; id?: string }>(
  datasetName: string,
  records: T[]
): RecordQualityAudit {
  let validCount = 0
  let spatiallyValidCount = 0
  let missingCoordCount = 0
  let outsideStudyAreaCount = 0
  let cleanProvenanceCount = 0
  const seenIds = new Set<string>()
  let duplicateCount = 0
  const issues: string[] = []

  records.forEach((rec, idx) => {
    // 1. Deduplication check
    const id = rec.id || `rec-${idx}`
    if (seenIds.has(id)) {
      duplicateCount++
      issues.push(`Duplikasi ditemukan pada entitas ID ${id}`)
    } else {
      seenIds.add(id)
    }

    // 2. Provenance integrity
    if (rec.provenance && rec.provenance.provider && rec.provenance.access_method === 'PUBLIC_NO_AUTH') {
      cleanProvenanceCount++
    } else {
      issues.push(`Record ${id} tidak memiliki metadata provenance publik yang lengkap`)
    }

    // 3. Spatial validity audit
    const spatialAudit = auditSpatialRecord(rec.latitude, rec.longitude)
    if (spatialAudit.status === 'MAPPABLE') {
      spatiallyValidCount++
      validCount++
    } else if (spatialAudit.status === 'MISSING_COORDINATE') {
      missingCoordCount++
      // Still data_valid, but not spatially_valid
      validCount++
    } else if (spatialAudit.status === 'OUTSIDE_STUDY_AREA') {
      outsideStudyAreaCount++
      issues.push(`Record ${id} (${rec.latitude}, ${rec.longitude}) berada di luar batas Kota Semarang`)
    } else {
      issues.push(`Record ${id} memiliki koordinat tidak valid`)
    }
  })

  return {
    totalRecords: records.length,
    validRecords: validCount,
    spatiallyValidRecords: spatiallyValidCount,
    missingCoordinates: missingCoordCount,
    outsideStudyArea: outsideStudyAreaCount,
    duplicatesDetected: duplicateCount,
    cleanProvenanceCount,
    issues,
  }
}
