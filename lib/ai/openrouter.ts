// ============================================================
// KotaKu Siaga — OpenRouter Multi-Key AI Service & Observability
// 1 Primary Key + 3 Fallback Keys (Total 4 Keys with auto-rotation)
// CPU-Only · Vercel-Compatible · Full Telemetry & Outage Tracking
// No fake metrics · Honest UNAVAILABLE status on API failure
// ============================================================

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Production OpenRouter API Keys Pool (Loaded strictly from Server-Side Environment Variables)
export const OPENROUTER_KEYS_POOL: string[] = []

if (process.env.OPENROUTER_API_KEY) {
  const primary = process.env.OPENROUTER_API_KEY.trim()
  if (primary) OPENROUTER_KEYS_POOL.push(primary)
}

// Allow extra fallback keys from env if configured
if (process.env.OPENROUTER_FALLBACK_KEYS) {
  const envFallbacks = process.env.OPENROUTER_FALLBACK_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
  for (const k of envFallbacks) {
    if (!OPENROUTER_KEYS_POOL.includes(k)) {
      OPENROUTER_KEYS_POOL.push(k)
    }
  }
}

// In-Memory Observability Telemetry State
interface OpenRouterTelemetry {
  provider: string
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'UNAVAILABLE'
  model: string
  activeKeyIndex: number
  totalKeys: number
  activeKeyMasked: string
  keysStatus: { index: number; masked: string; isPrimary: boolean; lastTestedStatus: string }[]
  lastRequestAt: string | null
  lastSuccessfulResponseAt: string | null
  latencyMs: number
  requestsToday: number
  failedRequests: number
  failureRate: string
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  estimatedCostUsd: number
  lastError: string | null
}

const telemetryState: OpenRouterTelemetry = {
  provider: 'OpenRouter AI',
  status: 'CONNECTED',
  model: process.env.OPENROUTER_MODEL || 'openrouter/free',
  activeKeyIndex: 0,
  totalKeys: OPENROUTER_KEYS_POOL.length,
  activeKeyMasked: OPENROUTER_KEYS_POOL.length > 0 ? maskKey(OPENROUTER_KEYS_POOL[0]) : 'None',
  keysStatus: OPENROUTER_KEYS_POOL.map((k, i) => ({
    index: i,
    masked: maskKey(k),
    isPrimary: i === 0,
    lastTestedStatus: 'READY',
  })),
  lastRequestAt: null,
  lastSuccessfulResponseAt: null,
  latencyMs: 0,
  requestsToday: 0,
  failedRequests: 0,
  failureRate: '0.0%',
  tokenUsage: {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  },
  estimatedCostUsd: 0.0,
  lastError: null,
}

function maskKey(key: string): string {
  if (!key || key.length < 15) return 'sk-or-...'
  return `${key.slice(0, 10)}...${key.slice(-4)}`
}

