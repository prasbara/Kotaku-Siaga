import { Suspense } from 'react'
import { EducationModule } from '@/components/education/EducationModule'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edukasi Mitigasi Bencana',
  description: 'Panduan dan tips mitigasi bencana: banjir, longsor, drainase, sampah, dan infrastruktur hijau.',
}

export default function EdukasiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat modul edukasi...</div>}>
      <EducationModule />
    </Suspense>
  )
}
