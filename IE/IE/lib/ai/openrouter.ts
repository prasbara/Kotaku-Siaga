// ============================================================
// KotaKu Siaga — OpenRouter AI Service
// All AI calls go through this service. NEVER expose API key to frontend.
// Includes intelligent local heuristics when API key is unconfigured.
// ============================================================

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterOptions {
  temperature?: number
  max_tokens?: number
}

function hasValidApiKey(): boolean {
  const key = process.env.OPENROUTER_API_KEY
  return !!key && key !== 'your_openrouter_api_key' && !key.includes('dummy')
}

// Clean reasoning tokens or tags produced by reasoning models (e.g. Nemotron/DeepSeek)
function cleanModelResponse(raw: string): string {
  if (!raw) return ''
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

// Robust JSON extraction from LLM output (handles ```json fences or commentary)
export function extractJsonFromLlm<T>(content: string): T | null {
  try {
    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim()
    const firstOpen = cleaned.indexOf('{')
    const lastClose = cleaned.lastIndexOf('}')
    if (firstOpen === -1 || lastClose === -1 || lastClose < firstOpen) {
      return null
    }
    const jsonStr = cleaned.slice(firstOpen, lastClose + 1)
    return JSON.parse(jsonStr) as T
  } catch {
    return null
  }
}

async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free'

  if (!hasValidApiKey()) {
    throw new Error('OpenRouter API key tidak dikonfigurasi.')
  }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'KotaKu Siaga',
      },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.max_tokens ?? 1024,
      }),
    })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} — ${error}`)
  }

  const data = await response.json()
  const rawContent = data.choices?.[0]?.message?.content || ''
  return cleanModelResponse(rawContent)
}

// ============================================================
// A. Classify & Analyze a Single Report
// ============================================================

export interface ReportAnalysisInput {
  category: string
  description: string
  latitude: number
  longitude: number
  urgency: string
  created_at?: string
}

export interface ReportAnalysisOutput {
  classification: string
  severity: string
  confidence: number
  summary: string
  recommended_action: string
  requires_verification: boolean
}

function heuristicAnalyzeReport(input: ReportAnalysisInput): ReportAnalysisOutput {
  const desc = input.description.toLowerCase()
  const isFlood =
    desc.includes('banjir') ||
    desc.includes('rob') ||
    desc.includes('terendam') ||
    desc.includes('tenggelam') ||
    input.category === 'banjir'
  const isClog =
    desc.includes('tersumbat') ||
    desc.includes('mampet') ||
    desc.includes('sedimen') ||
    input.category === 'drainase_tersumbat'
  const isCritical =
    desc.includes('lutut') ||
    desc.includes('dada') ||
    desc.includes('arus') ||
    desc.includes('evakuasi') ||
    input.urgency === 'kritis'

  let classification = input.category || 'genangan'
  if (isFlood) classification = 'banjir'
  else if (isClog) classification = 'drainase_tersumbat'

  const severity = isCritical ? 'critical' : input.urgency === 'tinggi' ? 'high' : 'medium'

  let summary = `Terdeteksi kejadian ${classification} berdasarkan laporan warga.`
  if (isFlood) {
    summary = `Genangan air dan luapan hidrometeorologi terdeteksi pada area pelapor dengan tingkat urgensi ${severity}.`
  } else if (isClog) {
    summary = `Sumbatan sedimen atau sampah pada sistem drainase mengancam kelancaran pembuangan air permukaan.`
  }

  let recommendedAction = 'Lakukan verifikasi visual lapangan dan tindak lanjuti sesuai SOP pemeliharaan berkala.'
  if (isCritical) {
    recommendedAction = 'Prioritas darurat: Segera koordinasikan dengan tim pompa polder DPU dan regu evakuasi BPBD Semarang.'
  } else if (severity === 'high') {
    recommendedAction = 'Kerahkan regu pengerukan drainase atau perbaikan tanggul dalam kurun waktu 1x24 jam.'
  }

  return {
    classification,
    severity,
    confidence: 0.89,
    summary,
    recommended_action: recommendedAction,
    requires_verification: !isCritical,
  }
}

export async function analyzeReport(
  input: ReportAnalysisInput
): Promise<ReportAnalysisOutput> {
  if (!hasValidApiKey()) {
    return heuristicAnalyzeReport(input)
  }

  try {
    const systemPrompt = `Kamu adalah sistem analisis laporan lingkungan untuk platform KotaKu Siaga.