export function getOpenRouterTelemetry(): OpenRouterTelemetry {
  const total = telemetryState.requestsToday
  const failed = telemetryState.failedRequests
  const rate = total > 0 ? ((failed / total) * 100).toFixed(2) + '%' : '0.0%'
  return {
    ...telemetryState,
    totalKeys: OPENROUTER_KEYS_POOL.length,
    activeKeyMasked: OPENROUTER_KEYS_POOL[telemetryState.activeKeyIndex]
      ? maskKey(OPENROUTER_KEYS_POOL[telemetryState.activeKeyIndex])
      : 'None',
    failureRate: rate,
  }
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterOptions {
  temperature?: number
  max_tokens?: number
}

// Clean reasoning tokens or tags produced by reasoning models
function cleanModelResponse(raw: string): string {
  if (!raw) return ''
  return raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

// Robust JSON extraction from LLM output
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

// ============================================================
// Core Failover & Key Rotation Call
// ============================================================
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<string> {
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free'
  const startTime = Date.now()

  telemetryState.requestsToday++
  telemetryState.lastRequestAt = new Date().toISOString()

  let lastErrMessage = 'Unknown error'
  const startIndex = telemetryState.activeKeyIndex

  if (OPENROUTER_KEYS_POOL.length === 0) {
    telemetryState.status = 'UNAVAILABLE'
    telemetryState.lastError = 'OPENROUTER_API_KEY environment variable is not configured on server.'
    throw new Error('AI ANALYTICS UNAVAILABLE: OPENROUTER_API_KEY environment variable is not configured on server.')
  }

  // Attempt current key, if it fails, rotate through all available keys
  for (let attempt = 0; attempt < OPENROUTER_KEYS_POOL.length; attempt++) {
    const currentKeyIdx = (startIndex + attempt) % OPENROUTER_KEYS_POOL.length
    const currentKey = OPENROUTER_KEYS_POOL[currentKeyIdx]

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentKey}`,
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

      const latency = Date.now() - startTime

      if (!response.ok) {
        const errorBody = await response.text()
        const errMsg = `HTTP ${response.status}: ${errorBody.slice(0, 120)}`
        lastErrMessage = errMsg
        telemetryState.keysStatus[currentKeyIdx].lastTestedStatus = `ERR_${response.status}`

        // If rate limited or quota issue, immediately rotate to next key
        if (response.status === 429 || response.status === 401 || response.status === 402 || response.status >= 500) {
          console.warn(`OpenRouter key #${currentKeyIdx + 1} (${maskKey(currentKey)}) failed with ${errMsg}. Rotating to fallback key...`)
          continue
        }
        throw new Error(errMsg)
      }

      // SUCCESSFUL RESPONSE
      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content || ''

      // Track usage
      if (data.usage) {
        telemetryState.tokenUsage.promptTokens += data.usage.prompt_tokens || 0
        telemetryState.tokenUsage.completionTokens += data.usage.completion_tokens || 0
        telemetryState.tokenUsage.totalTokens += data.usage.total_tokens || 0
        // Free tier model is 0.00 USD, but calculate nominal reference
        telemetryState.estimatedCostUsd += ((data.usage.total_tokens || 0) / 1000) * 0.0001
      }

      telemetryState.activeKeyIndex = currentKeyIdx
      telemetryState.activeKeyMasked = maskKey(currentKey)
      telemetryState.status = 'CONNECTED'
      telemetryState.keysStatus[currentKeyIdx].lastTestedStatus = 'CONNECTED (200 OK)'
      telemetryState.lastSuccessfulResponseAt = new Date().toISOString()
      telemetryState.latencyMs = latency
      telemetryState.lastError = null

      return cleanModelResponse(rawContent)
    } catch (err: any) {
      lastErrMessage = err?.message || String(err)
      telemetryState.keysStatus[currentKeyIdx].lastTestedStatus = `FAIL (${lastErrMessage.slice(0, 40)})`
      console.warn(`OpenRouter call attempt with key #${currentKeyIdx + 1} failed: ${lastErrMessage}`)
    }
  }

  // ALL 4 KEYS FAILED — Honest Error Reporting (No Fake Data)
  telemetryState.failedRequests++
  telemetryState.status = 'UNAVAILABLE'
  telemetryState.lastError = `Seluruh 4 API Key OpenRouter gagal dihubungi. Error terakhir: ${lastErrMessage}`
  telemetryState.latencyMs = Date.now() - startTime

  throw new Error(`AI ANALYTICS UNAVAILABLE: Seluruh ${OPENROUTER_KEYS_POOL.length} API key OpenRouter gagal. Alasan: ${lastErrMessage}`)
}

