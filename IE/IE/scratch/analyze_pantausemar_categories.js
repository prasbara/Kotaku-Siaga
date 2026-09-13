async function fetchCategoryPage(catId, catName) {
  const url = `https://pantausemar.semarangkota.go.id/?cctv_category_id=${catId}`;
  console.log(`=== Fetching ${catName} (${url}) ===`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const html = await res.text();
    console.log(`HTML size: ${html.length} bytes`);

    // Look for script tags, API endpoints, AJAX URLs, or embedded geojson
    const scriptMatches = html.match(/<script[\s\S]*?<\/script>/gi) || [];
    console.log(`Total <script> tags: ${scriptMatches.length}`);

    // Check if geojsonFeature exists
    const geojsonMatch = html.match(/var\s+geojsonFeature\s*=\s*(\{[\s\S]*?\});/);
    if (geojsonMatch) {
      console.log('Found var geojsonFeature in HTML!');
      try {
        const geojson = JSON.parse(geojsonMatch[1]);
        console.log(`GeoJSON Type: ${geojson.type}`);
        console.log(`Features count: ${geojson.features?.length}`);
        if (geojson.features && geojson.features.length > 0) {
          console.log(`Sample properties of item 0:`, JSON.stringify(geojson.features[0].properties, null, 2));
          console.log(`Sample geometry of item 0:`, JSON.stringify(geojson.features[0].geometry, null, 2));
          
          // List all cameras in this category
          console.log(`\n--- Cameras in ${catName} (${geojson.features.length}) ---`);
          geojson.features.forEach((f, idx) => {
            const p = f.properties;
            const coords = f.geometry?.coordinates;
            console.log(`[${idx + 1}] ID: ${p.id || p.cctv_id || p.camera_id || 'N/A'} | Name: ${p.name || p.cctv_name || p.title || 'N/A'} | Stream: ${p.stream_url || p.url || p.stream || 'N/A'} | Coords: ${coords ? coords.join(', ') : 'N/A'}`);
          });
        }
      } catch (e) {
        console.log('JSON parse error on geojsonFeature:', e.message);
      }
    } else {
      console.log('var geojsonFeature NOT directly matched with simple regex.');
    }

    // Search for fetch / axios / $.ajax / api endpoints in scripts
    const apiCalls = html.match(/(?:fetch|axios\.get|\$\.ajax|\$\.get|url\s*:\s*|href\s*=\s*)["']([^"']*(?:api|cctv|stream|category|get)[\w\/\?\=\-\.\:\&]*)["']/gi) || [];
    console.log(`Potential API/data calls found:`, apiCalls);

    // Look for cctv category select / links
    const categoryMatches = html.match(/cctv_category_id=[a-f0-9\-]+/gi) || [];
    console.log(`Category references:`, [...new Set(categoryMatches)]);

    // Check for video/hls/m3u8/stream links in the page
    const streamMatches = html.match(/https?:\/\/[^\s"']+\.(?:m3u8|mpd|flv)/gi) || [];
    console.log(`Stream links in page:`, [...new Set(streamMatches)]);

    // Look for modal/detail endpoints
    const modalMatches = html.match(/https?:\/\/[^\s"']*(?:detail|modal|stream|cctv)[^\s"']*/gi) || [];
    console.log(`Detail/Modal URLs in page:`, [...new Set(modalMatches)].slice(0, 10));

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

async function main() {
  await fetchCategoryPage('df69dbea-87c9-4d79-9ddc-f388c33f2dc9', 'RAWAN GENANGAN AIR');
  console.log('\n==================================================\n');
  await fetchCategoryPage('5b5b7e51-3a2e-446f-8fae-50d8e9e7196d', 'PANTAU POMPA AIR');
}

main();