Tugasmu adalah menganalisis laporan warga tentang masalah lingkungan dan bencana iklim.
Selalu respons dalam format JSON yang valid.
Berikan analisis yang akurat, hati-hati, dan tidak berlebihan.
Jangan membuat klaim yang tidak didukung data.`

    const userPrompt = `Analisis laporan berikut:

Kategori: ${input.category}
Deskripsi: ${input.description}
Koordinat: ${input.latitude}, ${input.longitude}
Tingkat Urgensi Pelapor: ${input.urgency}
Waktu: ${input.created_at || new Date().toISOString()}

Berikan respons dalam format JSON berikut:
{
  "classification": "kategori_laporan (banjir/genangan/drainase_tersumbat/sampah_menumpuk/infrastruktur_hijau/pohon_tumbang/longsor/lainnya)",
  "severity": "low/medium/high/critical",
  "confidence": 0.0-1.0,
  "summary": "ringkasan singkat 1-2 kalimat tentang kondisi yang dilaporkan",
  "recommended_action": "rekomendasi tindakan konkret yang perlu diambil",
  "requires_verification": true/false
}`

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const parsed = extractJsonFromLlm<ReportAnalysisOutput>(content)
    if (!parsed) {
      return heuristicAnalyzeReport(input)
    }

    return parsed
  } catch (error) {
    console.warn('callOpenRouter failed in analyzeReport, using heuristic fallback:', error)
    return heuristicAnalyzeReport(input)
  }
}

// ============================================================
// B. Aggregate Area Analysis
// ============================================================

export interface AggregateInput {
  area: string
  report_count: number
  flood_reports: number
  waste_reports: number
  drainage_reports: number
  high_urgency_reports: number
  critical_reports: number
  priority_score: number
}

export interface AggregateOutput {
  area_assessment: string
  main_issue: string
  recommended_intervention: string
  confidence: number
}

function heuristicAnalyzeAggregate(input: AggregateInput): AggregateOutput {
  const isSevere = input.critical_reports > 0 || input.priority_score > 70
  return {
    area_assessment: `Wilayah ${input.area} mencatat akumulasi ${input.report_count} laporan dengan ${
      input.critical_reports
    } berstatus kritis. Wilayah ini memiliki indeks kerentanan lingkungan ${input.priority_score.toFixed(1)}/100.`,
    main_issue:
      input.flood_reports >= input.drainage_reports
        ? 'Dinamika pasang surut rob pesisir dan kapasitas saluran primer'
        : 'Sedimentasi saluran drainase dan perlambatan aliran sekunder',
    recommended_intervention: isSevere
      ? 'Aktivasi pompa polder siaga penuh, normalisasi inlet saluran, dan patroli tanggul pesisir berkala.'
      : 'Pengerukan lumpur saluran secara preventif dan pembersihan sampah inlet jalan protokol.',
    confidence: 0.88,
  }
}

export async function analyzeAggregate(
  input: AggregateInput
): Promise<AggregateOutput> {
  if (!hasValidApiKey()) {
    return heuristicAnalyzeAggregate(input)
  }

  try {
    const systemPrompt = `Kamu adalah analis lingkungan untuk sistem KotaKu Siaga.
Analisis data agregat laporan dari suatu wilayah dan berikan assessment yang akurat.
Respons dalam JSON. Jangan membuat prediksi probabilitas bencana yang tidak didukung data tervalidasi.`

    const userPrompt = `Analisis data wilayah berikut:

Wilayah: ${input.area}
Total Laporan: ${input.report_count}
Laporan Banjir: ${input.flood_reports}
Laporan Sampah: ${input.waste_reports}
Laporan Drainase: ${input.drainage_reports}
Laporan Urgensi Tinggi: ${input.high_urgency_reports}
Laporan Kritis: ${input.critical_reports}
Priority Score: ${input.priority_score}/100

