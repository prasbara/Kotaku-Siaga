'use client'

import React, { useState, useEffect } from 'react'
import { Zap, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmergencyLiteModeToggle() {
  const [isLiteMode, setIsLiteMode] = useState<boolean>(false)

  useEffect(() => {
    // Check initial stored state
    const stored = localStorage.getItem('kotaku_emergency_lite')
    if (stored === 'true') {
      setIsLiteMode(true)
      document.documentElement.setAttribute('data-emergency-lite', 'true')
    }
  }, [])

  const handleToggle = () => {
    const nextState = !isLiteMode
    setIsLiteMode(nextState)
    localStorage.setItem('kotaku_emergency_lite', nextState ? 'true' : 'false')
    
    if (nextState) {
      document.documentElement.setAttribute('data-emergency-lite', 'true')
    } else {
      document.documentElement.removeAttribute('data-emergency-lite')
    }

    // Dispatch global custom event for components to react
    window.dispatchEvent(
      new CustomEvent('kotaku-emergency-lite-toggle', { detail: { isLite: nextState } })
    )
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border shadow-sm shrink-0 select-none',
        isLiteMode
          ? 'bg-[#cc4117] text-white border-[#cc4117] hover:bg-[#b03712] animate-pulse'
          : 'bg-[#f4ede4] text-[#4a154b] border-[#e6e6e6] hover:bg-[#f9f0ff] hover:border-[#4a154b]'
      )}
      title={isLiteMode ? 'Klik untuk kembali ke Mode Standar (Peta Lengkap)' : 'Aktifkan Mode Darurat Rendah Kuota & Baterai (Lite Mode)'}
      aria-label={isLiteMode ? 'Nonaktifkan Mode Darurat Lite' : 'Aktifkan Mode Darurat Lite'}
    >
      {isLiteMode ? (
        <>
          <Zap className="w-3.5 h-3.5 fill-white text-white" />
          <span>Mode Darurat (Lite)</span>
          <span className="w-2 h-2 rounded-full bg-white ring-2 ring-white/40"></span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-[#696969]" />
          <span className="hidden sm:inline">Mode Darurat</span>
          <span className="sm:hidden">Lite</span>
        </>
      )}
    </button>
  )
}
