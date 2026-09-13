const fs = require('fs');

const allCctvs = JSON.parse(fs.readFileSync('scratch/all_pantausemar_points.json', 'utf8'));

const tsHeader = `// ============================================================
// KotaKu Siaga — 70 Titik CCTV PantauSemar (Real-time HLS)
// Sumber: Portal PantauSemar Pemerintah Kota Semarang
// - Kategori Rawan Genangan Air (14 Titik)
// - Kategori Pantau Pompa Air (56 Titik)
// Streaming Server: https://livepantau.semarangkota.go.id/
// ============================================================

export interface CCTVPoint {
  id: string
  name: string
  code: string
  district: string
  category: 'rob_banjir' | 'polder_sungai' | 'lalin_protokol'
  categoryLabel: string
  status: 'online' | 'maintenance' | 'offline'
  resolution: string
  latitude: number
  longitude: number
  address: string
  opd: string
  streamUrl: string
  waterRiskLevel: 'kritis' | 'tinggi' | 'sedang' | 'rendah'
  description: string
  cctvId?: number
  linkId?: number
}

export const CCTV_PRIORITY_NOTE = 'Menampilkan 70 titik kamera pemantau genangan air dan pompa polder dari portal resmi PantauSemar Kota Semarang.'

export const PANTAUSEMAR_CCTV_POINTS: CCTVPoint[] = `;

const tsContent = tsHeader + JSON.stringify(allCctvs, null, 2) + ';\n';

fs.writeFileSync('lib/data/cctv-pantausemar.ts', tsContent);
console.log('Successfully updated lib/data/cctv-pantausemar.ts with 70 real cameras!');
