import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Matriks Risiko Banjir Kota Semarang | KotaKu Siaga',
  description:
    'Matriks kalkulasi risiko bencana banjir dan rob multi-parameter untuk 16 kecamatan Kota Semarang berdasar densitas, elevasi, dan data historis.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/dashboard/prioritas',
  },
  openGraph: {
    title: 'Matriks Risiko Banjir Kota Semarang | KotaKu Siaga',
    description:
      'Matriks kalkulasi risiko bencana banjir dan rob multi-parameter untuk 16 kecamatan Kota Semarang berdasar densitas, elevasi, dan data historis.',
    url: 'https://kotaku-siaga.vercel.app/dashboard/prioritas',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Matriks Risiko Banjir Kota Semarang | KotaKu Siaga',
    description:
      'Matriks kalkulasi risiko bencana banjir dan rob multi-parameter untuk 16 kecamatan Kota Semarang berdasar densitas, elevasi, dan data historis.',
  },
}

export default function PrioritasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
