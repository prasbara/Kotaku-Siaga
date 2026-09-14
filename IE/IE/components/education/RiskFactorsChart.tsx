'use client'

import React, { useState } from 'react'
import { BarChart3, Info } from 'lucide-react'

interface Factor {
  label: string
  value: number
  description: string
}

interface RiskFactorsChartProps {
  initialFactors: Factor[]
}

export function RiskFactorsChart({ initialFactors }: RiskFactorsChartProps) {
  const [factors, setFactors] = useState<Factor[]>(initialFactors)

  const handleUpdate = (idx: number, newVal: number) => {
    const updated = [...factors]
    updated[idx].value = newVal
    setFactors(updated)
  }

  return (
    <div className="w-full bg-white border border-[#e6e6e6] rounded-2xl p-5 sm:p-7 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e6e6e6]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] mb-1">
            <BarChart3 className="w-4 h-4 text-[#4a154b]" />
            Analisis Hubungan Antar-Faktor Risiko
          </div>
          <h3 className="font-bold text-lg sm:text-xl text-[#1d1d1d]">
            Faktor Penentu Risiko Genangan & Ketahanan
          </h3>
        </div>
      </div>

      {/* Factors Sliders */}
      <div className="space-y-4">
        {factors.map((f, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#1d1d1d]">
              <span className="font-mono">{f.label}</span>
              <span className="font-mono px-2 py-0.5 rounded bg-[#f4ede4] text-[#4a154b]">
                Bobot Pengaruh: {f.value}%
              </span>
            </div>

            {/* Visual Bar Indicator */}
            <div className="w-full h-3 bg-[#f0f0f0] rounded-full overflow-hidden flex">
              <div
                style={{ width: `${f.value}%` }}
                className={`h-full transition-all duration-300 rounded-full ${
                  f.value > 80
                    ? 'bg-[#cc4117]'
                    : f.value > 60
                    ? 'bg-[#d97706]'
                    : 'bg-[#007a5a]'
                }`}
              />
            </div>

            {/* Interactive Adjustment Slider */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min={0}
                max={100}
                value={f.value}
                onChange={(e) => handleUpdate(idx, parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#f4ede4] rounded-lg appearance-none cursor-pointer accent-[#4a154b]"
              />
            </div>

            <p className="text-xs text-[#696969] leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* Mandatory Scientific Disclaimer (Requirement #10) */}
      <div className="p-3.5 rounded-xl bg-[#f4ede4] border border-[#e6e6e6] flex items-start gap-2.5 text-xs text-[#4a154b]">
        <Info className="w-4 h-4 text-[#4a154b] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Catatan Transparansi:</strong> Visualisasi digunakan untuk membantu memahami hubungan timbal-balik antar faktor hidrometeorologi dan bukan merupakan skor prediksi mutlak bencana alam.
        </p>
      </div>
    </div>
  )
}
