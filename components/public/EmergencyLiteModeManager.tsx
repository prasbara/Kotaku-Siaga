'use client'

import React, { useState, useEffect } from 'react'
import { EmergencyLiteView } from '@/components/public/EmergencyLiteView'

interface EmergencyLiteModeManagerProps {
  children: React.ReactNode
}

export function EmergencyLiteModeManager({ children }: EmergencyLiteModeManagerProps) {
  const [isLite, setIsLite] = useState<boolean>(false)

  useEffect(() => {
    // Check initial stored state
    const stored = localStorage.getItem('kotaku_emergency_lite')
    if (stored === 'true') {
      setIsLite(true)
    }

    // Listen for custom toggle events
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isLite: boolean }>
      if (customEvent.detail) {
        setIsLite(customEvent.detail.isLite)
      }
    }

    window.addEventListener('kotaku-emergency-lite-toggle', handleToggle)
    return () => {
      window.removeEventListener('kotaku-emergency-lite-toggle', handleToggle)
    }
  }, [])

  if (isLite) {
    return <EmergencyLiteView />
  }

  return <>{children}</>
}
