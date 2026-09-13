const fs = require('fs');

function extractJsonObject(str, startIndex) {
  let openBraces = 0;
  let inString = false;
  let escapeNext = false;
  let start = -1;

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        if (openBraces === 0) start = i;
        openBraces++;
      } else if (char === '}') {
        openBraces--;
        if (openBraces === 0) {
          return str.substring(start, i + 1);
        }
      }
    }
  }
  return null;
}

async function extractCategory(catId, catName) {
  const url = `https://pantausemar.semarangkota.go.id/?cctv_category_id=${catId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });

  const html = await res.text();
  const keyword = 'var geojsonFeature =';
  const idx = html.indexOf(keyword);
  if (idx === -1) {
    console.log(`Keyword not found in ${catName}`);
    return [];
  }

  const jsonStr = extractJsonObject(html, idx + keyword.length);
  if (!jsonStr) {
    console.log(`Could not extract JSON object in ${catName}`);
    return [];
  }

  const geojson = JSON.parse(jsonStr);
  console.log(`\n======================================================`);
  console.log(`Kategori: ${catName}`);
  console.log(`Category ID: ${catId}`);
  console.log(`Total CCTV Features: ${geojson.features?.length || 0}`);

  if (geojson.features && geojson.features.length > 0) {
    console.log('\n--- Struktur Keys pada Feature properties ---');
    console.log(Object.keys(geojson.features[0].properties));
    console.log('\n--- Contoh 1 Feature Utuh ---');
    console.log(JSON.stringify(geojson.features[0], null, 2));

    const list = geojson.features.map(f => {
      const p = f.properties;
      const coords = f.geometry?.coordinates || [null, null];
      return {
        id: p.id || p.cctv_id || null,
        name: p.cctv_name || p.name || p.title || null,
        category: catName,
        category_id: catId,
        stream_url: p.stream_url || p.url || p.stream || null,
        status: p.status || null,
        device_status: p.device_status || null,
        location: p.location || p.address || null,
        longitude: coords[0],
        latitude: coords[1],
        properties: p,
      };
    });

    console.log(`\n--- Daftar Seluruh Kamera ${catName} (${list.length}) ---`);
    list.forEach((c, i) => {
      console.log(`[${i + 1}] ID: ${c.id} | Nama: "${c.name}" | Status: ${c.status || c.device_status} | Lat/Lng: ${c.latitude}, ${c.longitude} | Stream: ${c.stream_url}`);
    });

    return list;
  }
  return [];
}

async function run() {
  const genangan = await extractCategory('df69dbea-87c9-4d79-9ddc-f388c33f2dc9', 'RAWAN GENANGAN AIR');
  const pompa = await extractCategory('5b5b7e51-3a2e-446f-8fae-50d8e9e7196d', 'PANTAU POMPA AIR');

  fs.writeFileSync('scratch/cctv_clean.json', JSON.stringify({ genangan, pompa }, null, 2));
  console.log('\nSaved full data to scratch/cctv_clean.json');
}

run().catch(console.error);
