const fs = require('fs');

async function inspectHtml() {
  const url = 'https://pantausemar.semarangkota.go.id/?cctv_category_id=df69dbea-87c9-4d79-9ddc-f388c33f2dc9';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });

  const html = await res.text();
  fs.writeFileSync('scratch/pantausemar_page.html', html);
  console.log(`Saved HTML (length: ${html.length}) to scratch/pantausemar_page.html`);

  // Find all script tags
  const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  console.log(`\n--- Script Tags (${scriptTags.length}) ---`);
  scriptTags.forEach((s, idx) => {
    const srcMatch = s.match(/src=["'](.*?)["']/i);
    if (srcMatch) {
      console.log(`Script [${idx}] external: ${srcMatch[1]}`);
    } else {
      const inlineSnippet = s.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '').trim();
      console.log(`Script [${idx}] inline length: ${inlineSnippet.length} chars (starts: "${inlineSnippet.slice(0, 100).replace(/\n/g, ' ')}...")`);
    }
  });

  // Find any occurrences of AJAX, URL, or API in inline scripts
  scriptTags.forEach((s, idx) => {
    if (!s.includes('src=')) {
      const inline = s.replace(/<script[\s\S]*?>/i, '').replace(/<\/script>/i, '').trim();
      // Look for fetch, $, url, cctv, marker
      const lines = inline.split('\n');
      lines.forEach((l, lineIdx) => {
        const lower = l.toLowerCase();
        if (lower.includes('cctv') || lower.includes('url') || lower.includes('marker') || lower.includes('fetch') || lower.includes('ajax') || lower.includes('get') || lower.includes('post') || lower.includes('stream') || lower.includes('modal')) {
          if (!lower.includes('var geojsonfeature')) {
            console.log(`Inline Script [${idx}] L${lineIdx}: ${l.trim().slice(0, 180)}`);
          }
        }
      });
    }
  });
}

inspectHtml().catch(console.error);
