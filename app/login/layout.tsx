import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk Operator EOC | KotaKu Siaga',
  description:
    'Portal autentikasi petugas dan operator Pusat Kendali Operasi Kebencanaan Kota Semarang.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
