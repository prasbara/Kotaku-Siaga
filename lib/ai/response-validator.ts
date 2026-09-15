// ============================================================
// KotaKu Siaga — Civic Response Grounding & Number Validator
// Validates LLM responses against verified CivicContext facts.
// Prevents hallucinations, fabricated numbers, false flood alarms,
// and credential/PII leakage before sending response to client.
// ============================================================

import { CivicContext } from './civic-context-builder'
import { generateDeterministicCivicResponse } from './civic-fallback'
import { STANDARD_REFUSAL_MESSAGE } from './guardrails'

const PII_OR_LEAK_PATTERNS = [
  /sk-or-v1-[a-zA-Z0-9]{15,}/i,
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/i,
  /OPENROUTER_API_KEY/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /DATABASE_URL/i,
  /\b08[0-9]{9,12}\b/, // phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/, // email addresses
]

export interface ValidationResult {
  isValid: boolean
  sanitizedMessage: string
  rejectionReason?: string
  usedFallback: boolean
}

export function validateCivicResponse(
  rawResponse: string,
  ctx: CivicContext
): ValidationResult {
  if (!rawResponse || !rawResponse.trim()) {
    return {
      isValid: true,
      sanitizedMessage: generateDeterministicCivicResponse(ctx),
      usedFallback: true,
      rejectionReason: 'Empty LLM response',
    }
  }

  // 1. Check for Security & Credential Leakage
  for (const pattern of PII_OR_LEAK_PATTERNS) {
    if (pattern.test(rawResponse)) {
      console.warn('Response validator blocked potential credential or PII leak!')
      return {
        isValid: false,
        sanitizedMessage: STANDARD_REFUSAL_MESSAGE,
        usedFallback: true,
        rejectionReason: 'Security leak detected in output',
      }
    }
  }

  // 2. Number Grounding: Check for fabricated centimeter depth claims
  // Example: "terdapat genangan 25 cm" when context has maxFloodDepthCm = null or 0
  const depthMatches = rawResponse.match(/(\d+)\s*(cm|sentimeter)/gi)
  if (depthMatches && depthMatches.length > 0) {
    const verifiedDepth = ctx.reports.maxFloodDepthCm

    for (const match of depthMatches) {
      const numMatch = match.match(/\d+/)
      if (numMatch) {
        const claimedCm = parseInt(numMatch[0], 10)

        // If the context has 0/null verified depth, but LLM claims a specific depth >= 5 cm
        if ((verifiedDepth === null || verifiedDepth === 0) && claimedCm >= 5) {
          console.warn(`Response validator caught fabricated depth: claimed ${claimedCm}cm vs verified ${verifiedDepth}cm`)
          return {
            isValid: false,
            sanitizedMessage: generateDeterministicCivicResponse(ctx),
            usedFallback: true,
            rejectionReason: `Fabricated depth claim (${claimedCm}cm) not supported by context`,
          }
        }
      }
    }
  }

  // 3. Status Contradiction Check: If context has 0 flood reports and 0 rain, but response claims flood is confirmed
  const isZeroFloodContext =
    ctx.reports.verifiedCount === 0 &&
    (ctx.weather.rainfallRateMmH === 0 || ctx.weather.rainfallRateMmH === null)

  const claimsFloodConfirmed =
    /\b(sedang terjadi banjir besar|banjir terkonfirmasi di|wilayah ini terendam banjir)\b/i.test(
      rawResponse
    )

  if (isZeroFloodContext && claimsFloodConfirmed) {
    console.warn('Response validator caught false positive flood confirmation in clear weather context')
    return {
      isValid: false,
      sanitizedMessage: generateDeterministicCivicResponse(ctx),
      usedFallback: true,
      rejectionReason: 'False flood confirmation against zero-evidence context',
    }
  }

  return {
    isValid: true,
    sanitizedMessage: rawResponse,
    usedFallback: false,
  }
}
