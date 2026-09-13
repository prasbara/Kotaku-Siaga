async function testEndpoints() {
  console.log('Testing /api/ai/analyze-report...');
  const res1 = await fetch('http://localhost:3000/api/ai/analyze-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'banjir',
      description: 'Luapan air rob laut merendam Jl. Kaligawe Raya setinggi 50 cm, arus deras menyulitkan truk dan sepeda motor.',
      latitude: -6.9603,
      longitude: 110.4578,
      urgency: 'tinggi'
    })
  });
  const data1 = await res1.json();
  console.log('Analyze Report Result:', JSON.stringify(data1, null, 2));

  console.log('\nTesting /api/ai/aggregate-analysis...');
  const res2 = await fetch('http://localhost:3000/api/ai/aggregate-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      area: 'Kecamatan Genuk',
      report_count: 14,
      flood_reports: 8,
      waste_reports: 2,
      drainage_reports: 4,
      high_urgency_reports: 5,
      critical_reports: 2,
      priority_score: 84.5
    })
  });
  const data2 = await res2.json();
  console.log('Aggregate Analysis Result:', JSON.stringify(data2, null, 2));
}

testEndpoints().catch(console.error);
