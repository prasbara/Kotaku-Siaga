import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ConditionalPublicLayout } from '@/components/layout/ConditionalPublicLayout'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
})

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
  authors: [{ name: 'KotaKu Siaga — Inisiatif Resiliensi Perkotaan Semarang' }],
  creator: 'Tim KotaKu Siaga',
  publisher: 'KotaKu Siaga — Civic Resilience Platform',
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
      'Platform independen pemantauan risiko banjir, rob pesisir, dan kesiapsiagaan bencana Kota Semarang berbasis data spasial terbuka dan laporan warga terverifikasi.',
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
      'Platform independen pemantauan risiko banjir, rob pesisir, dan kesiapsiagaan bencana Kota Semarang berbasis data spasial terbuka dan laporan warga terverifikasi.',
    images: ['/opengraph-image'],
  },
  verification: {
    google: 'googled7bfe530ff714952',
  },
}

// Schema.org JSON-LD Graph: Valid, Factual & Truthful Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://kotaku-siaga.vercel.app/#website',
      url: 'https://kotaku-siaga.vercel.app',
      name: 'KotaKu Siaga',
      description:
        'Platform independen pemantauan banjir rob, genangan air, dan kesiapsiagaan bencana iklim Kota Semarang berbasis peta spasial dan laporan warga terverifikasi.',
      inLanguage: 'id-ID',
      publisher: {
        '@id': 'https://kotaku-siaga.vercel.app/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://kotaku-siaga.vercel.app/laporan?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://kotaku-siaga.vercel.app/#webapp',
      name: 'KotaKu Siaga',
      url: 'https://kotaku-siaga.vercel.app',
      applicationCategory: 'DisasterAlertApplication',
      operatingSystem: 'All',
      browserRequirements: 'Requires modern web browser with JavaScript enabled',
      description:
        'Aplikasi pemantauan risiko bencana hidrometeorologis, banjir pesisir rob, dan pelaporan genangan warga di Kota Semarang.',
      inLanguage: 'id-ID',
    },
    {
      '@type': 'Organization',
      '@id': 'https://kotaku-siaga.vercel.app/#organization',
      name: 'KotaKu Siaga',
      url: 'https://kotaku-siaga.vercel.app',
      logo: 'https://kotaku-siaga.vercel.app/opengraph-image',
      description:
        'Inisiatif ketahanan perkotaan dan keterbukaan data kebencanaan di wilayah Kota Semarang, Jawa Tengah.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Semarang',
        addressRegion: 'Jawa Tengah',
        addressCountry: 'ID',
      },
      areaServed: {
        '@type': 'AdministrativeArea',
        name: 'Kota Semarang',
      },
      knowsAbout: [
        'Mitigasi Banjir Kota Semarang',
        'Banjir Rob Pesisir Semarang Utara dan Genuk',
        'Kesiapsiagaan Bencana Hidrometeorologis',
        'Analisis Drainase Perkotaan',
      ],
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`light ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <ConditionalPublicLayout>{children}</ConditionalPublicLayout>
      </body>
    </html>
  )
}
