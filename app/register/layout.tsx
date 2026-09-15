import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrasi Petugas Lapangan | KotaKu Siaga',
  description: 'Pendaftaran akun resmi verifikator lapangan kebencanaan Kota Semarang.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
