async function testServerAI() {
  const res = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'Apakah pompa polder di Kaligawe bekerja optimal saat ini?' }
      ]
    })
  });

  const data = await res.json();
  console.log('Server response status:', res.status);
  console.log('Server response body:', JSON.stringify(data, null, 2));
}

testServerAI().catch(console.error);
