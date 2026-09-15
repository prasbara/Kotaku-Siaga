'use client'

import React, { useState } from 'react'
import { Radio, ShieldAlert } from 'lucide-react'
import { SOSModal } from './SOSModal'

export function SOSFloatingButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#cc4117] hover:bg-[#b03713] active:scale-95 text-white font-bold text-xs shadow-[0_4px_20px_rgba(204,65,23,0.45)] transition-all cursor-pointer"
          title="Buka Sinyal Darurat SOS"
        >
          <span className="absolute -inset-1 rounded-full border-2 border-[#cc4117] animate-ping opacity-75 pointer-events-none"></span>
          <Radio className="w-5 h-5 text-white animate-pulse shrink-0" />
          <span className="uppercase tracking-wider font-extrabold text-[13px]">
            🚨 SOS DARURAT
          </span>
        </button>
      </div>

      <SOSModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
