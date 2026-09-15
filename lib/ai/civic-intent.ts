// ============================================================
// KotaKu Siaga — Civic Intent & Location Resolver
// Parses citizen queries, resolves 16 Semarang Kecamatan + Landmarks,
// and determines analytical intent & time horizon for data grounding.
// ============================================================

import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'

export type CivicIntentType =
  | 'CURRENT_FLOOD_STATUS'
  | 'CURRENT_WEATHER'
  | 'CURRENT_RISK'
  | 'CCTV_STATUS'
  | 'ROAD_STATUS'
  | 'SAFE_ROUTE'
  | 'WATER_LEVEL'
  | 'ROB_STATUS'
  | 'EMERGENCY_HELP'
  | 'REPORT_STATUS'
  | 'GENERAL_EDUCATION'
  | 'GENERAL_STATUS'

export interface ResolvedLocation {
  districtSlug: string | null
  districtName: string | null
  zoneCategory: 'pesisir' | 'perkotaan' | 'perbukitan'
  centerCoordinates: { lat: number; lng: number }
  landmarkMatched: string | null
  isCityWide: boolean
}

export interface CivicIntentResult {
  intent: CivicIntentType
  location: ResolvedLocation
  isRealtimeQuery: boolean
  isEmergency: boolean
  confidence: number
  extractedKeywords: string[]
}

// Comprehensive landmark & neighborhood mapping to 16 Semarang Subdistricts
const LANDMARK_DISTRICT_MAP: Record<string, string> = {
  // Genuk
  genuk: 'genuk',
  kaligawe: 'genuk',
  terboyo: 'genuk',
  bangetayu: 'genuk',
  'muktiharjo lor': 'genuk',
  muktiharjo: 'genuk',
  genuksari: 'genuk',
  trimulyo: 'genuk',
  gebangsari: 'genuk',
  karangroto: 'genuk',
  banjit: 'genuk',
  'kali babon': 'genuk',
  'kali sringin': 'genuk',
  'kali tenggang': 'genuk',
  'rsi sultan agung': 'genuk',
  'pantura genuk': 'genuk',

  // Semarang Utara
  'semarang utara': 'semarang-utara',
  'tanjung emas': 'semarang-utara',
  'pelabuhan tanjung emas': 'semarang-utara',
  pelabuhan: 'semarang-utara',
  bandarharjo: 'semarang-utara',
  'panggung lor': 'semarang-utara',
  'panggung kidul': 'semarang-utara',
  dadapsari: 'semarang-utara',
  purwosari: 'semarang-utara',
  'stasiun tawang': 'semarang-utara',
  'stasiun poncol': 'semarang-utara',
  'kota lama': 'semarang-utara',

  // Gayamsari
  gayamsari: 'gayamsari',
  'tambak dalam': 'gayamsari',
  tambakrejo: 'gayamsari',
  'gajah raya': 'gayamsari',
  majt: 'gayamsari',
  'masjid agung jawa tengah': 'gayamsari',
  'pandean lamper': 'gayamsari',
  sambirejo: 'gayamsari',
  'sawah besar': 'gayamsari',
  'kanal banjir timur': 'gayamsari',
  kbt: 'gayamsari',

  // Tembalang
  tembalang: 'tembalang',
  undip: 'tembalang',
  meteseh: 'tembalang',
  'dinar elok': 'tembalang',
  'dinar indah': 'tembalang',
  rowosari: 'tembalang',
  'sigar bencah': 'tembalang',
  sendangmulyo: 'tembalang',
  bulusan: 'tembalang',
  kramas: 'tembalang',
  kedungmundu: 'tembalang',
  jangli: 'tembalang',

  // Banyumanik
  banyumanik: 'banyumanik',
  pudakpayung: 'banyumanik',
  gedawang: 'banyumanik',
  srondol: 'banyumanik',
  padangsari: 'banyumanik',
  tinjomoyo: 'banyumanik',
  sumurboto: 'banyumanik',

  // Gajahmungkur
  gajahmungkur: 'gajahmungkur',
  gombel: 'gajahmungkur',
  'tanjakan gombel': 'gajahmungkur',
  sampangan: 'gajahmungkur',
  'bendan duwur': 'gajahmungkur',
  'bendan ngisor': 'gajahmungkur',
  lempongsari: 'gajahmungkur',

  // Candisari
  candisari: 'candisari',
  wonotingal: 'candisari',
  tegalsari: 'candisari',
  jatingaleh: 'candisari',
  kaliwiru: 'candisari',
  karanganyar: 'candisari',

  // Gunungpati
  gunungpati: 'gunungpati',
  unnes: 'gunungpati',
  sekaran: 'gunungpati',
  sukorejo: 'gunungpati',
  sadeng: 'gunungpati',
  plalangan: 'gunungpati',
  'waduk jatibarang': 'gunungpati',
  goa_kreo: 'gunungpati',

  // Mijen
  mijen: 'mijen',
  'bsb city': 'mijen',
  bsb: 'mijen',
  cangkiran: 'mijen',
  pesantren: 'mijen',
  jatibarang: 'mijen',

  // Ngaliyan
  ngaliyan: 'ngaliyan',
  'tambak aji': 'ngaliyan',
  krapyak: 'ngaliyan',
  purwoyoso: 'ngaliyan',
  wonosari: 'ngaliyan',
  bringin: 'ngaliyan',
  bambankerep: 'ngaliyan',

  // Pedurungan
  pedurungan: 'pedurungan',
  tlogosari: 'pedurungan',
  'muktiharjo kidul': 'pedurungan',
  'plamongan sari': 'pedurungan',
  kalicari: 'pedurungan',
  gemah: 'pedurungan',
  tlogomulyo: 'pedurungan',
  penggaron: 'pedurungan',

  // Semarang Barat
  'semarang barat': 'semarang-barat',
  krobokan: 'semarang-barat',
  karangayu: 'semarang-barat',
  manyaran: 'semarang-barat',
  kembangarum: 'semarang-barat',
  tawangmas: 'semarang-barat',
  prpp: 'semarang-barat',
  'bandara ahmad yani': 'semarang-barat',
  'kanal banjir barat': 'semarang-barat',
  bkb: 'semarang-barat',

  // Semarang Selatan
  'semarang selatan': 'semarang-selatan',
  peterongan: 'semarang-selatan',
  pleburan: 'semarang-selatan',
  mupang: 'semarang-selatan',
  mugas: 'semarang-selatan',
  randusari: 'semarang-selatan',
  bulustalan: 'semarang-selatan',

  // Semarang Tengah
  'semarang tengah': 'semarang-tengah',
  'simpang lima': 'semarang-tengah',
  pandanaran: 'semarang-tengah',
  pemuda: 'semarang-tengah',
  kauman: 'semarang-tengah',
  pekunden: 'semarang-tengah',
  kembangsari: 'semarang-tengah',
  sekayu: 'semarang-tengah',

  // Semarang Timur
  'semarang timur': 'semarang-timur',
  rejomulyo: 'semarang-timur',
  kebonagung: 'semarang-timur',
  bugangan: 'semarang-timur',
  sarirejo: 'semarang-timur',
  karangtempel: 'semarang-timur',

  // Tugu
  tugu: 'tugu',
  mangkang: 'tugu',
  mangunharjo: 'tugu',
  jerakah: 'tugu',
  tugurejo: 'tugu',
  karanganyar_tugu: 'tugu',
}

