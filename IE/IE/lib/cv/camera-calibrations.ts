// ============================================================
// KotaKu Siaga — Camera-Specific ROI & Calibration Registry
// Multi-Signal Non-YOLO Flood Detection System
// Tailored for Kota Semarang CCTV Vantage Points
// ============================================================

export interface CameraCalibrationProfile {
  cameraId: string
  cameraCode: string
  name: string
  district: string
  category: 'rob_banjir' | 'polder_sungai' | 'lalin_protokol'
  /** Normalized polygon coordinates [[x, y], ...] in range [0..1] */
  roiPolygon: [number, number][]
  /** Normal baseline water coverage ratio (0.0 to 1.0) under dry weather */
  baselineWaterRatio: number
  /** Minimum water coverage ratio above baseline to trigger anomaly */
  waterThresholdRatio: number
  /** Expected normal roadway edge density factor */
  expectedEdgeDensity: number
  /** Temporal sliding window frame count */
  slidingWindowSize: number
  /** Minimum consecutive positive frames required for confirmation */
  minPositiveFrames: number
  /** Minimum consecutive clean frames required for recovery */
  recoveryCleanFrames: number
  /** Day/Night sensitivity factor */
  nightSensitivityMultiplier: number
}

// Default profile for general roadway CCTV
export const DEFAULT_ROAD_PROFILE: Omit<CameraCalibrationProfile, 'cameraId' | 'cameraCode' | 'name' | 'district' | 'category'> = {
  roiPolygon: [
    [0.10, 0.45],
    [0.90, 0.45],
    [1.00, 0.95],
    [0.00, 0.95],
  ],
  baselineWaterRatio: 0.01,
  waterThresholdRatio: 0.15,
  expectedEdgeDensity: 0.18,
  slidingWindowSize: 15,
  minPositiveFrames: 5,
  recoveryCleanFrames: 4,
  nightSensitivityMultiplier: 1.15,
}

// Default profile for polder / retention basin / canal CCTV
export const DEFAULT_POLDER_PROFILE: Omit<CameraCalibrationProfile, 'cameraId' | 'cameraCode' | 'name' | 'district' | 'category'> = {
  roiPolygon: [
    [0.05, 0.35],
    [0.95, 0.35],
    [0.95, 0.90],
    [0.05, 0.90],
  ],
  baselineWaterRatio: 0.35, // Polders normally have water in basin!
  waterThresholdRatio: 0.60, // Only alerts when water exceeds safe freeboard/embankment
  expectedEdgeDensity: 0.10,
  slidingWindowSize: 20,
  minPositiveFrames: 6,
  recoveryCleanFrames: 5,
  nightSensitivityMultiplier: 1.10,
}

// Dedicated profiles for Semarang High-Risk Monitoring Points
export const CAMERA_CALIBRATION_REGISTRY: Record<string, CameraCalibrationProfile> = {
  // 1. SUPRIYADI (Pedurungan) - Roadway & Drainage intersection
  'cctv-ps-414-321': {
    cameraId: 'cctv-ps-414-321',
    cameraCode: 'PS-GEN-321',
    name: 'SUPRIYADI',
    district: 'Pedurungan',
    category: 'rob_banjir',
    roiPolygon: [
      [0.05, 0.50],
      [0.95, 0.50],
      [1.00, 0.98],
      [0.00, 0.98],
    ],
    baselineWaterRatio: 0.02,
    waterThresholdRatio: 0.18,
    expectedEdgeDensity: 0.20,
    slidingWindowSize: 15,
    minPositiveFrames: 5,
    recoveryCleanFrames: 4,
    nightSensitivityMultiplier: 1.20,
  },

  // 2. PETERONGAN (Semarang Tengah) - Lowland Commercial Protocol Road
  'cctv-ps-414-324': {
    cameraId: 'cctv-ps-414-324',
    cameraCode: 'PS-GEN-324',
    name: 'PETERONGAN',
    district: 'Semarang Tengah',
    category: 'rob_banjir',
    roiPolygon: [
      [0.10, 0.48],
      [0.90, 0.48],
      [0.98, 0.95],
      [0.02, 0.95],
    ],
    baselineWaterRatio: 0.01,
    waterThresholdRatio: 0.15,
    expectedEdgeDensity: 0.22,
    slidingWindowSize: 15,
    minPositiveFrames: 5,
    recoveryCleanFrames: 4,
    nightSensitivityMultiplier: 1.15,
  },

  // 3. KALIGAWE (Genuk) - Tidal Flood & Coastal Highway (High Risk)
  'cctv-ps-414-323': {
    cameraId: 'cctv-ps-414-323',
    cameraCode: 'PS-GEN-323',
    name: 'KALIGAWE - GENUK',
    district: 'Genuk',
    category: 'rob_banjir',
    roiPolygon: [
      [0.02, 0.42],
      [0.98, 0.42],
      [1.00, 0.98],
      [0.00, 0.98],
    ],
    baselineWaterRatio: 0.03,
    waterThresholdRatio: 0.16,
    expectedEdgeDensity: 0.17,
    slidingWindowSize: 15,
    minPositiveFrames: 4, // Fast response for critical logistics corridor
    recoveryCleanFrames: 5,
    nightSensitivityMultiplier: 1.25,
  },

  // 4. TAMBAK LOROK (Semarang Utara) - Coastal Fishermen Village
  'cctv-ps-414-320': {
    cameraId: 'cctv-ps-414-320',
    cameraCode: 'PS-GEN-320',
    name: 'TAMBAK LOROK',
    district: 'Semarang Utara',
    category: 'rob_banjir',
    roiPolygon: [
      [0.08, 0.45],
      [0.92, 0.45],
      [0.98, 0.96],
      [0.02, 0.96],
    ],
    baselineWaterRatio: 0.05,
    waterThresholdRatio: 0.20,
    expectedEdgeDensity: 0.15,
    slidingWindowSize: 15,
    minPositiveFrames: 5,
    recoveryCleanFrames: 5,
    nightSensitivityMultiplier: 1.20,
  },

  // 5. TANJUNG EMAS (Semarang Utara) - Seaport Tidal Wall & Road
  'cctv-ps-414-322': {
    cameraId: 'cctv-ps-414-322',
    cameraCode: 'PS-GEN-322',
    name: 'TANJUNG EMAS',
    district: 'Semarang Utara',
    category: 'rob_banjir',
    roiPolygon: [
      [0.05, 0.40],
      [0.95, 0.40],
      [1.00, 0.95],
      [0.00, 0.95],
    ],
    baselineWaterRatio: 0.04,
    waterThresholdRatio: 0.18,
    expectedEdgeDensity: 0.16,
    slidingWindowSize: 15,
    minPositiveFrames: 4,
    recoveryCleanFrames: 5,
    nightSensitivityMultiplier: 1.25,
  },
}

/**
 * Retrieves calibration profile for a given camera ID, falling back to category default
 */
export function getCameraCalibration(
  cameraId: string,
  category: 'rob_banjir' | 'polder_sungai' | 'lalin_protokol' = 'rob_banjir',
  name = 'CCTV PantauSemar',
  district = 'Semarang'
): CameraCalibrationProfile {
  if (CAMERA_CALIBRATION_REGISTRY[cameraId]) {
    return CAMERA_CALIBRATION_REGISTRY[cameraId]
  }

  const base = category === 'polder_sungai' ? DEFAULT_POLDER_PROFILE : DEFAULT_ROAD_PROFILE

  return {
    ...base,
    cameraId,
    cameraCode: cameraId.toUpperCase(),
    name,
    district,
    category,
  }
}
