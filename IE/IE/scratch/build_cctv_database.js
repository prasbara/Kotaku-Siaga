const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scratch/cctvs_raw_both.json', 'utf8'));

// Helper to determine district from coordinates or name
function guessDistrict(lat, lng, name) {
  const n = (name || '').toLowerCase();
  if (n.includes('kaligawe') || n.includes('genuk') || n.includes('trimulyo') || n.includes('sringin') || n.includes('tenggang') || n.includes('muktiharjo') || n.includes('bangetayu') || n.includes('terboyo')) {
    return 'Genuk';
  }
  if (n.includes('tanjung emas') || n.includes('bandarharjo') || n.includes('tawang') || n.includes('kota lama') || n.includes('mberok') || n.includes('kali baru') || n.includes('polder tawang') || n.includes('banger')) {
    return 'Semarang Utara';
  }
  if (n.includes('tlogosari') || n.includes('soetta') || n.includes('usm') || n.includes('bugangan') || n.includes('pedurungan')) {
    return 'Pedurungan';
  }
  if (n.includes('pahlawan') || n.includes('simpang lima') || n.includes('tugumuda') || n.includes('peterongan') || n.includes('kp.kali') || n.includes('semarang indah') || n.includes('kartini') || n.includes('progo')) {
    return 'Semarang Tengah';
  }
  if (n.includes('akpol') || n.includes('gajahmungkur') || n.includes('candi') || n.includes('sultan agung')) {
    return 'Gajahmungkur';
  }
  if (n.includes('wonosari') || n.includes('plumbon') || n.includes('mangkang') || n.includes('tugu') || n.includes('bringin')) {
    return 'Tugu';
  }
  if (n.includes('bkb') || n.includes('bulu drain') || n.includes('indraprasta') || n.includes('madukoro') || n.includes('sbf') || n.includes('bridge fountain') || n.includes('kdg kebo')) {
    return 'Semarang Barat';
  }
  if (n.includes('gayamsari') || n.includes('kaligawe')) {
    return 'Gayamsari';
  }

  // Fallback by coordinates
  if (lat > -6.96) {
    if (lng > 110.44) return 'Genuk';
    if (lng > 110.41) return 'Semarang Utara';
    return 'Semarang Barat';
  }
  if (lat > -6.99) {
    if (lng > 110.43) return 'Semarang Timur';
    if (lng > 110.40) return 'Semarang Tengah';
    return 'Semarang Barat';
  }
  if (lng > 110.43) return 'Pedurungan';
  return 'Semarang Selatan';
}

const map = new Map();

// 1. Process Genangan
raw.genangan.forEach((c) => {
  const link = c.links?.[0];
  if (!link || !link.url) return;
  const key = link.url;
  const lat = parseFloat(c.lat);
  const lng = parseFloat(c.lng);
  const name = link.name || c.owner_name;
  const district = guessDistrict(lat, lng, name);

  map.set(key, {
    id: `cctv-ps-${c.cctv_id}-${link.id}`,
    cctvId: c.cctv_id,
    linkId: link.id,
    name: name,
    code: `PS-GEN-${link.id}`,
    district: district,
    category: 'rob_banjir',
    categoryLabel: 'Rawan Genangan Air',
    status: 'online',
    resolution: '1080p FHD (25 FPS)',
    latitude: lat,
    longitude: lng,
    address: `${name}, Kec. ${district}, Kota Semarang`,
    opd: link.owner_name || 'DPU / Dishub Kota Semarang',
    streamUrl: link.url,
    waterRiskLevel: (district === 'Genuk' || district === 'Semarang Utara') ? 'kritis' : 'tinggi',
    description: `Kamera pemantauan titik rawan genangan dan luapan air ${name}. Terkoneksi ke portal PantauSemar.`,
  });
});

// 2. Process Pompa Air
raw.pompa.forEach((c) => {
  const link = c.links?.[0];
  if (!link || !link.url) return;
  const key = link.url;
  const lat = parseFloat(c.lat);
  const lng = parseFloat(c.lng);
  const name = link.name || c.owner_name;
  const district = guessDistrict(lat, lng, name);

  if (map.has(key)) {
    // If it exists in both, flag as dual
    const existing = map.get(key);
    existing.categoryLabel = 'Rawan Genangan & Pompa Air';
    existing.description += ' Berada di kawasan stasiun pompa polder aktif.';
    return;
  }

  map.set(key, {
    id: `cctv-ps-${c.cctv_id}-${link.id}`,
    cctvId: c.cctv_id,
    linkId: link.id,
    name: name,
    code: `PS-PMP-${link.id}`,
    district: district,
    category: 'polder_sungai',
    categoryLabel: 'Pantau Pompa Air',
    status: 'online',
    resolution: '1080p FHD (25 FPS)',
    latitude: lat,
    longitude: lng,
    address: `${name}, Kec. ${district}, Kota Semarang`,
    opd: link.owner_name || 'DPU Kota Semarang (SDA)',
    streamUrl: link.url,
    waterRiskLevel: (name.toLowerCase().includes('in') || name.toLowerCase().includes('kolam') || district === 'Genuk') ? 'kritis' : 'tinggi',
    description: `Kamera pemantauan stasiun rumah pompa dan kolam retensi ${name}. Sumber: PantauSemar DPU Kota Semarang.`,
  });
});

const allCctvs = Array.from(map.values());
console.log(`Total Unique Real CCTVs extracted: ${allCctvs.length}`);

const genCount = allCctvs.filter(c => c.category === 'rob_banjir').length;
const pmpCount = allCctvs.filter(c => c.category === 'polder_sungai').length;
console.log(`- Kategori Rawan Genangan: ${genCount}`);
console.log(`- Kategori Pantau Pompa: ${pmpCount}`);

fs.writeFileSync('scratch/all_pantausemar_points.json', JSON.stringify(allCctvs, null, 2));
console.log('Saved to scratch/all_pantausemar_points.json');
