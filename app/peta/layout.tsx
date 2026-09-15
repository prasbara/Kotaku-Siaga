import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Peta Risiko Banjir & Rob Semarang | KotaKu Siaga',
  description:
    'Peta risiko banjir dan rob interaktif Kota Semarang. Pantau genangan air, titik CCTV live PantauSemar, polder pompa, dan laporan spasial warga real-time.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/peta',
  },
  openGraph: {
    title: 'Peta Risiko Banjir & Rob Semarang | KotaKu Siaga',
    description:
      'Peta risiko banjir dan rob interaktif Kota Semarang. Pantau genangan air, titik CCTV live PantauSemar, polder pompa, dan laporan spasial warga real-time.',
    url: 'https://kotaku-siaga.vercel.app/peta',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Peta Risiko Banjir & Rob Semarang | KotaKu Siaga',
    description:
      'Peta risiko banjir dan rob interaktif Kota Semarang. Pantau genangan air, titik CCTV live PantauSemar, polder pompa, dan laporan spasial warga real-time.',
  },
}

export default function PetaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
