'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp, AlertTriangle, Info, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AreaPriority {
  area: { name: string; population_density: number; environmental_vulnerability: number }
  score: number
  riskLevel: string
  riskLabel: string
  recent_report_count: number
  report_count: number
  factors: {
    reportFrequency: { raw: number; normalized: number; weighted: number }
    urgency: { raw: number; normalized: number; weighted: number }
    populationDensity: { raw: number; normalized: number; weighted: number }
    vulnerability: { raw: number; normalized: number; weighted: number }
  }
  explanation: string[]
}

const RISK_COLORS = {
  low: 'text-forest-700 bg-forest-50 border-forest-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  critical: 'text-red-700 bg-red-50 border-red-200',
}

const SCORE_COLOR = (s: number) =>
  s >= 75 ? 'text-red-600' : s >= 50 ? 'text-orange-600' : s >= 25 ? 'text-amber-600' : 'text-forest-600'

const SCORE_BAR_COLOR = (s: number) =>
  s >= 75 ? 'bg-red-500' : s >= 50 ? 'bg-orange-500' : s >= 25 ? 'bg-amber-500' : 'bg-forest-500'

export default function PrioritasPage() {
  const [priorities, setPriorities] = useState<AreaPriority[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState<AreaPriority | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null)
  const [analyzingArea, setAnalyzingArea] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/priority-scores')
      const data = await res.json()
      if (data.success) {
        setPriorities(data.data)
        if (data.data.length > 0 && !selectedArea) {
          setSelectedArea(data.data[0])
        }
      }
    } catch (err) {
      console.error('Priority fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const runAIAnalysis = async (area: AreaPriority) => {
    setAnalyzingArea(area.area.name)
    setAiAnalysis(null)
    try {
      // Calculate actual report counts from ground-truth reports
      let floodCount = 0
      let wasteCount = 0
      let drainageCount = 0
      let highCount = 0
      let criticalCount = 0

      try {
        const repRes = await fetch('/api/reports?limit=100')
        const repData = await repRes.json()
        if (repData.success && Array.isArray(repData.data)) {
          const districtKey = area.area.name.toLowerCase().replace('kecamatan ', '')
          const matching = repData.data.filter((r: { district_name?: string; address?: string }) => {
            const d = (r.district_name || '').toLowerCase()
            const a = (r.address || '').toLowerCase()
            return d.includes(districtKey) || a.includes(districtKey)
          })
          floodCount = matching.filter((r: { category: string }) => r.category === 'banjir').length
          wasteCount = matching.filter((r: { category: string }) => r.category === 'sampah_menumpuk').length
          drainageCount = matching.filter((r: { category: string }) => r.category === 'drainase_tersumbat').length
          criticalCount = matching.filter((r: { urgency: string }) => r.urgency === 'kritis').length
          highCount = matching.filter((r: { urgency: string }) => r.urgency === 'tinggi').length
        }
      } catch (e) {
        console.warn('Could not query ground-truth report breakdown:', e)
      }

      const res = await fetch('/api/ai/aggregate-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: area.area.name,
          report_count: area.report_count,
          flood_reports: floodCount,
          waste_reports: wasteCount,
          drainage_reports: drainageCount,
          high_urgency_reports: highCount,
          critical_reports: criticalCount,
          priority_score: area.score,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAiAnalysis(
          `[Model: OpenRouter / Free Models Router]\n\n${data.analysis.area_assessment}\n\nMASALAH UTAMA:\n${data.analysis.main_issue}\n\nREKOMENDASI INTERVENSI:\n${data.analysis.recommended_intervention}`
        )
      }
    } catch (err) {
      setAiAnalysis('Analisis AI tidak tersedia saat ini.')
    } finally {
      setAnalyzingArea(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Menghitung skor prioritas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="section-container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sistem Skor Prioritas</h1>
            <p className="text-slate-500 text-sm mt-0.5">Ranking wilayah berdasarkan kebutuhan penanganan</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Formula explanation */}
        <Card className="mb-5 border-forest-200 bg-forest-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-forest-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-forest-800 mb-1">Formula Skor Prioritas</div>
                <div className="text-xs font-mono text-forest-700 bg-white rounded-lg p-3 border border-forest-200">
                  Priority Score = (Frekuensi Laporan × 0.35) + (Urgensi × 0.30) + (Kepadatan × 0.20) + (Kerentanan × 0.15)
                </div>
                <div className="text-xs text-forest-600 mt-2">
                  Semua variabel dinormalisasi ke skala 0–100. Skor ini adalah sistem prioritisasi, bukan prediksi probabilitas bencana.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {priorities.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <div className="text-sm">Belum ada data area untuk dihitung.</div>
            <div className="text-xs mt-1">Tambahkan data area dan laporan ke database.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Ranking list */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ranking Wilayah</div>
              {priorities.map((p, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedArea(p); setAiAnalysis(null) }}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    selectedArea?.area.name === p.area.name
                      ? 'border-forest-300 bg-white shadow-card'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-card'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      'h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0',
                      i === 0 ? 'bg-red-100 text-red-700' :
                      i === 1 ? 'bg-orange-100 text-orange-700' :
                      i === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    )}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{p.area.name}</div>
                      <div className="text-xs text-slate-400">{p.recent_report_count} laporan 7 hari</div>
                    </div>
                    <div className={cn('text-lg font-bold', SCORE_COLOR(p.score))}>
                      {p.score}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className={cn('h-1.5 rounded-full', SCORE_BAR_COLOR(p.score))}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full border', RISK_COLORS[p.riskLevel as keyof typeof RISK_COLORS])}>
                      {p.riskLabel}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected area detail */}
            {selectedArea && (
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedArea.area.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-2xl font-bold', SCORE_COLOR(selectedArea.score))}>
                          {selectedArea.score}
                        </span>
                        <span className="text-slate-400 text-sm">/100</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Score breakdown */}
                    {selectedArea.factors && (
                      <div className="space-y-3 mb-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Faktor Penilaian</div>
                        {[
                          { label: 'Frekuensi Laporan (7 hari)', ...(selectedArea.factors.reportFrequency || { raw: 0, normalized: 0, weighted: 0 }), weight: '35%' },
                          { label: 'Rata-rata Urgensi', ...(selectedArea.factors.urgency || { raw: 0, normalized: 0, weighted: 0 }), weight: '30%' },
                          { label: 'Kepadatan Penduduk', ...(selectedArea.factors.populationDensity || { raw: 0, normalized: 0, weighted: 0 }), weight: '20%' },
                          { label: 'Kerentanan Lingkungan', ...(selectedArea.factors.vulnerability || { raw: 0, normalized: 0, weighted: 0 }), weight: '15%' },
                        ].map((f, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-600">{f.label}</span>
                              <div className="flex gap-2 text-slate-400">
                                <span>Bobot: {f.weight}</span>
                                <span className="font-semibold text-slate-700">+{f.weighted} poin</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-forest-500 transition-all"
                                  style={{ width: `${f.normalized}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono text-slate-500 w-8 text-right">{f.normalized}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Explanation */}
                    {(Array.isArray(selectedArea.explanation) ? selectedArea.explanation : selectedArea.explanation ? [selectedArea.explanation] : []).length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-3 mb-4">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Faktor Utama</div>
                        <ul className="space-y-1">
                          {(Array.isArray(selectedArea.explanation) ? selectedArea.explanation : [selectedArea.explanation]).map((exp, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                              {exp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* AI Analysis */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <Brain className="h-3.5 w-3.5 text-forest-600" />
                          Analisis AI
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 gap-1.5"
                          onClick={() => runAIAnalysis(selectedArea)}
                          loading={analyzingArea === selectedArea.area.name}
                        >
                          Analisis Wilayah Ini
                        </Button>
                      </div>

                      {aiAnalysis ? (
                        <div className="bg-forest-50 border border-forest-100 rounded-xl p-3 text-xs text-forest-800 leading-relaxed whitespace-pre-line">
                          {aiAnalysis}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                          Klik tombol untuk mendapatkan analisis AI tentang kondisi wilayah ini.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
