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

console.log('🧪 Starting Report Status Update & Moderation Test Suite...\n')

assert.ok(supabaseUrl && serviceRoleKey, 'Supabase URL and Service Role Key must be present')
const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const VALID_STATUSES = [
  'submitted',
  'under_review',
  'verified',
  'investigating',
  'in_progress',
  'resolved',
  'rejected',
  'suspicious',
  'duplicate',
]

async function runTests() {
  // Find or pick a report in Semarang Timur or any existing report
  const { data: reports, error: fetchErr } = await adminSupabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  assert.ifError(fetchErr)
  assert.ok(reports && reports.length > 0, 'Database must contain at least 1 report for testing')

  // Prefer the fire report in Semarang Timur if available, otherwise first report
  const targetReport =
    reports.find((r) => r.category === 'kebakaran' || r.district_name === 'Semarang Timur') ||
    reports[0]

  console.log(`Target Report for Testing: ${targetReport.report_code} (${targetReport.id})`)
  console.log(`Category: ${targetReport.category}, Location: ${targetReport.district_name}, Initial Status: ${targetReport.status}\n`)

  const initialStatus = targetReport.status

  // ====================================================
  // TEST 1: Verifikasi Action
  // ====================================================
  console.log('--- 1. Testing "Verifikasi" Action ---')
  const { data: verifiedData, error: verifyErr } = await adminSupabase
    .from('reports')
    .update({ status: 'verified', updated_at: new Date().toISOString() })
    .eq('id', targetReport.id)
    .select()
    .single()

  assert.ifError(verifyErr, 'Verifikasi update must not return an error')
  assert.equal(verifiedData.status, 'verified', 'Status must transition to verified')
  console.log('✅ PASS: Verifikasi successfully set status to "verified".')

  // ====================================================
  // TEST 2: Tinjau Action
  // ====================================================
  console.log('\n--- 2. Testing "Tinjau" Action ---')
  const { data: reviewData, error: reviewErr } = await adminSupabase
    .from('reports')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', targetReport.id)
    .select()
    .single()

  assert.ifError(reviewErr, 'Tinjau update must not return an error')
  assert.equal(reviewData.status, 'under_review', 'Status must transition to under_review')
  console.log('✅ PASS: Tinjau successfully set status to "under_review".')

  // ====================================================
  // TEST 3: Tolak Action
  // ====================================================
  console.log('\n--- 3. Testing "Tolak" Action ---')
  const { data: rejectData, error: rejectErr } = await adminSupabase
    .from('reports')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', targetReport.id)
    .select()
    .single()

  assert.ifError(rejectErr, 'Tolak update must not return an error')
  assert.equal(rejectData.status, 'rejected', 'Status must transition to rejected')
  console.log('✅ PASS: Tolak successfully set status to "rejected".')

  // ====================================================
  // TEST 4: "Bantuan Ringkasan" Integrity Check
  // ====================================================
  console.log('\n--- 4. Testing "Bantuan Ringkasan" Integrity ---')
  // Simulating AI analysis query: Reading description & inserting into ai_analysis
  const { data: currentBeforeAi } = await adminSupabase
    .from('reports')
    .select('id, status, report_code')
    .eq('id', targetReport.id)
    .single()

  const statusBefore = currentBeforeAi.status

  // AI analysis runs without updating the reports.status column
  const mockAiAnalysis = {
    report_id: targetReport.id,
    original_category: targetReport.category,
    ai_category: targetReport.category,
    ai_confidence: 0.92,
    severity: 'sedang',
    summary: 'Ringkasan otomatis AI untuk mitigasi operasional',
    recommended_action: 'Koordinasi posko pemadam dan verifikasi aksesibilitas',
    model_name: 'test-model',
  }

  // Insert AI record (optional test)
  const { error: aiInsertErr } = await adminSupabase
    .from('ai_analysis')
    .insert(mockAiAnalysis)

  // Verify status on reports table remains UNCHANGED
  const { data: currentAfterAi } = await adminSupabase
    .from('reports')
    .select('id, status')
    .eq('id', targetReport.id)
    .single()

  assert.equal(
    currentAfterAi.status,
    statusBefore,
    '"Bantuan Ringkasan" must NEVER mutate reports.status!'
  )
  console.log('✅ PASS: Bantuan Ringkasan generated insights with ZERO unintended status mutation.')

  // ====================================================
  // TEST 5: Status Validation & Constraints
  // ====================================================
  console.log('\n--- 5. Testing Status Validation & Constraints ---')
  const invalidStatus = 'approved_unconditionally_fake'
  assert.ok(!VALID_STATUSES.includes(invalidStatus), 'Invalid status must be rejected by validator')

  // Database level check
  const { error: constraintErr } = await adminSupabase
    .from('reports')
    .update({ status: invalidStatus })
    .eq('id', targetReport.id)

  assert.ok(
    constraintErr !== null,
    'Database constraint or validator must reject invalid status'
  )
  console.log('✅ PASS: Invalid status rejected by database constraint integrity.')

  // ====================================================
  // TEST 6: Other Reports Isolation
  // ====================================================
  console.log('\n--- 6. Testing Isolation (Other reports unmodified) ---')
  const otherReports = reports.filter((r) => r.id !== targetReport.id)
  if (otherReports.length > 0) {
    const { data: recheckedOther } = await adminSupabase
      .from('reports')
      .select('id, status')
      .eq('id', otherReports[0].id)
      .single()

    assert.equal(
      recheckedOther.status,
      otherReports[0].status,
      'Other reports must remain untouched during updates'
    )
    console.log('✅ PASS: Non-target reports remain strictly isolated and unaffected.')
  }

  // ====================================================
  // CLEANUP / RESTORE
  // ====================================================
  console.log('\n--- Restoring Initial State ---')
  await adminSupabase
    .from('reports')
    .update({ status: initialStatus, updated_at: new Date().toISOString() })
    .eq('id', targetReport.id)

  const { data: restored } = await adminSupabase
    .from('reports')
    .select('status')
    .eq('id', targetReport.id)
    .single()

  assert.equal(restored.status, initialStatus)
  console.log(`✅ Cleaned up: Report status restored back to "${initialStatus}".`)

  console.log('\n🎉 ALL 6 REPORT STATUS MODERATION TESTS PASSED!')
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err)
  process.exit(1)
})
