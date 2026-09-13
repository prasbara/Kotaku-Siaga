import { NextResponse } from 'next/server'
import { floodEventManager } from '@/lib/services/flood-event-manager'
import { FloodEventStatus, RawInferenceOutput } from '@/types/flood-event'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as FloodEventStatus | null
    const district = searchParams.get('district')
    const severity = searchParams.get('severity')

    let events = floodEventManager.getAllEvents({
      status: status && status !== ('all' as any) ? status : undefined,
      district: district || undefined,
    })

    if (severity && severity !== 'all') {
      events = events.filter((e) => e.severity.toLowerCase() === severity.toLowerCase())
    }

    const allEvents = floodEventManager.getAllEvents()
    const activeCount = allEvents.filter((e) => e.status === 'confirmed').length
    const suspectedCount = allEvents.filter((e) => e.status === 'suspected').length
    const resolvedCount = allEvents.filter((e) => e.status === 'resolved').length

    return NextResponse.json({
      success: true,
      summary: {
        total: allEvents.length,
        active: activeCount,
        suspected: suspectedCount,
        resolved: resolvedCount,
      },
      count: events.length,
      data: events,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body: RawInferenceOutput = await request.json()

    if (!body.camera_id) {
      return NextResponse.json(
        { success: false, error: 'camera_id wajib disertakan.' },
        { status: 400 }
      )
    }

    const result = await floodEventManager.processInference(body)

    return NextResponse.json({
      success: true,
      is_new_event: result.isNewEvent,
      event: result.event,
      health: result.health,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
