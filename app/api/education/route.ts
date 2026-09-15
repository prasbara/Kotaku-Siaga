import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// PRODUCTION: Education content comes from the real database only.
// FALLBACK_EDUCATION removed — no hardcoded content used as silent fallback.

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, data: [], is_local_store: true })
  }

  try {
    const category = request.nextUrl.searchParams.get('category')

    const supabase = await createAdminClient()
    let query = supabase.from('educational_contents').select('*').order('category')
    if (category) {
      query = query.eq('category', category)
    }
    const { data, error } = await query

    if (error) {
      console.error('GET /api/education database error:', error.message)
      return NextResponse.json(
        { error: 'Database query failed.', detail: error.message },
        { status: 503 }
      )
    }

    // Successful query — return real data (may be empty if educational_contents not seeded yet)
    return NextResponse.json({ success: true, data: data ?? [] })
  } catch (error) {
    console.error('GET /api/education error:', error)
    return NextResponse.json({ error: 'Gagal mengambil konten edukasi.' }, { status: 500 })
  }
}
