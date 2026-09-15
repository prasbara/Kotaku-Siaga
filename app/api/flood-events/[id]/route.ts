import { NextResponse } from 'next/server'
import { floodEventManager } from '@/lib/services/flood-event-manager'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = floodEventManager.getEventById(id)

    if (!event) {
      return NextResponse.json(
        { success: false, error: `Flood Event ${id} tidak ditemukan.` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
