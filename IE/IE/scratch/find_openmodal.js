const fs = require('fs');

const html = fs.readFileSync('scratch/pantausemar_page.html', 'utf8');
const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

const s12 = scriptTags[12];
const openModalIdx = s12.indexOf('function openModal');
if (openModalIdx !== -1) {
  console.log(s12.substring(openModalIdx, openModalIdx + 3000));
} else {
  console.log('function openModal not directly named in script 12. Searching all scripts for openModal:');
  scriptTags.forEach((s, i) => {
    if (s.includes('openModal')) {
      console.log(`Script ${i} includes openModal`);
      const idx = s.indexOf('openModal');
      console.log(s.substring(idx - 100, idx + 1000));
    }
  });
}
