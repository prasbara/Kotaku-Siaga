// Automated Functional QA Verification Suite
// Target: http://localhost:3001

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runQA() {
  console.log('====================================================');
  console.log('  KOTAKU SIAGA — QA FUNCTIONAL TEST SUITE');
  console.log('====================================================\n');

  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/peta', name: 'Interactive Map Page' },
    { path: '/laporan/baru', name: 'Citizen Report Form Page' },
    { path: '/laporan', name: 'Reports Page' },
    { path: '/priorities', name: 'EOC Priorities & Weight Simulator' },
    { path: '/edukasi', name: 'Educational Disaster Guide' },
    { path: '/data', name: 'Public Data Hub' },
    { path: '/login', name: 'Admin/User Login Page' },
    { path: '/register', name: 'Registration Page' },
  ];

  const apis = [
    { path: '/api/weather', name: 'Weather Telemetry API (Open-Meteo)', expectedStatus: 200 },
    { path: '/api/cctv', name: 'PantauSemar CCTV Inventory API', expectedStatus: 200 },
    { path: '/api/priority-scores', name: 'Deterministic Priority Scores API', expectedStatus: 200 },
    { path: '/api/dashboard/stats', name: 'Dashboard Stats API (Real DB Guard)', expectedStatus: [200, 503] },
    { path: '/api/reports', name: 'Reports Query API (Real DB Guard)', expectedStatus: [200, 503] },
  ];

  let passed = 0;
  let failed = 0;

  console.log('--- 1. Testing User-Facing Pages ---');
  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`);
      if (res.status === 200) {
        console.log(`✅ PASS: ${page.name} (${page.path}) -> HTTP 200`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${page.name} (${page.path}) -> HTTP ${res.status}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ FAIL: ${page.name} (${page.path}) -> Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n--- 2. Testing Core APIs ---');
  for (const api of apis) {
    try {
      const res = await fetch(`${BASE_URL}${api.path}`);
      const data = await res.json().catch(() => ({}));
      const isExpected = Array.isArray(api.expectedStatus) ? api.expectedStatus.includes(res.status) : res.status === api.expectedStatus;
      if (isExpected) {
        let extra = '';
        if (api.path === '/api/cctv' && data.total) {
          extra = `(${data.total} CCTV cameras loaded)`;
        } else if (api.path === '/api/weather' && data.data?.temperature_c !== undefined) {
          extra = `(${data.data.temperature_c}°C, ${data.data.weather_condition})`;
        } else if (res.status === 200) {
          extra = `(Healthy operational response)`;
        } else if (res.status === 503) {
          extra = `(Honest 503 service unavailable without fake fallback)`;
        }
        console.log(`✅ PASS: ${api.name} (${api.path}) -> HTTP ${res.status} ${extra}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${api.name} (${api.path}) -> HTTP ${res.status} (expected ${api.expectedStatus})`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ FAIL: ${api.name} (${api.path}) -> Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`  QA SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================');
}

runQA();
