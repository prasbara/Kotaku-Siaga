import assert from 'node:assert/strict'
import { localSosStore } from '../lib/services/local-sos-store.ts'

console.log('🧪 Running SOS Status Sealing & Mutation Verification Tests...\n')

// 1. Create a test SOS ticket
const testTicket = localSosStore.create({
  latitude: -6.9932,
  longitude: 110.4203,
  description: 'Test emergency SOS for sealing verification',
  status: 'NEW',
})

assert.ok(testTicket.id, 'SOS ticket created with an ID')
assert.strictEqual(testTicket.status, 'NEW', 'Initial status must be NEW')
console.log('✅ Created test SOS ticket:', testTicket.sos_code, 'with status NEW')

// 2. Dispatch the ticket
const dispatched = localSosStore.update(testTicket.id, { status: 'DISPATCHED' })
assert.strictEqual(dispatched?.status, 'DISPATCHED', 'Status should advance to DISPATCHED')
assert.ok(dispatched?.dispatched_at, 'Dispatched timestamp should be recorded')
console.log('✅ Dispatched test SOS ticket successfully')

// 3. Resolve the ticket (reaches final state)
const resolved = localSosStore.update(testTicket.id, { status: 'RESOLVED' })
assert.strictEqual(resolved?.status, 'RESOLVED', 'Status should reach RESOLVED')
assert.ok(resolved?.resolved_at, 'Resolved timestamp should be recorded')
console.log('✅ Resolved test SOS ticket (now sealed)')

// 4. Attempt to mutate sealed status back to NEW or DISPATCHED
const attemptedRegression = localSosStore.update(testTicket.id, { status: 'NEW' })
assert.strictEqual(
  attemptedRegression?.status,
  'RESOLVED',
  'Status must remain RESOLVED and reject any regression'
)
console.log('✅ Status regression blocked: remains RESOLVED')

const attemptedReDispatch = localSosStore.update(testTicket.id, { status: 'DISPATCHED' })
assert.strictEqual(
  attemptedReDispatch?.status,
  'RESOLVED',
  'Status must remain RESOLVED when attempting re-dispatch'
)
console.log('✅ Status re-dispatch blocked: remains RESOLVED')

console.log('\n🎉 ALL SOS SEALING & IMMUTABILITY TESTS PASSED!')
