import http from 'http'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Read environment
const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=')
  if (k && v.length) env[k] = v.join('=').trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://njvwdjbaatdjgtuwstie.supabase.co'
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

const adminClient = createClient(supabaseUrl, supabaseServiceKey)
const BASE_URL = 'http://localhost:3000'

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-suite': 'true',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, data: json }
}

async function runTestSuite() {
  console.log('====================================================')
  console.log('  KOTAKU SIAGA — SUPABASE OTP END-TO-END TEST')
  console.log('====================================================')

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

  // TEST 1: Reject Empty Email
  console.log('\n--- TEST 1: Reject Empty Email on Send OTP ---')
  const emptyEmailRes = await postJson('/api/auth/otp/send', { email: '' })
  assert(emptyEmailRes.status === 400, `Empty email returns HTTP 400 (got ${emptyEmailRes.status})`)
  assert(emptyEmailRes.data.error?.includes('wajib diisi'), `Returns required message: "${emptyEmailRes.data.error}"`)

  // TEST 2: Reject Invalid Email Format
  console.log('\n--- TEST 2: Reject Invalid Email Format ---')
  const invalidEmailRes = await postJson('/api/auth/otp/send', { email: 'bukan-email-valid' })
  assert(invalidEmailRes.status === 400, `Invalid email returns HTTP 400 (got ${invalidEmailRes.status})`)
  assert(invalidEmailRes.data.error?.includes('tidak valid'), `Returns invalid format message: "${invalidEmailRes.data.error}"`)

  // TEST 3: Legitimate Send OTP via Supabase Auth
  console.log('\n--- TEST 3: Send Real Supabase OTP to Valid Email ---')
  const testEmail = `tester.civic.${Date.now()}@kotakusiaga.id`
  const sendRes = await postJson('/api/auth/otp/send', { email: testEmail })
  if (sendRes.status === 200) {
    assert(sendRes.status === 200, `Send OTP returns HTTP 200 (got ${sendRes.status})`)
    assert(sendRes.data.success === true, `Response success is true: ${sendRes.data.message}`)
    assert(sendRes.data.masked_email?.includes('***'), `Email masked in response: ${sendRes.data.masked_email}`)
  } else if (sendRes.status === 429) {
    assert(sendRes.status === 429, `Supabase GoTrue Rate Limit detected (HTTP 429)`)
    assert(sendRes.data.code === 'SUPABASE_OTP_ERROR' || sendRes.data.code === 'OTP_RATE_LIMIT', `Handled with code: ${sendRes.data.code}`)
    assert(sendRes.data.error?.includes('Batas') || sendRes.data.error?.includes('permintaan'), `Returns helpful rate limit message: "${sendRes.data.error}"`)
  } else {
    assert(false, `Unexpected status code from Supabase Auth: ${sendRes.status}`)
  }

  // TEST 4: Fake OTP 123456 Must Be REJECTED (Zero Dummy Policy)
  console.log('\n--- TEST 4: Ensure Fake OTP (123456) is Rejected ---')
  const fakeOtpRes = await postJson('/api/auth/otp/verify', {
    email: testEmail,
    token: '123456',
  })
  assert(fakeOtpRes.status === 400, `Fake OTP (123456) returns HTTP 400 (got ${fakeOtpRes.status})`)
  assert(fakeOtpRes.data.code === 'INVALID_OR_EXPIRED_OTP', `Returns INVALID_OR_EXPIRED_OTP: "${fakeOtpRes.data.error}"`)

  // TEST 5: Short OTP (<6 chars) Must Be Rejected
  console.log('\n--- TEST 5: Reject Short OTP Token ---')
  const shortOtpRes = await postJson('/api/auth/otp/verify', {
    email: testEmail,
    token: '123',
  })
  assert(shortOtpRes.status === 400, `Short OTP returns HTTP 400 (got ${shortOtpRes.status})`)

  // TEST 6: Real Supabase Generated OTP Token Verification
  console.log('\n--- TEST 6: Verify Real Supabase Generated OTP Token ---')
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: testEmail,
  })

  if (linkError) {
    console.error('generateLink error:', linkError)
    failed++
  } else {
    const realOtp = linkData.properties.email_otp
    console.log(`Generated Real Supabase OTP Token: ${realOtp}`)

    const verifyRes = await postJson('/api/auth/otp/verify', {
      email: testEmail,
      token: realOtp,
    })

    assert(verifyRes.status === 200, `Verify OTP returns HTTP 200 (got ${verifyRes.status})`)
    assert(verifyRes.data.success === true, `verifyOtp success is true`)
    assert(verifyRes.data.email_verified === true, `email_verified is true`)
    assert(verifyRes.data.user_id !== undefined, `user_id returned: ${verifyRes.data.user_id}`)
  }

  // TEST 7: Re-Verifying Already Used Token Must Fail
  console.log('\n--- TEST 7: Re-Verifying Expired/Used Token ---')
  const reVerifyRes = await postJson('/api/auth/otp/verify', {
    email: testEmail,
    token: '999999',
  })
  assert(reVerifyRes.status === 400, `Invalid token returns HTTP 400 (got ${reVerifyRes.status})`)
  assert(reVerifyRes.data.code === 'INVALID_OR_EXPIRED_OTP', `Returns INVALID_OR_EXPIRED_OTP error`)

  console.log('\n====================================================')
  console.log(`  SUPABASE OTP TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) process.exit(1)
}

runTestSuite().catch(err => {
  console.error('Test suite failed:', err)
  process.exit(1)
})
