import type { Metadata } from 'next'
import { CommandCenterDisplayView } from '@/components/dashboard/CommandCenterDisplayView'

export const metadata: Metadata = {
  title: 'Layar Command Center EOC Semarang | KotaKu Siaga',
  description:
    'Modus display operasional monitor besar, TV ruang kendali, dan proyektor untuk pemantauan realtime situasi kebencanaan Kota Semarang.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function CommandCenterDirectPage() {
  return <CommandCenterDisplayView />
}
