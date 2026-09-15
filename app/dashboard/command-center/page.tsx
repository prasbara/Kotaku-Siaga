import type { Metadata } from 'next'
import { CommandCenterDisplayView } from '@/components/dashboard/CommandCenterDisplayView'

export const metadata: Metadata = {
  title: 'Layar Command Center EOC Semarang | KotaKu Siaga',
  description:
    'Modus display operasional monitor besar, TV ruang kendali, dan proyektor untuk pemantauan realtime situasi kebencanaan Kota Semarang.',
}

export default function DashboardCommandCenterPage() {
  return <CommandCenterDisplayView />
}