const ZONE_CATEGORY_MAP: Record<string, 'pesisir' | 'perkotaan' | 'perbukitan'> = {
  'semarang-utara': 'pesisir',
  genuk: 'pesisir',
  tugu: 'pesisir',
  gayamsari: 'perkotaan',
  pedurungan: 'perkotaan',
  'semarang-tengah': 'perkotaan',
  'semarang-timur': 'perkotaan',
  'semarang-barat': 'perkotaan',
  'semarang-selatan': 'perkotaan',
  tembalang: 'perbukitan',
  banyumanik: 'perbukitan',
  candisari: 'perbukitan',
  gajahmungkur: 'perbukitan',
  gunungpati: 'perbukitan',
  mijen: 'perbukitan',
  ngaliyan: 'perbukitan',
}

export function resolveCivicLocation(query: string): ResolvedLocation {
  const normalized = (query || '').toLowerCase()

  // 1. Check specific landmark and neighborhood phrases
  const sortedLandmarks = Object.keys(LANDMARK_DISTRICT_MAP).sort(
    (a, b) => b.length - a.length
  )

  for (const landmark of sortedLandmarks) {
    const regex = new RegExp(`\\b${landmark}\\b`, 'i')
    if (regex.test(normalized)) {
      const slug = LANDMARK_DISTRICT_MAP[landmark]
      const district = SEMARANG_KECAMATAN.find((k) => k.slug === slug)
      if (district) {
        return {
          districtSlug: district.slug,
          districtName: district.name,
          zoneCategory: ZONE_CATEGORY_MAP[district.slug] || 'perkotaan',
          centerCoordinates: {
            lat: district.center_lat,
            lng: district.center_lng,
          },
          landmarkMatched: landmark,
          isCityWide: false,
        }
      }
    }
  }

  // 2. Default City-Wide (Kota Semarang Central)
  return {
    districtSlug: null,
    districtName: 'Seluruh Wilayah Kota Semarang',
    zoneCategory: 'perkotaan',
    centerCoordinates: {
      lat: -6.9932,
      lng: 110.4203,
    },
    landmarkMatched: null,
    isCityWide: true,
  }
}

