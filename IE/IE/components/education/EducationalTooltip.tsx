'use client'

import React, { useState } from 'react'
import { HelpCircle, BookOpen } from 'lucide-react'
import { SCIENTIFIC_GLOSSARY } from '@/lib/data/education-resilience'

interface EducationalTooltipProps {
  termKey: keyof typeof SCIENTIFIC_GLOSSARY | string
  children?: React.ReactNode
  fallbackTerm?: string
}

export function EducationalTooltip({ termKey, children, fallbackTerm }: EducationalTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const item = SCIENTIFIC_GLOSSARY[termKey]

  if (!item) {
    return <span>{children || fallbackTerm || termKey}</span>
  }

  return (
    <span className="relative inline-flex items-baseline group">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 font-semibold text-[#4a154b] underline decoration-dotted decoration-[#4a154b]/60 underline-offset-4 hover:decoration-solid hover:bg-[#f9f0ff] px-1 rounded transition-colors text-inherit"
        title="Klik untuk melihat penjelasan ilmiah"
      >
        <span>{children || item.term}</span>
        <HelpCircle className="w-3.5 h-3.5 text-[#4a154b]/70 shrink-0" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl bg-[#1f0621] text-[#f4ede4] text-xs shadow-2xl border border-[#eddcf7]/30 z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#007a5a] font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-[#007a5a]" />
            Glosarium Sains Perkotaan
          </div>
          <div className="font-bold text-white text-sm mb-1">{item.term}</div>
          <p className="text-[#f4ede4]/90 leading-relaxed text-[12px]">{item.definition}</p>
          <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-[#eddcf7]/70 font-mono">
            Sumber: {item.source}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1f0621] rotate-45 border-r border-b border-[#eddcf7]/30 -mt-1" />
        </div>
      )}
    </span>
  )
}
