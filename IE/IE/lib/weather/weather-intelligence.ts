// ============================================================
// KotaKu Siaga — Weather Intelligence & Environmental Risk Engine
// Khusus Wilayah Kota Semarang (Pesisir, Perkotaan, Perbukitan)
// Thresholds & Metodologi: BMKG, WMO, BNPB & BBWS Pemali-Juana
// ============================================================

export type SemarangZoneId = 'pesisir' | 'perkotaan' | 'perbukitan'

export interface SemarangZoneInfo {
  id: SemarangZoneId
  name: string
  subtitle: string
  districts: string[]
  defaultCoords: { lat: number; lon: number }
  elevationMeters: string
  primaryRisks: string[]
  drainageSystem: string
}

export const SEMARANG_ZONES: Record<SemarangZoneId, SemarangZoneInfo> = {
  pesisir: {
    id: 'pesisir',
    name: 'Zona Pesisir Utara',
    subtitle: 'Semarang Utara, Genuk, Tugu, Pelabuhan Tanjung Emas',
    districts: ['Semarang Utara', 'Genuk', 'Tugu'],
    defaultCoords: { lat: -6.9548, lon: 110.4285 },
    elevationMeters: '0 - 2.5 m DPL',
    primaryRisks: [
      'Banjir Rob Pasang Laut',
      'Penurunan Tanah (Land Subsidence)',
      'Intrusi Air Asin',
      'Gelombang Pasang Muara',
    ],
    drainageSystem: 'Sistem Pompa Kolam Retensi Sringin, Tenggang, dan Kali Banger',
  },
  perkotaan: {
    id: 'perkotaan',
    name: 'Zona Dataran Perkotaan',
    subtitle: 'Semarang Tengah, Timur, Barat, Gayamsari, Pedurungan',
    districts: ['Semarang Tengah', 'Semarang Timur', 'Semarang Barat', 'Gayamsari', 'Pedurungan'],
    defaultCoords: { lat: -6.9932, lon: 110.4203 },
    elevationMeters: '3 - 25 m DPL',
    primaryRisks: [
      'Genangan Limpasan Jalan Arteri',
      'Sedimentasi Gorong-Gorong Perkotaan',
      'Backwater Saluran Primer',
      'Penyempitan Alur Pembuang',
    ],
    drainageSystem: 'Saluran Primer Banjir Kanal Barat (BKB) & Banjir Kanal Timur (BKT)',
  },
  perbukitan: {
    id: 'perbukitan',
    name: 'Zona Perbukitan Selatan',
    subtitle: 'Banyumanik, Tembalang, Candisari, Gajahmungkur, Gunungpati, Mijen',
    districts: ['Banyumanik', 'Tembalang', 'Candisari', 'Gajahmungkur', 'Gunungpati', 'Mijen'],
    defaultCoords: { lat: -7.0542, lon: 110.4241 },
    elevationMeters: '> 120 - 350 m DPL',
    primaryRisks: [
      'Kestabilan Lereng & Longsoran',
      'Erosi Tebing Pemukiman',
      'Limpasan Cepat Hulu ke Hilir',
      'Peningkatan Tekanan Air Pori Tanah',
    ],
    drainageSystem: 'Catchment Area & Sub-DAS Hulu Garang, Kreo, dan Kripik',
  },
}

export type CompassCardinal8 = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export interface CompassDirection {
  deg: number
  cardinal: 'N' | 'NNE' | 'NE' | 'ENE' | 'E' | 'ESE' | 'SE' | 'SSE' | 'S' | 'SSW' | 'SW' | 'WSW' | 'W' | 'WNW' | 'NW' | 'NNW'
  cardinal8: CompassCardinal8
  labelId: string
  windBearingDesc: string
}

