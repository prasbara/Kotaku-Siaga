const fs = require('fs');

function extractJsonArray(str, startIndex) {
  let openBrackets = 0;
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
      if (char === '[') {
        if (openBrackets === 0) start = i;
        openBrackets++;
      } else if (char === ']') {
        openBrackets--;
        if (openBrackets === 0) {
          return str.substring(start, i + 1);
        }
      }
    }
  }
  return null;
}

async function getCategoryData(categoryId, categoryName) {
  const url = `https://pantausemar.semarangkota.go.id/?cctv_category_id=${categoryId}`;
  console.log(`\n======================================================`);
  console.log(`FETCHING: ${categoryName}`);
  console.log(`URL: ${url}`);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });

  const html = await res.text();
  const keyword = 'var cctvs =';
  const idx = html.indexOf(keyword);
  if (idx === -1) {
    console.log(`'var cctvs =' not found in HTML!`);
    return [];
  }

  const jsonStr = extractJsonArray(html, idx + keyword.length);
  if (!jsonStr) {
    console.log('Failed to extract cctvs array!');
    return [];
  }

  const cctvs = JSON.parse(jsonStr);
  console.log(`Berhasil mengekstrak ${cctvs.length} kamera untuk ${categoryName}!`);

  // Inspect the script right after var cctvs to see how it renders markers and streams
  const afterSnippet = html.substring(idx + keyword.length + jsonStr.length, idx + keyword.length + jsonStr.length + 3000);
  console.log('\n--- Script rendering snippet after var cctvs ---');
  console.log(afterSnippet.substring(0, 1200));

  return cctvs;
}

async function run() {
  const genangan = await getCategoryData('df69dbea-87c9-4d79-9ddc-f388c33f2dc9', 'RAWAN GENANGAN AIR');
  const pompa = await getCategoryData('5b5b7e51-3a2e-446f-8fae-50d8e9e7196d', 'PANTAU POMPA AIR');

  fs.writeFileSync('scratch/cctvs_raw_both.json', JSON.stringify({ genangan, pompa }, null, 2));
  console.log('\nSaved data to scratch/cctvs_raw_both.json');
}

run().catch(console.error);
