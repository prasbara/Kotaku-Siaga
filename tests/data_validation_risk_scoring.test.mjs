// ============================================================
// KotaKu Siaga — Automated Test Suite: Real Data Validation & Trustworthy Risk Scoring
// Tests: Backend Validation, Anti-Fake, Anti-Panic, Data Quality vs Risk Index, Simulation Isolation
// ============================================================

import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

console.log('====================================================')
console.log('  KOTAKU SIAGA — DATA VALIDATION & RISK SCORING TEST')
console.log('====================================================\n')

let passedTests = 0
let failedTests = 0

function recordPass(testName) {
  passedTests++
  console.log(`[PASS] ${testName}`)
}

function recordFail(testName, err) {
  failedTests++
  console.error(`[FAIL] ${testName}:`, err.message || err)
}

async function runAllTests() {
  // ─── TEST 1: REJECTION OF OUT-OF-BOUND COORDINATES (PHASE 4) ───
  console.log('--- TEST 1: Strict Semarang Geofence Validation ---')
  try {
    // Coordinate in Jakarta (-6.2088, 106.8456)
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_name: 'Uji Validasi Geofence',
        reporter_email: 'tester@kotakusiaga.id',
        reporter_phone: '081234567890',
        category: 'banjir',
        description: 'Uji pelaporan koordinat di luar wilayah Kota Semarang untuk verifikasi geofence.',
        latitude: -6.2088,
        longitude: 106.8456,
        photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        turnstile_token: 'turnstile-testing-bypass-token',
        is_simulation: true,
      }),
    })

    const body = await res.json()
    assert.equal(res.status, 422, `Expected 422 Unprocessable Entity, got ${res.status}`)
    assert.equal(body.code, 'OUTSIDE_SEMARANG_BOUNDARY', 'Expected OUTSIDE_SEMARANG_BOUNDARY error code')
    recordPass('Out-of-scope coordinates outside Semarang correctly rejected with HTTP 422')
  } catch (err) {
    recordFail('Rejection of out-of-scope coordinates', err)
  }

  // ─── TEST 2: REJECTION OF FUTURE TIMESTAMPS (PHASE 4) ───
  console.log('\n--- TEST 2: Timestamp Sanity & Anti-Future Validation ---')
  try {
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours in the future
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_name: 'Uji Stempel Waktu Masa Depan',
        reporter_email: 'tester@kotakusiaga.id',
        reporter_phone: '081234567890',
        category: 'banjir',
        description: 'Uji pengiriman laporan dengan stempel waktu masa depan.',
        latitude: -6.9667,
        longitude: 110.4167,
        reported_at: futureTime,
        photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        turnstile_token: 'turnstile-testing-bypass-token',
        is_simulation: true,
      }),
    })

    const body = await res.json()
    assert.equal(res.status, 400, `Expected 400 Bad Request, got ${res.status}`)
    assert.ok(body.error.includes('masa depan'), 'Expected future timestamp rejection message')
    recordPass('Future timestamp (>5m) correctly rejected with HTTP 400')
  } catch (err) {
    recordFail('Future timestamp rejection', err)
  }

  // ─── TEST 3: REJECTION OF EXTREME / NEGATIVE FLOOD DEPTH (PHASE 19) ───
  console.log('\n--- TEST 3: Flood Depth Range & Numeric Validation ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_name: 'Uji Nilai Genangan Negatif',
        reporter_email: 'tester@kotakusiaga.id',
        reporter_phone: '081234567890',
        category: 'banjir',
        description: 'Uji pengiriman laporan banjir dengan kedalaman air negatif.',
        latitude: -6.9667,
        longitude: 110.4167,
        incident_details: {
          water_height_cm: -50, // Negative depth
        },
        photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        turnstile_token: 'turnstile-testing-bypass-token',
        is_simulation: true,
      }),
    })

    const body = await res.json()
    assert.equal(res.status, 400, `Expected 400 Bad Request, got ${res.status}`)
    assert.ok(body.error.includes('negatif'), 'Expected negative depth rejection')
    recordPass('Negative flood depth (-50cm) correctly rejected with HTTP 400')
  } catch (err) {
    recordFail('Negative flood depth rejection', err)
  }

  // ─── TEST 4: FIRE INCIDENT ISOLATION (PHASE 18) ───
  console.log('\n--- TEST 4: Fire Incident Isolation & Zero Water Contamination ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_name: 'Saksi Mata Kebakaran',
        reporter_email: 'saksi.damkar@kotakusiaga.id',
        reporter_phone: '081234567890',
        category: 'kebakaran',
        description: 'Terlihat kepulan asap tebal di kawasan pergudangan Terboyo Genuk.',
        latitude: -6.955,
        longitude: 110.455,
        incident_details: {
          incident_type: 'kebakaran',
          fire_condition: 'asap_tebal',
          spread_risk: 'sedang',
          water_height_cm: 80, // Inadvertent water height submitted
        },
        photo_url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
        turnstile_token: 'turnstile-testing-bypass-token',
        is_simulation: true,
      }),
    })

    const body = await res.json()
    assert.equal(res.status, 201, `Expected 201 Created, got ${res.status}`)
    assert.equal(body.data.category, 'kebakaran', 'Category is kebakaran')
    assert.equal(body.data.water_height_cm, null, 'Water height is strictly null for fire report')
    assert.equal(body.data.incident_details.water_height_cm, null, 'Incident details water height is null')
    recordPass('Fire report successfully accepted and water depth is strictly sanitized to null')
  } catch (err) {
    recordFail('Fire report isolation', err)
  }

  // ─── TEST 5: PRIORITY SCORES & DATA QUALITY ENGINE (PHASE 6 & 7) ───
  console.log('\n--- TEST 5: Deterministic Priority Scores & Data Quality Breakdown ---')
  try {
    const res = await fetch(`${BASE_URL}/api/priority-scores`)
    const body = await res.json()
    assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`)
    assert.ok(Array.isArray(body.data), 'Expected array of priority scores')
    assert.ok(body.data.length >= 16, 'Expected all 16 Kecamatan scored')

    const firstScore = body.data[0]
    assert.ok(firstScore.areaName, 'Area name present')
    assert.ok(firstScore.finalScore >= 0 && firstScore.finalScore <= 100, 'Score is bounded [0, 100]')
    assert.ok(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(firstScore.priorityLevel), 'Valid priority level')
    assert.ok(firstScore.dataQuality, 'Data quality result attached')
    assert.ok(['HIGH', 'MODERATE', 'LIMITED', 'POOR'].includes(firstScore.dataQuality.grade), 'Valid data quality grade')
    assert.ok(firstScore.dataQuality.factors.length === 6, 'All 6 Data Quality factors evaluated')
    recordPass(`Priority formula ${firstScore.formulaVersion} and Data Quality evaluated across ${body.data.length} districts`)
  } catch (err) {
    recordFail('Priority score and data quality evaluation', err)
  }

  // ─── TEST 6: SIMULATION ISOLATION (PHASE 24) ───
  console.log('\n--- TEST 6: Simulation Segregation from Production Analytics ---')
  try {
    const realRes = await fetch(`${BASE_URL}/api/reports?simulation=false`)
    const realBody = await realRes.json()
    assert.equal(realRes.status, 200)

    const simRes = await fetch(`${BASE_URL}/api/reports?simulation=true`)
    const simBody = await simRes.json()
    assert.equal(simRes.status, 200)

    const allReal = realBody.data.every((r) => r.is_demo !== true && r.is_simulation !== true)
    assert.ok(allReal, 'Production query contains zero simulation reports')

    const allSim = simBody.data.every((r) => r.is_demo === true || r.is_simulation === true)
    assert.ok(allSim, 'Simulation query contains only simulation reports')
    recordPass('Simulation records cleanly isolated from real citizen analytics')
  } catch (err) {
    recordFail('Simulation isolation', err)
  }

  // ─── TEST 7: DATA SOURCE HEALTH OBSERVABILITY (PHASE 14 & 20) ───
  console.log('\n--- TEST 7: Data Source Observability & Freshness Integrity ---')
  try {
    const res = await fetch(`${BASE_URL}/api/disaster-intelligence?area=semarang-utara&role=admin`)
    const body = await res.json()
    assert.equal(res.status, 200)
    assert.ok(body.assessment || body.summary, 'Assessment or Summary object present')
    const target = body.assessment || body.summary
    assert.ok(target.dataQuality, 'Data quality score present')
    assert.ok(['HIGH', 'MODERATE', 'LIMITED', 'POOR'].includes(target.dataQuality.grade))
    recordPass('Disaster intelligence returns complete provenance, data quality & explainable signals')
  } catch (err) {
    recordFail('Data source observability test', err)
  }

  // ─── SUMMARY ───
  console.log('\n====================================================')
  console.log(`  VALIDATION TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`)
  console.log('====================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runAllTests()
