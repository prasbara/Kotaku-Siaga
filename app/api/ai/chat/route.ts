import { NextRequest, NextResponse } from 'next/server'
import { chatAssistant } from '@/lib/ai/openrouter'
import { classifyIntent, validateOutput, STANDARD_REFUSAL_MESSAGE } from '@/lib/ai/guardrails'

// Rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = requestCounts.get(ip)
  if (!limit || now > limit.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (limit.count >= 60) return true // 60 chat messages per minute
  limit.count++
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Tunggu sebentar.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 })
    }

    // Limit message history to last 10 messages
    const limitedMessages = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).slice(0, 1000), // Limit per message
    }))

    // Find the latest user query to inspect
    const userMessages = limitedMessages.filter((m: { role: string }) => m.role === 'user')
    const latestUserMsg = userMessages[userMessages.length - 1]?.content || ''

    // 1. APPLICATION-LEVEL GUARD: Domain / Intent Classification
    const decision = classifyIntent(latestUserMsg)

    if (decision.status !== 'IN_SCOPE') {
      return NextResponse.json({
        success: true,
        message: decision.refusalResponse || STANDARD_REFUSAL_MESSAGE,
        guardrail_status: decision.status,
      })
    }

    // 2. LLM EXECUTION (Constrained to Disaster Domain)
    let rawResponse = ''
    try {
      rawResponse = await chatAssistant(limitedMessages, context)
    } catch (llmErr) {
      console.warn('OpenRouter LLM failed, using deterministic local heuristic engine:', llmErr)
      rawResponse = generateLocalHeuristicResponse(latestUserMsg)
    }

    // 3. POST-GENERATION VALIDATION
    const { isValid, sanitizedText } = validateOutput(rawResponse)

    return NextResponse.json({
      success: true,
      message: isValid ? sanitizedText : STANDARD_REFUSAL_MESSAGE,
      guardrail_status: 'IN_SCOPE',
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({
      success: true,
      message: generateLocalHeuristicResponse(''),
      guardrail_status: 'IN_SCOPE',
    })
  }
}

function generateLocalHeuristicResponse(query: string): string {
  const q = (query || '').toLowerCase()

  if (q.includes('skor') || q.includes('prioritas') || q.includes('hitung') || q.includes('rumus') || q.includes('formula')) {
    return `[Analisis Deterministik ISO 37120]\n\nSkor Prioritas Penanganan KotaKu Siaga dihitung menggunakan Formula D-RISK multi-kriteria berbasis data spasial obyektif:\n\n• Urgensi Lapangan [U] (Bobot 35%): Validasi kedalaman genangan & hambatan akses\n• Frekuensi Laporan [L] (Bobot 25%): Kluster spasial laporan warga terverifikasi\n• Rekam Historis Bencana [H] (Bobot 15%): Arsip DIBI BNPB 2020–2026\n• Kepadatan Penduduk [P] (Bobot 15%): Data BPS per km²\n• Kerentanan Lingkungan [K] (Bobot 10%): Elevasi DEM Ina-Geoportal & penurunan tanah (land subsidence)\n\nWilayah dengan skor di atas 80 diklasifikasikan sebagai PRIORITAS KRITIS untuk disposisi armada pompa bergerak dan tim reaksi cepat BPBD.`
  }

  if (q.includes('sumber') || q.includes('cuaca') || q.includes('rob') || q.includes('data')) {
    return `[Telemetri Multi-Sumber KotaKu Siaga]\n\nPlatform mengintegrasikan 4 pilar data resmi:\n1. Cuaca & Presipitasi: Data terbuka WMO / Open-Meteo & BMKG Stasiun Meteorologi Maritim Tanjung Emas\n2. Visual Titik Pantau: 70 kamera CCTV publik PantauSemar Diskominfo Kota Semarang\n3. Elevasi & Topografi: Ina-Geoportal Badan Informasi Geospasial (DEM NAS 0–350m DPL)\n4. Laporan Warga Terverifikasi: Diotentikasi via Supabase Email OTP & Turnstile anti-bot.`
  }

  if (q.includes('genuk') || q.includes('kaligawe') || q.includes('tanjung emas') || q.includes('pesisir') || q.includes('mitigasi')) {
    return `[Kajian Wilayah Pesisir Semarang]\n\nKawasan Genuk, Kaligawe, dan Tanjung Emas berada pada elevasi rendah (< 2.5 meter DPL) yang rentan terhadap fenomena rob astronomis dan luapan Kali Tenggang/Kali Sringin.\n\nLangkah Mitigasi Operasional EOC:\n• Optimalisasi 5 pompa stasioner di Rumah Pompa Tenggang & Sringin\n• Pemantauan tinggi muka air (TMA) saluran kolektor Pantura\n• Penutupan pintu air pasang saat pasang laut maksimum\n• Rekomendasi warga: Amankan instalasi listrik dan pantau status visual via menu CCTV di peta.`
  }

  return `[Pusat Intelijen Kebencanaan Semarang]\n\nKotaKu Siaga memantau dinamika hidrometeorologis 16 kecamatan di Kota Semarang secara kontinu. Untuk kondisi darurat evakuasi atau pohon tumbang, segera hubungi Call Center 112 (Bebas Pulsa 24 Jam) atau buat laporan terverifikasi melalui menu Lapor di aplikasi.`
}
