const apiKey = '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';

async function testAI() {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'KotaKu Siaga',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah sistem analisis laporan lingkungan KotaKu Siaga. Selalu respons dalam format JSON valid tanpa penjelasan tambahan.'
        },
        {
          role: 'user',
          content: `Analisis laporan: Kategori: banjir, Deskripsi: Air rob masuk rumah setinggi 40cm di Kaligawe dekat jembatan tol, Urgensi: tinggi.
Format JSON:
{
  "classification": "banjir/genangan/drainase_tersumbat",
  "severity": "low/medium/high/critical",
  "confidence": 0.9,
  "summary": "ringkasan",
  "recommended_action": "rekomendasi tindakan",
  "requires_verification": false
}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500,
    })
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Model used:', data.model);
  console.log('Raw output:', data.choices?.[0]?.message?.content);
}

testAI().catch(console.error);
