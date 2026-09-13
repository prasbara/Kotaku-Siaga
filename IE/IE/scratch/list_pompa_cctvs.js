const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scratch/cctvs_raw_both.json', 'utf8'));

console.log(`=== DAFTAR 58 KAMERA: PANTAU POMPA AIR ===`);
raw.pompa.forEach((c, idx) => {
  const link = c.links?.[0] || {};
  console.log(`[${idx + 1}] cctv_id: ${c.cctv_id} | link_id: ${link.id} | Nama: "${link.name || c.owner_name}" | OPD: "${link.owner_name}" | Lat: ${c.lat}, Lng: ${c.lng} | Stream: ${link.url}`);
});
