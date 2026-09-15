import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { FloodAlertBanner } from '@/components/layout/FloodAlertBanner'
import { ChatAssistant } from '@/components/ai/ChatAssistant'
import { Toaster } from '@/components/ui/toaster'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#4a154b',
}

export const metadata: Metadata = {
  title: {
    default: 'KotaKu Siaga — Civic Climate Intelligence Semarang',
    template: '%s | KotaKu Siaga',
  },
  description:
    'Platform civic-tech monitoring risiko hidrometeorologis, rob pesisir, dan resiliensi iklim Kota Semarang dengan prinsip transparansi data terbuka deterministik.',
  keywords: ['bencana iklim', 'banjir rob', 'semarang', 'laporan warga', 'peta risiko', 'SDG 11', 'SDG 13', 'civic tech'],
  authors: [{ name: 'Pemerintah Kota Semarang & Komunitas Resiliensi Pesisir' }],
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#fdfbf9] text-[#1d1d1d] font-sans antialiased flex flex-col selection:bg-[#4a154b]/15 selection:text-[#4a154b]">
        <DemoBanner />
        <Navbar />
        <FloodAlertBanner />
        <main className="flex-1 w-full min-w-0">{children}</main>
        <Footer />
        <ChatAssistant />
        <Toaster />
      </body>
    </html>
  )
}