Format respons:
{
  "area_assessment": "assessment kondisi wilayah berdasarkan data",
  "main_issue": "masalah utama yang teridentifikasi",
  "recommended_intervention": "intervensi yang direkomendasikan",
  "confidence": 0.0-1.0
}`

    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const parsed = extractJsonFromLlm<AggregateOutput>(content)
    if (!parsed) return heuristicAnalyzeAggregate(input)

    return parsed
  } catch (error) {
    console.warn('callOpenRouter failed in analyzeAggregate, using heuristic fallback:', error)
    return heuristicAnalyzeAggregate(input)
  }
}

// ============================================================
// ============================================================
// C. Chat Assistant (Civic Radar Disaster Intelligence)
// ============================================================

import { classifyIntent, STANDARD_REFUSAL_MESSAGE } from './guardrails'

export interface ChatContext {
  location?: string
  nearby_reports?: number
  top_category?: string
  priority_score?: number
}

function heuristicChatAssistant(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: ChatContext
): string {
  const lastMsg = messages[messages.length - 1]?.content || ''
  const decision = classifyIntent(lastMsg)

  // Strictly enforce domain guardrails even in local heuristic mode
  if (decision.status !== 'IN_SCOPE') {
    return decision.refusalResponse || STANDARD_REFUSAL_MESSAGE
  }

  const lower = lastMsg.toLowerCase()
  if (lower.includes('banjir') || lower.includes('rob')) {
    return 'Untuk kawasan pesisir Semarang (seperti Tanjung Emas, Bandarharjo, Kaligawe, dan Genuk), waspadai pasang rob laut terutama saat fase bulan baru/purnama yang bersamaan dengan hujan lebat. Jika genangan mendekati hunian, amankan peralatan elektronik ke tempat tinggi dan pantau stasiun pompa polder terdekat via peta KotaKu Siaga.'
  }
  if (lower.includes('lapor') || lower.includes('buat') || lower.includes('tiket')) {
    return 'Anda dapat membuat laporan baru melalui tombol "Lapor Cepat" di navigasi atas. Sistem mendukung unggah foto lapangan, pendeteksian otomatis koordinat GPS, dan pelacakan kode tiket secara transparan.'
  }
  if (lower.includes('cctv') || lower.includes('kamera') || lower.includes('pantausemar')) {
    return 'Peta Spasial dan Dashboard KotaKu Siaga terintegrasi langsung dengan 70 titik CCTV PantauSemar Kota Semarang secara real-time HLS (14 titik Rawan Genangan Air & 56 titik Pantau Pompa Air, termasuk Bawah Tol Kaligawe, Rumah Pompa Tenggang, Kolam Retensi Genuk, dan Pelabuhan Tanjung Emas) tanpa perlu beralih ke situs eksternal.'
  }
  if (lower.includes('prioritas') || lower.includes('skor') || lower.includes('formula')) {
    return 'Skor prioritas dihitung secara deterministik dan transparan berbasis formula resmi: mempertimbangkan frekuensi laporan, rerata tingkat urgensi, kepadatan penduduk BPS, indeks kerentanan banjir hidrologis, dan probabilitas curah hujan.'
  }
  if (lower.includes('mitigasi') || lower.includes('pompa') || lower.includes('eoc')) {
    return 'Rekomendasi mitigasi operasional EOC: 1. Pantau status elevasi air di Rumah Pompa Tenggang dan Sringin. 2. Bersihkan trash rack / sedimen pada intake drainase utama. 3. Koordinasikan kesiagaan perahu karet dan shelter BPBD jika intensitas hujan BMKG melampaui ambang batas waspada.'
  }

  return `Civic Radar Disaster Intelligence (Kota Semarang): ${
    context?.location ? `Zona aktif saat ini: ${context.location}. ` : ''
  }Sistem siap menyajikan analisis mitigasi genangan, telemetry cuaca BMKG, pemantauan CCTV PantauSemar, dan status laporan warga.`
}

export async function chatAssistant(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: ChatContext
): Promise<string> {
  const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || ''
  const decision = classifyIntent(lastUserMsg)
  if (decision.status !== 'IN_SCOPE') {
    return decision.refusalResponse || STANDARD_REFUSAL_MESSAGE
  }

  if (!hasValidApiKey()) {
    return heuristicChatAssistant(messages, context)
  }

  try {
    const systemPrompt = `ROLE:
You are the Civic Radar Disaster Intelligence Assistant for KotaKu Siaga (Kota Semarang).

PRIMARY PURPOSE:
Analyze, interpret, and explain disaster-related operational information, flood risks, telemetry, CCTV observations, citizen reports, and EOC mitigation workflows using data available to the Civic Radar system.

