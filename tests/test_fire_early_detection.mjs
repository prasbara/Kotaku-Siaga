// ============================================================
// KotaKu Siaga — Fire Early Detection & Monitoring System E2E Test
// Automated Test Suite for NASA FIRMS Ingestion, Correlation Engine,
// Case Verification, Auditability, and Command Centre API.
// ============================================================

const BASE_URL = 'http://localhost:3000'

async function runTests() {
  console.log('====================================================')
  console.log('🚀 TESTING FIRE EARLY DETECTION & COMMAND CENTRE')
  console.log('====================================================\n')

  let passed = 0
  let total = 0

  function assert(condition, testName, details = '') {
    total++
    if (condition) {
      console.log(`✅ PASS [${total}]: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAIL [${total}]: ${testName}`)
      if (details) console.error(`   Details: ${details}`)
    }
  }

  try {
    // 1. Test Source Health & Stats API
    console.log('\n--- 1. Testing Fire Stats & Source Health API ---')
    const statsRes = await fetch(`${BASE_URL}/api/fire/stats`)
    assert(statsRes.ok, 'GET /api/fire/stats returns HTTP 200')
    const statsData = await statsRes.json()
    assert(statsData.success === true, 'Stats response contains success: true')
    assert(statsData.data.sources_health !== undefined, 'Sources health object is present')
    assert(
      statsData.data.sources_health.nasa_firms.status === 'CONNECTED' ||
      statsData.data.sources_health.nasa_firms.status === 'DEGRADED' ||
      statsData.data.sources_health.nasa_firms.status === 'UNAVAILABLE',
      'NASA FIRMS status is valid standard enum (CONNECTED/DEGRADED/UNAVAILABLE)'
    )
    assert(
      statsData.data.sources_health.sipongi_klhk !== undefined,
      'SiPongi+ KLHK status is tracked'
    )
    assert(
      statsData.data.sources_health.semarisk_bpbd !== undefined,
      'SEMARISK BPBD status is tracked'
    )

    // 2. Test Ingesting a Simulated / Near-Realtime Fire Observation
    console.log('\n--- 2. Testing Fire Observation Ingestion ---')
    const nowIso = new Date().toISOString()
    const testObsPayload = {
      source: 'NASA_FIRMS_VIIRS',
      source_record_id: `TEST_SNPP_${Date.now()}`,
      latitude: -6.9554,
      longitude: 110.4182, // Semarang Utara
      observed_at: nowIso,
      satellite: 'Suomi-NPP',
      instrument: 'VIIRS',
      confidence: 'high',
      frp: 18.5,
      day_night: 'D',
      district_name: 'Kecamatan Semarang Utara',
      is_simulation: true,
    }

    const ingestRes = await fetch(`${BASE_URL}/api/fire/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testObsPayload),
    })
    assert(ingestRes.ok, 'POST /api/fire/observations returns HTTP 200')
    const ingestData = await ingestRes.json()
    assert(ingestData.success === true, 'Observation ingestion success')
    assert(ingestData.data.id !== undefined, 'Generated observation has ID')
    const createdObsId = ingestData.data.id

    // 3. Test Fetching Fire Observations
    console.log('\n--- 3. Testing Fire Observations Query ---')
    const obsListRes = await fetch(`${BASE_URL}/api/fire/observations`)
    assert(obsListRes.ok, 'GET /api/fire/observations returns HTTP 200')
    const obsListData = await obsListRes.json()
    assert(Array.isArray(obsListData.data), 'Observations data is an array')
    assert(obsListData.data.some((o) => o.id === createdObsId), 'Created observation is listed in store')

    // 4. Test Multi-Source Correlation Engine & Investigation Cases
    console.log('\n--- 4. Testing Multi-Source Correlation & Priority Engine ---')
    const casesRes = await fetch(`${BASE_URL}/api/fire/cases`)
    assert(casesRes.ok, 'GET /api/fire/cases returns HTTP 200')
    const casesData = await casesRes.json()
    assert(Array.isArray(casesData.data), 'Cases data is an array')
    assert(casesData.data.length > 0, 'Correlation engine generated at least 1 investigation case')

    const targetCase = casesData.data.find((c) => c.signals.some((s) => s.id === createdObsId))
    assert(Boolean(targetCase), 'Target investigation case contains the ingested satellite signal')
    if (targetCase) {
      assert(
        ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(targetCase.detection_priority),
        'Detection priority is valid enum (CRITICAL/HIGH/MEDIUM/LOW)'
      )
      assert(
        Array.isArray(targetCase.correlation_reasons) && targetCase.correlation_reasons.length > 0,
        'Correlation reasons are transparent and auditable'
      )
      assert(
        Array.isArray(targetCase.timeline) && targetCase.timeline.length > 0,
        'Investigation case has audit trail timeline'
      )
    }

    // 5. Test Operator Case Status Update (Under Review)
    console.log('\n--- 5. Testing Operator Status Transition (Under Review) ---')
    if (targetCase) {
      const patchRes = await fetch(`${BASE_URL}/api/fire/cases/${targetCase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'UNDER_REVIEW',
          notes: 'Petugas operator memulai asesmen visual dengan armada pos terdekat.',
          actor: 'Operator EOC Damkar',
        }),
      })
      assert(patchRes.ok, 'PATCH /api/fire/cases/[id] returns HTTP 200')
      const patchData = await patchRes.json()
      assert(patchData.data.status === 'UNDER_REVIEW', 'Case status successfully transitioned to UNDER_REVIEW')
      assert(
        patchData.data.timeline.some((t) => t.label.includes('UNDER_REVIEW')),
        'Status transition recorded in timeline audit trail'
      )
    }

    // 6. Test Human / Operator Verification Workflow -> Generates FireIncident
    console.log('\n--- 6. Testing Human Verification -> FireIncident Creation ---')
    if (targetCase) {
      const verifyRes = await fetch(`${BASE_URL}/api/fire/cases/${targetCase.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fire_type: 'Building / Settlement',
          severity: 'tinggi',
          location_address: 'Jl. Bandarharjo No. 45, Semarang Utara',
          notes: 'Diverifikasi via pengecekan fisik unit Damkar Semarang Utara.',
          verified_by: 'Kapten Damkar Kota Semarang',
        }),
      })
      assert(verifyRes.ok, 'POST /api/fire/cases/[id]/verify returns HTTP 200')
      const verifyData = await verifyRes.json()
      assert(verifyData.success === true, 'Verification success')
      assert(verifyData.data.incident !== undefined, 'Official FireIncident was generated')
      assert(
        verifyData.data.incident.verification_status === 'VERIFIED',
        'FireIncident has VERIFIED status'
      )
      assert(
        verifyData.data.incident.source_lineage.length >= 2,
        'FireIncident retains source provenance lineage (Satellite + Responder)'
      )

      // 7. Test Verified Incidents Query
      console.log('\n--- 7. Testing Verified Incidents Query ---')
      const incRes = await fetch(`${BASE_URL}/api/fire/incidents`)
      assert(incRes.ok, 'GET /api/fire/incidents returns HTTP 200')
      const incData = await incRes.json()
      assert(Array.isArray(incData.data), 'Incidents data is an array')
      assert(
        incData.data.some((i) => i.id === verifyData.data.incident.id),
        'Newly verified incident appears in verified incidents registry'
      )
    }

    // 8. Re-test Stats API for consistency
    console.log('\n--- 8. Testing Post-Verification Telemetry & Counts ---')
    const finalStatsRes = await fetch(`${BASE_URL}/api/fire/stats`)
    const finalStats = await finalStatsRes.json()
    assert(
      finalStats.data.verified_incidents_count >= 1,
      'Final stats reflects verified incident count accurately'
    )
  } catch (err) {
    console.error('Test execution exception:', err)
  }

  console.log('\n====================================================')
  console.log(`📊 TEST RESULTS: ${passed}/${total} PASS (${Math.round((passed / total) * 100)}%)`)
  console.log('====================================================\n')

  if (passed === total) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}

runTests()
