import { NextResponse } from 'next/server'
import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'
import { calculateDeterministicPriority, PRIORITY_FORMULA_VERSION } from '@/lib/priority/calculator'
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function GET() {
  try {
    const reportDistribution: Record<string, { freq: number; urgency: number }> = {}

    // Initialize all kecamatan to 0
    for (const kec of SEMARANG_KECAMATAN) {
      reportDistribution[kec.id] = { freq: 0, urgency: 0 }
    }

    // If Supabase is configured, aggregate real reports from the database (past 7 days)
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createAdminClient()
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { data: reports } = await supabase
          .from('reports')
          .select('district_name, urgency, created_at')
          .gte('created_at', sevenDaysAgo)
          .neq('status', 'rejected')
          .neq('status', 'duplicate')

        if (reports && reports.length > 0) {
          const urgencyWeight: Record<string, number> = {
            rendah: 25,
            sedang: 50,
            tinggi: 75,
            kritis: 100,
          }

          const counts: Record<string, { sumUrgency: number; count: number }> = {}

          for (const rep of reports) {
            const dName = (rep.district_name || '').toLowerCase()
            const matchingKec = SEMARANG_KECAMATAN.find(
              (k) =>
                dName.includes(k.slug.replace('-', ' ')) ||
                dName.includes(k.name.toLowerCase()) ||
                k.name.toLowerCase().includes(dName)
            )

            if (matchingKec) {
              if (!counts[matchingKec.id]) counts[matchingKec.id] = { sumUrgency: 0, count: 0 }
              counts[matchingKec.id].count++
              counts[matchingKec.id].sumUrgency += urgencyWeight[rep.urgency] || 50
            }
          }

          for (const [id, val] of Object.entries(counts)) {
            reportDistribution[id] = {
              freq: val.count,
              urgency: val.count > 0 ? Math.round(val.sumUrgency / val.count) : 0,
            }
          }
        }
      } catch (dbErr) {
        console.warn('Could not aggregate reports from database:', dbErr)
      }
    }

    const priorityScores = SEMARANG_KECAMATAN.map((kec) => {
      const rep = reportDistribution[kec.id] || { freq: 0, urgency: 0 }
      const isCoastal = ['semarang-utara', 'genuk', 'tugu', 'gayamsari'].includes(kec.slug)
      const disasters = isCoastal ? 12 : ['tembalang', 'banyumanik'].includes(kec.slug) ? 8 : 3
      const rainProb = isCoastal ? 75 : 50

      const result = calculateDeterministicPriority({
        areaId: kec.id,
        areaName: kec.name,
        reportFrequency7d: rep.freq,
        averageUrgencyScore: rep.urgency,
        populationDensityPerKm2: kec.population_density,
        historicalDisasterCount: disasters,
        environmentalVulnerabilityIndex: kec.flood_vulnerability_index,
        weatherRainProbability: rainProb,
      })

      return {
        area: {
          id: kec.id,
          name: kec.name,
          slug: kec.slug,
          population_density: kec.population_density,
          flood_vulnerability_index: kec.flood_vulnerability_index,
        },
        formula_version: PRIORITY_FORMULA_VERSION,
        score: result.finalScore,
        riskLevel: result.priorityLevel.toLowerCase(),
        riskLabel: result.priorityLevel,
        recent_report_count: rep.freq,
        report_count: rep.freq,
        components: result.components,
        factors: {
          reportFrequency: {
            raw: result.components.report_frequency.raw,
            normalized: result.components.report_frequency.normalized,
            weighted: result.components.report_frequency.weightedContribution,
          },
          urgency: {
            raw: result.components.urgency.raw,
            normalized: result.components.urgency.normalized,
            weighted: result.components.urgency.weightedContribution,
          },
          populationDensity: {
            raw: result.components.population_density.raw,
            normalized: result.components.population_density.normalized,
            weighted: result.components.population_density.weightedContribution,
          },
          vulnerability: {
            raw: result.components.environmental_vulnerability.raw,
            normalized: result.components.environmental_vulnerability.normalized,
            weighted: result.components.environmental_vulnerability.weightedContribution,
          },
        },
        explanation: Array.isArray(result.explanation) ? result.explanation : [result.explanation],
        data_sources: result.dataSources,
      }
    })

    priorityScores.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      success: true,
      formula_version: PRIORITY_FORMULA_VERSION,
      study_area: 'Kota Semarang',
      data: priorityScores,
    })
  } catch (error) {
    console.error('GET /api/priority-scores error:', error)
    return NextResponse.json({ error: 'Gagal menghitung skor prioritas.' }, { status: 500 })
  }
}