export function getCompassDirection(deg: number | null): CompassDirection {
  if (deg === null || isNaN(deg)) {
    return {
      deg: 0,
      cardinal: 'N',
      cardinal8: 'N',
      labelId: 'Utara',
      windBearingDesc: 'Tiupan dari arah Utara',
    }
  }
  const normalized = ((deg % 360) + 360) % 360

  const directions8: { cardinal: CompassCardinal8; labelId: string; desc: string }[] = [
    { cardinal: 'N', labelId: 'Utara (N)', desc: 'Tiupan dari arah Laut Jawa / Utara' },
    { cardinal: 'NE', labelId: 'Timur Laut (NE)', desc: 'Tiupan dari arah Pesisir Timur Laut' },
    { cardinal: 'E', labelId: 'Timur (E)', desc: 'Tiupan dari arah Demak / Timur' },
    { cardinal: 'SE', labelId: 'Tenggara (SE)', desc: 'Tiupan dari arah Tenggara' },
    { cardinal: 'S', labelId: 'Selatan (S)', desc: 'Tiupan dari arah Perbukitan / Selatan' },
    { cardinal: 'SW', labelId: 'Barat Daya (SW)', desc: 'Tiupan dari arah Barat Daya' },
    { cardinal: 'W', labelId: 'Barat (W)', desc: 'Tiupan dari arah Kendal / Barat' },
    { cardinal: 'NW', labelId: 'Barat Laut (NW)', desc: 'Tiupan dari arah Pesisir Barat Laut' },
  ]

  const idx8 = Math.round(normalized / 45) % 8
  const d8 = directions8[idx8]

  const directions16: CompassDirection['cardinal'][] = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ]
  const idx16 = Math.round(normalized / 22.5) % 16

  return {
    deg: Math.round(normalized),
    cardinal: directions16[idx16],
    cardinal8: d8.cardinal,
    labelId: d8.labelId,
    windBearingDesc: d8.desc,
  }
}

export function determineZoneByCoordinates(lat: number, _lon?: number): SemarangZoneId {
  // Pesisir: lat > -6.98 (Semarang Utara, Genuk, Tugu)
  if (lat > -6.98) return 'pesisir'
  // Perbukitan: lat < -7.03 (Semarang Selatan, Banyumanik, Candisari, Gunungpati)
  if (lat < -7.03) return 'perbukitan'
  // Perkotaan: between -6.98 and -7.03
  return 'perkotaan'
}

export type RiskLevel = 'Normal' | 'Elevated' | 'High'

export interface EnvironmentalRiskIndicators {
  rainfall: {
    level: RiskLevel
    label: string
    valueMm: number
    thresholdDesc: string
  }
  wind: {
    level: RiskLevel
    label: string
    speedKmh: number
    gustKmh: number
    thresholdDesc: string
  }
  coastal: {
    level: RiskLevel
    label: string
    waveHeightM: number | null
    thresholdDesc: string
  }
  slope: {
    level: 'Normal' | 'Attention'
    label: string
    cumulRain12h: number
    thresholdDesc: string
  }
}

