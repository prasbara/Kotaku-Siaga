const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scratch/cctv_clean.json', 'utf8'));

console.log('=== RINGKASAN DATA PANTUASEMAR ===');
console.log(`Total RAWAN GENANGAN AIR: ${data.genangan.length}`);
console.log(`Total PANTAU POMPA AIR: ${data.pompa.length}`);

console.log('\n--- 1. Sample Feature Properties Structure (RAWAN GENANGAN AIR) ---');
if (data.genangan.length > 0) {
  console.log(JSON.stringify(data.genangan[0].properties, null, 2));
}

console.log('\n--- 2. Sample Feature Properties Structure (PANTAU POMPA AIR) ---');
if (data.pompa.length > 0) {
  console.log(JSON.stringify(data.pompa[0].properties, null, 2));
}

console.log('\n--- 3. DAFTAR LENGKAP CCTV: RAWAN GENANGAN AIR ---');
data.genangan.forEach((c, idx) => {
  const p = c.properties;
  console.log(`${idx + 1}. Nama: ${p.cctv_name || p.name || c.name} | ID: ${p.id || p.cctv_id || c.id} | Status: ${p.status || p.device_status || c.status} | Lat/Lng: ${c.latitude}, ${c.longitude}`);
});

console.log('\n--- 4. DAFTAR LENGKAP CCTV: PANTAU POMPA AIR ---');
data.pompa.forEach((c, idx) => {
  const p = c.properties;
  console.log(`${idx + 1}. Nama: ${p.cctv_name || p.name || c.name} | ID: ${p.id || p.cctv_id || c.id} | Status: ${p.status || p.device_status || c.status} | Lat/Lng: ${c.latitude}, ${c.longitude}`);
});
