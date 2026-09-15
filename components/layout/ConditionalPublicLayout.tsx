'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { FloodAlertBanner } from '@/components/layout/FloodAlertBanner'
import { ChatAssistant } from '@/components/ai/ChatAssistant'
import { SOSFloatingButton } from '@/components/sos/SOSFloatingButton'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'

export function ConditionalPublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Check if current route is an internal operator or command center route
  const isInternalOperatorRoute =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/command-center')

  if (isInternalOperatorRoute) {
    return (
      <div className="min-h-screen bg-[#fdfbf9] text-[#1d1d1d] font-sans antialiased flex flex-col selection:bg-[#4a154b]/15 selection:text-[#4a154b]">
        <main className="flex-1 w-full min-w-0">{children}</main>
        <Toaster />
        <Analytics />
      </div>
    )
  }

  // Public portal layout
  return (
    <div className="min-h-screen bg-[#fdfbf9] text-[#1d1d1d] font-sans antialiased flex flex-col selection:bg-[#4a154b]/15 selection:text-[#4a154b]">
      <DemoBanner />
      <Navbar />
      <FloodAlertBanner />
      <main className="flex-1 w-full min-w-0">{children}</main>
      <Footer />
      <ChatAssistant />
      <SOSFloatingButton />
      <Toaster />
      <Analytics />
    </div>
  )
}
