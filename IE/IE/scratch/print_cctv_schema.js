const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('scratch/cctvs_raw_both.json', 'utf8'));

console.log('--- SCHEMA SAMPLE 1 (RAWAN GENANGAN AIR) ---');
console.log(JSON.stringify(raw.genangan[0], null, 2));

console.log('\n--- SCHEMA SAMPLE 2 (PANTAU POMPA AIR) ---');
console.log(JSON.stringify(raw.pompa[0], null, 2));
