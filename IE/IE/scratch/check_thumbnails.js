const fs = require('fs');

const html = fs.readFileSync('scratch/pantausemar_page.html', 'utf8');

// Check all image or thumbnail patterns
const imgs = html.match(/(?:src|poster|thumbnail|image)\s*=\s*["']([^"']+)["']/gi) || [];
console.log('Images/Posters found:', [...new Set(imgs)].slice(0, 30));

// Check if livepantau has snapshot / poster (e.g. index.jpg or snapshot.jpg)
const streamUrl = 'https://livepantau.semarangkota.go.id/ec3868fc-cbdb-4995-bcd5-3abe90ac6a0b/index.m3u8';
const snapUrl1 = 'https://livepantau.semarangkota.go.id/ec3868fc-cbdb-4995-bcd5-3abe90ac6a0b/snap.jpg';
const snapUrl2 = 'https://livepantau.semarangkota.go.id/ec3868fc-cbdb-4995-bcd5-3abe90ac6a0b/preview.jpg';

async function checkSnaps() {
  for (const s of [snapUrl1, snapUrl2]) {
    try {
      const res = await fetch(s);
      console.log(`Snapshot check: [${res.status}] ${s}`);
    } catch (e) {
      console.log(`Snapshot check error: ${e.message}`);
    }
  }
}

checkSnaps();
