import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Laporan Banjir Warga Kota Semarang | KotaKu Siaga',
  description:
    'Daftar laporan banjir, genangan air jalan, rob pesisir, dan kondisi darurat warga Kota Semarang yang terverifikasi secara real-time.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/laporan',
  },
  openGraph: {
    title: 'Laporan Banjir Warga Kota Semarang | KotaKu Siaga',
    description:
      'Daftar laporan banjir, genangan air jalan, rob pesisir, dan kondisi darurat warga Kota Semarang yang terverifikasi secara real-time.',
    url: 'https://kotaku-siaga.vercel.app/laporan',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Laporan Banjir Warga Kota Semarang | KotaKu Siaga',
    description:
      'Daftar laporan banjir, genangan air jalan, rob pesisir, dan kondisi darurat warga Kota Semarang yang terverifikasi secara real-time.',
  },
}

export default function LaporanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