export function evaluateEnvironmentalRiskIndicators(
  currentRain: number,
  windSpeed: number,
  windGust: number,
  waveHeight: number | null,
  cumulRain12h: number,
  zone: SemarangZoneId
): EnvironmentalRiskIndicators {
  // 1. Curah Hujan (Klasifikasi Standar BMKG):
  // 0 - 5 mm/jam: Normal / Ringan
  // 5 - 20 mm/jam: Elevated / Sedang
  // > 20 mm/jam: High / Lebat - Sangat Lebat
  let rainLevel: RiskLevel = 'Normal'
  let rainLabel = 'Curah Hujan Normal'
  if (currentRain > 20) {
    rainLevel = 'High'
    rainLabel = 'Curah Hujan Tinggi (Lebat / Ekstrem)'
  } else if (currentRain >= 5) {
    rainLevel = 'Elevated'
    rainLabel = 'Curah Hujan Sedang / Meningkat'
  }

  // 2. Kecepatan & Hembusan Angin (Skala Beaufort & Peringatan Dini BMKG):
  // Speed < 20 km/h: Normal
  // Speed 20 - 40 km/h atau Gust 35 - 50 km/h: Elevated
  // Speed > 40 km/h atau Gust > 50 km/h: High
  let windLevel: RiskLevel = 'Normal'
  let windLabel = 'Kecepatan Angin Normal'
  if (windSpeed > 40 || windGust > 50) {
    windLevel = 'High'
    windLabel = 'Kecepatan & Hembusan Kencang'
  } else if (windSpeed >= 20 || windGust >= 35) {
    windLevel = 'Elevated'
    windLabel = 'Hembusan Angin Meningkat'
  }

  // 3. Gelombang Pesisir (BMKG Stasiun Meteorologi Maritim Tanjung Emas):
  // Wave < 0.5 m: Tenang (Normal)
  // Wave 0.5 - 1.25 m: Sedang (Elevated)
  // Wave > 1.25 m: Tinggi (High)
  let coastalLevel: RiskLevel = 'Normal'
  let coastalLabel = 'Gelombang Laut Tenang'
  if (waveHeight != null) {
    if (waveHeight > 1.25) {
      coastalLevel = 'High'
      coastalLabel = 'Gelombang Pesisir Tinggi'
    } else if (waveHeight >= 0.5) {
      coastalLevel = 'Elevated'
      coastalLabel = 'Gelombang Pesisir Sedang'
    }
  }

  // 4. Kestabilan Lereng (Kawasan Perbukitan Semarang Selatan):
  // Jika zona perbukitan dan akumulasi 12 jam > 30 mm atau hujan sesaat > 15 mm/jam
  let slopeLevel: 'Normal' | 'Attention' = 'Normal'
  let slopeLabel = 'Kondisi Lereng Terpantau Normal'
  if (zone === 'perbukitan' && (cumulRain12h > 30 || currentRain > 15)) {
    slopeLevel = 'Attention'
    slopeLabel = 'Perhatian terhadap Kondisi Lereng'
  }

  return {
    rainfall: {
      level: rainLevel,
      label: rainLabel,
      valueMm: currentRain,
      thresholdDesc: 'BMKG: Normal (<5 mm/j), Sedang (5-20 mm/j), Tinggi (>20 mm/j)',
    },
    wind: {
      level: windLevel,
      label: windLabel,
      speedKmh: windSpeed,
      gustKmh: windGust,
      thresholdDesc: 'Skala Beaufort: Normal (<20 km/j), Waspada Gust (>35 km/j), Kencang (>50 km/j)',
    },
    coastal: {
      level: coastalLevel,
      label: coastalLabel,
      waveHeightM: waveHeight,
      thresholdDesc: 'BMKG Maritim Tanjung Emas: Tenang (<0.5m), Sedang (0.5-1.25m), Tinggi (>1.25m)',
    },
    slope: {
      level: slopeLevel,
      label: slopeLabel,
      cumulRain12h,
      thresholdDesc: 'PVMBG / BNPB: Akumulasi hujan >30mm/12jam pada kemiringan lereng >20°',
    },
  }
}

export interface RainfallTemporalAccumulation {
  acc1h: number
  acc3h: number
  acc6h: number
  acc12h: number
  acc24h: number
  trend: 'HUJAN MENINGKAT' | 'HUJAN STABIL' | 'HUJAN MENURUN'
  trendDescription: string
  hourlySeries: { hourOffset: number; timeStr: string; rainMm: number }[]
}

