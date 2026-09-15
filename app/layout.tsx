import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ConditionalPublicLayout } from '@/components/layout/ConditionalPublicLayout'

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
    default: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    template: '%s',
  },
  description:
    'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV, data cuaca, dan pusat kendali.',
  keywords: [
    'KotaKu Siaga',
    'pemantauan banjir Semarang',
    'informasi banjir Semarang',
    'banjir Kota Semarang',
    'banjir Semarang hari ini',
    'rob Semarang',
    'rob Kota Semarang',
    'pemantauan rob Semarang',
    'peta banjir Semarang',
    'peta risiko banjir Semarang',
    'CCTV banjir Semarang',
    'laporan banjir Semarang',
    'kondisi banjir Semarang',
    'risiko banjir Kota Semarang',
    'informasi bencana Semarang',
    'pusat informasi banjir Semarang',
    'Genuk',
    'Kaligawe',
    'Semarang Utara',
    'Semarang Timur',
    'Tembalang',
    'wilayah pesisir Semarang',
    'kawasan rob Semarang',
  ],
  authors: [{ name: 'Inisiatif Ketahanan Bencana Kota Semarang' }],
  creator: 'KotaKu Siaga Team',
  publisher: 'Pemerintah Kota Semarang & BPBD Kota Semarang',
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
    title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    description:
      'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV, data cuaca, dan pusat kendali.',
    siteName: 'KotaKu Siaga',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'KotaKu Siaga — Pemantauan Banjir & Rob Kota Semarang',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KotaKu Siaga | Pemantauan Banjir & Rob Kota Semarang',
    description:
      'KotaKu Siaga menyediakan informasi pemantauan banjir dan rob Kota Semarang melalui peta risiko, laporan warga, CCTV, data cuaca, dan pusat kendali.',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'googled7bfe530ff714952',
  },
}

// Rich Schema.org JSON-LD Graph for AI & Search Engine Rich Results
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://kotaku-siaga.vercel.app/#website',
      url: 'https://kotaku-siaga.vercel.app',
      name: 'KotaKu Siaga',
      description:
        'Platform pemantauan risiko banjir dan rob Kota Semarang secara real-time berbasis peta risiko, laporan warga, dan CCTV.',
      inLanguage: 'id-ID',
      publisher: {
        '@id': 'https://kotaku-siaga.vercel.app/#organization',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://kotaku-siaga.vercel.app/#webapp',
      name: 'KotaKu Siaga Platform',
      url: 'https://kotaku-siaga.vercel.app',
      applicationCategory: 'PublicSafetyApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires modern browser with JavaScript enabled',
      description:
        'Aplikasi web pemantauan risiko bencana hidrometeorologis, banjir pesisir rob, dan pelaporan genangan warga di Kota Semarang.',
    },
    {
      '@type': 'EmergencyService',
      '@id': 'https://kotaku-siaga.vercel.app/#organization',
      name: 'KotaKu Siaga — Pusat Informasi Bencana Semarang',
      url: 'https://kotaku-siaga.vercel.app',
      logo: 'https://kotaku-siaga.vercel.app/opengraph-image',
      telephone: '112',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '112',
        contactType: 'emergency',
        areaServed: 'Kota Semarang',
        availableLanguage: ['Indonesian', 'Javanese'],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Semarang',
        addressRegion: 'Jawa Tengah',
        addressCountry: 'ID',
      },
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Kota Semarang',
        containsPlace: [
          { '@type': 'Place', name: 'Kecamatan Semarang Utara' },
          { '@type': 'Place', name: 'Kecamatan Genuk' },
          { '@type': 'Place', name: 'Kecamatan Gayamsari' },
          { '@type': 'Place', name: 'Kecamatan Tembalang' },
          { '@type': 'Place', name: 'Kecamatan Pedurungan' },
          { '@type': 'Place', name: 'Kecamatan Tugu' },
        ],
      },
    },
  ],
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
      <body>
        <ConditionalPublicLayout>{children}</ConditionalPublicLayout>
      </body>
    </html>
  )
}
