// ============================================================
// KotaKu Siaga — End-to-End Production Hardening & QA Suite
// Tests Fire Report Rejection State Synchronization,
// Authentication Failure Detection, SOC Threat Alerting,
// and Role Authorization Separation.
// ============================================================

import assert from 'assert'

const BASE_URL = 'http://localhost:3000'

let passed = 0
let failed = 0

function logPass(msg) {
  passed++
  console.log(`  ✅ [PASS] ${msg}`)
}

function logFail(msg, err) {
  failed++
  console.error(`  ❌ [FAIL] ${msg}:`, err?.message || err)
}

async function postJson(path, body, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  let data = null
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, headers: res.headers, data }
}

async function getJson(path, headers = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
  })
  let data = null
  try {
    data = await res.json()
  } catch {}
  return { status: res.status, headers: res.headers, data }
}

async function runE2ETests() {
  console.log('\n======================================================')
  console.log('   KOTAKU SIAGA — END-TO-END QA & VERIFICATION')
  console.log('======================================================\n')

  // -----------------------------------------------------------
  // 1. FIRE REPORT REJECTION & ACTIVE DETECTION FILTERING
  // -----------------------------------------------------------
  console.log('--- 1. FIRE REPORT REJECTION & ACTIVE DETECTION FILTERING ---')

  try {
    const res = await getJson('/api/reports?category=kebakaran&status=active&limit=50')
    assert.strictEqual(res.status, 200, 'GET /api/reports?category=kebakaran&status=active returns HTTP 200')
    assert.ok(res.data.success, 'Response success is true')
    assert.ok(Array.isArray(res.data.data), 'Returns array of reports')

    // Verify rejected report 20ccf901-cf57-4615-904f-1712d89f0ef1 is NOT present
    const rejectedReport = res.data.data.find((r) => r.id === '20ccf901-cf57-4615-904f-1712d89f0ef1')
    assert.strictEqual(rejectedReport, undefined, 'Rejected fire report is strictly excluded from active reports query')
    
    // Ensure no report with status 'rejected' or verification_status 'rejected' is in active list
    const hasAnyRejected = res.data.data.some((r) => r.status === 'rejected' || r.verification_status === 'rejected')
    assert.strictEqual(hasAnyRejected, false, 'Zero rejected reports in active detection stream')

    logPass('Fire report rejection sync: rejected reports strictly excluded from active stream')
  } catch (err) {
    logFail('Fire report rejection sync failed', err)
  }

  // Test Fire Cases API
  try {
    const casesRes = await getJson('/api/fire/cases')
    assert.strictEqual(casesRes.status, 200, 'GET /api/fire/cases returns HTTP 200')
    assert.ok(casesRes.data.success, 'Cases response success is true')
    logPass('Fire cases API operational and returns valid structured schema')
  } catch (err) {
    logFail('Fire cases API check failed', err)
  }

  // -----------------------------------------------------------
  // 2. AUTHENTICATION & SECURITY AUDIT TEST CASES
  // -----------------------------------------------------------
  console.log('\n--- 2. AUTHENTICATION & SECURITY AUDIT TEST CASES ---')

  let adminCookie = ''

  // Case 1: Valid operator.siaga login
  try {
    const res = await postJson('/api/auth/login', {
      identifier: 'operator.siaga',
      password: 'Siaga@Prod_26!K7m',
    })
    assert.strictEqual(res.status, 200, 'operator.siaga login returns HTTP 200')
    assert.ok(res.data.success, 'Login response success is true')
    assert.strictEqual(res.data.user.role, 'admin', 'operator.siaga resolves to role: admin')

    const setCookie = res.headers.get('set-cookie')
    assert.ok(setCookie && setCookie.includes('kotaku_admin_session'), 'Issues kotaku_admin_session cookie')
    adminCookie = setCookie.split(';')[0]
    logPass('Case 1: operator.siaga valid login -> HTTP 200 + role admin + signed session cookie')
  } catch (err) {
    logFail('Case 1 failed', err)
  }

  // Case 2: operator.siaga invalid password -> failed + audit event + alert
  try {
    const res = await postJson('/api/auth/login', {
      identifier: 'operator.siaga',
      password: 'WrongPassword123!',
    })
    assert.strictEqual(res.status, 401, 'Invalid password returns HTTP 401')
    assert.strictEqual(res.data.success, false, 'Response success is false')
    assert.strictEqual(res.data.error, 'Username atau password tidak valid.', 'Generic anti-enumeration message')
    logPass('Case 2: operator.siaga invalid password -> HTTP 401 with generic error (anti-enumeration)')
  } catch (err) {
    logFail('Case 2 failed', err)
  }

  // Case 3: tester.civic invalid password -> failed + audit event
  try {
    const res = await postJson('/api/auth/login', {
      identifier: 'tester.civic',
      password: 'WrongPassword456!',
    })
    assert.strictEqual(res.status, 401, 'tester.civic invalid password returns HTTP 401')
    assert.strictEqual(res.data.success, false, 'Response success is false')
    assert.strictEqual(res.data.error, 'Username atau password tidak valid.', 'Generic anti-enumeration message')
    logPass('Case 3: tester.civic invalid password -> HTTP 401 with generic error')
  } catch (err) {
    logFail('Case 3 failed', err)
  }

  // Case 4: Unknown username + invalid password -> failed + audit event
  try {
    const res = await postJson('/api/auth/login', {
      identifier: 'fictional.user.nonexistent',
      password: 'SomeRandomPassword!',
    })
    assert.strictEqual(res.status, 401, 'Unknown user returns HTTP 401')
    assert.strictEqual(res.data.error, 'Username atau password tidak valid.', 'Identical generic response')
    logPass('Case 4: Unknown username -> HTTP 401 identical message (prevents user enumeration)')
  } catch (err) {
    logFail('Case 4 failed', err)
  }

  // Case 5: Valid account + insufficient role (tester.civic) -> authentication success + authorization denied
  try {
    const res = await postJson('/api/auth/login', {
      identifier: 'tester.civic',
      password: 'Siaga@Prod_26!K7m',
    })
    assert.strictEqual(res.status, 403, 'tester.civic returns HTTP 403 Forbidden')
    assert.strictEqual(res.data.success, false, 'Response success is false')
    assert.strictEqual(res.data.code, 'AUTHORIZATION_DENIED', 'Code is AUTHORIZATION_DENIED')
    assert.ok(res.data.error.includes('citizen'), 'Informs user of citizen role restriction for command center')
    assert.strictEqual(res.data.role, 'citizen', 'Role correctly identified as citizen')
    
    // Ensure no session cookie was issued
    const setCookie = res.headers.get('set-cookie')
    assert.ok(!setCookie || !setCookie.includes('kotaku_admin_session='), 'Strictly NO admin session cookie issued to citizen')
    logPass('Case 5: tester.civic valid credentials -> HTTP 403 AUTHORIZATION_DENIED (Separates auth from authorization)')
  } catch (err) {
    logFail('Case 5 failed', err)
  }

  // Case 6: Inspect security audit logs & alert feed
  try {
    const auditRes = await getJson('/api/auth/security-alerts', {
      Cookie: adminCookie,
    })
    assert.strictEqual(auditRes.status, 200, 'GET /api/auth/security-alerts returns HTTP 200 with admin cookie')
    assert.ok(auditRes.data.success, 'Security alerts response success is true')
    assert.ok(Array.isArray(auditRes.data.data), 'Data is array of audit records')
    assert.ok(auditRes.data.count >= 4, `Contains audit events (count: ${auditRes.data.count})`)

    // Verify events recorded
    const events = auditRes.data.data
    const hasOpFailed = events.some((e) => e.identifier === 'operator.siaga' && e.event === 'AUTH_LOGIN_FAILED')
    const hasCivicFailed = events.some((e) => e.identifier === 'tester.civic' && e.event === 'AUTH_LOGIN_FAILED')
    const hasAuthDenied = events.some((e) => e.identifier === 'tester.civic' && e.event === 'AUTH_SUCCESS_AUTHORIZATION_DENIED')
    const hasOpSuccess = events.some((e) => e.identifier === 'operator.siaga' && e.event === 'AUTH_LOGIN_SUCCESS')

    assert.ok(hasOpFailed, 'Audit log recorded operator.siaga AUTH_LOGIN_FAILED')
    assert.ok(hasCivicFailed, 'Audit log recorded tester.civic AUTH_LOGIN_FAILED')
    assert.ok(hasAuthDenied, 'Audit log recorded tester.civic AUTH_SUCCESS_AUTHORIZATION_DENIED')
    assert.ok(hasOpSuccess, 'Audit log recorded operator.siaga AUTH_LOGIN_SUCCESS')

    // Verify NO password or token in any log record
    const allJson = JSON.stringify(events)
    assert.ok(!allJson.includes('Siaga@Prod_26!K7m'), 'Strictly ZERO passwords leaked in audit logs')
    assert.ok(!allJson.includes('WrongPassword'), 'Strictly ZERO invalid passwords leaked in audit logs')

    logPass('Case 6: Security audit trail verified: events recorded, zero secret/password leakage')
  } catch (err) {
    logFail('Case 6 failed', err)
  }

  // Case 7: Unauthorized request to security alerts endpoint is blocked
  try {
    const unauthRes = await getJson('/api/auth/security-alerts')
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request to /api/auth/security-alerts returns HTTP 401')
    logPass('Case 7: Security alerts endpoint strictly protected from unauthenticated access')
  } catch (err) {
    logFail('Case 7 failed', err)
  }

  console.log('\n======================================================')
  console.log(`   QA SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('======================================================\n')

  if (failed > 0) process.exit(1)
}

runE2ETests().catch((err) => {
  console.error('E2E Execution Error:', err)
  process.exit(1)
})
