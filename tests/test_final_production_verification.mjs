// ============================================================
// KotaKu Siaga — Final Production Fix Verification Suite
// Tests Fire Report Rejection State Synchronization,
// Authentication Failure Detection, SOC Threat Alerting,
// and Role Authorization Separation.
// ============================================================

import assert from 'assert'
import fs from 'fs'
import {
  isActiveFireReport,
  isReportActive,
  isFireCaseActive,
  filterActiveFireReports,
} from '../lib/services/fire-status.ts'

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=')
  if (k && v.length) env[k] = v.join('=').trim()
})

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`  ✅ [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message)
    failed++
  }
}

async function testAsync(name, fn) {
  try {
    await fn()
    console.log(`  ✅ [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message)
    failed++
  }
}

async function runAllTests() {
  console.log('\n======================================================')
  console.log('   KOTAKU SIAGA — PRODUCTION VERIFICATION TEST SUITE')
  console.log('======================================================\n')

  // -----------------------------------------------------------
  // SECTION 1: FIRE REPORT SINGLE SOURCE OF TRUTH & REJECTION
  // -----------------------------------------------------------
  console.log('--- SECTION 1: Fire Report State Single Source of Truth ---')

  test('Active fire report is correctly identified as ACTIVE', () => {
    const activeReport = {
      id: 'rep-fire-01',
      category: 'kebakaran',
      status: 'submitted',
      verification_status: 'verified',
    }
    assert.strictEqual(isActiveFireReport(activeReport), true)
    assert.strictEqual(isReportActive(activeReport), true)
  })

  test('Rejected fire report is strictly EXCLUDED from active detection', () => {
    const rejectedReport = {
      id: 'rep-fire-02',
      category: 'kebakaran',
      status: 'rejected',
      verification_status: 'rejected',
    }
    assert.strictEqual(isActiveFireReport(rejectedReport), false)
    assert.strictEqual(isReportActive(rejectedReport), false)
  })

  test('Resolved fire report is strictly EXCLUDED from active detection', () => {
    const resolvedReport = {
      id: 'rep-fire-03',
      category: 'kebakaran',
      status: 'resolved',
      verification_status: 'verified',
    }
    assert.strictEqual(isActiveFireReport(resolvedReport), false)
    assert.strictEqual(isReportActive(resolvedReport), false)
  })

  test('Cancelled or duplicate fire report is strictly EXCLUDED', () => {
    const cancelled = { id: 'c1', category: 'kebakaran', status: 'cancelled' }
    const duplicate = { id: 'c2', category: 'kebakaran', status: 'duplicate' }
    assert.strictEqual(isActiveFireReport(cancelled), false)
    assert.strictEqual(isActiveFireReport(duplicate), false)
  })

  test('filterActiveFireReports removes all inactive items deterministically', () => {
    const reports = [
      { id: '1', category: 'kebakaran', status: 'submitted' },
      { id: '2', category: 'kebakaran', status: 'rejected' },
      { id: '3', category: 'kebakaran', status: 'resolved' },
      { id: '4', category: 'kebakaran', status: 'under_review' },
      { id: '5', category: 'genangan', status: 'submitted' }, // Non-fire category
    ]
    const filtered = filterActiveFireReports(reports)
    assert.strictEqual(filtered.length, 2)
    assert.deepStrictEqual(filtered.map((r) => r.id), ['1', '4'])
  })

  test('FireInvestigationCase active status correctly respects REJECTED/RESOLVED', () => {
    assert.strictEqual(isFireCaseActive({ status: 'NEW' }), true)
    assert.strictEqual(isFireCaseActive({ status: 'UNDER_REVIEW' }), true)
    assert.strictEqual(isFireCaseActive({ status: 'VERIFIED' }), true)
    assert.strictEqual(isFireCaseActive({ status: 'REJECTED' }), false)
    assert.strictEqual(isFireCaseActive({ status: 'RESOLVED' }), false)
    assert.strictEqual(isFireCaseActive({ status: 'DISMISSED' }), false)
  })

  // -----------------------------------------------------------
  // SECTION 2: SECURITY LOGGER & AUDIT EVENT INTEGRITY
  // -----------------------------------------------------------
  console.log('\n--- SECTION 2: Security Audit Logger & SOC Threat Detection ---')

  const {
    recordAuthFailure,
    recordAuthSuccess,
    recordAuthorizationDenied,
    getRecentSecurityLogs,
    getSecurityAlerts,
  } = await import('../lib/audit/security-logger.ts')

  await testAsync('recordAuthFailure creates structured event without storing password', async () => {
    const event = await recordAuthFailure({
      identifier: 'operator.siaga',
      source_ip: '192.168.1.50',
      user_agent: 'Mozilla/5.0 Test Browser',
      reason: 'invalid_credentials',
    })

    assert.strictEqual(event.event, 'AUTH_LOGIN_FAILED')
    assert.strictEqual(event.identifier, 'operator.siaga')
    assert.strictEqual(event.success, false)
    assert.strictEqual(event.severity, 'HIGH') // Privileged target elevated
    assert.strictEqual(event.alert_triggered, true) // Alert triggered for critical account
    assert.ok(event.id, 'Has unique event UUID')
    assert.ok(event.created_at, 'Has ISO timestamp')

    // Stringify and verify NO password or secret keys exist in the event
    const jsonStr = JSON.stringify(event)
    assert.ok(!jsonStr.includes('password'), 'Strictly no password field in security record')
    assert.ok(!jsonStr.includes('secret'), 'Strictly no secret field in security record')
  })

  await testAsync('Case C: recordAuthorizationDenied logs citizen role denial for command center', async () => {
    const event = await recordAuthorizationDenied({
      identifier: 'tester.civic',
      role: 'citizen',
      requiredRole: 'officer|admin',
      source_ip: '192.168.1.60',
    })

    assert.strictEqual(event.event, 'AUTH_SUCCESS_AUTHORIZATION_DENIED')
    assert.strictEqual(event.success, true) // Authentication itself succeeded
    assert.strictEqual(event.severity, 'LOW')
    assert.strictEqual(event.reason, 'insufficient_role_for_command_center')
  })

  await testAsync('getRecentSecurityLogs and getSecurityAlerts retrieve active events', async () => {
    const logs = await getRecentSecurityLogs({ limit: 10 })
    assert.ok(Array.isArray(logs), 'Logs is an array')
    assert.ok(logs.length >= 2, 'Contains the recently recorded audit events')

    const alerts = await getSecurityAlerts(5)
    assert.ok(Array.isArray(alerts), 'Alerts is an array')
    assert.ok(alerts.some((a) => a.identifier === 'operator.siaga'), 'Contains operator.siaga alert')
  })

  console.log('\n======================================================')
  console.log(`   FINAL TEST RESULT: ${passed} PASSED, ${failed} FAILED`)
  console.log('======================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runAllTests().catch((err) => {
  console.error('Test execution error:', err)
  process.exit(1)
})
