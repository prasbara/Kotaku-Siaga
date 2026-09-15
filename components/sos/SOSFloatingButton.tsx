'use client'

import React, { useState } from 'react'
import { Radio, ShieldAlert } from 'lucide-react'
import { SOSModal } from './SOSModal'

export function SOSFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-4 sm:right-6 z-50 pointer-events-auto select-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 sm:gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-[#cc4117] hover:bg-[#b03713] active:scale-95 text-white font-bold text-xs sm:text-[13px] shadow-[0_4px_24px_rgba(204,65,23,0.5)] hover:shadow-[0_6px_28px_rgba(204,65,23,0.6)] transition-all duration-150 cursor-pointer border border-white/25"
          title="Buka Sinyal Darurat SOS Kota Semarang"
          aria-label="Kirim Sinyal Darurat SOS"
        >
          <span className="absolute -inset-1 rounded-full border-2 border-[#cc4117] animate-ping opacity-75 pointer-events-none"></span>
          <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse shrink-0" />
          <span className="uppercase tracking-wider font-extrabold text-[12px] sm:text-[13px] whitespace-nowrap">
            🚨 SOS DARURAT
          </span>
        </button>
      </div>

      <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
