import assert from 'node:assert/strict'
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

let envLocal = {}
try {
  const content = fs.readFileSync('.env.local', 'utf-8')
  content.split('\n').forEach(line => {
    const parts = line.split('=')
    if (parts.length >= 2 && !parts[0].trim().startsWith('#')) {
      const k = parts[0].trim()
      const v = parts.slice(1).join('=').trim().replace(/^["'](.*)["']$/, '$1')
      envLocal[k] = v
    }
  })
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envLocal.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envLocal.SUPABASE_SERVICE_ROLE_KEY || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🧪 Starting Verification Status End-to-End Test Suite...\n')

assert.ok(supabaseUrl && serviceRoleKey, 'Supabase URL and Service Role Key must be present')
const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function runE2ETests() {
  const testReportCode = `TEST-E2E-${Date.now().toString().slice(-6)}`
  let createdReportId = null

  try {
    // ----------------------------------------------------
    // TEST 1: Create report -> report tersimpan with verification_status
    // ----------------------------------------------------
    console.log('--- TEST 1: Create Report ---')
    const { data: created, error: createErr } = await adminSupabase
      .from('reports')
      .insert({
        report_code: testReportCode,
        category: 'genangan',
        description: 'E2E automated test report for verification_status audit',
        latitude: -6.9932,
        longitude: 110.4203,
        urgency: 'sedang',
        status: 'submitted',
        verification_status: 'pending',
        credibility_score: 85,
        verification_metadata: {
          test: true,
          verification_status: 'pending',
        },
      })
      .select()
      .single()

    assert.ifError(createErr, `Failed to create report: ${createErr?.message}`)
    assert.ok(created && created.id, 'Report must be created with valid ID')
    createdReportId = created.id
    assert.equal(created.status, 'submitted', 'Initial status must be submitted')
    assert.equal(created.verification_status, 'pending', 'Initial verification_status must be pending')
    console.log(`✅ PASS: Report created (${testReportCode}, ID: ${createdReportId}) with status=submitted, verification_status=pending`)

    // ----------------------------------------------------
    // TEST 2: Open report -> report dapat dibaca
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Read Report ---')
    const { data: fetched, error: fetchErr } = await adminSupabase
      .from('reports')
      .select('*')
      .eq('id', createdReportId)
      .single()

    assert.ifError(fetchErr, `Failed to fetch report: ${fetchErr?.message}`)
    assert.equal(fetched.id, createdReportId)
    assert.equal(fetched.verification_status, 'pending')
    console.log('✅ PASS: Report fetched successfully, verification_status verified.')

    // ----------------------------------------------------
    // TEST 3: Update: pending -> verified
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Update pending -> verified ---')
    const { data: verified, error: verifyErr } = await adminSupabase
      .from('reports')
      .update({
        status: 'verified',
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdReportId)
      .select()
      .single()

    assert.ifError(verifyErr, `Failed to update to verified: ${verifyErr?.message}`)
    assert.equal(verified.status, 'verified', 'status must be verified')
    assert.equal(verified.verification_status, 'verified', 'verification_status must be verified')
    console.log('✅ PASS: Report successfully transitioned to status=verified, verification_status=verified')

    // ----------------------------------------------------
    // TEST 4: Update: verified -> rejected
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Update verified -> rejected ---')
    const { data: rejected, error: rejectErr } = await adminSupabase
      .from('reports')
      .update({
        status: 'rejected',
        verification_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', createdReportId)
      .select()
      .single()

    assert.ifError(rejectErr, `Failed to update to rejected: ${rejectErr?.message}`)
    assert.equal(rejected.status, 'rejected', 'status must be rejected')
    assert.equal(rejected.verification_status, 'rejected', 'verification_status must be rejected')
    console.log('✅ PASS: Report successfully transitioned to status=rejected, verification_status=rejected')

    // ----------------------------------------------------
    // TEST 5: Invalid status -> ditolak dengan aman
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Invalid Status Rejection ---')
    const { error: invalidStatusErr } = await adminSupabase
      .from('reports')
      .update({
        verification_status: 'invalid_malicious_status',
      })
      .eq('id', createdReportId)

    assert.ok(invalidStatusErr !== null, 'Database constraint must reject invalid verification_status')
    console.log(`✅ PASS: Invalid verification_status rejected by database constraint: [${invalidStatusErr.code}] ${invalidStatusErr.message}`)

    // ----------------------------------------------------
    // TEST 6: Unauthorized user -> tidak dapat mengubah status
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Unauthorized User Access Control ---')
    if (anonKey) {
      const anonSupabase = createClient(supabaseUrl, anonKey)
      const { data: anonUpdate, error: anonErr } = await anonSupabase
        .from('reports')
        .update({ status: 'verified', verification_status: 'verified' })
        .eq('id', createdReportId)
        .select()

      // Anon user must either get an error or 0 rows modified (RLS)
      assert.ok(
        anonErr !== null || (anonUpdate && anonUpdate.length === 0),
        'Anonymous user must NOT be permitted to modify report status'
      )
      console.log('✅ PASS: Unauthorized anonymous client blocked from modifying reports by RLS.')
    }

    // ----------------------------------------------------
    // TEST 7: Verification_status query / filter
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Filtering by verification_status ---')
    const { data: filtered, error: filterErr } = await adminSupabase
      .from('reports')
      .select('id, report_code, verification_status')
      .eq('verification_status', 'rejected')
      .limit(5)

    assert.ifError(filterErr)
    assert.ok(filtered.some((r) => r.id === createdReportId), 'Newly rejected report must appear in filtered list')
    console.log(`✅ PASS: Indexed query by verification_status succeeded (${filtered.length} rows returned).`)

    // ----------------------------------------------------
    // TEST 8: State persistence & Data Integrity
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Re-verifying State Persistence ---')
    const { data: rechecked, error: recheckErr } = await adminSupabase
      .from('reports')
      .select('status, verification_status')
      .eq('id', createdReportId)
      .single()

    assert.ifError(recheckErr)
    assert.equal(rechecked.status, 'rejected')
    assert.equal(rechecked.verification_status, 'rejected')
    console.log('✅ PASS: State persisted across queries identically.')

  } finally {
    // Cleanup test record
    if (createdReportId) {
      await adminSupabase.from('reports').delete().eq('id', createdReportId)
      console.log(`\n🧹 Cleaned up temporary test report: ${testReportCode}`)
    }
  }

  console.log('\n🎉 ALL E2E VERIFICATION STATUS TESTS PASSED!')
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err)
  process.exit(1)
})
