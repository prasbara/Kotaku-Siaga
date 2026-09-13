import { NextRequest, NextResponse } from 'next/server'
import { analyzeAggregate } from '@/lib/ai/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      area,
      report_count,
      flood_reports,
      waste_reports,
      drainage_reports,
      high_urgency_reports,
      critical_reports,
      priority_score,
    } = body

    if (!area || report_count === undefined) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }

    const analysis = await analyzeAggregate({
      area,
      report_count,
      flood_reports: flood_reports || 0,
      waste_reports: waste_reports || 0,
      drainage_reports: drainage_reports || 0,
      high_urgency_reports: high_urgency_reports || 0,
      critical_reports: critical_reports || 0,
      priority_score: priority_score || 0,
    })

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('AI aggregate analysis error:', error)
    return NextResponse.json(
      { error: 'Analisis agregat gagal.' },
      { status: 500 }
    )
  }
}
