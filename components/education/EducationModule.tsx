'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  Waves,
  Droplets,
  Mountain,
  ShieldAlert,
  PhoneCall,
  ArrowRight,
  Layers,
  MapPin
} from 'lucide-react'
import { EDUCATION_MODULES } from '@/lib/data/education-resilience'
import { EducationalTooltip } from '@/components/education/EducationalTooltip'
import { InteractiveHydrologyDiagram } from '@/components/education/InteractiveHydrologyDiagram'
import { InteractiveDrainageFlowVisualizer } from '@/components/education/InteractiveDrainageFlowVisualizer'
import { InteractiveSlopeStabilityVisualizer } from '@/components/education/InteractiveSlopeStabilityVisualizer'
import { DangerSignsExplorer } from '@/components/education/DangerSignsExplorer'
import { ActionCardPhases } from '@/components/education/ActionCardPhases'
import { RiskFactorsChart } from '@/components/education/RiskFactorsChart'
import { KnowledgeQuiz } from '@/components/education/KnowledgeQuiz'
import { TasSiagaChecklist } from '@/components/education/TasSiagaChecklist'

export function EducationModule() {
  const searchParams = useSearchParams()
  const modulQuery = searchParams.get('modul')

  // Find initial module or default to modul-01
  const initialModule =
    EDUCATION_MODULES.find((m) => m.slug === modulQuery) || EDUCATION_MODULES[0]

  const [selectedSlug, setSelectedSlug] = useState<string>(initialModule.slug)

  // Sync if query param changes
  useEffect(() => {
    if (modulQuery) {
      const found = EDUCATION_MODULES.find((m) => m.slug === modulQuery)
      if (found) setSelectedSlug(found.slug)
    }
  }, [modulQuery])

  const currentModule =
    EDUCATION_MODULES.find((m) => m.slug === selectedSlug) || EDUCATION_MODULES[0]

  return (
    <div className="flex flex-col w-full bg-[#fdfbf9] text-[#1d1d1d] min-h-screen pb-28 font-sans">
      {/* 1. EDITORIAL HERO BANNER */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 bg-[#f4ede4] border-b border-[#e6e6e6] overflow-hidden">
        {/* Soft subtle radial background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,#f9f0ff_0%,transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase font-bold tracking-wider text-[#4a154b] px-3 py-1 rounded-[90px] bg-white border border-[#e6e6e6]">
              LITERASI & KETAHANAN IKLIM
            </span>
            <span className="font-mono text-xs text-[#007a5a] flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#007a5a] animate-pulse" />
              SAINS HIDROLOGI & GEOLOGI KOTA SEMARANG
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#4a154b] tracking-tight leading-tight">
            Kajian & Panduan Ketahanan Perkotaan
          </h1>
          <p className="text-sm sm:text-base text-[#696969] max-w-3xl leading-relaxed">
            Memahami risiko lingkungan Kota Semarang berbasis sains, data, dan kesiapsiagaan masyarakat.
          </p>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* TOPIC SELECTION NAV TABS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EDUCATION_MODULES.map((mod) => {
            const isSelected = mod.slug === selectedSlug
            const Icon =
              mod.category === 'banjir_rob'
                ? Waves
                : mod.category === 'drainase_perkotaan'
                ? Droplets
                : Mountain

            return (
              <button
                key={mod.slug}
                type="button"
                onClick={() => setSelectedSlug(mod.slug)}
                className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#f9f0ff] border-[#4a154b] ring-2 ring-[#4a154b]/20 shadow-md'
                    : 'bg-white border-[#e6e6e6] hover:bg-[#f4ede4]/40 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4a154b] bg-white/80 px-2 py-0.5 rounded border border-[#eddcf7]">
                    {mod.moduleCode}
                  </span>
                  <span className="text-[11px] font-mono text-[#696969]">
                    {mod.readingTime}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 my-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#4a154b] text-white' : 'bg-[#f4ede4] text-[#4a154b]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-[#1d1d1d] leading-snug">
                    {mod.title}
                  </h3>
                </div>

                <p className="text-xs text-[#696969] line-clamp-2 leading-relaxed mt-1">
                  {mod.subtitle}
                </p>

                <div className="mt-3 pt-2.5 border-t border-[#f0f0f0] flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#4a154b] font-semibold truncate max-w-[200px]">
                    Kawasan: {mod.topographyType}
                  </span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isSelected ? 'text-[#4a154b]' : 'text-[#696969]'
                    }`}
                  >
                    {isSelected ? 'Sedang Dibaca' : 'Buka Modul'} ➔
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 3. CURRENT ACTIVE MODULE: 5-PILLAR SCIENTIFIC DEEP-DIVE */}
        <section className="bg-white border border-[#e6e6e6] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          {/* Module Title Banner */}
          <div className="space-y-2 pb-6 border-b border-[#e6e6e6]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[90px] bg-[#f9f0ff] border border-[#d9bdde]/60 text-[#4a154b] font-mono text-[11px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              {currentModule.overline} • {currentModule.readingTime}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4a154b] tracking-tight">
              {currentModule.title}
            </h2>
            <p className="text-sm sm:text-base text-[#696969] leading-relaxed">
              {currentModule.subtitle}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-mono text-[#007a5a]">
              <MapPin className="w-3.5 h-3.5" />
              <span><strong>Fokus Wilayah:</strong> {currentModule.targetArea}</span>
            </div>
          </div>

          {/* 5-PILLAR SCIENTIFIC BREAKDOWN (APA -> MENGAPA -> MENGENALI -> DAMPAK -> TINDAKAN) */}
          <div className="space-y-6">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#4a154b]" />
              Kerangka Kajian Terstruktur (5 Pilar Sains & Aksi Warga)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pilar 1: Apa yang terjadi? */}
              <div className="p-5 rounded-2xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2">
                <span className="text-[11px] font-mono font-bold uppercase text-[#1264a3] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1264a3] text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Apa yang Terjadi?
                </span>
                <p className="text-xs sm:text-sm text-[#1d1d1d] leading-relaxed">
                  {currentModule.fivePillars.apa}
                </p>
              </div>

              {/* Pilar 2: Mengapa terjadi? */}
              <div className="p-5 rounded-2xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2">
                <span className="text-[11px] font-mono font-bold uppercase text-[#4a154b] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#4a154b] text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  Mengapa Bisa Terjadi?
                </span>
                <p className="text-xs sm:text-sm text-[#1d1d1d] leading-relaxed">
                  {currentModule.fivePillars.mengapa}
                </p>
                <div className="pt-1 text-[11px] text-[#696969]">
                  Konsep terkait:{' '}
                  <EducationalTooltip termKey="land-subsidence" /> •{' '}
                  <EducationalTooltip termKey="polder" /> •{' '}
                  <EducationalTooltip termKey="backwater-effect" />
                </div>
              </div>
            </div>

            {/* Pilar 3: Bagaimana mengenalinya? */}
            <div className="p-5 rounded-2xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-3">
              <span className="text-[11px] font-mono font-bold uppercase text-[#d97706] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d97706] text-white flex items-center justify-center text-[10px]">
                  3
                </span>
                Bagaimana Cara Mengenalinya di Lapangan?
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1d1d1d]">
                {currentModule.fivePillars.bagaimanaMengenali.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#e6e6e6]">
                    <span className="text-[#d97706] font-bold">●</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pilar 4 & 5: Apa dampaknya? & Apa yang dapat dilakukan? */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#fdfbf9] border border-[#e6e6e6] flex flex-col gap-2.5">
                <span className="text-[11px] font-mono font-bold uppercase text-[#cc4117] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#cc4117] text-white flex items-center justify-center text-[10px]">
                    4
                  </span>
                  Apa Dampaknya Terhadap Kehidupan?
                </span>
                <ul className="space-y-1.5 text-xs text-[#1d1d1d]">
                  {currentModule.fivePillars.apaDampaknya.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#cc4117] font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-[#ebf7f3] border border-[#007a5a]/30 flex flex-col gap-2.5">
                <span className="text-[11px] font-mono font-bold uppercase text-[#007a5a] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#007a5a] text-white flex items-center justify-center text-[10px]">
                    5
                  </span>
                  Apa yang Dapat Dilakukan Warga?
                </span>
                <ul className="space-y-1.5 text-xs text-[#1d1d1d]">
                  {currentModule.fivePillars.apaYangDapatDilakukan.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#007a5a] font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4. DEDICATED INTERACTIVE SIMULATION WIDGET PER MODULE */}
          <div className="pt-6 border-t border-[#e6e6e6]">
            {currentModule.diagramType === 'coastal_hydrology' && <InteractiveHydrologyDiagram />}
            {currentModule.diagramType === 'drainage_blockage' && <InteractiveDrainageFlowVisualizer />}
            {currentModule.diagramType === 'slope_stability' && <InteractiveSlopeStabilityVisualizer />}
          </div>

          {/* 5. EDUCATIONAL RISK FACTOR MIX CHART (Requirement #10) */}
          <div className="pt-2">
            <RiskFactorsChart initialFactors={currentModule.riskFactorSliders} />
          </div>

          {/* 6. PHASED CIVIC ACTION CARDS (Requirement #6: SEBELUM, SAAT, SETELAH) */}
          <div className="pt-2">
            <ActionCardPhases
              title={`Panduan Kesiapsiagaan Aksi: ${currentModule.title}`}
              checklist={currentModule.actionChecklist}
            />
          </div>

          {/* 7. KNOWLEDGE QUIZ GAMIFICATION (Requirement #13) */}
          <div className="pt-2">
            <KnowledgeQuiz questions={currentModule.quiz} moduleTitle={currentModule.title} />
          </div>

          {/* 8. SCIENTIFIC REFERENCES & TRANSPARENCY (Requirement #11) */}
          <div className="pt-6 border-t border-[#e6e6e6] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b]">
                Transparansi & Sumber Referensi Ilmiah Resmi
              </span>
              <span className="text-[11px] font-mono text-[#696969]">
                Terakhir diperbarui: 14 September 2026
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentModule.references.map((ref, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3.5 rounded-xl bg-[#f4ede4]/40 border border-[#e6e6e6] text-xs space-y-1"
                >
                  <div className="font-bold text-[#1d1d1d]">{ref.title}</div>
                  <div className="text-[#696969] text-[11px]">
                    {ref.publisher} ({ref.year})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. CROSS-SYSTEM FEATURE: "KENALI TANDA BAHAYA" EXPLORER (Requirement #5) */}
        <section id="tanda-bahaya" className="w-full">
          <DangerSignsExplorer />
        </section>

        {/* 5. FAMILY DISASTER CHECKLIST (72 JAM MANDIRI) */}
        <section id="tas-siaga" className="w-full">
          <TasSiagaChecklist />
        </section>

        {/* 6. EMERGENCY ACTION CARD & DISPATCH (Requirement #12) */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#4a154b] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[90px] bg-white/10 text-[#eddcf7] font-mono text-[10px] uppercase font-bold tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              PUSAT BANTUAN DARURAT & RESPONS KOTA
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              Menghadapi Kondisi Kritis / Genangan Mendesak?
            </h3>
            <p className="text-xs sm:text-sm text-[#eddcf7]/80 leading-relaxed">
              Hubungi kanal darurat resmi Pemkot Semarang atau laporkan kejadian secara langsung melalui aplikasi KotaKu Siaga untuk disposisi tim lapangan BPBD & DPUPR.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 font-mono text-xs font-bold text-[#f4ede4]">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
                <span>Call Center 112 (Bebas Pulsa)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-300" />
                <span>BPBD Semarang: 024-7629474</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/laporan/baru"
              className="px-6 py-3.5 rounded-[90px] bg-[#007a5a] hover:bg-[#008f6b] text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Laporkan Kejadian Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/peta"
              className="px-6 py-3.5 rounded-[90px] bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all"
            >
              <span>Lihat Peta Pemantauan</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
