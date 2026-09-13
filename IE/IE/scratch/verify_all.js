async function verifyAll() {
  const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/peta',
    'http://localhost:3000/laporan/baru',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/dashboard/prioritas',
    'http://localhost:3000/api/weather',
    'http://localhost:3000/api/reports',
    'http://localhost:3000/api/dashboard/stats',
  ];

  console.log('--- Checking HTTP Endpoints ---');
  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`[${res.status}] ${url}`);
    } catch (err) {
      console.error(`[FAIL] ${url}:`, err.message);
    }
  }

  console.log('\n--- Checking AI Chat with OpenRouter Free Models Router ---');
  try {
    const chatRes = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Halo KotaKu Siaga, apa rekomendasi penanganan genangan di Genuk?' }]
      })
    });
    const chatData = await chatRes.json();
    console.log(`[${chatRes.status}] AI Chat response preview:`, chatData.message?.slice(0, 140) + '...');
  } catch (err) {
    console.error('AI Chat test failed:', err.message);
  }
}

verifyAll();
