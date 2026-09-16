'use client'

import React, { useState } from 'react'
import { Radio } from 'lucide-react'
import { SOSModal } from './SOSModal'

export function SOSFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,1rem))] right-3 sm:right-6 z-40 pointer-events-auto select-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-[#cc4117] hover:bg-[#b03713] active:scale-95 text-white font-bold text-xs sm:text-[13px] shadow-[0_4px_18px_rgba(204,65,23,0.4)] hover:shadow-[0_6px_22px_rgba(204,65,23,0.5)] transition-all duration-150 cursor-pointer border border-white/20"
          title="Buka Sinyal Darurat SOS Kota Semarang"
          aria-label="Kirim Sinyal Darurat SOS 1-Klik"
        >
          <Radio className="w-4 h-4 text-white animate-pulse shrink-0" />
          <span className="uppercase tracking-wider font-extrabold text-[11px] sm:text-xs whitespace-nowrap">
            SOS Darurat
          </span>
        </button>
      </div>

      <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
