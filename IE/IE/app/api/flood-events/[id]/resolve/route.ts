import { NextResponse } from 'next/server'
import { floodEventManager } from '@/lib/services/flood-event-manager'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason = 'Verifikasi manual petugas: air telah surut terkendali' } = body

    const resolved = floodEventManager.resolveEvent(id, reason)

    if (!resolved) {
      return NextResponse.json(
        { success: false, error: `Flood Event ${id} tidak ditemukan.` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Flood Event ${id} berhasil diresolusi.`,
      data: resolved,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
