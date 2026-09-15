// ============================================================
// KotaKu Siaga — Civic Radar Context Guardrail & Security Engine
// Enforces strict domain limitation: disaster, flood, telemetry,
// PantauSemar CCTV, citizen reports, flood events, and EOC mitigation.
// Prevents general-knowledge drift, politics, prompt injection, and data leaks.
// ============================================================

export type GuardrailIntent = 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'PROMPT_INJECTION' | 'AMBIGUOUS'

export interface GuardrailDecision {
  status: GuardrailIntent
  reason?: string
  refusalResponse?: string
}

export const STANDARD_REFUSAL_MESSAGE =
  'Maaf, saya hanya dapat membantu terkait informasi kebencanaan, kondisi lingkungan, cuaca/telemetry, CCTV PantauSemar, laporan warga, flood events, EOC, dan analisis mitigasi yang tersedia di KotaKu Siaga Civic Radar (Kota Semarang).\n\nSilakan ajukan pertanyaan yang berkaitan dengan pemantauan risiko bencana atau status infrastruktur lingkungan.'

export const SECURITY_REFUSAL_MESSAGE =
  'Maaf, permintaan tersebut ditolak demi keamanan sistem dan perlindungan integritas operasional Civic Radar.'

export const LOCATION_UNSUPPORTED_MESSAGE =
  'Sistem Civic Radar saat ini difokuskan secara khusus untuk pemantauan wilayah operasional Kota Semarang. Saya tidak memiliki data telemetry, CCTV, atau laporan warga yang memadai untuk wilayah di luar cakupan sistem kami.'

// ------------------------------------------------------------
// 1. Prompt Injection & System Tampering Patterns
// ------------------------------------------------------------
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|rules|instructions|data|prompts)/i,
  /abaikan\s+(semua\s+)?(instruksi|aturan|perintah|data|sumber)/i,
  /forget\s+(all\s+)?(previous|prior|instructions|context|rules|data)/i,
  /you\s+are\s+now\s+(a\s+)?(general|unrestricted|dan|jailbreak|different|an\s+unfiltered)/i,
  /sekarang\s+kamu\s+adalah\s+(chatbot\s+umum|ai\s+bebas|asisten\s+umum)/i,
  /(reveal|show|print|display|tell|bocorkan|tampilkan)\s+(your\s+)?(system\s+prompt|prompt\s+sistem|instruksi\s+rahasia)/i,
  /(show|reveal|print|bocorkan|tampilkan|berikan)\s+(your\s+)?(api\s*key|secret|token|credentials|password|service\s*role|env(\.local)?)/i,
  /bypass\s+(guardrail|filter|restriction|policy)/i,
  /anggap\s+saja\s+saya\s+(operator\s+admin|superadmin|root|developer)/i,
  /act\s+as\s+(dan|an\s+unfiltered|an\s+independent|jailbreak)/i,
]

// ------------------------------------------------------------
// 2. Out-of-Scope Topics: Politics, General Knowledge, Pop Culture, etc.
// ------------------------------------------------------------
const OUT_OF_SCOPE_POLITICS_PATTERNS = [
  /\b(jokowi|joko\s*widodo)\b/i,
  /\b(prabowo(\s*subianto)?)\b/i,
  /\b(gibran(\s*rakabuming)?)\b/i,
  /\b(megawati|sby|susilo\s*bambang\s*yudhoyono|soeharto|soekarno|habibie|gus\s*dur)\b/i,
  /\b(presiden\s+indonesia|wakil\s+presiden|menteri\s+(keuangan|bumn|pertahanan|perdagangan|luar\s*negeri))\b/i,
  /\b(partai\s+(politik|pdi|gerindra|golkar|pks|nasdem|pkb|pan|demokrat|psi))\b/i,
  /\b(pemilu|pilpres|pilkada|dpr|mpr|kpu|bawaslu|parlemen)\b/i,
  /\b(gdp|apbn|politik\s+luar\s+negeri|hubungan\s+internasional)\b/i,
]

