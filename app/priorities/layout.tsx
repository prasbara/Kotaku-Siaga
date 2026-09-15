import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Matriks Risiko Banjir Kota Semarang | KotaKu Siaga',
  description:
    'Matriks prioritas penanganan wilayah risiko bencana banjir dan rob Kota Semarang berstandar ISO 37120.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/priorities',
  },
  openGraph: {
    title: 'Matriks Risiko Banjir Kota Semarang | KotaKu Siaga',
    description:
      'Matriks prioritas penanganan wilayah risiko bencana banjir dan rob Kota Semarang berstandar ISO 37120.',
    url: 'https://kotaku-siaga.vercel.app/priorities',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Matriks Risiko Banjir Kota Semarang | KotaKu Siaga',
    description:
      'Matriks prioritas penanganan wilayah risiko bencana banjir dan rob Kota Semarang berstandar ISO 37120.',
  },
}

export default function PrioritiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
