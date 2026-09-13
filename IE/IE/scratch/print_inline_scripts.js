const fs = require('fs');

const html = fs.readFileSync('scratch/pantausemar_page.html', 'utf8');

const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

console.log('=== SCRIPT 10 (Tracking/Telemetry) ===');
console.log(scriptTags[10]);

console.log('\n=== SCRIPT 12 (Modal & Stream Rendering) ===');
console.log(scriptTags[12].substring(0, 3000));
