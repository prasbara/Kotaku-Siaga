// ============================================================
// KotaKu Siaga Civic Radar v1.1 — Verification Pipeline Test Suite
// Tests 8 mandatory verification criteria defined in implementation prompt
// ============================================================

const BASE_URL = 'http://localhost:3000'

async function runTests() {
  console.log('====================================================')
  console.log('KOTAKU SIAGA CIVIC RADAR v1.1 — VERIFICATION SUITE')
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

  // Sample valid coordinates in Semarang (Kaligawe, Genuk)
  const semarangCoord = { lat: -6.9620, lng: 110.4550 }

  // -------------------------------------------------------------
  // TEST 1: Normal Report (GPS Valid, Accurate, No Duplicate)
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Normal Report (Valid GPS & Photo) ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.101',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Genangan air rob di sekitar jalan Kaligawe mencapai 30 cm, kendaraan roda dua melambat.',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        location_accuracy: 24, // 24 meters accurate
        urgency: 'tinggi',
        district_name: 'Genuk',
        photo_url: 'https://example.com/test-valid-photo.jpg',
        photo_sha256: 'test_hash_' + Date.now(),
        photo_dhash: 'a1b2c3d4e5f60001',
      }),
    })

    const data = await res.json()
    assert(res.status === 201, `Status code 201 (got ${res.status})`)
    assert(data.success === true, 'Response success is true')
    assert(data.report_code && data.report_code.startsWith('SMG-2026-'), `Report code matches SMG-2026-XXXXXX (${data.report_code})`)
    assert(data.credibility_score >= 70, `High confidence credibility score >= 70 (got ${data.credibility_score})`)
    assert(data.status === 'submitted' || data.status === 'under_review', `Status is submitted/under_review (got ${data.status})`)
  } catch (err) {
    assert(false, `Test 1 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 2: Spam Rate Limiting (Kirim >3 laporan dalam 15 menit)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Spam Protection & Rate Limiting (429) ---')
  try {
    const spammerIp = '10.20.30.40'
    let got429 = false
    let rateLimitMessage = ''

    for (let i = 1; i <= 5; i++) {
      const res = await fetch(`${BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': spammerIp,
        },
        body: JSON.stringify({
          category: 'genangan',
          description: `Spam report test request number ${i}`,
          latitude: semarangCoord.lat,
          longitude: semarangCoord.lng,
          urgency: 'rendah',
        }),
      })

      if (res.status === 429) {
        got429 = true
        const data = await res.json()
        rateLimitMessage = data.error
        break
      }
    }

    assert(got429, 'Rate limiter triggered HTTP 429 on subsequent requests')
    assert(
      rateLimitMessage.includes('Terlalu banyak laporan dikirim dalam waktu singkat'),
      `User-friendly Indonesian message returned: "${rateLimitMessage}"`
    )
  } catch (err) {
    assert(false, `Test 2 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 3: Anti-Bot Honeypot Trap
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Anti-Bot Honeypot Protection ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.103',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Laporan otomatis oleh bot spammer dengan field honeypot terisi',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        urgency: 'sedang',
        website: 'https://spamsite.example.com/promo', // Honeypot field filled!
      }),
    })

    const data = await res.json()
    assert(res.status === 201, `Request processed (got ${res.status})`)
    assert(data.status === 'suspicious', `Status flagged as 'suspicious' (got ${data.status})`)
    assert(data.credibility_score < 40, `Credibility score penalty applied < 40 (got ${data.credibility_score})`)
    assert(
      data.verification_summary?.warnings?.some((w) => w.toLowerCase().includes('bot') || w.toLowerCase().includes('honeypot')),
      'Warning explicitly mentions bot/honeypot detection'
    )
  } catch (err) {
    assert(false, `Test 3 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 4: Duplicate Image / Perceptual Hash Detection
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Duplicate Photo / Perceptual Hash Detection ---')
  try {
    const sharedPhotoDhash = '9988776655443322'
    const sharedPhotoSha = 'dup_sha256_shared_' + Date.now()

    // 1st submission with photo
    const res1 = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.104',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Foto pertama kondisi jalan tergenang air di Genuk',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        urgency: 'sedang',
        photo_url: 'https://example.com/photo-dup-orig.jpg',
        photo_sha256: sharedPhotoSha,
        photo_dhash: sharedPhotoDhash,
      }),
    })
    const data1 = await res1.json()

    // 2nd submission with the EXACT SAME photo hashes
    const res2 = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.105',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Laporan kedua yang memakai foto yang sama dari laporan pertama',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        urgency: 'sedang',
        photo_url: 'https://example.com/photo-dup-second.jpg',
        photo_sha256: sharedPhotoSha,
        photo_dhash: sharedPhotoDhash,
      }),
    })
    const data2 = await res2.json()

    assert(
      data2.verification_summary?.warnings?.some((w) => w.toLowerCase().includes('duplikat')),
      'Duplicate photo detected across reports'
    )
    assert(
      data2.data?.verification_metadata?.duplicate_photo === true,
      'verification_metadata.duplicate_photo is true'
    )
  } catch (err) {
    assert(false, `Test 4 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 5: Poor GPS Accuracy (e.g. 800m)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Poor GPS Accuracy (>500m) ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.106',
      },
      body: JSON.stringify({
        category: 'genangan',
        description: 'Laporan dari perangkat dengan sinyal satelit GPS lemah (800m)',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        location_accuracy: 800, // 800m accuracy
        urgency: 'sedang',
      }),
    })

    const data = await res.json()
    assert(res.status === 201, `Submission successful (status 201)`)
    assert(
      data.verification_summary?.warnings?.some((w) => w.toLowerCase().includes('rendah') || w.toLowerCase().includes('800')),
      'Low GPS accuracy flagged in warnings, not auto-rejected'
    )
    assert(
      data.data?.verification_metadata?.location_grade === 'low_confidence',
      'Location grade categorized as low_confidence'
    )
  } catch (err) {
    assert(false, `Test 5 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 6: CCTV Corroboration & Fallback (PantauSemar)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: CCTV PantauSemar Spatial Corroboration ---')
  try {
    // Point near Bawah Tol Kaligawe (-6.9620, 110.4550) which has PS-GEN-002 nearby
    const resNear = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.107',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Genangan di dekat underpass Kaligawe dekat kamera PantauSemar',
        latitude: -6.9620,
        longitude: 110.4550,
        urgency: 'tinggi',
      }),
    })
    const dataNear = await resNear.json()
    assert(
      dataNear.data?.verification_metadata?.cctv_evidence === 'corroborated',
      `CCTV corroborated for nearby point (got ${dataNear.data?.verification_metadata?.cctv_evidence})`
    )
    assert(
      dataNear.data?.verification_metadata?.nearest_cctv?.name !== undefined,
      `Nearest CCTV identified: ${dataNear.data?.verification_metadata?.nearest_cctv?.name}`
    )
  } catch (err) {
    assert(false, `Test 6 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 7: Weather Telemetry Cross-Reference
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Real Weather Cross-Reference ---')
  try {
    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.108',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Laporan banjir saat observasi cuaca aktif di Semarang',
        latitude: semarangCoord.lat,
        longitude: semarangCoord.lng,
        urgency: 'sedang',
      }),
    })
    const data = await res.json()
    const weatherEv = data.data?.verification_metadata?.weather_evidence
    assert(
      weatherEv === 'positive' || weatherEv === 'neutral' || weatherEv === 'unknown',
      `Weather evidence valid state (positive/neutral/unknown): got "${weatherEv}"`
    )
  } catch (err) {
    assert(false, `Test 7 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // TEST 8: Crowd Corroboration (Radius <= 300m, Time <= 30 min)
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Spatio-Temporal Crowd Corroboration ---')
  try {
    const crowdLat = -6.9650
    const crowdLng = 110.4600

    // Report A
    await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.109',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Genangan air rob pertama di jalan arteri Kaligawe Genuk',
        latitude: crowdLat,
        longitude: crowdLng,
        urgency: 'tinggi',
      }),
    })

    // Report B (100 meters away, 1 second later)
    const resB = await fetch(`${BASE_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.110',
      },
      body: JSON.stringify({
        category: 'banjir',
        description: 'Genangan air rob kedua oleh warga lain di lokasi yang sama',
        latitude: crowdLat + 0.0008, // ~90 meters
        longitude: crowdLng + 0.0005,
        urgency: 'tinggi',
      }),
    })
    const dataB = await resB.json()

    assert(
      dataB.data?.verification_metadata?.corroboration_count >= 1,
      `Crowd corroboration detected (count: ${dataB.data?.verification_metadata?.corroboration_count})`
    )
    assert(
      dataB.verification_summary?.positive_evidence?.some((e) => e.toLowerCase().includes('radius 300') || e.toLowerCase().includes('laporan')),
      'Positive evidence mentions crowd corroborating reports'
    )
  } catch (err) {
    assert(false, `Test 8 threw error: ${err.message}`)
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================')
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
