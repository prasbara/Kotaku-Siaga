import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lapor Genangan & Banjir Semarang | KotaKu Siaga',
  description:
    'Laporkan kejadian banjir, genangan air jalan, tanggul bocor, atau rob di Kota Semarang langsung dengan foto bukti, lokasi GPS presisi, dan deteksi AI.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/laporan/baru',
  },
  openGraph: {
    title: 'Lapor Genangan & Banjir Semarang | KotaKu Siaga',
    description:
      'Laporkan kejadian banjir, genangan air jalan, tanggul bocor, atau rob di Kota Semarang langsung dengan foto bukti, lokasi GPS presisi, dan deteksi AI.',
    url: 'https://kotaku-siaga.vercel.app/laporan/baru',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lapor Genangan & Banjir Semarang | KotaKu Siaga',
    description:
      'Laporkan kejadian banjir, genangan air jalan, tanggul bocor, atau rob di Kota Semarang langsung dengan foto bukti, lokasi GPS presisi, dan deteksi AI.',
  },
}

export default function LaporBaruLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
