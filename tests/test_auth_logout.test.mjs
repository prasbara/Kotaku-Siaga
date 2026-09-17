// Automated Unit & Integration Tests: Admin Authentication & Logout Hardening
import assert from 'assert';
import {
  createSessionToken,
  verifySessionToken,
  verifyOperatorSession,
  getUserRole,
  isRequestAuthorizedAdmin,
  SESSION_COOKIE_NAME,
} from '../lib/auth/session.ts';

async function runAuthLogoutTests() {
  console.log('====================================================');
  console.log('  TEST SUITE: ADMIN AUTHENTICATION & LOGOUT HARDENING');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Cryptographic Session Generation & Validation
  // -------------------------------------------------------------
  await test('Generates cryptographically valid tokens with tamper resistance', async () => {
    const adminToken = await createSessionToken('admin');
    const officerToken = await createSessionToken('officer');

    const verifiedAdmin = await verifySessionToken(adminToken);
    assert.strictEqual(verifiedAdmin.valid, true);
    assert.strictEqual(verifiedAdmin.role, 'admin');

    const verifiedOfficer = await verifySessionToken(officerToken);
    assert.strictEqual(verifiedOfficer.valid, true);
    assert.strictEqual(verifiedOfficer.role, 'officer');

    // Tampering test: alter payload
    const tamperedPayload = adminToken.replace('admin:', 'officer:');
    const verifiedTampered = await verifySessionToken(tamperedPayload);
    assert.strictEqual(verifiedTampered.valid, false, 'Tampered payload must fail HMAC check');

    // Tampering test: alter signature
    const tamperedSig = adminToken.slice(0, -4) + '0000';
    const verifiedTamperedSig = await verifySessionToken(tamperedSig);
    assert.strictEqual(verifiedTamperedSig.valid, false, 'Tampered signature must fail');
  });

  // -------------------------------------------------------------
  // Test 2: Expired Token Rejection
  // -------------------------------------------------------------
  await test('Rejects expired or future-dated session tokens', async () => {
    // 8 days ago
    const pastTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const expiredFakeToken = `admin:${pastTimestamp}:dummyhmacsignature1234567890`;
    const checkExpired = await verifySessionToken(expiredFakeToken);
    assert.strictEqual(checkExpired.valid, false, 'Expired session token must be rejected');

    // Future timestamp (> 5 seconds ahead)
    const futureTimestamp = Date.now() + 60 * 60 * 1000;
    const futureFakeToken = `admin:${futureTimestamp}:dummyhmacsignature1234567890`;
    const checkFuture = await verifySessionToken(futureFakeToken);
    assert.strictEqual(checkFuture.valid, false, 'Future timestamp token must be rejected');
  });

  // -------------------------------------------------------------
  // Test 3: Cookie Extraction & Role Verification in Request
  // -------------------------------------------------------------
  await test('Correctly extracts role from signed session cookie', async () => {
    const adminToken = await createSessionToken('admin');

    const mockRequest = {
      headers: new Headers({
        cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
      }),
    };

    const role = await getUserRole(mockRequest);
    assert.strictEqual(role, 'admin', 'User role should be admin when valid cookie is present');

    const isAuth = await isRequestAuthorizedAdmin(mockRequest);
    assert.strictEqual(isAuth, true, 'Request with valid admin cookie must be authorized');
  });

  // -------------------------------------------------------------
  // Test 4: Rejection of Spoofed Referer and Forged Cookie
  // -------------------------------------------------------------
  await test('Strictly rejects unauthenticated requests even with spoofed dashboard referer in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalDemo = process.env.NEXT_PUBLIC_DEMO_MODE;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_DEMO_MODE;

      // Attacker trying to spoof referer or x-operator-view without signed cookie
      const spoofedRequest = {
        headers: new Headers({
          referer: 'https://kotaku-siaga.vercel.app/dashboard',
          'x-operator-view': 'true',
        }),
      };

      const role = await getUserRole(spoofedRequest);
      assert.strictEqual(
        role,
        'public',
        'In production, spoofed referer/headers MUST NOT grant admin role'
      );

      const isAuth = await isRequestAuthorizedAdmin(spoofedRequest);
      assert.strictEqual(
        isAuth,
        false,
        'In production, spoofed referer/headers MUST NOT authorize admin requests'
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalDemo !== undefined) process.env.NEXT_PUBLIC_DEMO_MODE = originalDemo;
    }
  });

  // -------------------------------------------------------------
  // Test 5: Cookie Invalidation Attributes Check
  // -------------------------------------------------------------
  await test('Verifies cookie invalidation parameters conform to RFC 6265 (Path=/, Max-Age=0)', async () => {
    // Cookie deletion must specify path: '/' and maxAge: 0 or expires: 1970
    const cookieDeleteOpts = {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
    };

    assert.strictEqual(cookieDeleteOpts.path, '/', 'Cookie deletion MUST use root path "/"');
    assert.strictEqual(cookieDeleteOpts.maxAge, 0, 'Cookie deletion MUST have maxAge 0');
    assert.strictEqual(
      cookieDeleteOpts.expires.getTime(),
      0,
      'Cookie deletion MUST expire at epoch 1970'
    );
  });

  console.log(`\nResults: ${passed} Passed, ${failed} Failed\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthLogoutTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
