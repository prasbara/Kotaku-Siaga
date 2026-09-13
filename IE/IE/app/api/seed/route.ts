import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/seed — seed demo data into database
export async function POST(request: NextRequest) {
  // Only allow in demo mode or development
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Seed tidak diizinkan di production.' }, { status: 403 })
  }

  try {
    const supabase = await createAdminClient()

    // Insert areas (Kota Semarang)
    const areas = [
      { name: 'Kecamatan Semarang Utara', latitude: -6.9554, longitude: 110.4182, population_density: 92, environmental_vulnerability: 92 },
      { name: 'Kecamatan Genuk', latitude: -6.9542, longitude: 110.4721, population_density: 75, environmental_vulnerability: 88 },
      { name: 'Kecamatan Gayamsari', latitude: -6.9850, longitude: 110.4420, population_density: 80, environmental_vulnerability: 78 },
      { name: 'Kecamatan Semarang Timur', latitude: -6.9742, longitude: 110.4350, population_density: 88, environmental_vulnerability: 70 },
      { name: 'Kecamatan Candisari', latitude: -7.0250, longitude: 110.4280, population_density: 68, environmental_vulnerability: 65 },
      { name: 'Kecamatan Tembalang', latitude: -7.0580, longitude: 110.4480, population_density: 60, environmental_vulnerability: 60 },
      { name: 'Kecamatan Tugu', latitude: -6.9680, longitude: 110.3350, population_density: 52, environmental_vulnerability: 74 },
    ]

    const { data: insertedAreas, error: areasError } = await supabase
      .from('areas')
      .upsert(areas, { onConflict: 'name' })
      .select()

    if (areasError) console.error('Areas error:', areasError)

    // Get area IDs
    const { data: areaRows } = await supabase.from('areas').select('id, name')
    const areaMap: Record<string, string> = {}
    areaRows?.forEach(a => { areaMap[a.name] = a.id })

    // Insert education content
    const education = [
      { category: 'banjir', title: 'Banjir Rob & Dinamika Pesisir Semarang', content: JSON.stringify(['Hindari arus air laut pasang yang deras pada akses pantura.', 'Matikan instalasi listrik di rumah jika air rob mulai masuk.', 'Waspadai penurunan tanah (subsidence) yang mempercepat genangan.', 'Perhatikan status pompa polder BBWS dan pintu air sungai.', 'Bawa dokumen berharga ke lantai dua atau tempat terlindung.']) },
      { category: 'genangan', title: 'Mitigasi Genangan Drainase Perkotaan', content: JSON.stringify(['Pastikan saringan selokan depan rumah bersih dari sampah plastik.', 'Jangan menutup seluruh saluran drainase dengan semen tanpa bak kontrol.', 'Segera laporkan titik sumbatan melalui KotaKu Siaga.', 'Buat sumur resapan atau biopori di pekarangan rumah.']) },
      { category: 'drainase_tersumbat', title: 'Bahaya Sedimentasi Saluran Primer & Sekunder', content: JSON.stringify(['Sedimentasi lumpur tebal mengurangi daya tampung saluran pembuang hingga 70%.', 'Sampah anorganik menjadi pemicu utama terbentuknya bendung balik.', 'Periksa kemiringan dan kelancaran aliran parit lingkungan berkala.', 'Gotong royong rutin warga sebelum puncak musim hujan sangat efektif.']) },
      { category: 'sampah_menumpuk', title: 'Dampak Penumpukan Sampah terhadap Sistem Polder', content: JSON.stringify(['Sampah yang hanyut ke muara sungai dapat merusak baling-baling pompa stasiun polder.', 'TPS liar di sempadan sungai mempercepat pendangkalan dasar sungai.', 'Gunakan layanan pengangkutan sampah resmi DLH Kota Semarang.', 'Laporkan tumpukan sampah liar di badan jalan via aplikasi.']) },
      { category: 'longsor', title: 'Kewaspadaan Rekahan Lereng & Perbukitan Semarang', content: JSON.stringify(['Waspadai retakan tanah berbentuk tapal kuda pada tebing lereng Candisari dan Gombel.', 'Perhatikan kemiringan tiang listrik atau pohon yang terjadi tiba-tiba.', 'Munculnya rembesan air keruh menandakan tanah sudah jenuh air.', 'Segera evakuasi ke tempat aman jika terdengar suara gemuruh.']) },
      { category: 'infrastruktur_hijau', title: 'Peran Sabuk Mangrove & Hutan Kota Pesisir', content: JSON.stringify(['Rumpun mangrove pesisir Semarang Utara berfungsi meredam gelombang pasang air laut.', 'Taman kota dan vegetasi menyerap ratusan liter air hujan per jam.', 'Laporkan kerusakan dinding penahan atau tanggul hijau.', 'Dukung program penanaman mangrove dan penghijauan sempadan sungai.']) },
    ]

    const { error: eduError } = await supabase.from('educational_contents').upsert(education, { onConflict: 'category' })
    if (eduError) console.error('Education error:', eduError)

    // Insert demo reports (Kota Semarang)
    const reports = [
      { report_code: 'KKS-2026-00001', title: 'Rob Pesisir Bandarharjo 45cm', category: 'banjir', description: 'Genangan rob pesisir mencapai 45 cm di kawasan Bandarharjo, Semarang Utara. Pompa air darurat sedang beroperasi.', district_name: 'Semarang Utara', address: 'Jl. Bandarharjo, Semarang Utara', latitude: -6.9535, longitude: 110.4289, urgency: 'kritis', status: 'in_progress', reporter_name: 'Warga Bandarharjo', is_demo: true, area_id: areaMap['Kecamatan Semarang Utara'] },
      { report_code: 'KKS-2026-00002', title: 'Drainase Kaligawe Mampet Sedimen', category: 'drainase_tersumbat', description: 'Sedimentasi lumpur tebal dan tumpukan sampah plastik menyumbat saluran primer Kaligawe, Genuk. Aliran melambat drastis menjelang hujan.', district_name: 'Genuk', address: 'Jl. Kaligawe Raya, Genuk', latitude: -6.9620, longitude: 110.4550, urgency: 'tinggi', status: 'verified', reporter_name: 'Relawan Lingkungan', is_demo: true, area_id: areaMap['Kecamatan Genuk'] },
      { report_code: 'KKS-2026-00003', title: 'Parapet Rob Tambaklorok Bocor', category: 'infrastruktur_hijau', description: 'Rembesan air pada parapet pelindung pasang di kawasan pesisir Tambaklorok. Diperlukan penguatan struktur tanggul.', district_name: 'Semarang Utara', address: 'Jl. Tambaklorok, Pesisir Semarang Utara', latitude: -6.9580, longitude: 110.4150, urgency: 'sedang', status: 'investigating', reporter_name: 'Komunitas Pesisir', is_demo: true, area_id: areaMap['Kecamatan Semarang Utara'] },
      { report_code: 'KKS-2026-00004', title: 'Genangan 20cm Gayamsari', category: 'genangan', description: 'Genangan air sisa hujan setinggi 20 cm di pertigaan jalan raya Gayamsari akibat drainase sekunder lambat surut.', district_name: 'Gayamsari', address: 'Jl. Gayamsari Raya, Semarang Timur', latitude: -6.9850, longitude: 110.4420, urgency: 'sedang', status: 'submitted', reporter_name: 'Warga Gayamsari', is_demo: true, area_id: areaMap['Kecamatan Gayamsari'] },
      { report_code: 'KKS-2026-00005', title: 'Retakan Tebing Candisari', category: 'longsor', description: 'Retakan tanah selebar 10 cm sepanjang 15 meter pada tebing permukiman Candisari setelah hujan deras kemarin sore.', district_name: 'Candisari', address: 'Kawasan Perbukitan Candisari, Semarang Selatan', latitude: -7.0250, longitude: 110.4280, urgency: 'tinggi', status: 'verified', reporter_name: 'Forum RW Candisari', is_demo: true, area_id: areaMap['Kecamatan Candisari'] },
      { report_code: 'KKS-2026-00006', title: 'Genangan Rob Terboyo Megah 60cm', category: 'banjir', description: 'Banjir rob setinggi 60 cm merendam kawasan industri Terboyo Megah. Akses jalan terputus, kendaraan berat tidak bisa lewat.', district_name: 'Genuk', address: 'Jl. Terboyo Megah, Kawasan Industri Terboyo', latitude: -6.9614, longitude: 110.4456, urgency: 'kritis', status: 'in_progress', reporter_name: 'Operator Kawasan Terboyo', is_demo: true, area_id: areaMap['Kecamatan Genuk'] },
      { report_code: 'KKS-2026-00007', title: 'Sampah Menumpuk Jl. Pemuda', category: 'sampah_menumpuk', description: 'Tumpukan sampah di median jalan mengganggu aliran drainase tepi jalan.', district_name: 'Semarang Tengah', address: 'Jl. Pemuda, Semarang Tengah', latitude: -6.9727, longitude: 110.4381, urgency: 'rendah', status: 'submitted', reporter_name: 'Warga Semarang Tengah', is_demo: true },
    ]

    const { error: reportsError } = await supabase
      .from('reports')
      .upsert(reports, { onConflict: 'report_code' })

    if (reportsError) console.error('Reports error:', reportsError)

    return NextResponse.json({
      success: true,
      message: 'Seed data berhasil dimasukkan.',
      counts: {
        areas: areas.length,
        education: education.length,
        reports: reports.length,
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed gagal.' }, { status: 500 })
  }
}
