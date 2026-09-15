import assert from 'node:assert'
import { generateSituationShareText } from '../components/public/DisasterShareModal.tsx'

console.log('--- STARTING SITUATION CONSISTENCY & CONTRADICTION TESTS ---')

// TEST 1: Rain = 0, Flood = null, No road closures
{
  const text = generateSituationShareText({
    districtName: 'Kecamatan Genuk',
    riskLevel: 'ELEVATED',
    riskScore: 46.2,
    rainfallMmH: 0,
    rainfallCategory: 'Nihil Hujan',
    rainfallStatus: 'Termonitor Aktual (WMO)',
    coastalStatus: 'Laut Tenang',
    waveHeightM: 0.35,
    floodDepthCm: null,
    activeReportsCount: 0,
    avoidRoads: [],
  })

  console.log('\n[TEST 1: Calm / Clear / 0 mm Rain / No Flood]')
  assert(!text.includes('15 cm'), 'TEST 1 FAILED: Text must NOT contain 15 cm when rain is 0 and no flood')
  assert(!text.includes('RUAS JALAN DIALIHKAN'), 'TEST 1 FAILED: Text must NOT claim road diverted when avoidRoads is empty')
  assert(text.includes('Nihil pengamatan genangan aktif terverifikasi'), 'TEST 1 FAILED: Must state nihil genangan')
  assert(text.includes('Nihil penutupan jalan'), 'TEST 1 FAILED: Must state nihil penutupan jalan')
  assert(text.includes('0 mm/jam'), 'TEST 1 FAILED: Must state 0 mm/jam')
  assert(text.includes('bukan konfirmasi bahwa bencana sedang terjadi'), 'TEST 1 FAILED: Must have risk disclaimer')
  console.log('✓ TEST 1 PASSED: Zero false positive flood or road closures.')
}

// TEST 2: Rain = 45 mm/h (Heavy Rain), but NO verified flood report yet
{
  const text = generateSituationShareText({
    districtName: 'Kecamatan Semarang Utara',
    riskLevel: 'HIGH',
    riskScore: 78.5,
    rainfallMmH: 45,
    rainfallCategory: 'Hujan Lebat',
    rainfallStatus: 'BMKG Maritim',
    coastalStatus: 'Pasang Laut',
    waveHeightM: 1.1,
    floodDepthCm: null,
    activeReportsCount: 0,
    avoidRoads: [],
  })

  console.log('\n[TEST 2: Heavy Rain / No Confirmed Flood Depth]')
  assert(text.includes('45 mm/jam'), 'TEST 2 FAILED: Must display 45 mm/jam')
  assert(!text.includes('15 cm'), 'TEST 2 FAILED: Must NOT fabricate 15 cm')
  assert(text.includes('Hujan Lebat'), 'TEST 2 FAILED: Must indicate heavy rain')
  assert(text.includes('Nihil pengamatan genangan aktif terverifikasi'), 'TEST 2 FAILED: Must not fabricate flood depth')
  console.log('✓ TEST 2 PASSED: Heavy rain correctly reported without fabricating flood depth.')
}

// TEST 3: Verified Citizen Report has 25 cm Flood Depth
{
  const text = generateSituationShareText({
    districtName: 'Kecamatan Genuk',
    riskLevel: 'CRITICAL',
    riskScore: 88.0,
    rainfallMmH: 30,
    rainfallCategory: 'Hujan Lebat',
    rainfallStatus: 'BMKG',
    coastalStatus: 'Pasang Tinggi',
    waveHeightM: 1.4,
    floodDepthCm: 25,
    activeReportsCount: 3,
    avoidRoads: ['Jl. Raya Kaligawe Bawah Jembatan Tol', 'Jembatan Kali Babon'],
    safeCorridors: ['Jl. Wolter Monginsidi', 'Jl. Majapahit'],
  })

  console.log('\n[TEST 3: Verified Flood 25 cm with Active Road Closures]')
  assert(text.includes('25 cm (Terverifikasi dari laporan lapangan)'), 'TEST 3 FAILED: Must display 25 cm from verified field report')
  assert(text.includes('RUAS JALAN DIALIHKAN / DIHINDARI:'), 'TEST 3 FAILED: Must display road closures when provided')
  assert(text.includes('Jl. Raya Kaligawe Bawah Jembatan Tol'), 'TEST 3 FAILED: Must list specific closed roads')
  assert(text.includes('REKOMENDASI JALUR ALTERNATIF:'), 'TEST 3 FAILED: Must list safe corridors')
  console.log('✓ TEST 3 PASSED: Verified flood and road closures accurately reflected.')
}

// TEST 4: Empty road closures -> Normal routing message
{
  const text = generateSituationShareText({
    districtName: 'Kecamatan Tembalang',
    riskLevel: 'LOW',
    riskScore: 18.2,
    rainfallMmH: 0,
    rainfallCategory: 'Cerah',
    floodDepthCm: null,
    avoidRoads: [],
  })

  console.log('\n[TEST 4: Normal Routing on Safe District]')
  assert(text.includes('Jalur utama dapat dilalui secara normal'), 'TEST 4 FAILED: Must advise normal travel')
  assert(!text.includes('RUAS JALAN DIALIHKAN'), 'TEST 4 FAILED: Must not claim road closures')
  console.log('✓ TEST 4 PASSED: Normal routing safely advised.')
}

console.log('\n========================================')
console.log('ALL SITUATION CONSISTENCY TESTS PASSED!')
console.log('========================================')
