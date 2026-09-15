import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DemoBanner } from '@/components/layout/DemoBanner'
import { FloodAlertBanner } from '@/components/layout/FloodAlertBanner'
import { ChatAssistant } from '@/components/ai/ChatAssistant'
import { Toaster } from '@/components/ui/toaster'
import { Analytics } from '@vercel/analytics/next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#4a154b',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://kotaku-siaga.vercel.app'),
  title: {
    default: 'KotaKu Siaga — Civic Climate Intelligence Semarang',
    template: '%s | KotaKu Siaga',
  },
  description:
    'Platform civic-tech monitoring risiko hidrometeorologis, rob pesisir, dan kesiapsiagaan cuaca Kota Semarang berbasis data terbuka, CCTV AI, dan partisipasi warga.',
  keywords: [
    'bencana iklim',
    'banjir semarang',
    'rob pesisir semarang',
    'laporan warga semarang',
    'peta risiko bencana',
    'cctv banjir semarang',
    'pantausemar',
    'SDG 11',
    'SDG 13',
    'civic tech',
  ],
  authors: [{ name: 'Pemerintah Kota Semarang & Komunitas Resiliensi Pesisir' }],
  creator: 'KotaKu Siaga Team',
  publisher: 'Pemerintah Kota Semarang',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://kotaku-siaga.vercel.app',
    title: 'KotaKu Siaga — Civic Climate Intelligence Semarang',
    description:
      'Platform kolaboratif pemantauan risiko banjir, rob pesisir, dan kesiapsiagaan cuaca Kota Semarang dengan integrasi sensor dan AI.',
    siteName: 'KotaKu Siaga',
    images: [
      {
        url: '/images/civic-illustration.png',
        width: 1200,
        height: 630,
        alt: 'KotaKu Siaga - Civic Climate Intelligence Platform Semarang',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KotaKu Siaga — Civic Climate Intelligence Semarang',
    description:
      'Platform kolaboratif pemantauan risiko hidrometeorologis dan rob pesisir Kota Semarang.',
    images: ['/images/civic-illustration.png'],
  },
  verification: {
    google: 'googled7bfe530ff714952',
  },
}

// JSON-LD structured data for search engine rich results
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EmergencyService',
  name: 'KotaKu Siaga',
  url: 'https://kotaku-siaga.vercel.app',
  logo: 'https://kotaku-siaga.vercel.app/images/civic-illustration.png',
  description:
    'Sistem cerdas pemantauan risiko banjir, rob, dan kesiapsiagaan cuaca Kota Semarang.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Semarang',
    addressRegion: 'Jawa Tengah',
    addressCountry: 'ID',
  },
  areaServed: {
    '@type': 'City',
    name: 'Kota Semarang',
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
        <Analytics />
      </body>
    </html>
  )
}
