import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk Petugas & Admin | KotaKu Siaga',
  description: 'Portal autentikasi petugas tanggap darurat dan administrator sistem KotaKu Siaga Semarang.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
