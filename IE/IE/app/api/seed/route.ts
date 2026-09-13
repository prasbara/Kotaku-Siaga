import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// POST /api/seed — seed reference data (areas, educational content) into database
// SECURITY: Requires SEED_SECRET environment variable to be set and matched.
// This endpoint is disabled if SEED_SECRET is not configured.
// Never seeds citizen reports or fake flood events into production.

export async function POST(request: NextRequest) {
  // Guard 1: SEED_SECRET must be configured
  const seedSecret = process.env.SEED_SECRET
  if (!seedSecret) {
    return NextResponse.json(
      { error: 'Seed endpoint disabled. SEED_SECRET is not configured.' },
      { status: 403 }
    )
  }

  // Guard 2: Request must provide the correct secret
  let providedSecret: string | undefined
  try {
    const body = await request.json()
    providedSecret = body.secret
  } catch {
    return NextResponse.json({ error: 'Request body tidak valid.' }, { status: 400 })
  }

  if (!providedSecret || providedSecret !== seedSecret) {
    return NextResponse.json(
      { error: 'Seed tidak diizinkan. Secret tidak cocok.' },
      { status: 403 }
    )
  }

  // Guard 3: Database must be configured
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured.' },
      { status: 503 }
    )
  }

  try {
    const supabase = await createAdminClient()

    // Seed areas (Kota Semarang) — reference data only, not citizen reports
    const areas = [
      { name: 'Kecamatan Semarang Utara', latitude: -6.9554, longitude: 110.4182, population_density: 92, environmental_vulnerability: 92 },
      { name: 'Kecamatan Genuk', latitude: -6.9542, longitude: 110.4721, population_density: 75, environmental_vulnerability: 88 },
      { name: 'Kecamatan Gayamsari', latitude: -6.9850, longitude: 110.4420, population_density: 80, environmental_vulnerability: 78 },
      { name: 'Kecamatan Semarang Timur', latitude: -6.9742, longitude: 110.4350, population_density: 88, environmental_vulnerability: 70 },
      { name: 'Kecamatan Candisari', latitude: -7.0250, longitude: 110.4280, population_density: 68, environmental_vulnerability: 65 },
      { name: 'Kecamatan Tembalang', latitude: -7.0580, longitude: 110.4480, population_density: 60, environmental_vulnerability: 60 },
      { name: 'Kecamatan Tugu', latitude: -6.9680, longitude: 110.3350, population_density: 52, environmental_vulnerability: 74 },
    ]

    const { error: areasError } = await supabase
      .from('areas')
      .upsert(areas, { onConflict: 'name' })
      .select()

    if (areasError) console.error('Areas seed error:', areasError)

    // Seed educational content — static reference data
    const education = [
      { category: 'banjir', title: 'Banjir Rob & Dinamika Pesisir Semarang', content: JSON.stringify(['Hindari arus air laut pasang yang deras pada akses pantura.', 'Matikan instalasi listrik di rumah jika air rob mulai masuk.', 'Waspadai penurunan tanah (subsidence) yang mempercepat genangan.', 'Perhatikan status pompa polder BBWS dan pintu air sungai.', 'Bawa dokumen berharga ke lantai dua atau tempat terlindung.']) },
      { category: 'genangan', title: 'Mitigasi Genangan Drainase Perkotaan', content: JSON.stringify(['Pastikan saringan selokan depan rumah bersih dari sampah plastik.', 'Jangan menutup seluruh saluran drainase dengan semen tanpa bak kontrol.', 'Segera laporkan titik sumbatan melalui KotaKu Siaga.', 'Buat sumur resapan atau biopori di pekarangan rumah.']) },
      { category: 'drainase_tersumbat', title: 'Bahaya Sedimentasi Saluran Primer & Sekunder', content: JSON.stringify(['Sedimentasi lumpur tebal mengurangi daya tampung saluran pembuang hingga 70%.', 'Sampah anorganik menjadi pemicu utama terbentuknya bendung balik.', 'Periksa kemiringan dan kelancaran aliran parit lingkungan berkala.', 'Gotong royong rutin warga sebelum puncak musim hujan sangat efektif.']) },
      { category: 'sampah_menumpuk', title: 'Dampak Penumpukan Sampah terhadap Sistem Polder', content: JSON.stringify(['Sampah yang hanyut ke muara sungai dapat merusak baling-baling pompa stasiun polder.', 'TPS liar di sempadan sungai mempercepat pendangkalan dasar sungai.', 'Gunakan layanan pengangkutan sampah resmi DLH Kota Semarang.', 'Laporkan tumpukan sampah liar di badan jalan via aplikasi.']) },
      { category: 'longsor', title: 'Kewaspadaan Rekahan Lereng & Perbukitan Semarang', content: JSON.stringify(['Waspadai retakan tanah berbentuk tapal kuda pada tebing lereng Candisari dan Gombel.', 'Perhatikan kemiringan tiang listrik atau pohon yang terjadi tiba-tiba.', 'Munculnya rembesan air keruh menandakan tanah sudah jenuh air.', 'Segera evakuasi ke tempat aman jika terdengar suara gemuruh.']) },
      { category: 'infrastruktur_hijau', title: 'Peran Sabuk Mangrove & Hutan Kota Pesisir', content: JSON.stringify(['Rumpun mangrove pesisir Semarang Utara berfungsi meredam gelombang pasang air laut.', 'Taman kota dan vegetasi menyerap ratusan liter air hujan per jam.', 'Laporkan kerusakan dinding penahan atau tanggul hijau.', 'Dukung program penanaman mangrove dan penghijauan sempadan sungai.']) },
    ]

    const { error: eduError } = await supabase.from('educational_contents').upsert(education, { onConflict: 'category' })
    if (eduError) console.error('Education seed error:', eduError)

    // PRODUCTION: No citizen reports or flood events are seeded.
    // Demo reports (is_demo: true) are NOT seeded to prevent fake data in production dashboards.

    return NextResponse.json({
      success: true,
      message: 'Reference data seeded successfully.',
      counts: {
        areas: areas.length,
        education: education.length,
        citizen_reports: 0, // PRODUCTION: no fake citizen reports seeded
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed gagal.' }, { status: 500 })
  }
}

// Reject all other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method tidak diizinkan.' }, { status: 405 })
}
export async function PUT() {
  return NextResponse.json({ error: 'Method tidak diizinkan.' }, { status: 405 })
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method tidak diizinkan.' }, { status: 405 })
}
export async function PATCH() {
  return NextResponse.json({ error: 'Method tidak diizinkan.' }, { status: 405 })
}
