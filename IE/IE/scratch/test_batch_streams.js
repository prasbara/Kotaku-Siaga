const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scratch/cctvs_raw_both.json', 'utf8'));

async function checkStream(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal, method: 'GET' });
    clearTimeout(timeout);
    return res.status;
  } catch (e) {
    return 'ERR: ' + e.message;
  }
}

async function testBatch() {
  console.log('=== TESTING STREAMS: RAWAN GENANGAN AIR (14 CCTVs) ===');
  for (const c of raw.genangan) {
    const link = c.links?.[0] || {};
    const status = await checkStream(link.url);
    console.log(`[Status: ${status}] "${link.name}" (${link.owner_name}) -> ${link.url}`);
  }

  console.log('\n=== TESTING STREAMS: PANTAU POMPA AIR (First 15 sample CCTVs) ===');
  for (const c of raw.pompa.slice(0, 15)) {
    const link = c.links?.[0] || {};
    const status = await checkStream(link.url);
    console.log(`[Status: ${status}] "${link.name}" (${link.owner_name}) -> ${link.url}`);
  }
}

testBatch().catch(console.error);
