async function testApiEndpoints() {
  const endpoints = [
    'https://pantausemar.semarangkota.go.id/api/visit/cctv-link',
    'https://pantausemar.semarangkota.go.id/api/cctv',
    'https://pantausemar.semarangkota.go.id/api/cctvs',
    'https://pantausemar.semarangkota.go.id/api/categories',
    'https://pantausemar.semarangkota.go.id/api/cctv-category',
    'https://pantausemar.semarangkota.go.id/api/get-cctv',
    'https://pantausemar.semarangkota.go.id/cctv/get-data',
    'https://pantausemar.semarangkota.go.id/cctv/category/df69dbea-87c9-4d79-9ddc-f388c33f2dc9',
  ];

  console.log('Testing potential REST API endpoints on pantausemar.semarangkota.go.id:');
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const ct = res.headers.get('content-type') || '';
      console.log(`[${res.status}] ${ep} (Content-Type: ${ct})`);
      if (res.status === 200 && ct.includes('json')) {
        const json = await res.json();
        console.log('  -> Response JSON keys:', Object.keys(json));
      }
    } catch (e) {
      console.log(`[ERROR] ${ep}: ${e.message}`);
    }
  }
}

testApiEndpoints().catch(console.error);
