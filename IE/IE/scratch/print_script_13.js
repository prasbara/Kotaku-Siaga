const fs = require('fs');

const html = fs.readFileSync('scratch/pantausemar_page.html', 'utf8');
const scriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

console.log('=== SCRIPT 13 CONTENT ===');
console.log(scriptTags[13]);
