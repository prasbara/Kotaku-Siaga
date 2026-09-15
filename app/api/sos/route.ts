import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

// In-memory fallback for local development / testing
const localSosStore: any[] = []

// POST /api/sos — Ultra-fast unblocked emergency signal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      latitude,
      longitude,
      location_accuracy,
      location_available,
      client_session_id,
      district_name,
    } = body

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Generate unique SOS Code: SOS-2026-XXXXXX
    const year = new Date().getFullYear()
    const uniqueNum = Date.now().toString().slice(-6)
    const sosCode = `SOS-${year}-${uniqueNum}`
    const now = new Date().toISOString()

    const sosPayload = {
      sos_code: sosCode,
      latitude: latitude ?? -6.9932,
      longitude: longitude ?? 110.4203,
      location_accuracy: location_accuracy ?? null,
      location_available: Boolean(location_available && latitude !== undefined),
      district_name: district_name || 'Kota Semarang',
      client_session_id: client_session_id || `session-${Date.now()}`,
      client_ip_hash: Buffer.from(clientIp).toString('base64').slice(0, 16),
      status: 'NEW',
      priority: 'CRITICAL',
      created_at: now,
      updated_at: now,
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const { data, error } = await supabase
          .from('sos_events')
          .insert(sosPayload)
          .select()
          .single()

        if (!error && data) {
          // Broadcast to realtime channel
          try {
            const channel = supabase.channel('emergency-alerts')
            await channel.send({
              type: 'broadcast',
              event: 'new_emergency_sos',
              payload: data,
            })
          } catch (broadcastErr) {
            console.warn('[SOS Realtime Broadcast Warning]:', broadcastErr)
          }

          return NextResponse.json(
            {
              success: true,
              sos_code: sosCode,
              data,
              message: 'Sinyal darurat SOS telah berhasil dikirim ke Command Center BPBD.',
            },
            { status: 201 }
          )
        } else {
          console.warn('[Supabase SOS Insert Warning]:', error?.message)
        }
      } catch (dbErr) {
        console.warn('[Supabase SOS Exception]:', dbErr)
      }
    }

    // Fallback store
    const localEntry = { id: `sos-local-${Date.now()}`, ...sosPayload }
    localSosStore.unshift(localEntry)

    return NextResponse.json(
      {
        success: true,
        sos_code: sosCode,
        data: localEntry,
        message: 'Sinyal darurat SOS telah berhasil dicatat.',
        is_local_store: true,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('POST /api/sos exception:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses sinyal darurat.' },
      { status: 500 }
    )
  }
}

// GET /api/sos — Fetch active emergency SOS signals (for Command Center)
export async function GET(request: NextRequest) {
  try {
    if (isSupabaseConfigured()) {
      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('sos_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data,
          count: data.length,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: localSosStore,
      count: localSosStore.length,
      is_local_store: true,
    })
  } catch (err: any) {
    console.error('GET /api/sos exception:', err)
    return NextResponse.json({ error: 'Gagal mengambil data SOS.' }, { status: 500 })
  }
}
