// Automated Security Audit & Penetration Testing Suite
// Target: Local authorized testing instance (http://localhost:3001)

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3001';

async function runTests() {
  console.log('====================================================');
  console.log('  KOTAKU SIAGA — PENTEST & SECURITY RETEST SUITE');
  console.log('====================================================\n');

  const results = [];

  function record(testId, name, category, passed, evidence, severity) {
    results.push({ testId, name, category, passed, evidence, severity });
    const mark = passed ? '✅ PASS' : '❌ FAIL (VULNERABLE)';
    console.log(`[${testId}] ${mark} - ${name} [${severity}]`);
    console.log(`     Evidence: ${evidence}\n`);
  }

  // -------------------------------------------------------------
  // Test 1: Session Forgery / Unsigned Cookie Bypass
  // -------------------------------------------------------------
  try {
    const unauthRes = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    
    // Attempt forgery with dummy string
    const forgedRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { 'Cookie': 'kotaku_admin_session=true' },
      redirect: 'manual'
    });
    
    // Attempt forgery with crafted fake HMAC token
    const forgedHmacRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { 'Cookie': 'kotaku_admin_session=admin:1700000000000:bad_signature_here' },
      redirect: 'manual'
    });

    const bypassSuccess = forgedRes.status === 200 || forgedHmacRes.status === 200;

    if (bypassSuccess) {
      record('AUTH-01', 'Admin Session Forgery Bypass', 'Authentication', false,
        `Forged cookie was accepted with HTTP 200! Vulnerable to session forgery.`,
        'HIGH');
    } else {
      record('AUTH-01', 'Admin Session Forgery Bypass', 'Authentication', true,
        `Forged cookies were rejected: 'true' -> HTTP ${forgedRes.status}, forged token -> HTTP ${forgedHmacRes.status}`,
        'HIGH');
    }
  } catch (err) {
    record('AUTH-01', 'Admin Session Forgery Bypass', 'Authentication', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 2: Valid Admin Authentication & Cookie Generation
  // -------------------------------------------------------------
  let validAdminCookie = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'superadmin.' })
    });
    const loginData = await loginRes.json();
    const setCookie = loginRes.headers.get('set-cookie');
    
    if (loginRes.status === 200 && loginData.success && setCookie) {
      const match = setCookie.match(/kotaku_admin_session=([^;]+)/);
      if (match && match[1]) {
        validAdminCookie = match[1];
      }
      
      const decodedCookie = decodeURIComponent(validAdminCookie);
      const isSignedToken = decodedCookie.startsWith('admin:') && decodedCookie.split(':').length === 3;
      if (isSignedToken) {
        record('AUTH-02', 'Cryptographic Signed Session Token Generation', 'Authentication', true,
          `Login generated HMAC-signed admin session: ${decodedCookie.slice(0, 25)}...`,
          'HIGH');
      } else {
        record('AUTH-02', 'Cryptographic Signed Session Token Generation', 'Authentication', false,
          `Session cookie is not a signed token: ${validAdminCookie}`,
          'HIGH');
      }
    } else {
      record('AUTH-02', 'Cryptographic Signed Session Token Generation', 'Authentication', false,
        `Login failed: status ${loginRes.status}`,
        'HIGH');
    }
  } catch (err) {
    record('AUTH-02', 'Cryptographic Signed Session Token Generation', 'Authentication', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 3: Authenticated Admin Access to Dashboard
  // -------------------------------------------------------------
  try {
    if (validAdminCookie) {
      const authDashRes = await fetch(`${BASE_URL}/dashboard`, {
        headers: { 'Cookie': `kotaku_admin_session=${validAdminCookie}` },
        redirect: 'manual'
      });
      if (authDashRes.status === 200) {
        record('AUTH-03', 'Authorized Admin Dashboard Access', 'Authentication', true,
          `Legitimate admin session cookie successfully grants HTTP 200 access to /dashboard`,
          'HIGH');
      } else {
        record('AUTH-03', 'Authorized Admin Dashboard Access', 'Authentication', false,
          `Legitimate admin session returned HTTP ${authDashRes.status}`,
          'HIGH');
      }
    } else {
      record('AUTH-03', 'Authorized Admin Dashboard Access', 'Authentication', false,
        `Skipped because no valid admin cookie was obtained in Test 2`,
        'HIGH');
    }
  } catch (err) {
    record('AUTH-03', 'Authorized Admin Dashboard Access', 'Authentication', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 4: Broken Function Level Authorization (BFLA) on /api/admin/ingest
  // -------------------------------------------------------------
  try {
    const ingestUnauth = await fetch(`${BASE_URL}/api/admin/ingest`, { method: 'POST' });
    const ingestWithAuth = validAdminCookie ? await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: { 'Cookie': `kotaku_admin_session=${validAdminCookie}` }
    }) : null;

    if (ingestUnauth.status === 401) {
      record('BFLA-01', 'Unauthenticated Access to /api/admin/ingest', 'Authorization', true,
        `Anonymous request blocked with HTTP 401 Unauthorized.${ingestWithAuth ? ` Authorized request accepted (HTTP ${ingestWithAuth.status}).` : ''}`,
        'HIGH');
    } else {
      record('BFLA-01', 'Unauthenticated Access to /api/admin/ingest', 'Authorization', false,
        `Anonymous request returned HTTP ${ingestUnauth.status} (expected 401)`,
        'HIGH');
    }
  } catch (err) {
    record('BFLA-01', 'Unauthenticated Access to /api/admin/ingest', 'Authorization', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 5: BFLA on /api/flood-events/[id]/resolve
  // -------------------------------------------------------------
  try {
    const resolveUnauth = await fetch(`${BASE_URL}/api/flood-events/test-event-id/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Malicious unauthorized resolution' })
    });

    if (resolveUnauth.status === 401) {
      record('BFLA-02', 'Unauthenticated Resolution of Flood Events', 'Authorization', true,
        `Anonymous resolve request blocked with HTTP 401 Unauthorized`,
        'HIGH');
    } else {
      record('BFLA-02', 'Unauthenticated Resolution of Flood Events', 'Authorization', false,
        `Anonymous POST returned HTTP ${resolveUnauth.status} instead of 401`,
        'HIGH');
    }
  } catch (err) {
    record('BFLA-02', 'Unauthenticated Resolution of Flood Events', 'Authorization', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 6: BFLA on /api/flood-events (POST)
  // -------------------------------------------------------------
  try {
    const postEventUnauth = await fetch(`${BASE_URL}/api/flood-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: 'test-cam', flood_confidence: 0.99 })
    });

    if (postEventUnauth.status === 401) {
      record('BFLA-03', 'Unauthenticated Flood Event Injection (/api/flood-events)', 'Authorization', true,
        `Anonymous event injection blocked with HTTP 401 Unauthorized`,
        'HIGH');
    } else {
      record('BFLA-03', 'Unauthenticated Flood Event Injection (/api/flood-events)', 'Authorization', false,
        `Anonymous event injection returned HTTP ${postEventUnauth.status} instead of 401`,
        'HIGH');
    }
  } catch (err) {
    record('BFLA-03', 'Unauthenticated Flood Event Injection (/api/flood-events)', 'Authorization', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 7: BFLA on /api/reports/[id] (PATCH)
  // -------------------------------------------------------------
  try {
    const patchReportUnauth = await fetch(`${BASE_URL}/api/reports/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', credibility_score: 100 })
    });

    if (patchReportUnauth.status === 401) {
      record('BFLA-04', 'Unauthenticated Report Modification (/api/reports/[id])', 'Authorization', true,
        `Anonymous report modification blocked with HTTP 401 Unauthorized`,
        'HIGH');
    } else {
      record('BFLA-04', 'Unauthenticated Report Modification (/api/reports/[id])', 'Authorization', false,
        `Anonymous PATCH returned HTTP ${patchReportUnauth.status} instead of 401`,
        'HIGH');
    }
  } catch (err) {
    record('BFLA-04', 'Unauthenticated Report Modification (/api/reports/[id])', 'Authorization', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 8: CCTV Scan Abuse Protection
  // -------------------------------------------------------------
  try {
    const scanUnauth = await fetch(`${BASE_URL}/api/cctv/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 2 })
    });

    if (scanUnauth.status === 401) {
      record('ABUSE-01', 'Unauthenticated CCTV Trigger Scan (/api/cctv/scan)', 'Abuse / Auth', true,
        `Anonymous scan trigger blocked with HTTP 401 Unauthorized`,
        'MEDIUM');
    } else {
      record('ABUSE-01', 'Unauthenticated CCTV Trigger Scan (/api/cctv/scan)', 'Abuse / Auth', false,
        `Anonymous scan trigger returned HTTP ${scanUnauth.status} instead of 401`,
        'MEDIUM');
    }
  } catch (err) {
    record('ABUSE-01', 'Unauthenticated CCTV Trigger Scan (/api/cctv/scan)', 'Abuse / Auth', false, `Error: ${err.message}`, 'MEDIUM');
  }

  // -------------------------------------------------------------
  // Test 9: Cron Endpoint Protection without CRON_SECRET
  // -------------------------------------------------------------
  try {
    const cronRes = await fetch(`${BASE_URL}/api/cron/cctv-analysis`);
    if (cronRes.status === 401) {
      record('CRON-01', 'Cron Endpoint Authorization Enforcement', 'Cron Security', true,
        `Unauthenticated cron trigger rejected with HTTP 401 Unauthorized`,
        'HIGH');
    } else {
      record('CRON-01', 'Cron Endpoint Authorization Enforcement', 'Cron Security', false,
        `Cron request returned HTTP ${cronRes.status} without authorization`,
        'HIGH');
    }
  } catch (err) {
    record('CRON-01', 'Cron Endpoint Authorization Enforcement', 'Cron Security', false, `Error: ${err.message}`, 'HIGH');
  }

  // -------------------------------------------------------------
  // Test 10: Seed Endpoint Security Guard
  // -------------------------------------------------------------
  try {
    const getSeed = await fetch(`${BASE_URL}/api/seed`, { method: 'GET' });
    const postSeedNoSecret = await fetch(`${BASE_URL}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const postSeedWrongSecret = await fetch(`${BASE_URL}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'wrong_secret_123' })
    });

    const isGetProtected = getSeed.status === 405 || getSeed.status === 403;
    const isNoSecretProtected = postSeedNoSecret.status === 403;
    const isWrongSecretProtected = postSeedWrongSecret.status === 403;

    if (isGetProtected && isNoSecretProtected && isWrongSecretProtected) {
      record('SEED-01', 'Seed Endpoint Security Guard', 'Access Control', true,
        `GET returned ${getSeed.status}, POST no secret returned ${postSeedNoSecret.status}, POST wrong secret returned ${postSeedWrongSecret.status}`,
        'CRITICAL');
    } else {
      record('SEED-01', 'Seed Endpoint Security Guard', 'Access Control', false,
        `Guard failure: GET: ${getSeed.status}, NoSecret: ${postSeedNoSecret.status}, WrongSecret: ${postSeedWrongSecret.status}`,
        'CRITICAL');
    }
  } catch (err) {
    record('SEED-01', 'Seed Endpoint Security Guard', 'Access Control', false, `Error: ${err.message}`, 'CRITICAL');
  }

  // -------------------------------------------------------------
  // Test 11: HTTP Security Headers
  // -------------------------------------------------------------
  try {
    const headRes = await fetch(`${BASE_URL}/`);
    const headers = headRes.headers;
    const xfo = headers.get('x-frame-options');
    const xcto = headers.get('x-content-type-options');
    const rp = headers.get('referrer-policy');

    const hasHeaders = !!(xfo && xcto);
    if (hasHeaders) {
      record('SEC-HDR-01', 'HTTP Security Headers', 'Configuration', true,
        `X-Frame-Options: ${xfo}, X-Content-Type-Options: ${xcto}, Referrer-Policy: ${rp}`,
        'MEDIUM');
    } else {
      record('SEC-HDR-01', 'HTTP Security Headers', 'Configuration', false,
        `Missing headers on root. X-Frame-Options: ${xfo || 'MISSING'}, X-Content-Type-Options: ${xcto || 'MISSING'}`,
        'MEDIUM');
    }
  } catch (err) {
    record('SEC-HDR-01', 'HTTP Security Headers', 'Configuration', false, `Error: ${err.message}`, 'MEDIUM');
  }

  // -------------------------------------------------------------
  // Test 12: SQL Injection / Error Leakage in Query Params
  // -------------------------------------------------------------
  try {
    const sqliRes = await fetch(`${BASE_URL}/api/reports?category=' OR 1=1--&urgency=' UNION SELECT 1--`);
    const sqliBody = await sqliRes.text();
    const leaksSql = /syntax error|pg_|postgrest|column .* does not exist/i.test(sqliBody);
    if (leaksSql) {
      record('INJ-01', 'SQL Injection / Error Leakage in Query Params', 'Injection', false,
        `Server leaked database syntax error: ${sqliBody.slice(0, 100)}`,
        'HIGH');
    } else {
      record('INJ-01', 'SQL Injection / Error Leakage in Query Params', 'Injection', true,
        `SQL injection parameter handled cleanly without syntax error leak (HTTP ${sqliRes.status})`,
        'HIGH');
    }
  } catch (err) {
    record('INJ-01', 'SQL Injection / Error Leakage in Query Params', 'Injection', false, `Error: ${err.message}`, 'HIGH');
  }

  console.log('\n====================================================');
  console.log('  TEST SUMMARY');
  console.log('====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total: ${results.length} | Passed: ${passedCount} | Vulnerable/Failed: ${failedCount}`);
}

runTests();
