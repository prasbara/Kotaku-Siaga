import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// GET /api/clusters — Fetch active incident clusters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (isSupabaseConfigured()) {
      const supabase = await createAdminClient()
      let query = supabase
        .from('incident_clusters')
        .select('*', { count: 'exact' })
        .order('last_reported_at', { ascending: false })
        .limit(limit)

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data,
          count: count ?? data.length,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
    })
  } catch (err: any) {
    console.error('GET /api/clusters error:', err)
    return NextResponse.json({ error: 'Gagal mengambil data klaster insiden.' }, { status: 500 })
  }
}
