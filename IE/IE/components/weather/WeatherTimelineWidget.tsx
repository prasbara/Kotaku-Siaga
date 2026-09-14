'use client'

import React, { useState } from 'react'
import { Clock, CloudRain, Wind, Thermometer, Waves } from 'lucide-react'
import type { WeatherTimelineStep } from '@/lib/weather/weather-intelligence'

interface WeatherTimelineWidgetProps {
  timeline?: WeatherTimelineStep[]
}

export function WeatherTimelineWidget({ timeline }: WeatherTimelineWidgetProps) {
  const [selectedIdx, setSelectedIdx] = useState<number>(0)

  if (!timeline || timeline.length === 0) return null

  const activeStep = timeline[selectedIdx] || timeline[0]

  return (
    <div className="p-4 rounded-xl bg-[#fdfbf9] border border-[#e6e6e6] shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#f9f0ff] border border-[#eddcf7] flex items-center justify-center text-[#4a154b]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
              Timeline Dinamika Cuaca
            </h4>
            <span className="text-[10px] text-[#696969] block">
              Proyeksi Temporal Multi-Parameter (0h — 24h)
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#4a154b] font-bold">
          FORECAST HORIZON
        </span>
      </div>

      {/* Horizontal Steps Navigator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {timeline.map((step, idx) => {
          const isSelected = idx === selectedIdx
          return (
            <button
              key={step.stepKey}
              onClick={() => setSelectedIdx(idx)}
              className={`flex-1 min-w-[56px] py-1.5 px-2 rounded-lg text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer border ${
                isSelected
                  ? 'bg-[#4a154b] text-white border-[#4a154b] shadow-xs'
                  : 'bg-white text-[#1d1d1d] border-[#e6e6e6] hover:bg-[#f4ede4]'
              }`}
            >
              <span className={`text-[10px] font-bold font-mono ${isSelected ? 'text-white' : 'text-[#4a154b]'}`}>
                {step.stepKey}
              </span>
              <span className={`text-[9px] truncate max-w-full ${isSelected ? 'text-white/80' : 'text-[#696969]'}`}>
                {step.rainMm > 0 ? `${step.rainMm}mm` : 'Cerah'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Step Detail Inspector */}
      <div className="p-3 rounded-lg bg-white border border-[#e6e6e6] flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4a154b] uppercase font-mono">
              {activeStep.label} ({activeStep.timeWib})
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f4ede4] text-[#1d1d1d] font-semibold">
              {activeStep.conditionDesc}
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#696969]">
            {activeStep.hourOffset === 0 ? 'Observasi Terkini' : `Proyeksi +${activeStep.hourOffset} Jam`}
          </span>
        </div>

        {/* 4 Metrics for the Selected Horizon Step */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Rain */}
          <div className="p-2 rounded bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col">
            <div className="flex items-center gap-1 text-[#696969] text-[10px]">
              <CloudRain className="w-3 h-3 text-[#4a154b]" />
              <span>Curah Hujan</span>
            </div>
            <span className="text-sm font-bold font-mono text-[#1d1d1d] mt-1">
              {activeStep.rainMm} mm/j
            </span>
          </div>

          {/* Wind */}
          <div className="p-2 rounded bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col">
            <div className="flex items-center gap-1 text-[#696969] text-[10px]">
              <Wind className="w-3 h-3 text-[#4a154b]" />
              <span>Kecepatan Angin</span>
            </div>
            <span className="text-sm font-bold font-mono text-[#1d1d1d] mt-1">
              {activeStep.windKmh} km/j
            </span>
          </div>

          {/* Temperature */}
          <div className="p-2 rounded bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col">
            <div className="flex items-center gap-1 text-[#696969] text-[10px]">
              <Thermometer className="w-3 h-3 text-[#4a154b]" />
              <span>Temperatur</span>
            </div>
            <span className="text-sm font-bold font-mono text-[#1d1d1d] mt-1">
              {activeStep.tempC} °C
            </span>
          </div>

          {/* Wave */}
          <div className="p-2 rounded bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col">
            <div className="flex items-center gap-1 text-[#696969] text-[10px]">
              <Waves className="w-3 h-3 text-[#4a154b]" />
              <span>Gelombang Laut</span>
            </div>
            <span className="text-sm font-bold font-mono text-[#1d1d1d] mt-1">
              {activeStep.waveM != null ? `${activeStep.waveM} m` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