export function calculateRainfallTemporal(hourlyRain: number[]): RainfallTemporalAccumulation {
  const safeRain = hourlyRain && hourlyRain.length > 0 ? hourlyRain : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  const acc1h = Number((safeRain[0] || 0).toFixed(1))
  const acc3h = Number((safeRain.slice(0, 3).reduce((a, b) => a + (b || 0), 0)).toFixed(1))
  const acc6h = Number((safeRain.slice(0, 6).reduce((a, b) => a + (b || 0), 0)).toFixed(1))
  const acc12h = Number((safeRain.slice(0, 12).reduce((a, b) => a + (b || 0), 0)).toFixed(1))
  const acc24h = Number((safeRain.slice(0, 24).reduce((a, b) => a + (b || 0), 0)).toFixed(1))

  const first3Avg = (acc3h / 3) || 0
  const next3Avg = ((acc6h - acc3h) / 3) || 0

  let trend: RainfallTemporalAccumulation['trend'] = 'HUJAN STABIL'
  let trendDescription = 'Intensitas curah hujan terpantau stabil dalam horizon waktu observasi dan estimasi.'

  if (next3Avg > first3Avg + 1.2) {
    trend = 'HUJAN MENINGKAT'
    trendDescription = 'Data forecast mengindikasikan intensitas hujan bertambah dalam beberapa jam ke depan.'
  } else if (first3Avg > next3Avg + 1.2) {
    trend = 'HUJAN MENURUN'
    trendDescription = 'Data forecast menunjukkan kecenderungan penurunan intensitas presipitasi.'
  }

  const now = new Date()
  const hourlySeries = safeRain.slice(0, 24).map((val, idx) => {
    const futureTime = new Date(now.getTime() + idx * 3600 * 1000)
    const timeStr = futureTime.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    return {
      hourOffset: idx,
      timeStr: idx === 0 ? 'Sekarang' : `+${idx}h (${timeStr})`,
      rainMm: Number((val || 0).toFixed(1)),
    }
  })

  return {
    acc1h,
    acc3h,
    acc6h,
    acc12h,
    acc24h,
    trend,
    trendDescription,
    hourlySeries,
  }
}

export interface WeatherTimelineStep {
  stepKey: 'NOW' | '+1H' | '+3H' | '+6H' | '+12H' | '+24H'
  hourOffset: number
  label: string
  timeWib: string
  rainMm: number
  tempC: number
  windKmh: number
  waveM: number | null
  conditionDesc: string
}

export function buildWeatherTimeline(
  hourlyRain: number[],
  hourlyTemp: number[],
  hourlyWind: number[],
  hourlyWave?: number[]
): WeatherTimelineStep[] {
  const offsets: { stepKey: WeatherTimelineStep['stepKey']; offset: number; label: string }[] = [
    { stepKey: 'NOW', offset: 0, label: 'Sekarang' },
    { stepKey: '+1H', offset: 1, label: '+1 Jam' },
    { stepKey: '+3H', offset: 3, label: '+3 Jam' },
    { stepKey: '+6H', offset: 6, label: '+6 Jam' },
    { stepKey: '+12H', offset: 12, label: '+12 Jam' },
    { stepKey: '+24H', offset: 24, label: '+24 Jam' },
  ]

  const now = new Date()

  return offsets.map(({ stepKey, offset, label }) => {
    const timePoint = new Date(now.getTime() + offset * 3600 * 1000)
    const timeWib = timePoint.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' WIB'

    const rainMm = Number((hourlyRain[offset] ?? 0).toFixed(1))
    const tempC = Number((hourlyTemp[offset] ?? 28).toFixed(1))
    const windKmh = Number((hourlyWind[offset] ?? 10).toFixed(1))
    const waveM = hourlyWave && hourlyWave[offset] != null ? Number(hourlyWave[offset].toFixed(2)) : null

    let conditionDesc = 'Cerah / Berawan'
    if (rainMm > 20) conditionDesc = 'Hujan Sangat Lebat'
    else if (rainMm >= 5) conditionDesc = 'Hujan Sedang'
    else if (rainMm > 0.5) conditionDesc = 'Hujan Ringan'
    else if (windKmh > 35) conditionDesc = 'Angin Kencang'

    return {
      stepKey,
      hourOffset: offset,
      label,
      timeWib,
      rainMm,
      tempC,
      windKmh,
      waveM,
      conditionDesc,
    }
  })
}

export interface WeatherParamItem {
  parameter: string
  value: number | string | null
  formatted: string
  unit: string
  timestamp: string
  periodType: 'OBSERVATION' | 'FORECAST'
  periodDesc: string
  source: string
}