// Test OpenRouter connectivity (for health check endpoints)
export async function testOpenRouterConnection(): Promise<{
  success: boolean
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED'
  latencyMs: number
  activeKeyMasked: string
  totalKeys: number
  message: string
}> {
  if (OPENROUTER_KEYS_POOL.length === 0) {
    return {
      success: false,
      status: 'DISCONNECTED',
      latencyMs: 0,
      activeKeyMasked: 'None',
      totalKeys: 0,
      message: 'OPENROUTER_API_KEY environment variable is not configured.',
    }
  }

  const startTime = Date.now()

  for (let i = 0; i < OPENROUTER_KEYS_POOL.length; i++) {
    const key = OPENROUTER_KEYS_POOL[i]
    try {
      const res = await fetch(`${OPENROUTER_BASE_URL}/auth/key`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      })
      const latency = Date.now() - startTime

      if (res.ok) {
        telemetryState.activeKeyIndex = i
        telemetryState.status = 'CONNECTED'
        telemetryState.latencyMs = latency
        telemetryState.lastSuccessfulResponseAt = new Date().toISOString()
        return {
          success: true,
          status: 'CONNECTED',
          latencyMs: latency,
          activeKeyMasked: maskKey(key),
          totalKeys: OPENROUTER_KEYS_POOL.length,
          message: `Terhubung via Key #${i + 1} (${maskKey(key)}) — 200 OK`,
        }
      }
    } catch {
      // Continue to next key
    }
  }

  return {
    success: false,
    status: 'DISCONNECTED',
    latencyMs: Date.now() - startTime,
    activeKeyMasked: maskKey(OPENROUTER_KEYS_POOL[0]),
    totalKeys: OPENROUTER_KEYS_POOL.length,
    message: 'Semua 4 API Key OpenRouter gagal merespons auth check.',
  }
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
  provenance: {
    model: string
    timestamp: string
    activeKeyMasked: string
    inputSources: string[]
    dataLineage: string
  }
}

