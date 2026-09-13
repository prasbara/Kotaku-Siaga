const fs = require('fs');

const html = fs.readFileSync('scratch/pantausemar_page.html', 'utf8');

// Find function openModal, openStream, or video setup
const idxCctvs = html.indexOf('var cctvs =');
if (idxCctvs !== -1) {
  const scriptContent = html.substring(idxCctvs, idxCctvs + 15000);
  console.log('--- SCRIPT CONTENT AFTER var cctvs ---');
  console.log(scriptContent.substring(0, 5000));
}
