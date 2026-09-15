import { NextRequest, NextResponse } from 'next/server'
import { chatAssistant } from '@/lib/ai/openrouter'
import { classifyIntent, STANDARD_REFUSAL_MESSAGE } from '@/lib/ai/guardrails'
import { buildCivicContext } from '@/lib/ai/civic-context-builder'
import { generateDeterministicCivicResponse } from '@/lib/ai/civic-fallback'
import { validateCivicResponse } from '@/lib/ai/response-validator'
import { getUserRole } from '@/lib/auth/session'

// In-memory rate limiting: 60 requests per minute per IP
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = requestCounts.get(ip)
  if (!limit || now > limit.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (limit.count >= 60) return true
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
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Pesan tidak valid.' }, { status: 400 })
    }

    // Limit message history to last 10 messages
    const limitedMessages = messages.slice(-10).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).slice(0, 1000),
    }))

    // Find latest user query
    const userMessages = limitedMessages.filter((m: { role: string }) => m.role === 'user')
    const latestUserMsg = userMessages[userMessages.length - 1]?.content || ''

    // 1. APPLICATION-LEVEL GUARDRAIL: Domain / Anti-Injection Classification
    const decision = classifyIntent(latestUserMsg)

    if (decision.status !== 'IN_SCOPE') {
      return NextResponse.json({
        success: true,
        message: decision.refusalResponse || STANDARD_REFUSAL_MESSAGE,
        guardrail_status: decision.status,
      })
    }

    // 2. MULTI-SOURCE LIVE CIVIC CONTEXT BUILDER
    const role = await getUserRole(request)
    const civicContext = await buildCivicContext(latestUserMsg, role)

    // 3. LLM EXECUTION WITH STRICT GROUNDING CONTRACT
    let rawResponse = ''
    let usedFallback = false

    try {
      rawResponse = await chatAssistant(limitedMessages, civicContext)
    } catch (llmErr) {
      console.warn('OpenRouter LLM unavailable, using deterministic civic intelligence engine:', llmErr)
      rawResponse = generateDeterministicCivicResponse(civicContext)
      usedFallback = true
    }

    // 4. POST-GENERATION CLAIM & NUMBER VALIDATOR
    const validation = validateCivicResponse(rawResponse, civicContext)
    const finalMessage = validation.sanitizedMessage

    return NextResponse.json({
      success: true,
      message: finalMessage,
      guardrail_status: 'IN_SCOPE',
      used_fallback: usedFallback || validation.usedFallback,
      context_meta: {
        district: civicContext.location.districtName,
        district_slug: civicContext.location.districtSlug,
        zone: civicContext.location.zoneCategory,
        timestamp_wib: civicContext.timestampWib,
        flood_status: civicContext.synthesis.floodConfirmationStatus,
        verified_reports_count: civicContext.reports.verifiedCount,
        max_flood_depth_cm: civicContext.reports.maxFloodDepthCm,
        rainfall_mm_h: civicContext.weather.rainfallRateMmH,
        risk_score: civicContext.risk.riskScore,
        risk_level: civicContext.risk.riskLevel,
        confidence_grade: civicContext.synthesis.confidenceAssessment.grade,
      },
      sources: civicContext.synthesis.sourcesUsed,
      actions: civicContext.synthesis.suggestedActions,
    })
  } catch (error: any) {
    console.error('AI chat route error:', error)
    const fallbackCtx = await buildCivicContext('Semarang', 'public')
    return NextResponse.json({
      success: true,
      message: generateDeterministicCivicResponse(fallbackCtx),
      guardrail_status: 'IN_SCOPE',
      used_fallback: true,
      sources: fallbackCtx.synthesis.sourcesUsed,
      actions: fallbackCtx.synthesis.suggestedActions,
    })
  }
}