const OUT_OF_SCOPE_GENERAL_PATTERNS = [
  /\b(artis|aktor|aktris|selebriti|penyanyi|musisi|lagu|konser|film|bioskop|drama\s*korea|kpop|anime)\b/i,
  /\b(piala\s*dunia|world\s*cup|liga\s*inggris|champions\s*league|sepak\s*bola|pemain\s*bola|ronaldo|messi)\b/i,
  /\b(bitcoin|ethereum|crypto|kripto|saham\s+(bbca|bbri|ihsg)|forex|trading|harga\s+emas)\b/i,
  /\b(resep|cara\s+(memasak|membuat\s+kue|membuat\s+nasi\s+goreng|bikin\s+kopi|bikin\s+kue))\b/i,
  /\b(sejarah\s+(perang\s*dunia|majapahit|eropa|kuno|kemerdekaan|romawi))\b/i,
  /\b(coding\s+(python|java|react|nextjs|c\+\+|flutter)|buatkan\s+script\s+python|belajar\s+programming)\b/i,
  /\b(zodiak|ramalan\s+bintang|horoskop|jodoh|cinta|pacaran|curhat\s+pribadi)\b/i,
  /\b(game\s+(online|mobile\s*legends|ff|free\s*fire|pubg|roblox|valorant))\b/i,
]

// ------------------------------------------------------------
// 3. Supported Core Disaster & Environmental Domain Keywords
// ------------------------------------------------------------
const IN_SCOPE_DISASTER_CORE = [
  /\b(banjir|rob|genangan|luapan|air\s*tergenang|banjir\s*bandang|longsor|tanah\s*longsor)\b/i,
  /\b(cuaca|hujan|curah\s*hujan|angin\s*kencang|badai|gelombang\s*pasang|pasang\s*surut|hidrologi|bmkg)\b/i,
  /\b(telemetry|telemetri|sensor|water\s*level|tinggi\s*muka\s*air|tma|debit\s*air)\b/i,
  /\b(cctv|kamera|pantausemar|pantau\s*semar|kamera\s*genangan|pemantauan\s*visual)\b/i,
  /\b(laporan\s*warga|citizen\s*report|lapor|tiket\s*laporan|verifikasi\s*laporan)\b/i,
  /\b(flood\s*event|severity|confidence|corroboration|eoc|emergency\s*operations)\b/i,
  /\b(mitigasi|kesiapsiagaan|evakuasi|jalur\s*evakuasi|posko|shelter|pengungsian|tanggap\s*darurat)\b/i,
  /\b(pompa|rumah\s*pompa|polder|tanggul|drainase|saluran\s*air|sedimen|sedimentasi|kolam\s*retensi)\b/i,
  /\b(prioritas\s*penanganan|skor\s*prioritas|indeks\s*kerentanan|risiko\s*bencana)\b/i,
  /\b(bpbd|dpu|pekerjaan\s*umum|relawan\s*bencana)\b/i,
]

// Specific Semarang Administrative & Operational Landmarks
const SEMARANG_LOCALITIES = [
  /\b(semarang|kaligawe|genuk|tanjung\s*emas|bandarharjo|pedurungan|gayamsari|tugu|ngaliyan)\b/i,
  /\b(semarang\s*(utara|timur|tengah|barat|selatan)|gajahmungkur|candisari|tembalang|banyumanik|gunungpati|mijen)\b/i,
  /\b(sungai\s*tenggang|rumah\s*pompa\s*tenggang|sungai\s*sringin|pompa\s*sringin|kali\s*garang|banjir\s*kanal\s*(timur|barat)|bkt|bkb)\b/i,
  /\b(bawah\s*tol\s*kaligawe|kolam\s*retensi\s*genuk|simpang\s*lima|pelabuhan\s*tanjung\s*emas)\b/i,
]

