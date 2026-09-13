import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { analyzeReport, MODEL_NAME } from '@/lib/ai/openrouter'

// Rate limiting — simple in-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = requestCounts.get(ip)
  
  if (!limit || now > limit.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 }) // 1 min window
    return false
  }
  
  if (limit.count >= 10) return true // max 10 AI requests per minute per IP
  
  limit.count++
  return false
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa menit.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { report_id, category, description, latitude, longitude, urgency, created_at } = body

    // Validate required fields
    if (!category || !description || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Data laporan tidak lengkap.' },
        { status: 400 }
      )
    }

    // Validate description length (don't send too much to AI)
    const safeDescription = description.slice(0, 500)

    // Call AI analysis
    const analysis = await analyzeReport({
      category,
      description: safeDescription,
      latitude,
      longitude,
      urgency,
      created_at,
    })

    // Save to database if report_id provided
    if (report_id) {
      try {
        const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
        if (!isDummySupabase) {
          const supabase = await createAdminClient()
          const { error: dbError } = await supabase.from('ai_analysis').insert({
            report_id,
            original_category: category,
            ai_category: analysis.classification,
            ai_confidence: analysis.confidence,
            severity: analysis.severity,
            summary: analysis.summary,
            recommended_action: analysis.recommended_action,
            model_name: MODEL_NAME,
          })

          if (dbError) {
            console.warn('Failed to save AI analysis to DB:', dbError)
          }
        }
      } catch (dbErr) {
        console.warn('Supabase client init failed in analyze-report:', dbErr)
      }
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('AI analyze-report error:', error)
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service tidak dikonfigurasi. Hubungi administrator.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Analisis AI gagal. Laporan tetap tersimpan.' },
      { status: 500 }
    )
  }
}