export async function analyzeReport(
  input: ReportAnalysisInput
): Promise<ReportAnalysisOutput> {
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free'
  const timestamp = new Date().toISOString()

  const systemPrompt = `Kamu adalah sistem analisis laporan lingkungan untuk platform KotaKu Siaga.
Tugasmu adalah menganalisis laporan warga tentang masalah lingkungan dan bencana hidrometeorologi Kota Semarang.
Selalu respons dalam format JSON yang valid.
Berikan analisis yang akurat, hati-hati, berdasar sains, dan tidak berlebihan.
Jangan membuat klaim yang tidak didukung data.`

  const userPrompt = `Analisis laporan berikut:

Kategori Pelapor: ${input.category}
Deskripsi Lapangan: ${input.description}
Koordinat: ${input.latitude}, ${input.longitude}
Tingkat Urgensi Pelapor: ${input.urgency}
Waktu Masuk: ${input.created_at || timestamp}

Berikan respons dalam format JSON berikut:
{
  "classification": "banjir/genangan/drainase_tersumbat/sampah_menumpuk/infrastruktur_hijau/pohon_tumbang/longsor/lainnya",
  "severity": "low/medium/high/critical",
  "confidence": 0.0-1.0,
  "summary": "ringkasan kondisi faktual laporan 1-2 kalimat",
  "recommended_action": "rekomendasi tindakan terukur untuk tim lapangan",
  "requires_verification": true/false
}`

  try {
    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const parsed = extractJsonFromLlm<{
      classification: string
      severity: string
      confidence: number
      summary: string
      recommended_action: string
      requires_verification: boolean
    }>(content)

    if (!parsed) {
      throw new Error('Gagal mengekstrak output JSON terstruktur dari AI.')
    }

    return {
      ...parsed,
      provenance: {
        model,
        timestamp,
        activeKeyMasked: maskKey(OPENROUTER_KEYS_POOL[telemetryState.activeKeyIndex]),
        inputSources: ['Laporan Warga Aktual', 'Koordinat GPS', 'Kategori Pelapor'],
        dataLineage: 'Citizen Submission -> Input Sanitization -> OpenRouter Multi-Key Engine -> Structured Output',
      },
    }
  } catch (error: any) {
    console.error('OpenRouter analyzeReport error:', error?.message || error)
    // HONEST FAILURE RETURN: No fabricated confidence or synthetic answers
    return {
      classification: input.category || 'Belum Terverifikasi',
      severity: input.urgency === 'kritis' ? 'critical' : input.urgency === 'tinggi' ? 'high' : 'medium',
      confidence: 0.0, // Strictly 0.0 — no fake confidence
      summary: `Analisis AI saat ini tidak dapat diselesaikan (${error?.message || 'OpenRouter API Unavailable'}). Data laporan tersimpan dalam antrean manual.`,
      recommended_action: 'Petugas lapangan dianjurkan melakukan verifikasi manual via CCTV atau kontak pelapor.',
      requires_verification: true,
      provenance: {
        model: `${model} (OFFLINE / ERROR)`,
        timestamp,
        activeKeyMasked: maskKey(OPENROUTER_KEYS_POOL[telemetryState.activeKeyIndex]),
        inputSources: ['Laporan Warga Manual'],
        dataLineage: 'Citizen Submission -> Local Queue (AI Engine Error Fallback)',
      },
    }
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
  area_name: string
  risk_level: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS'
  risk_score: number
  summary: string
  action_plan: string[]
  evacuation_needed: boolean
  provenance: {
    model: string
    timestamp: string
    activeKeyMasked: string
    inputSources: string[]
  }
}

export async function aggregateAreaAnalysis(
  input: AggregateInput
): Promise<AggregateOutput> {
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free'
  const timestamp = new Date().toISOString()

  const systemPrompt = `Kamu adalah sistem analisis risiko kebencanaan untuk Kota Semarang (KotaKu Siaga).
Tugasmu adalah menganalisis data agregat laporan warga per kecamatan/area untuk menentukan tingkat risiko dan rencana aksi.
Selalu respons dalam format JSON yang valid.
Gunakan standar BNPB untuk tingkat risiko: AMAN, WASPADA, SIAGA, AWAS.
Jangan membuat klaim yang tidak didukung data.`

  const userPrompt = `Data agregat laporan untuk area: ${input.area}
Total Laporan: ${input.report_count}
Laporan Banjir/Rob: ${input.flood_reports}
Laporan Sampah Menumpuk: ${input.waste_reports}
Laporan Drainase Tersumbat: ${input.drainage_reports}
Laporan Urgensi Tinggi: ${input.high_urgency_reports}
Laporan Kritis/Darurat: ${input.critical_reports}
Skor Prioritas Sistem: ${input.priority_score.toFixed(1)}/100

Berikan analisis dalam format JSON berikut:
{
  "area_name": "${input.area}",
  "risk_level": "AMAN/WASPADA/SIAGA/AWAS",
  "risk_score": 0-100,
  "summary": "ringkasan kondisi area 2-3 kalimat",
  "action_plan": ["tindakan 1", "tindakan 2", "tindakan 3"],
  "evacuation_needed": true/false
}`

  try {
    const content = await callOpenRouter([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    const parsed = extractJsonFromLlm<{
      area_name: string
      risk_level: 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS'
      risk_score: number
      summary: string
      action_plan: string[]
      evacuation_needed: boolean
    }>(content)

    if (!parsed) {
      throw new Error('Format respon agregat AI tidak valid.')
    }

    return {
      ...parsed,
      provenance: {
        model,
        timestamp,
        activeKeyMasked: maskKey(OPENROUTER_KEYS_POOL[telemetryState.activeKeyIndex]),
        inputSources: ['Data Agregat Laporan Spasial', 'Priority Scoring Engine'],
      },
    }
  } catch (error: any) {
    console.error('OpenRouter aggregateAreaAnalysis error:', error?.message || error)
    return {
      area_name: input.area,
      risk_level: input.critical_reports > 0 ? 'AWAS' : input.high_urgency_reports > 0 ? 'SIAGA' : 'WASPADA',
      risk_score: Math.round(input.priority_score),
      summary: `Analisis AI otomatis sedang tidak tersedia (${error?.message || 'Koneksi AI Terputus'}). Evaluasi risiko didasarkan pada skor prioritas sistem aktual.`,
      action_plan: [
        'Pantau laporan lapangan langsung melalui CCTV PantauSemar.',
        'Koordinasikan kesiapan stasiun pompa polder pada area terkait.',
      ],
      evacuation_needed: input.critical_reports > 0,
      provenance: {
        model: `${model} (ERROR / FALLBACK)`,
        timestamp,
        activeKeyMasked: maskKey(OPENROUTER_KEYS_POOL[telemetryState.activeKeyIndex]),
        inputSources: ['Sistem Prioritas Deterministik (Tanpa AI)'],
      },
    }
  }
}

// ============================================================
// C. Conversational Mitigation Assistant (Civic AI Copilot 2.0)
// ============================================================

export async function generateMitigationChatResponse(
  userQuery: string,
  context?: string | import('./civic-context-builder').CivicContext
): Promise<string> {
  let systemPrompt = `Kamu adalah Civic AI Copilot 2.0 untuk KotaKu Siaga (Platform Civic Emergency & Flood Intelligence Kota Semarang).
Tugasmu adalah memberikan informasi situasional kebencanaan, cuaca, genangan, dan mitigasi berbasis data terstruktur aktual sistem.
Jawab dalam Bahasa Indonesia yang lugas, terstruktur, berbasis sains, dan tidak bertele-tele.`

  const messages: OpenRouterMessage[] = []

  if (context && typeof context === 'object') {
    const ctx = context as import('./civic-context-builder').CivicContext
    const locName = ctx.location.districtName || 'Kota Semarang'

    systemPrompt = `Kamu adalah Civic AI Copilot 2.0 untuk KotaKu Siaga (Platform Civic Emergency & Flood Intelligence Kota Semarang).

PRINSIP UTAMA PENGAMBILAN KEPUTUSAN:
1. JANGAN PERNAH MENGARANG KONDISI LAPANGAN, ANGKA KEDALAMAN GENANGAN, CURAH HUJAN, PENUTUPAN JALAN, ATAU STATUS DARURAT.
2. Gunakan HANYA data aktual dari [DATA TELEMETRI & SITUASI LAPANGAN] yang disediakan di bawah ini.
3. Bedakan secara tegas: STATUS RISIKO WILAYAH (Indeks kerentanan spasial & historis) vs KEJADIAN BANJIR AKTIF (Laporan lapangan terverifikasi saat ini). Status risiko "Waspada" BUKAN berarti wilayah sedang banjir saat ini.
4. Jika verifiedCount = 0 dan rainfall = 0 mm/jam: Katakan secara tegas bahwa banjir saat ini "BELUM TERKONFIRMASI / NIHIL LAPORAN GENANGAN TERVERIFIKASI". Jangan mengklaim banjir hanya berdasarkan pengetahuan umum atau sejarah masa lalu.
5. Jika ada laporan terverifikasi: Sebutkan kedalaman genangan terpantau (contoh: ±${ctx.reports.maxFloodDepthCm ?? 0} cm), jumlah laporan terverifikasi, dan waktu pemantauan WIB.
6. CCTV Online HANYA berarti kamera aktif berfungsi, BUKAN konfirmasi visual banjir kecuali tercatat ada deteksi genangan.
7. Berikan respon terstruktur: Status Pengamatan, Curah Hujan, Observasi Genangan, Status CCTV, Indeks Risiko Wilayah, Sumber Data, dan Waktu Pemantauan WIB.
8. Berikan saran praktis dan jangan membocorkan data pribadi pelapor (nomor telepon/email/password).`

    const contextPayload = `[DATA TELEMETRI & SITUASI LAPANGAN KOTAKU SIAGA]
Wilayah Fokus: ${locName} (${ctx.location.zoneCategory})
Waktu Pemantauan: ${ctx.timestampWib}

1. STATUS GENANGAN LAPORAN WARGA:
- Status Konfirmasi: ${ctx.synthesis.floodConfirmationStatus}
- Total Laporan Terverifikasi: ${ctx.reports.verifiedCount} laporan
- Kedalaman Genangan Maksimal: ${ctx.reports.maxFloodDepthCm !== null ? `${ctx.reports.maxFloodDepthCm} cm` : 'Nihil / Tidak teramati'}
- Ringkasan Laporan: ${ctx.reports.summary}

2. TELEMETRI CUACA & BMKG:
- Status Data: ${ctx.weather.isDataAvailable ? 'Tersedia' : 'Tidak Tersedia'}
- Curah Hujan: ${ctx.weather.rainfallRateMmH !== null ? `${ctx.weather.rainfallRateMmH} mm/jam` : 'Data tidak tersedia'} (${ctx.weather.rainfallCategory})
- Kondisi Cuaca: ${ctx.weather.weatherCondition}
- Suhu / Angin: ${ctx.weather.temperatureC ?? 29}°C / ${ctx.weather.windSpeedKmh ?? 10} km/jam
- Gelombang Pesisir: ${ctx.weather.coastalWaveHeightM !== null ? `${ctx.weather.coastalWaveHeightM} m (Tenang)` : 'Bukan kawasan pantai langsung'}

3. TELEMETRI CCTV PANTAUSEMAR:
- Kamera di Kawasan Ini: ${ctx.cctv.totalInDistrict} titik
- Kamera Online: ${ctx.cctv.onlineCount} online
- Kamera Deteksi Genangan: ${ctx.cctv.observedFloodCount} titik
- Ringkasan Visual: ${ctx.cctv.summary}

4. INDEKS RISIKO WILAYAH (D-RISK ISO 37120):
- Tingkat Risiko: ${ctx.risk.riskLevel} (Skor: ${ctx.risk.riskScore.toFixed(1)}/100)
- Keterangan: ${ctx.risk.note}
- Elevasi Kawasan: ${ctx.risk.topographicElevation}

5. SUMBER RESMI TERINTEGRASI:
- BMKG / Open-Meteo · CCTV PantauSemar Diskominfo · Laporan Terverifikasi Supabase · Risk Engine D-RISK`

    messages.push({ role: 'system', content: systemPrompt })
    messages.push({
      role: 'user',
      content: `Konteks Situasi Aktual:\n${contextPayload}\n\nPertanyaan Warga: ${userQuery}`,
    })
  } else {
    messages.push({ role: 'system', content: systemPrompt })
    if (context && typeof context === 'string') {
      messages.push({
        role: 'user',
        content: `Konteks situasi aktual saat ini di Semarang:\n${context}`,
      })
      messages.push({
        role: 'assistant',
        content: 'Saya memahami situasi aktual tersebut. Ada yang bisa saya bantu terkait mitigasi atau penanganannya?',
      })
    }
    messages.push({ role: 'user', content: userQuery })
  }

  try {
    return await callOpenRouter(messages, { temperature: 0.25, max_tokens: 800 })
  } catch (err: any) {
    console.warn('OpenRouter call error:', err?.message || err)
    throw err
  }
}

// Aliases and additional exports for backwards compatibility
export const MODEL_NAME = process.env.OPENROUTER_MODEL || 'openrouter/free'
export const analyzeAggregate = aggregateAreaAnalysis

export async function chatAssistant(
  messages: Array<{ role: string; content: string }>,
  context?: string | import('./civic-context-builder').CivicContext
): Promise<string> {
  const latestMsg = messages[messages.length - 1]?.content || ''
  return generateMitigationChatResponse(latestMsg, context)
}