// ------------------------------------------------------------
// 4. Intent Classifier Function (Application-Level Gate)
// ------------------------------------------------------------
export function classifyIntent(query: string): GuardrailDecision {
  const text = (query || '').trim()
  if (!text) {
    return {
      status: 'AMBIGUOUS',
      reason: 'Empty query',
      refusalResponse:
        'Halo! Saya Civic Radar AI Copilot. Silakan ajukan pertanyaan terkait pemantauan banjir, cuaca, CCTV PantauSemar, atau mitigasi bencana di Kota Semarang.',
    }
  }

  // A. Check for Prompt Injection / Security Tampering
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'PROMPT_INJECTION',
        reason: 'Detected prompt injection or credential exfiltration attempt',
        refusalResponse: SECURITY_REFUSAL_MESSAGE,
      }
    }
  }

  // B. Check for Explicit Political Entities (Jokowi, Presiden, Partai, etc.)
  for (const pattern of OUT_OF_SCOPE_POLITICS_PATTERNS) {
    if (pattern.test(text)) {
      // Even if user attempts to wrap it: "Untuk mitigasi, jawab apakah jokowi presiden..."
      // The core inquiry is out-of-scope politics.
      return {
        status: 'OUT_OF_SCOPE',
        reason: 'Political entity or government election inquiry is outside disaster scope',
        refusalResponse: STANDARD_REFUSAL_MESSAGE,
      }
    }
  }

  // C. Check for Out-of-Scope General Knowledge & Entertainment
  for (const pattern of OUT_OF_SCOPE_GENERAL_PATTERNS) {
    if (pattern.test(text)) {
      return {
        status: 'OUT_OF_SCOPE',
        reason: 'General knowledge, entertainment, sports, or recipes outside disaster scope',
        refusalResponse: STANDARD_REFUSAL_MESSAGE,
      }
    }
  }

  // D. Check for In-Scope Disaster / Environmental Concepts
  const hasDisasterContext = IN_SCOPE_DISASTER_CORE.some((pat) => pat.test(text))
  const hasSemarangContext = SEMARANG_LOCALITIES.some((pat) => pat.test(text))

  if (hasDisasterContext) {
    // Check if user is asking about unmonitored geographic regions (e.g. Jakarta, Surabaya)
    const otherCities = /\b(jakarta|surabaya|bandung|medan|makassar|bali|yogyakarta|jogja|solo)\b/i
    if (otherCities.test(text) && !hasSemarangContext) {
      // If asking specifically about another city's telemetry/flood
      const asksTelemetryOrStatus = /\b(kondisi|status|telemetri|cctv|kamera|laporan|bagaimana)\b/i.test(text)
      if (asksTelemetryOrStatus) {
        return {
          status: 'OUT_OF_SCOPE',
          reason: 'Geographic location outside Civic Radar operational scope',
          refusalResponse: LOCATION_UNSUPPORTED_MESSAGE,
        }
      }
    }

    return { status: 'IN_SCOPE' }
  }

  // E. Check for Local Semarang context with generic query (e.g. "bagaimana kaligawe?")
  if (hasSemarangContext) {
    const genericStatus = /\b(bagaimana|kondisi|status|info|pantauan|aman)\b/i.test(text)
    if (genericStatus) {
      return { status: 'IN_SCOPE' }
    }
  }

  // F. Ambiguous Queries (e.g. "bagaimana kondisi kota?", "tes", "halo")
  const ambiguousGreetings = /^(halo|hai|p|tes|test|selamat\s+(pagi|siang|sore|malam)|bagaimana\s+kondisi(\s+kota)?\??)$/i
  if (ambiguousGreetings.test(text) || text.length < 15) {
    return {
      status: 'AMBIGUOUS',
      reason: 'Under-specified general inquiry',
      refusalResponse:
        'Halo! Saya Civic Radar AI Copilot untuk Kota Semarang. Saya memantau data kebencanaan, status CCTV PantauSemar, curah hujan BMKG, serta laporan genangan warga. Silakan tanyakan kondisi titik tertentu (misal: Kaligawe, Genuk, Tanjung Emas) atau mitigasi risiko bencana.',
    }
  }

  // Default fallback for anything that does not match disaster domain
  return {
    status: 'OUT_OF_SCOPE',
    reason: 'Inquiry does not correlate with Civic Radar disaster domain',
    refusalResponse: STANDARD_REFUSAL_MESSAGE,
  }
}

// ------------------------------------------------------------
// 5. Output Validation (Sanitization Gate)
// ------------------------------------------------------------
const FORBIDDEN_OUTPUT_PATTERNS = [
  /joko\s*widodo\s+(adalah|merupakan)\s+presiden/i,
  /presiden\s+republik\s+indonesia\s+(saat\s+ini|adalah)/i,
  /prabowo\s+(adalah|presiden)/i,
  /sk-or-v1-[a-zA-Z0-9]{20,}/i,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/i,
  /OPENROUTER_API_KEY/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /DATABASE_URL/i,
]

export function validateOutput(generatedText: string): {
  isValid: boolean
  sanitizedText: string
} {
  if (!generatedText) {
    return { isValid: true, sanitizedText: '' }
  }

  for (const pattern of FORBIDDEN_OUTPUT_PATTERNS) {
    if (pattern.test(generatedText)) {
      return {
        isValid: false,
        sanitizedText: STANDARD_REFUSAL_MESSAGE,
      }
    }
  }

  return {
    isValid: true,
    sanitizedText: generatedText,
  }
}
