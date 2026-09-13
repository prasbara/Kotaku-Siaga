import { NextRequest, NextResponse } from 'next/server'
import { chatAssistant } from '@/lib/ai/openrouter'

// Rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = requestCounts.get(ip)
  if (!limit || now > limit.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (limit.count >= 20) return true // 20 chat messages per minute
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

    const response = await chatAssistant(limitedMessages, context)

    return NextResponse.json({ success: true, message: response })
  } catch (error) {
    console.error('AI chat error:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'KotaKu Assistant saat ini tidak tersedia. Pastikan API key sudah dikonfigurasi.'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Maaf, terjadi gangguan. Coba lagi dalam beberapa saat.' },
      { status: 500 }
    )
  }
}
