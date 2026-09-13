const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scratch/cctv_clean.json', 'utf8'));

function analyzeCategory(items, label) {
  console.log(`\n========================================`);
  console.log(`ANALISIS FITUR POINT: ${label} (Total Item: ${items.length})`);
  
  const points = items.filter(it => it.properties && (!it.properties.type || it.properties.type !== 'administrative'));
  console.log(`Non-administrative / Potential Cameras: ${points.length}`);

  // Inspect first 5 items properties
  points.slice(0, 5).forEach((item, idx) => {
    console.log(`\n--- Item ${idx + 1} ---`);
    console.log(JSON.stringify(item.properties, null, 2));
    console.log('Coordinates:', item.longitude, item.latitude);
  });
}

analyzeCategory(raw.genangan, 'RAWAN GENANGAN AIR');
analyzeCategory(raw.pompa, 'PANTAU POMPA AIR');
