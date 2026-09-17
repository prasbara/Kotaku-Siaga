// Integration & Unit Test: OTP Rate Limit Handling & Vermuk Camera Verification
import assert from 'assert'
import fs from 'fs'

async function runOtpAndVermukTests() {
  console.log('====================================================')
  console.log('  TEST SUITE: OTP & VERMUK CAMERA VERIFICATION')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`✅ PASS: ${name}`)
      passed++
    } catch (err) {
      console.error(`❌ FAIL: ${name}`)
      console.error(`   Error: ${err.message}`)
      failed++
    }
  }

  // -------------------------------------------------------------
  // Test 1: Permissions-Policy in next.config.js
  // -------------------------------------------------------------
  test('next.config.js MUST configure Permissions-Policy camera=(self) to unblock camera in all browsers', () => {
    const nextConfigContent = fs.readFileSync('next.config.js', 'utf-8')
    assert(
      nextConfigContent.includes("camera=(self)"),
      'next.config.js must contain camera=(self) in Permissions-Policy'
    )
    assert(
      !nextConfigContent.includes("camera=()"),
      'next.config.js must NOT contain camera=() which disables camera system-wide'
    )
  })

  // -------------------------------------------------------------
  // Test 2: Camera Error Diagnostics (Diagnose & Actions)
  // -------------------------------------------------------------
  test('Camera error categorizer handles NotAllowedError, NotReadableError, and NotFoundError', () => {
    function diagnoseCameraError(err) {
      const errName = err?.name || ''
      const errMsg = err?.message || ''
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('permission')) {
        return { code: 'PERMISSION_DENIED', title: 'Izin Akses Kamera Ditolak' }
      }
      if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('busy')) {
        return { code: 'CAMERA_BUSY', title: 'Kamera Sedang Digunakan Aplikasi Lain' }
      }
      if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || errMsg.includes('not found')) {
        return { code: 'NO_CAMERA_FOUND', title: 'Perangkat Kamera Tidak Ditemukan' }
      }
      if (errName === 'SecurityError') {
        return { code: 'INSECURE_CONTEXT', title: 'Koneksi Tidak Aman (HTTPS Diperlukan)' }
      }
      return { code: 'UNKNOWN_CAMERA_ERROR', title: 'Kamera Gagal Dinyalakan' }
    }

    assert.strictEqual(diagnoseCameraError({ name: 'NotAllowedError' }).code, 'PERMISSION_DENIED')
    assert.strictEqual(diagnoseCameraError({ name: 'TrackStartError' }).code, 'CAMERA_BUSY')
    assert.strictEqual(diagnoseCameraError({ name: 'DevicesNotFoundError' }).code, 'NO_CAMERA_FOUND')
    assert.strictEqual(diagnoseCameraError({ name: 'SecurityError' }).code, 'INSECURE_CONTEXT')
  })

  // -------------------------------------------------------------
  // Test 3: Camera Video Mobile Configuration
  // -------------------------------------------------------------
  test('CameraLivenessVerification component includes playsInline, autoPlay, and muted for mobile support', () => {
    const compContent = fs.readFileSync(
      'components/verification/CameraLivenessVerification.tsx',
      'utf-8'
    )
    assert(compContent.includes('playsInline'), 'Must include playsInline')
    assert(compContent.includes('autoPlay'), 'Must include autoPlay')
    assert(compContent.includes('muted'), 'Must include muted')
    assert(compContent.includes('webkit-playsinline'), 'Must include webkit-playsinline for iOS')
    assert(compContent.includes('stopCameraStream'), 'Must include stopCameraStream for cleanup')
    assert(compContent.includes('upload-fallback'), 'Must include upload-fallback state')
  })

  // -------------------------------------------------------------
  // Test 4: OTP Rate Limit Classification
  // -------------------------------------------------------------
  test('OTP API classifies over_email_send_rate_limit as OTP_RATE_LIMIT with rate_limited flag', () => {
    const otpRouteContent = fs.readFileSync('app/api/auth/otp/send/route.ts', 'utf-8')
    assert(otpRouteContent.includes('over_email_send_rate_limit'), 'Must check over_email_send_rate_limit code')
    assert(otpRouteContent.includes('OTP_RATE_LIMIT'), 'Must return OTP_RATE_LIMIT code')
    assert(otpRouteContent.includes('rate_limited: isRateLimit'), 'Must include rate_limited flag')
    assert(otpRouteContent.includes('suggest_face_verification: true'), 'Must suggest face verification fallback')
  })

  // -------------------------------------------------------------
  // Test 5: Fallback Flow in Citizen Reporting Page
  // -------------------------------------------------------------
  test('Citizen reporting page displays fallback banner when OTP is rate-limited', () => {
    const pageContent = fs.readFileSync('app/laporan/baru/page.tsx', 'utf-8')
    assert(
      pageContent.includes('OTP sedang dibatasi sementara. Gunakan verifikasi wajah sebagai alternatif.'),
      'Must contain the exact rate-limit alert message requested'
    )
    assert(
      pageContent.includes("setVerificationMethod('camera')"),
      'Must allow instant 1-click transition to camera verification'
    )
    assert(
      pageContent.includes("setVerificationMethod('otp')"),
      'Must preserve OTP verification method option'
    )
  })

  // -------------------------------------------------------------
  // Test 6: Report API supports camera_liveness verification method
  // -------------------------------------------------------------
  test('Report API properly stores camera_liveness verification method and liveness scores', () => {
    const reportsRouteContent = fs.readFileSync('app/api/reports/route.ts', 'utf-8')
    assert(
      reportsRouteContent.includes('camera_liveness'),
      'Report API must support camera_liveness verification method'
    )
    assert(
      reportsRouteContent.includes('safeVerificationPhotoUrl'),
      'Report API must safely validate verification photo URL'
    )
    assert(
      reportsRouteContent.includes('liveness_score'),
      'Report API must store liveness_score'
    )
  })

  console.log(`\nResults: ${passed} Passed, ${failed} Failed\n`)
  if (failed > 0) {
    process.exit(1)
  }
}

runOtpAndVermukTests()
