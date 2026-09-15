import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pusat Kendali Kebencanaan Semarang | KotaKu Siaga',
  description:
    'Pusat kendali dan komando darurat bencana hidrometeorologis Kota Semarang. Monitor telemetri cuaca BMKG, CCTV aktif, status polder, dan koordinasi tanggap darurat.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/dashboard',
  },
  openGraph: {
    title: 'Pusat Kendali Kebencanaan Semarang | KotaKu Siaga',
    description:
      'Pusat kendali dan komando darurat bencana hidrometeorologis Kota Semarang. Monitor telemetri cuaca BMKG, CCTV aktif, status polder, dan koordinasi tanggap darurat.',
    url: 'https://kotaku-siaga.vercel.app/dashboard',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pusat Kendali Kebencanaan Semarang | KotaKu Siaga',
    description:
      'Pusat kendali dan komando darurat bencana hidrometeorologis Kota Semarang. Monitor telemetri cuaca BMKG, CCTV aktif, status polder, dan koordinasi tanggap darurat.',
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
