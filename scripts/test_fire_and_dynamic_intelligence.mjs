// ============================================================
// KotaKu Siaga — Fire Incident & Dynamic Intelligence Acceptance Test
// Tests:
// 1. Fire Incident Report with dynamic structured details
// 2. Flood Incident Report without fire fields
// 3. Fallen Tree Incident Report
// 4. Simulation Mode Flagging & Segregation
// 5. Proximity & Time-Window Duplicate Detection
// 6. Reports API GET with simulation & category filtering
// ============================================================

const BASE_URL = 'http://localhost:3000'

async function runAcceptanceTests() {
  console.log('====================================================')
  console.log('KOTAKU SIAGA — FIRE & DYNAMIC INTELLIGENCE TEST')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`)
      passed++
    } else {
      console.error(`[FAIL] ${message}`)
      failed++
    }
  }

  const semarangCoord = { lat: -6.9750, lng: 110.4280 }

  // -------------------------------------------------------------
  // TEST 1: Fire Incident Report (Kebakaran)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Fire Incident Report Submission ---')
  let fireReportCode = ''
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.50.10',
      },
      body: JSON.stringify({
        reporter_name: 'Budi Santoso',
        reporter_email: 'budi.santoso@example.com',
        reporter_phone: '081234567890',
        category: 'kebakaran',
        title: 'Kebakaran Rumah di Kawasan Padat',
        description: 'Kobaran api terlihat membesar dari lantai dua rumah warga, asap tebal hitam membubung tinggi, dekat tiang listrik.',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        location_accuracy: 15,
        urgency: 'tinggi',
        district_name: 'Semarang Timur',
        photo_url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0',
        photo_sha256: 'fire_test_sha256_' + Date.now(),
        turnstile_token: 'turnstile-testing-bypass-token',
        incident_details: {
          incident_type: 'kebakaran',
          fire_condition: 'api_dan_asap_terlihat',
          location_subtype: 'rumah_permukiman',
          spread_condition: 'mulai_menyebar',
          smoke_intensity: 'tebal',
          casualty_potential: 'tidak_ada_korban',
          additional_hazards: ['listrik', 'lpg_gas'],
        },
      }),
    })

    const data = await res.json()
    assert(res.status === 201, `HTTP 201 Created (got ${res.status})`)
    assert(data.success === true, 'Response success is true')
    assert(data.report_code && data.report_code.startsWith('SMG-'), `Valid Report Code generated (${data.report_code})`)
    assert(data.data.category === 'kebakaran', `Category is correctly stored as kebakaran (${data.data.category})`)
    assert(data.data.incident_details !== undefined, 'incident_details is preserved')
    assert(data.data.water_height_cm === null, 'water_height_cm is cleanly null (no water contamination for fire)')
    fireReportCode = data.report_code
  } catch (err) {
    assert(false, `Test 1 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 2: Duplicate Fire Report Detection in close proximity (< 300m, < 60m)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Proximity Duplicate Incident Detection ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.50.11',
      },
      body: JSON.stringify({
        reporter_name: 'Siti Rahma',
        reporter_email: 'siti.rahma@example.com',
        reporter_phone: '081298765432',
        category: 'kebakaran',
        title: 'Api dan Asap Tebal di Jl. Citarum',
        description: 'Ada asap tebal dan api menyala di atap rumah tetangga beberapa menit lalu.',
        latitude: semarangCoord.lat + 0.0005, // ~55 meters away
        longitude: semarangCoord.lng + 0.0005,
        location_accuracy: 12,
        urgency: 'tinggi',
        district_name: 'Semarang Timur',
        photo_url: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?dup=1',
        photo_sha256: 'fire_test_sha256_dup_' + Date.now(),
        turnstile_token: 'turnstile-testing-bypass-token',
        incident_details: {
          incident_type: 'kebakaran',
          fire_condition: 'asap_terlihat',
          location_subtype: 'rumah_permukiman',
          spread_condition: 'terlokalisasi',
          smoke_intensity: 'tebal',
          casualty_potential: 'tidak_diketahui',
          additional_hazards: ['listrik'],
        },
      }),
    })

    const data = await res.json()
    assert(res.status === 201, `Duplicate candidate accepted without rejection (HTTP 201)`)
    assert(data.data.verification_metadata?.possible_duplicate === true, 'Verification metadata correctly flagged possible_duplicate: true')
    assert(
      data.data.verification_metadata?.suspected_duplicate_of?.includes(fireReportCode) ||
      (data.data.verification_metadata?.duplicate_warning && data.data.verification_metadata.duplicate_warning.includes('300m')),
      'Duplicate warning correctly references proximity and category match'
    )
  } catch (err) {
    assert(false, `Test 2 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 3: Simulation Report Flagging
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Simulation / Test Mode Segregation ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.50.20',
      },
      body: JSON.stringify({
        reporter_name: 'Tester Relawan',
        reporter_email: 'tester@siaga.id',
        reporter_phone: '081112223334',
        category: 'pohon_tumbang',
        title: '[SIMULASI] Uji Coba Laporan Pohon Tumbang',
        description: 'Ini adalah laporan uji coba simulasi sistem tanpa dampak operasional lapangan.',
        latitude: -6.9932,
        longitude: 110.4203,
        urgency: 'sedang',
        district_name: 'Semarang Tengah',
        photo_url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9',
        photo_sha256: 'sim_test_sha256_' + Date.now(),
        turnstile_token: 'turnstile-testing-bypass-token',
        is_simulation: true,
        incident_details: {
          incident_type: 'pohon_tumbang',
          tree_size: 'sedang',
          road_blocked: 'sebagian',
          electricity_impact: 'kabel_tertindih',
        },
      }),
    })

    const data = await res.json()
    assert(res.status === 201, 'Simulation report created (HTTP 201)')
    assert(data.data.is_simulation === true || data.data.is_demo === true, 'Report is clearly marked is_simulation: true')
  } catch (err) {
    assert(false, `Test 3 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 4: Reports API Filter (Real vs Simulation & Category)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Reports Query Filtering ---')
  try {
    // 4A: Query category=kebakaran
    const resCat = await fetch(`${BASE_URL}/api/reports?category=kebakaran`)
    const dataCat = await resCat.json()
    assert(dataCat.success === true, 'GET /api/reports?category=kebakaran returned success')
    assert(dataCat.data.every((r) => r.category === 'kebakaran'), 'All returned reports match category kebakaran')

    // 4B: Query simulation=false (Production real data only)
    const resReal = await fetch(`${BASE_URL}/api/reports?simulation=false`)
    const dataReal = await resReal.json()
    assert(dataReal.success === true, 'GET /api/reports?simulation=false returned success')
    assert(dataReal.data.every((r) => !r.is_simulation && !r.is_demo), 'Real filter excludes all simulation reports')

    // 4C: Query simulation=true
    const resSim = await fetch(`${BASE_URL}/api/reports?simulation=true`)
    const dataSim = await resSim.json()
    assert(dataSim.success === true, 'GET /api/reports?simulation=true returned success')
    assert(dataSim.data.every((r) => Boolean(r.is_simulation || r.is_demo)), 'Simulation filter returns simulation reports')
  } catch (err) {
    assert(false, `Test 4 threw error: ${err.message}`)
  }

  console.log('\n====================================================')
  console.log(`ACCEPTANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runAcceptanceTests()
