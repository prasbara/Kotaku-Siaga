import fs from 'fs'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=')
  if (k && v.length) env[k] = v.join('=').trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://njvwdjbaatdjgtuwstie.supabase.co'
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY
const adminClient = createClient(supabaseUrl, supabaseServiceKey)

const BASE_URL = 'http://localhost:3000'

let totalPassed = 0
let totalFailed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`)
    totalPassed++
  } else {
    console.error(`[FAIL] ${message}`)
    totalFailed++
  }
}

async function runAuditTests() {
  console.log('=================================================================')
  console.log('  KOTAKU SIAGA — FINAL PRODUCTION HARDENING & INTEGRITY AUDIT')
  console.log('=================================================================\n')

  // SECTION 1: EXIF TIMESTAMP & 24-HOUR RULE VALIDATION
  console.log('--- SECTION 1: EXIF Timestamp & 24-Hour Rule Validation ---')

  // 1A. Generate JPEG with recent EXIF (consistent, within 24h)
  const now = new Date()
  const recentExifDate = new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
  const pad = (n) => String(n).padStart(2, '0')
  const recentExifString = `${recentExifDate.getFullYear()}:${pad(recentExifDate.getMonth() + 1)}:${pad(recentExifDate.getDate())} ${pad(recentExifDate.getHours())}:${pad(recentExifDate.getMinutes())}:${pad(recentExifDate.getSeconds())}`

  const recentBuffer = await sharp({
    create: { width: 40, height: 40, channels: 3, background: { r: 50, g: 150, b: 200 } }
  }).withMetadata({
    exif: { IFD0: { DateTime: recentExifString } }
  }).jpeg().toBuffer()

  const recentBase64 = `data:image/jpeg;base64,${recentBuffer.toString('base64')}`

  // Submit test report with consistent EXIF
  const rep1Res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'genangan',
      description: 'Audit test: Genangan air hujan terpantau 25 cm di bahu jalan raya Kaligawe',
      latitude: -6.9667,
      longitude: 110.4200,
      district_name: 'Genuk',
      reporter_name: 'Audit Officer 1',
      reporter_email: 'audit1@kotakusiaga.id',
      reporter_phone: '081234567891',
      photo_url: recentBase64,
      verification_method: 'otp',
      email_verified: true,
      turnstile_token: 'turnstile-safe-fallback',
      is_test_mode: true,
    })
  })
  const rep1 = await rep1Res.json()
  assert(rep1Res.status === 201, `Consistent EXIF report accepted (HTTP ${rep1Res.status})`)
  assert(rep1.success === true, `Report created with code: ${rep1.report_code}`)

  // Verify in database
  const { data: dbRep1 } = await adminClient.from('reports').select('*').eq('report_code', rep1.report_code).single()
  assert(dbRep1 !== null, `Database record confirmed in Supabase`)
  assert(dbRep1.verification_metadata?.capture_timestamp_status === 'timestamp_consistent', `EXIF status is 'timestamp_consistent': got ${dbRep1?.verification_metadata?.capture_timestamp_status}`)
  assert(dbRep1.verification_metadata?.capture_timestamp_age_hours >= 1.5, `EXIF age calculated accurately: ~${dbRep1?.verification_metadata?.capture_timestamp_age_hours}h`)

  // 1B. Generate JPEG with stale EXIF (> 24 hours ago)
  const staleExifDate = new Date(now.getTime() - 48 * 60 * 60 * 1000) // 48 hours ago
  const staleExifString = `${staleExifDate.getFullYear()}:${pad(staleExifDate.getMonth() + 1)}:${pad(staleExifDate.getDate())} ${pad(staleExifDate.getHours())}:${pad(staleExifDate.getMinutes())}:${pad(staleExifDate.getSeconds())}`

  const staleBuffer = await sharp({
    create: { width: 40, height: 40, channels: 3, background: { r: 200, g: 100, b: 50 } }
  }).withMetadata({
    exif: { IFD0: { DateTime: staleExifString } }
  }).jpeg().toBuffer()

  const staleBase64 = `data:image/jpeg;base64,${staleBuffer.toString('base64')}`

  const rep2Res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'genangan',
      description: 'Audit test: Foto lama dokumentasi genangan banjir rob 48 jam lalu',
      latitude: -6.9602,
      longitude: 110.4721,
      district_name: 'Genuk',
      reporter_name: 'Audit Officer 2',
      reporter_email: 'audit2@kotakusiaga.id',
      reporter_phone: '081234567892',
      photo_url: staleBase64,
      verification_method: 'otp',
      email_verified: true,
      turnstile_token: 'turnstile-safe-fallback',
      is_test_mode: true,
    })
  })
  const rep2 = await rep2Res.json()
  assert(rep2Res.status === 201, `Stale EXIF report NOT rejected (Zero fraud assumption), accepted with risk signal`)
  const { data: dbRep2 } = await adminClient.from('reports').select('*').eq('report_code', rep2.report_code).single()
  assert(dbRep2.verification_metadata?.capture_timestamp_status === 'stale_evidence', `EXIF flagged as 'stale_evidence': got ${dbRep2?.verification_metadata?.capture_timestamp_status}`)
  assert(dbRep2.verification_metadata?.warnings?.some(w => w.includes('older than 24h')), `Risk signal contains 'older than 24h' warning`)

  // 1C. Generate image with NO EXIF (must be timestamp_unavailable, NOT rejected)
  const noExifBuffer = await sharp({
    create: { width: 40, height: 40, channels: 3, background: { r: 100, g: 100, b: 100 } }
  }).png().toBuffer()
  const noExifBase64 = `data:image/png;base64,${noExifBuffer.toString('base64')}`

  const rep3Res = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'pohon_tumbang',
      description: 'Audit test: Pohon patah dahan di jalan pemuda tanpa metadata EXIF peramban',
      latitude: -6.9854,
      longitude: 110.4085,
      district_name: 'Semarang Tengah',
      reporter_name: 'Audit Officer 3',
      reporter_email: 'audit3@kotakusiaga.id',
      reporter_phone: '081234567893',
      photo_url: noExifBase64,
      verification_method: 'otp',
      email_verified: true,
      turnstile_token: 'turnstile-safe-fallback',
      is_test_mode: true,
    })
  })
  const rep3 = await rep3Res.json()
  assert(rep3Res.status === 201, `No-EXIF report accepted gracefully`)
  const { data: dbRep3 } = await adminClient.from('reports').select('*').eq('report_code', rep3.report_code).single()
  assert(dbRep3.verification_metadata?.capture_timestamp_status === 'timestamp_unavailable', `Missing EXIF has status 'timestamp_unavailable'`)

  // SECTION 2: CAMERA REPORTER VERIFICATION (Liveness + Privacy)
  console.log('\n--- SECTION 2: Camera Reporter Verification (Liveness & Private Storage) ---')
  const cameraSelfieBuffer = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 240, g: 200, b: 180 } }
  }).jpeg().toBuffer()
  const cameraSelfieBase64 = `data:image/jpeg;base64,${cameraSelfieBuffer.toString('base64')}`

  const repCamRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'kebakaran',
      description: 'Audit test: Verifikasi kamera pelapor terdeteksi asap tebal di lahan kosong',
      latitude: -6.9700,
      longitude: 110.4300,
      district_name: 'Semarang Timur',
      reporter_name: 'Fauzan Camera Tester',
      reporter_email: 'camera.tester@kotakusiaga.id',
      reporter_phone: '081298765432',
      photo_url: recentBase64,
      verification_method: 'camera_liveness',
      verification_status: 'verified',
      verification_photo_url: cameraSelfieBase64,
      liveness_score: 93,
      spoof_risk: 6,
      quality_score: 88,
      turnstile_token: 'turnstile-safe-fallback',
      is_test_mode: true,
    })
  })
  const repCam = await repCamRes.json()
  assert(repCamRes.status === 201, `Camera Liveness report submitted successfully`)
  const { data: dbRepCam } = await adminClient.from('reports').select('*').eq('report_code', repCam.report_code).single()
  assert(dbRepCam.verification_metadata?.verification_method === 'camera_liveness', `Verification method recorded as 'camera_liveness'`)
  assert(dbRepCam.verification_metadata?.liveness_score === 93, `Liveness score preserved: 93%`)
  assert(dbRepCam.verification_metadata?.spoof_risk === 6, `Anti-spoof risk preserved: 6%`)
  assert(dbRepCam.verification_metadata?.verification_photo_url !== null, `Reporter verification selfie stored for admin moderation`)

  // SECTION 3: REAL WEATHER DATA INGESTION & ZERO FAKE POLICY
  console.log('\n--- SECTION 3: Real Weather Data Pipeline (Open-Meteo Semarang) ---')
  const weatherRes = await fetch(`${BASE_URL}/api/weather?zone=pesisir`)
  const weather = await weatherRes.json()
  assert(weatherRes.status === 200, `Weather endpoint responded HTTP 200`)
  assert(weather.success === true, `Weather data response marked success`)
  assert(typeof weather.humidity_percent === 'number' && weather.humidity_percent >= 0 && weather.humidity_percent <= 100, `Real humidity ingested from Open-Meteo: ${weather.humidity_percent}%`)
  assert(typeof weather.temperature_c === 'number', `Real temperature ingested: ${weather.temperature_c}°C`)
  assert(weather.retrieved_at_wib?.includes('WIB'), `Observation timestamp formatted in Asia/Jakarta (WIB): ${weather.retrieved_at_wib}`)
  assert(weather.source?.includes('Open-Meteo'), `Weather provenance attributed to Open-Meteo & WMO`)

  // SECTION 4: GEOFENCING & REJECTION OF COORDINATES OUTSIDE SEMARANG
  console.log('\n--- SECTION 4: Strict Geofencing & Anti-Fake GPS Audit ---')
  const outCoordRes = await fetch(`${BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'banjir',
      description: 'Audit test: Titik di Jakarta harus ditolak karena di luar Kota Semarang',
      latitude: -6.2088, // Jakarta
      longitude: 106.8456,
      district_name: 'Jakarta',
      reporter_name: 'Outsider',
      reporter_email: 'out@test.com',
      reporter_phone: '081234567899',
      photo_url: recentBase64,
      turnstile_token: 'turnstile-safe-fallback',
      is_test_mode: true,
    })
  })
  assert(outCoordRes.status === 422, `Outside Semarang coordinate strictly rejected with HTTP 422 (got ${outCoordRes.status})`)

  // SECTION 5: ADMIN MODERATION WORKFLOW & AUDIT TRAIL
  console.log('\n--- SECTION 5: Admin Moderation Status Transitions & Detail API ---')
  const detailRes = await fetch(`${BASE_URL}/api/reports/${dbRep1.id}`, {
    headers: { Authorization: `Bearer ${supabaseServiceKey}` }
  })
  const detailData = await detailRes.json()
  assert(detailRes.status === 200, `Report Detail API accessible`)
  assert(detailData.data?.report_code === rep1.report_code, `Report code matched in detail API: ${detailData.data?.report_code}`)

  // Update Status: submitted -> in_progress
  const patchRes = await fetch(`${BASE_URL}/api/reports/${dbRep1.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({
      status: 'in_progress',
    })
  })
  assert(patchRes.status === 200, `Admin updated report status to in_progress`)
  const { data: updatedDbRep } = await adminClient.from('reports').select('status').eq('id', dbRep1.id).single()
  assert(updatedDbRep.status === 'in_progress', `Database reflects new status 'in_progress'`)

  // SECTION 6: SUPABASE STORAGE BUCKETS SECURITY
  console.log('\n--- SECTION 6: Supabase Storage Buckets Security ---')
  const { data: buckets } = await adminClient.storage.listBuckets()
  const repVerificationBucket = buckets?.find(b => b.name === 'reporter-verification')
  const repEvidenceBucket = buckets?.find(b => b.name === 'report-evidence')
  assert(repVerificationBucket !== undefined, `Bucket 'reporter-verification' exists`)
  assert(repVerificationBucket?.public === false, `Bucket 'reporter-verification' is strictly PRIVATE`)
  assert(repEvidenceBucket !== undefined, `Bucket 'report-evidence' exists`)

  // CLEANUP TEST DATA (Strictly delete ONLY test records created during this audit)
  console.log('\n--- CLEANUP: Cleaning up audit test records ---')
  const testCodes = [rep1.report_code, rep2.report_code, rep3.report_code, repCam.report_code]
  const { error: delErr } = await adminClient.from('reports').delete().in('report_code', testCodes)
  if (!delErr) {
    console.log(`Successfully cleaned up ${testCodes.length} temporary audit test records. Production records untouched.`)
  } else {
    console.warn(`Cleanup notice:`, delErr.message)
  }

  console.log('\n=================================================================')
  console.log(`  AUDIT RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`)
  console.log('=================================================================')

  if (totalFailed > 0) {
    process.exit(1)
  }
}

runAuditTests().catch(err => {
  console.error('Audit execution error:', err)
  process.exit(1)
})
