/**
 * KotaKu Siaga Civic Radar v1.1
 * Vercel Serverless CPU-Only Computer Vision Test Suite
 * Validates LightweightCVEngine, Batching, Vercel Cron, CCTV Observations, and Deduplication
 */

const assert = require('assert')

async function runTests() {
  console.log('=================================================================')
  console.log('KOTAKU SIAGA v1.1 — VERCEL CPU-ONLY COMPUTER VISION TEST SUITE')
  console.log('=================================================================')

  const baseUrl = 'http://localhost:3000'

  // -----------------------------------------------------------------
  // TEST 1: Engine Initialization & Default Vercel Abstraction
  // -----------------------------------------------------------------
  console.log('\n--- TEST 1: Engine Initialization & Vercel Serverless Default ---')
  const scanRes = await fetch(`${baseUrl}/api/cctv/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: 1 }),
  }).then((r) => r.json())

  assert.strictEqual(scanRes.success, true, 'Scan API must succeed')
  assert.strictEqual(
    scanRes.engine,
    'LightweightCVEngine',
    'Vercel default engine must be LightweightCVEngine (CPU-only)'
  )
  console.log(`✓ Test 1 Passed: Engine=${scanRes.engine} (Default CPU-only on Vercel)`)

  // -----------------------------------------------------------------
  // TEST 2: Fast CPU Execution on Real PantauSemar Stream
  // -----------------------------------------------------------------
  console.log('\n--- TEST 2: Real CCTV Stream CPU Execution Time ---')
  const camResult = scanRes.results[0]
  assert.ok(camResult.camera_id, 'Camera ID must be present')
  assert.ok(camResult.processing_time_ms < 1500, 'Processing time must be < 1.5s on CPU')
  console.log(
    `✓ Test 2 Passed: Camera=${camResult.camera_code} (${camResult.camera_name}), Status=${camResult.cctv_status}, Time=${camResult.processing_time_ms}ms`
  )

  // -----------------------------------------------------------------
  // TEST 3: Offline Camera Methodology (Section 12 & 28)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 3: Offline CCTV Methodology (UNKNOWN ≠ NO_FLOOD) ---')
  const statusRes = await fetch(
    `${baseUrl}/api/cctv/cctv-ps-414-321/status`
  ).then((r) => r.json())
  assert.strictEqual(statusRes.success, true)
  assert.ok(statusRes.data.methodology_note, 'Methodology note must be documented')
  assert.ok(
    !statusRes.data.methodology_note.includes('aman'),
    'Offline camera must not declare area is safe'
  )
  console.log(
    `✓ Test 3 Passed: Methodology preserved -> ${statusRes.data.methodology_note}`
  )

  // -----------------------------------------------------------------
  // TEST 4: Vercel Cron Priority Batch Processing (Section 9 & 10)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 4: Vercel Cron Batch Processing (/api/cron/cctv-analysis) ---')
  const cronRes = await fetch(`${baseUrl}/api/cron/cctv-analysis?limit=3`).then(
    (r) => r.json()
  )
  assert.strictEqual(cronRes.success, true, 'Cron endpoint must succeed')
  assert.strictEqual(cronRes.engine, 'LightweightCVEngine')
  assert.ok(cronRes.batch_size <= 3, 'Batch size must respect limit')
  assert.ok(
    cronRes.execution_time_ms < 5000,
    'Batch must complete well within Vercel timeout (< 5s)'
  )
  console.log(
    `✓ Test 4 Passed: Batch Size=${cronRes.batch_size}, Total Time=${cronRes.execution_time_ms}ms (<5s Vercel limit)`
  )

  // -----------------------------------------------------------------
  // TEST 5: CCTV Observations Storage & History (Section 13)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 5: CCTV Observations Recording & Retrieval ---')
  const obsRes = await fetch(
    `${baseUrl}/api/cctv/cctv-ps-414-321/observations?limit=5`
  ).then((r) => r.json())
  assert.strictEqual(obsRes.success, true)
  assert.ok(Array.isArray(obsRes.data), 'Observations data must be array')
  assert.ok(obsRes.total_observations >= 1, 'At least 1 observation must be recorded')
  const latestObs = obsRes.data[0]
  assert.ok(typeof latestObs.visual_score === 'number', 'visual_score must be number')
  assert.ok(
    typeof latestObs.water_region_score === 'number',
    'water_region_score must be number'
  )
  assert.ok(
    typeof latestObs.road_coverage_score === 'number',
    'road_coverage_score must be number'
  )
  assert.ok(
    typeof latestObs.temporal_score === 'number',
    'temporal_score must be number'
  )
  console.log(
    `✓ Test 5 Passed: Recorded ${obsRes.total_observations} observations. Latest: VisualScore=${latestObs.visual_score}, WaterScore=${latestObs.water_region_score}, Severity=${latestObs.estimated_visual_severity}`
  )

  // -----------------------------------------------------------------
  // TEST 6: Event Deduplication & Separate Confidence Scores (Section 7 & 14)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 6: Flood Event Deduplication & Separate Confidence Scores ---')
  const eventsRes = await fetch(`${baseUrl}/api/flood-events`).then((r) =>
    r.json()
  )
  assert.strictEqual(eventsRes.success, true)
  const activeEvs = eventsRes.data.filter(
    (e) => e.camera_id === 'cctv-ps-414-321' && e.status !== 'resolved'
  )
  // Deduplication check: at most 1 active event for this camera
  assert.ok(
    activeEvs.length <= 1,
    'Deduplication violation: more than 1 active event for camera'
  )
  if (eventsRes.data.length > 0) {
    const sample = eventsRes.data[0]
    assert.ok(
      typeof sample.model_confidence === 'number',
      'visual/model confidence must exist'
    )
    assert.ok(
      typeof sample.event_confidence === 'number',
      'composite event confidence must exist'
    )
    assert.ok(
      typeof sample.corroboration_score === 'number',
      'corroboration score must exist'
    )
    assert.ok(
      ['minor', 'moderate', 'severe'].includes(sample.estimated_visual_severity),
      'severity must be visual classification'
    )
    console.log(
      `✓ Test 6 Passed: Deduplication verified. Event=${sample.event_id}, ModelConf=${sample.model_confidence}, Corroboration=${sample.corroboration_score}, EventConf=${sample.event_confidence}, Severity=${sample.estimated_visual_severity}`
    )
  }

  // -----------------------------------------------------------------
  // TEST 7: Telegram Zero-Tolerance Audit (Section 20)
  // -----------------------------------------------------------------
  console.log('\n--- TEST 7: Telegram Integration Audit ---')
  const fs = require('fs')
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
  const hasTelegramPkg = Object.keys(allDeps).some((d) =>
    d.toLowerCase().includes('telegram')
  )
  assert.strictEqual(
    hasTelegramPkg,
    false,
    'Telegram package found in dependencies!'
  )
  console.log('✓ Test 7 Passed: ZERO Telegram dependencies in project.')

  console.log('\n=================================================================')
  console.log('ALL 7 VERCEL SERVERLESS CPU-ONLY TESTS PASSED SUCCESSFULLY (100%)')
  console.log('=================================================================')
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err)
  process.exit(1)
})
