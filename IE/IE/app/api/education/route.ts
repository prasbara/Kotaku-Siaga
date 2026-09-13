import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const FALLBACK_EDUCATION = [
  {
    id: 'edu-001',
    category: 'banjir',
    title: 'Banjir Rob & Dinamika Pesisir Semarang',
    content: JSON.stringify([
      'Hindari arus air laut pasang yang deras pada akses pantura Semarang-Demak.',
      'Matikan instalasi listrik dari panel utama jika air rob mulai masuk ke teras/lantai rumah.',
      'Waspadai penurunan tanah (subsidence) yang mempercepat genangan air laut di kawasan pesisir.',
      'Perhatikan status pompa polder BBWS (Sringin, Tenggang, Kalibaru, BKB) dan pintu air sungai.',
      'Bawa dokumen penting ke tempat yang lebih tinggi sebelum genangan mencapai puncaknya.',
      'Pantau visual CCTV PantauSemar untuk memonitor ketinggian air jalan sebelum bepergian.',
    ]),
  },
  {
    id: 'edu-002',
    category: 'genangan',
    title: 'Mitigasi Genangan Drainase Perkotaan',
    content: JSON.stringify([
      'Pastikan saringan selokan (inlet) depan rumah bersih dari sampah plastik dan daun rontok.',
      'Hindari menutup total saluran air dengan cor semen tanpa bak kontrol inspeksi pembersihan.',
      'Laporkan saluran tersumbat ke platform KotaKu Siaga untuk percepatan tindakan dinas PU.',
      'Buat sumur resapan atau lubang biopori di pekarangan rumah untuk meningkatkan daya serap air.',
      'Hindari menerobos genangan air yang ketinggiannya melebihi knalpot kendaraan bermotor.',
    ]),
  },
  {
    id: 'edu-003',
    category: 'drainase_tersumbat',
    title: 'Bahaya Sedimentasi Saluran Primer & Sekunder',
    content: JSON.stringify([
      'Sedimentasi lumpur tebal mengurangi daya tampung debit saluran drainase hingga 70%.',
      'Sampah anorganik menjadi pemicu utama terjadinya bendung balik (backwater effect).',
      'Periksa kondisi kemiringan dan kelancaran parit di sekitar rumah secara berkala.',
      'Gotong royong rutin warga membersihkan gorong-gorong sangat efektif mencegah genangan.',
      'Satu titik sumbatan pada saluran utama dapat melumpuhkan aliran air satu kelurahan.',
    ]),
  },
  {
    id: 'edu-004',
    category: 'sampah_menumpuk',
    title: 'Dampak Penumpukan Sampah terhadap Sistem Polder',
    content: JSON.stringify([
      'Sampah yang hanyut ke muara sungai dapat merusak turbin pompa stasiun polder pengendali rob.',
      'TPS liar di tepi saluran air mempercepat pendangkalan sedimentasi dan pencemaran aroma.',
      'Gunakan jadwal resmi pengangkutan sampah Dinas Lingkungan Hidup Kota Semarang.',
      'Kurangi penggunaan plastik sekali pakai yang sulit terurai dan rentan menyumbat saringan air.',
      'Laporkan TPS liar di ruang publik melalui KotaKu Siaga untuk tindak lanjut cepat.',
    ]),
  },
  {
    id: 'edu-005',
    category: 'longsor',
    title: 'Kewaspadaan Rekahan Lereng & Perbukitan Semarang',
    content: JSON.stringify([
      'Waspadai retakan tanah berbentuk tapal kuda pada tebing permukiman Candisari, Gajahmungkur, dan Gombel.',
      'Perhatikan kemiringan tiang listrik, pagar, atau pepohonan yang terjadi secara tiba-tiba.',
      'Rembesan air keruh di kaki tebing menandakan lapisan tanah sudah jenuh air dan rawan longsor.',
      'Segera evakuasi mandiri ke zona aman jika terdengar suara gemuruh kecil dari arah bukit.',
      'Pertahankan tanaman berakar tunjang penahan lereng dan hindari pemotongan tebing terjal tanpa kajian.',
    ]),
  },
  {
    id: 'edu-006',
    category: 'infrastruktur_hijau',
    title: 'Peran Sabuk Mangrove & Hutan Kota Pesisir',
    content: JSON.stringify([
      'Sabuk vegetasi mangrove di pesisir Semarang Utara meredam energi hempasan gelombang rob.',
      'Taman kota dan ruang terbuka hijau mampu menyerap ratusan liter air hujan per meter persegi.',
      'Laporkan kerusakan tanggul hijau atau kematian vegetasi peneduh ke dinas terkait.',
      'Dukung program penanaman mangrove dan konservasi bantaran sempadan sungai BKB dan BKT.',
      'Infrastruktur hijau menurunkan efek pulau bahang (urban heat) dan menjaga kestabilan pantai.',
    ]),
  },
]

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')
    const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')

    if (!isDummySupabase) {
      try {
        const supabase = await createAdminClient()
        let query = supabase.from('educational_contents').select('*').order('category')
        if (category) {
          query = query.eq('category', category)
        }
        const { data, error } = await query
        if (!error && data && data.length > 0) {
          return NextResponse.json({ success: true, data })
        }
      } catch (dbErr) {
        console.warn('Supabase educational_contents query failed, using baseline data:', dbErr)
      }
    }

    let filtered = FALLBACK_EDUCATION
    if (category) {
      filtered = filtered.filter((e) => e.category === category)
    }

    return NextResponse.json({ success: true, data: filtered, is_fallback: true })
  } catch (error) {
    console.error('GET /api/education error:', error)
    return NextResponse.json({ success: true, data: FALLBACK_EDUCATION, is_fallback: true })
  }
}
