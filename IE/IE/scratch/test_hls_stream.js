async function testHlsStream() {
  const streamUrl = 'https://livepantau.semarangkota.go.id/ec3868fc-cbdb-4995-bcd5-3abe90ac6a0b/index.m3u8';
  console.log(`Testing stream: ${streamUrl}`);

  // Test 1: plain fetch
  try {
    const res1 = await fetch(streamUrl);
    console.log(`Test 1 (No headers): Status ${res1.status} ${res1.statusText}`);
    const text1 = await res1.text();
    console.log(`Test 1 body preview: ${text1.slice(0, 150)}`);
  } catch (e) {
    console.log(`Test 1 error: ${e.message}`);
  }

  // Test 2: with Referer and Origin header
  try {
    const res2 = await fetch(streamUrl, {
      headers: {
        'Referer': 'https://pantausemar.semarangkota.go.id/',
        'Origin': 'https://pantausemar.semarangkota.go.id',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });
    console.log(`\nTest 2 (With Referer & Origin): Status ${res2.status} ${res2.statusText}`);
    const text2 = await res2.text();
    console.log(`Test 2 body preview: ${text2.slice(0, 150)}`);
  } catch (e) {
    console.log(`Test 2 error: ${e.message}`);
  }
}

testHlsStream().catch(console.error);