export function resolveCivicIntent(query: string): CivicIntentResult {
  const q = (query || '').toLowerCase().trim()
  const location = resolveCivicLocation(q)

  // Emergency intent checks
  const isEmergency =
    /\b(terjebak|evakuasi|butuh bantuan|tolong|darurat|tenggelam|perahu karet|112|menyelamatkan|posko darurat)\b/i.test(
      q
    )

  if (isEmergency) {
    return {
      intent: 'EMERGENCY_HELP',
      location,
      isRealtimeQuery: true,
      isEmergency: true,
      confidence: 0.98,
      extractedKeywords: ['darurat', 'evakuasi', 'bantuan'],
    }
  }

  // Real-time query indicator
  const isRealtimeQuery =
    /\b(sekarang|saat ini|hari ini|malam ini|pagi ini|siang ini|tadi|terbaru|terkini|live|status|kondisi)\b/i.test(
      q
    ) || !/\b(sejarah|kemarin|dulu|pengertian|apa itu|cara kerja)\b/i.test(q)

  // Intent 1: Current Flood Status
  if (
    /\b(banjir|genangan|luapan|terendam|kedalaman|tinggi air|air naik|tenggelam)\b/i.test(
      q
    ) &&
    /\b(apakah|gimana|bagaimana|ada|sedang|terjadi|info|cek|pantauan|kondisi)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'CURRENT_FLOOD_STATUS',
      location,
      isRealtimeQuery,
      isEmergency: false,
      confidence: 0.95,
      extractedKeywords: ['banjir', 'genangan', 'situasi_lapangan'],
    }
  }

  // Intent 2: Weather & Precipitation
  if (
    /\b(hujan|cuaca|gerimis|deras|lebat|angin|badai|panas|mendung|presipitasi|bmkg)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'CURRENT_WEATHER',
      location,
      isRealtimeQuery,
      isEmergency: false,
      confidence: 0.92,
      extractedKeywords: ['cuaca', 'curah_hujan'],
    }
  }

  // Intent 3: CCTV Telemetry
  if (/\b(cctv|kamera|pantausemar|pantau semar|video|kamera jalan)\b/i.test(q)) {
    return {
      intent: 'CCTV_STATUS',
      location,
      isRealtimeQuery,
      isEmergency: false,
      confidence: 0.94,
      extractedKeywords: ['cctv', 'pantausemar'],
    }
  }

  // Intent 4: Road Closure & Safe Route
  if (
    /\b(jalan|rute|lewat|lalu lintas|ditutup|macet|jalur aman|bisa lewat|akses jalan)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'ROAD_STATUS',
      location,
      isRealtimeQuery,
      isEmergency: false,
      confidence: 0.9,
      extractedKeywords: ['jalan', 'rute_lalu_lintas'],
    }
  }

  // Intent 5: Coastal Rob & Water Level
  if (
    /\b(rob|pasang|pasang laut|muka air laut|gelombang|tma|kali tenggang|kali sringin)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'ROB_STATUS',
      location,
      isRealtimeQuery,
      isEmergency: false,
      confidence: 0.93,
      extractedKeywords: ['banjir_rob', 'pasang_surut'],
    }
  }

  // Intent 6: Risk Assessment / D-RISK Formula
  if (
    /\b(risiko|skor|prioritas|d-risk|iso 37120|kerentanan|indeks|tingkat bahaya)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'CURRENT_RISK',
      location,
      isRealtimeQuery,
      isEmergency: false,
      confidence: 0.91,
      extractedKeywords: ['skor_risiko', 'prioritas_drisk'],
    }
  }

  // Intent 7: Citizen Reporting Guide
  if (
    /\b(lapor|melapor|cara lapor|upload foto|kirim laporan|buat tiket)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'REPORT_STATUS',
      location,
      isRealtimeQuery: false,
      isEmergency: false,
      confidence: 0.88,
      extractedKeywords: ['lapor_warga'],
    }
  }

  // Intent 8: General Science & Disaster Education
  if (
    /\b(apa itu|penyebab|kenapa|mengapa|faktor|edukasi|tas siaga|mitigasi|cara kerja)\b/i.test(
      q
    )
  ) {
    return {
      intent: 'GENERAL_EDUCATION',
      location,
      isRealtimeQuery: false,
      isEmergency: false,
      confidence: 0.85,
      extractedKeywords: ['edukasi_ilmiah'],
    }
  }

  // Default: General Status for the resolved location
  return {
    intent: 'GENERAL_STATUS',
    location,
    isRealtimeQuery: true,
    isEmergency: false,
    confidence: 0.8,
    extractedKeywords: ['status_umum'],
  }
}