export interface ContextualInsights {
  floodRiskContext: {
    title: string
    implication: string
    recommendations: string[]
  }
  coastalRobContext: {
    title: string
    condition: string
    recommendations: string[]
  }
  slopeContext: {
    title: string
    status: string
    hasAttention: boolean
    recommendations: string[]
  }
  windGustContext: {
    title: string
    advice: string | null
  }
}

export function generateContextualInsights(
  zone: SemarangZoneInfo,
  indicators: EnvironmentalRiskIndicators,
  acc: RainfallTemporalAccumulation,
  windBearingDesc: string
): ContextualInsights {
  // 1. Flood Risk Context (Curah Hujan vs Elevasi vs Drainase)
  let floodImplication = 'Kapasitas drainase perkotaan berada dalam batas tampung normal. Tetap pantau kebersihan tali-tali air jalan.'
  const floodRecs: string[] = ['Pastikan saringan talang dan saluran pembuang rumah tangga bersih dari sumbatan sampah.']

  if (indicators.rainfall.level === 'High' || acc.acc3h > 35) {
    floodImplication = `Curah hujan tinggi terdeteksi di ${zone.name}. Pada wilayah elevasi rendah (${zone.elevationMeters}), akumulasi air berpotensi meningkatkan beban sistem drainase primer (${zone.drainageSystem}). Perhatian terhadap potensi genangan limpasan di titik-titik cekungan historis.`
    floodRecs.push('Operator rumah pompa disiagakan untuk percepatan pembuangan debit air ke saluran induk.')
    floodRecs.push('Pengendara disarankan mewaspadai genangan pada underpass dan bahu jalan arteri rendah.')
  } else if (indicators.rainfall.level === 'Elevated' || acc.acc6h > 20) {
    floodImplication = `Curah hujan sedang berlangsung secara berkala di ${zone.name}. Saluran pembuang sekunder mulai mengalami kenaikan debit air. Situational awareness direkomendasikan pada ruas jalan rentan sedimentasi.`
    floodRecs.push('Pantau saluran air di sekitar tempat tinggal dan laporkan jika terdapat hambatan aliran.')
  }

  // 2. Coastal / Rob Context (Pesisir Semarang Utara, Genuk, Tugu)
  let coastalCondition = 'Kondisi pasang dan gelombang pesisir perairan Semarang terpantau normal dan stabil.'
  const coastalRecs: string[] = ['Aktivitas pelabuhan dan dermaga nelayan beroperasi dalam rentang hidrografi normal.']

  if (zone.id === 'pesisir') {
    if (indicators.coastal.level === 'High' || (indicators.coastal.level === 'Elevated' && indicators.rainfall.level !== 'Normal')) {
      coastalCondition = `Perhatian terhadap genangan pesisir di kawasan pesisir rendah Semarang Utara dan Genuk. Ketinggian gelombang (${indicators.coastal.waveHeightM ?? 'N/A'} m) bertepatan dengan arah angin laut (${windBearingDesc}) dapat memperlambat gravitasi buangan air sungai ke muara.`
      coastalRecs.push('Pantau pintu air dan kolam retensi di pesisir (Polder Sringin & Tenggang).')
      coastalRecs.push('Pengemudi di jalur Pantura Kaligawe diimbau waspada terhadap backwater pasang air laut.')
    } else {
      coastalCondition = `Zona pesisir berada pada ketinggian ${zone.elevationMeters}. Gelombang relatif tenang, namun kawasan ini tetap memiliki kerentanan land subsidence kumulatif.`
    }
  } else {
    coastalCondition = 'Zona pengamatan ini berada di luar garis pantai langsung. Kondisi gelombang pesisir menjadi rujukan bagi muara saluran utama.'
  }

  // 3. Slope / Landslide Context (Zona Perbukitan Semarang Selatan)
  let slopeStatus = 'Kondisi kestabilan lereng terpantau normal. Tingkat kejenuhan air tanah hulu dalam batas stabil.'
  const slopeRecs: string[] = ['Pertahankan vegetasi berakar dalam penahan tebing pekarangan.']
  let hasAttention = false

  if (zone.id === 'perbukitan') {
    if (indicators.slope.level === 'Attention') {
      hasAttention = true
      slopeStatus = `Perhatian terhadap kondisi lereng di kawasan perbukitan (Banyumanik, Tembalang, Gunungpati). Akumulasi hujan 12 jam mencapai ${indicators.slope.cumulRain12h} mm. Peningkatan tekanan air pori tanah dapat memicu ketidakstabilan pada tebing tanpa retaining wall.`
      slopeRecs.push('Waspadai tanda-tanda retakan melengkung pada tanah tebing, pohon miring mendadak, atau rembesan air keruh dari lereng.')
      slopeRecs.push('Hindari pembebanan struktur berat di bibir tebing curam selama periode hujan berkepanjangan.')
    } else {
      slopeStatus = `Zona perbukitan (${zone.elevationMeters}). Akumulasi hujan saat ini belum melewati batas kewaspadaan stabilitas lereng.`
    }
  }

  // 4. Wind Gust Context
  let windAdvice: string | null = null
  if (indicators.wind.level === 'High') {
    windAdvice = 'Angin kencang dapat meningkatkan risiko terhadap pohon peneduh jalan, papan reklame/baliho, struktur atap ringan, dan keselamatan aktivitas luar ruangan. Diimbau tidak memarkir kendaraan tepat di bawah pohon tua atau baliho besar.'
  } else if (indicators.wind.level === 'Elevated') {
    windAdvice = 'Hembusan angin meningkat. Operator crane pelabuhan dan baliho terbuka dianjurkan memperhatikan kecepatan hembusan maksimum.'
  }

  return {
    floodRiskContext: {
      title: 'Implikasi terhadap Genangan & Drainase',
      implication: floodImplication,
      recommendations: floodRecs,
    },
    coastalRobContext: {
      title: 'Kondisi Pesisir & Dinamika Muara',
      condition: coastalCondition,
      recommendations: coastalRecs,
    },
    slopeContext: {
      title: 'Kondisi Lereng & Stabilitas Topografi',
      status: slopeStatus,
      hasAttention,
      recommendations: slopeRecs,
    },
    windGustContext: {
      title: 'Analisis Angin & Hembusan Maksimum',
      advice: windAdvice,
    },
  }
}

