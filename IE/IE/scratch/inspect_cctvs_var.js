const fs = require('fs');

const html = fs.readFileSync('scratch/pantausemar_page.html', 'utf8');

// Find where cctvs variable is defined
const matches = [];
const regex = /(?:var|let|const|window\.)\s*cctvs\s*=\s*/g;
let m;
while ((m = regex.exec(html)) !== null) {
  matches.push(m.index);
}

console.log(`Matches for 'cctvs =':`, matches);

matches.forEach((idx, i) => {
  console.log(`\n--- Match ${i} at index ${idx} ---`);
  console.log(html.substring(idx, idx + 500));
});

// Also search for any JSON.parse or Blade @json or array assignment
const bladeMatch = html.match(/cctvs\s*=\s*(@json\(.*?\)|\[.*?\]|\{.*?\})/s);
if (bladeMatch) {
  console.log('\nFound cctvs assignment snippet:');
  console.log(bladeMatch[0].substring(0, 300));
}
