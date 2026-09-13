import { NextResponse } from 'next/server'
import { SEMARANG_KECAMATAN } from '@/lib/ingestion/semarang-admin'
import { calculateDeterministicPriority, PRIORITY_FORMULA_VERSION } from '@/lib/priority/calculator'

export async function GET() {
  try {
    const reportDistribution: Record<string, { freq: number; urgency: number }> = {
      '337401': { freq: 28, urgency: 88 }, // Semarang Utara
      '337402': { freq: 24, urgency: 84 }, // Genuk
      '337403': { freq: 17, urgency: 72 }, // Gayamsari
      '337404': { freq: 19, urgency: 75 }, // Tembalang
      '337405': { freq: 10, urgency: 60 }, // Pedurungan
      '337406': { freq: 13, urgency: 65 }, // Ngaliyan
      '337407': { freq: 8,  urgency: 50 }, // Banyumanik
      '337408': { freq: 15, urgency: 70 }, // Semarang Barat
      '337409': { freq: 12, urgency: 68 }, // Semarang Timur
      '337410': { freq: 11, urgency: 62 }, // Semarang Tengah
      '337411': { freq: 9,  urgency: 55 }, // Semarang Selatan
      '337412': { freq: 7,  urgency: 48 }, // Candisari
      '337413': { freq: 6,  urgency: 45 }, // Gajahmungkur
      '337414': { freq: 14, urgency: 74 }, // Tugu
      '337415': { freq: 5,  urgency: 40 }, // Mijen
      '337416': { freq: 4,  urgency: 35 }, // Gunungpati
    }

    const priorityScores = SEMARANG_KECAMATAN.map((kec) => {
      const rep = reportDistribution[kec.id] || { freq: 5, urgency: 50 }
      const isCoastal = ['semarang-utara', 'genuk', 'tugu', 'gayamsari'].includes(kec.slug)
      const disasters = isCoastal ? 12 : ['tembalang', 'banyumanik'].includes(kec.slug) ? 8 : 3
      const rainProb = isCoastal ? 82 : 55

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
