import { Suspense } from 'react'
import { EducationModule } from '@/components/education/EducationModule'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edukasi Kesiapsiagaan Banjir & Rob Semarang | KotaKu Siaga',
  description:
    'Panduan edukasi kesiapsiagaan menghadapi banjir, rob pesisir, dan tanah longsor di Kota Semarang. Tips keselamatan keluarga, tas siaga bencana, dan kontak darurat BPBD 112.',
  alternates: {
    canonical: 'https://kotaku-siaga.vercel.app/edukasi',
  },
  openGraph: {
    title: 'Edukasi Kesiapsiagaan Banjir & Rob Semarang | KotaKu Siaga',
    description:
      'Panduan edukasi kesiapsiagaan menghadapi banjir, rob pesisir, dan tanah longsor di Kota Semarang. Tips keselamatan keluarga, tas siaga bencana, dan kontak darurat BPBD 112.',
    url: 'https://kotaku-siaga.vercel.app/edukasi',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edukasi Kesiapsiagaan Banjir & Rob Semarang | KotaKu Siaga',
    description:
      'Panduan edukasi kesiapsiagaan menghadapi banjir, rob pesisir, dan tanah longsor di Kota Semarang. Tips keselamatan keluarga, tas siaga bencana, dan kontak darurat BPBD 112.',
  },
}

const edukasiFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Apa perbedaan banjir limpasan air hujan dan banjir rob di Kota Semarang?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Banjir limpasan air hujan disebabkan oleh intensitas curah hujan tinggi yang melebihi kapasitas saluran drainase. Sedangkan banjir rob adalah genangan air laut pasang yang melimpas ke daratan pesisir rendah seperti Genuk, Semarang Utara, dan Tugu, yang diperparah oleh penurunan muka tanah (land subsidence).',
      },
    },
    {
      '@type': 'Question',
      name: 'Apa yang harus dipersiapkan dalam Tas Siaga Bencana?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Dokumen penting dalam kantong plastik kedap air, pakaian ganti, senter baterai, kotak P3K dan obat-obatan pribadi, makanan instan tahan lama, air minum botol, peluit darurat, dan uang tunai secukupnya.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa nomor darurat banjir di Kota Semarang?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Layanan darurat bencana Kota Semarang dapat dihubungi melalui BPBD Call Center 112 (Bebas Pulsa 24 Jam) atau posko siaga polder terdekat.',
      },
    },
  ],
}

export default function EdukasiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(edukasiFaqJsonLd) }}
      />
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Memuat modul edukasi...</div>}>
        <EducationModule />
      </Suspense>
    </>
  )
}