export interface WhyItMattersItem {
  id: string
  topic: string
  summary: string
  actionLabel: string
  href: string
}

export const WHY_IT_MATTERS_ITEMS: WhyItMattersItem[] = [
  {
    id: 'drainage',
    topic: 'Kapasitas Drainase & Limpasan Permukaan',
    summary: 'Curah hujan tinggi dalam waktu singkat dapat meningkatkan beban sistem drainase perkotaan, terutama pada kawasan dengan kapasitas saluran terbatas atau mengalami sedimentasi.',
    actionLabel: 'Pelajari Sistem Drainase Kota Semarang',
    href: '/edukasi#modul-01',
  },
  {
    id: 'coastal',
    topic: 'Dinamika Pesisir, Pasang Laut & Muara',
    summary: 'Gelombang laut, arah angin, dan waktu pasang air laut dapat memengaruhi kecepatan gravitasi air tawar menuju laut, memperparah fenomena backwater di kawasan pesisir rendah.',
    actionLabel: 'Pelajari Dinamika Pesisir & Penurunan Tanah',
    href: '/edukasi#modul-02',
  },
  {
    id: 'slope',
    topic: 'Tekanan Air Pori & Ketidakstabilan Lereng',
    summary: 'Hujan berkepanjangan meningkatkan kejenuhan air dalam pori-pori tanah di kawasan Semarang Selatan, mengurangi gaya gesek antar-partikel tanah pada lereng curam.',
    actionLabel: 'Pelajari Tanda-Tanda Ketidakstabilan Lereng',
    href: '/edukasi#modul-03',
  },
]
