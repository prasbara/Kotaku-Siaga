// Comprehensive Smoke Test for Production Release

const BASE_URL = 'http://127.0.0.1:3000';

async function testEndpoint(path, expectedStatus = 200) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal: AbortSignal.timeout(6000),
    });
    const status = res.status;
    const ok = status === expectedStatus || (expectedStatus === 200 && status >= 200 && status < 300);
    const contentType = res.headers.get('content-type') || '';
    let preview = '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      preview = JSON.stringify(data).slice(0, 60);
    } else {
      const text = await res.text();
      preview = text.slice(0, 60).replace(/\s+/g, ' ');
    }
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${path} -> HTTP ${status} (${preview}...)`);
    return ok;
  } catch (err) {
    console.error(`[FAIL] ${path} -> Exception: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('====================================================');
  console.log('  KOTAKU SIAGA — COMPREHENSIVE PRODUCTION SMOKE TEST');
  console.log('====================================================\n');

  const tests = [
    // Core APIs
    { path: '/api/health', expected: 200 },
    { path: '/api/health/data-sources', expected: 200 },
    { path: '/api/disaster-intelligence', expected: 200 },
    { path: '/api/reports', expected: 200 },
    { path: '/api/cctv', expected: 200 },
    { path: '/api/priority-scores', expected: 200 },
    { path: '/api/weather', expected: 200 },

    // Fire Early Detection APIs
    { path: '/api/fire/stats', expected: 200 },
    { path: '/api/fire/observations', expected: 200 },
    { path: '/api/fire/cases', expected: 200 },
    { path: '/api/fire/incidents', expected: 200 },

    // Public Pages
    { path: '/', expected: 200 },
    { path: '/peta', expected: 200 },
    { path: '/laporan', expected: 200 },
    { path: '/laporan/baru', expected: 200 },
    { path: '/edukasi', expected: 200 },
    { path: '/presentasi', expected: 200 },
    { path: '/data', expected: 200 },
    { path: '/login', expected: 200 },

    // Admin & Command Centre Pages
    { path: '/dashboard', expected: 200 },
    { path: '/dashboard/command-center', expected: 200 },
    { path: '/command-center', expected: 200 },
    { path: '/dashboard/prioritas', expected: 200 },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    const ok = await testEndpoint(t.path, t.expected);
    if (ok) passed++;
    else failed++;
  }

  console.log('\n====================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${tests.length})`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