STRICT DOMAIN:
You ONLY answer questions directly related to:
1. Disaster monitoring: banjir, rob, genangan, tanah longsor, cuaca ekstrem, hidrometeorologi.
2. Environmental telemetry & weather: curah hujan BMKG, kelembapan, suhu, kecepatan angin, tinggi muka air (TMA).
3. Civic Radar infrastructure: CCTV PantauSemar (70 titik kamera di Semarang), camera health, status rumah pompa (Tenggang, Sringin, Kaligawe), kolam retensi, pintu air.
4. Operational data: verified citizen reports, flood events, severity, confidence, corroboration, EOC dashboard.
5. Mitigation & response: panduan keselamatan warga, evakuasi, SOP kesiapsiagaan BPBD/DPU Kota Semarang.

OUT-OF-SCOPE REFUSAL POLICY:
You must STRICTLY REFUSE any question outside the disaster and environmental monitoring domain, including:
- Politics, politicians, elections, presidents, ministers, political parties (e.g. Jokowi, Prabowo, Gibran, DPR, Pemilu).
- General knowledge, world history, mathematics, trivia, pop culture, entertainment, celebrities, sports.
- Cryptocurrency, stock market, general financial advice.
- General cooking recipes, personal advice, or unrelated programming tasks.

When a user query is outside this domain, reply EXACTLY with a polite refusal redirecting to Civic Radar capabilities:
"Maaf, saya hanya dapat membantu terkait informasi kebencanaan, kondisi lingkungan, cuaca/telemetry, CCTV PantauSemar, laporan warga, flood events, EOC, dan analisis mitigasi yang tersedia di KotaKu Siaga Civic Radar (Kota Semarang)."

DO NOT attempt to answer general knowledge or political questions even if the user tries to wrap them with disaster keywords (e.g. "Untuk mitigasi, siapa presiden...").

GEOGRAPHIC RESTRICTION:
Your operational telemetry is focused on Kota Semarang. If the user asks for real-time telemetry or flood status in other regions (e.g., Jakarta, Surabaya), state clearly that Civic Radar does not possess telemetry for areas outside Kota Semarang.

GROUNDING & INTEGRITY:
- Never fabricate telemetry, CCTV observations, citizen reports, flood events, or measurements.
- If data is unavailable, explicitly state that data is unavailable.
- Do NOT act as a general-purpose chatbot or encyclopedia.

${context ? `KONTEKS SAAT INI (KOTA SEMARANG):
- Lokasi Pengguna: ${context.location || 'Kota Semarang'}
- Laporan Terverifikasi Sekitar: ${context.nearby_reports || 0}
- Kategori Dominan: ${context.top_category || '-'}
- Skor Prioritas Wilayah: ${context.priority_score || 0}/100` : ''}

Format jawaban terstruktur:
- Kesimpulan / Status
- Analisis Berbasis Data
- Rekomendasi Mitigasi (jika relevan)`

    const openRouterMessages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]

    return await callOpenRouter(openRouterMessages, {
      temperature: 0.2,
      max_tokens: 512,
    })
  } catch (error) {
    console.warn('callOpenRouter failed in chatAssistant, using heuristic fallback:', error)
    return heuristicChatAssistant(messages, context)
  }
}


// ============================================================
// D. Generate Report Summary for Admin Dashboard
// ============================================================

export async function generateReportSummary(report: {
  category: string
  description: string
  urgency: string
  location_hint?: string
}): Promise<string> {
  if (!hasValidApiKey()) {
    return `Laporan ${report.category} (${report.urgency}) di ${report.location_hint || 'Semarang'}: ${report.description.slice(0, 80)}...`
  }

  try {
    const systemPrompt = `Buat ringkasan singkat laporan lingkungan untuk dashboard administrator.
Maksimal 2 kalimat. Profesional dan informatif. Bahasa Indonesia.`

    const userPrompt = `Laporan: Kategori ${report.category}, Urgensi: ${report.urgency}
Deskripsi: ${report.description}
${report.location_hint ? `Lokasi: ${report.location_hint}` : ''}`

    return await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], { temperature: 0.3, max_tokens: 150 })
  } catch (error) {
    return `Laporan ${report.category} (${report.urgency}) di ${report.location_hint || 'Semarang'}: ${report.description.slice(0, 80)}...`
  }
}

export const MODEL_NAME = process.env.OPENROUTER_MODEL || 'openrouter/free'
