'use client'

import React from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight, Lightbulb, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getRecommendedModuleForLocation } from '@/lib/data/education-resilience'

interface WhyDidThisHappenCardProps {
  category?: string
  latitude?: number
  longitude?: number
  locationName?: string
}

export function WhyDidThisHappenCard({
  category = 'banjir',
  latitude = -6.9932,
  longitude = 110.4203,
  locationName = 'Kota Semarang',
}: WhyDidThisHappenCardProps) {
  const recommendedModule = getRecommendedModuleForLocation(latitude, longitude, category)

  const getScientificReason = () => {
    if (category === 'kebakaran') {
      return 'Beban termal, kegagalan isolasi listrik (korsleting), kebocoran tabung gas, atau akumulasi biomassa kering memicu segitiga api (oksigen, panas, bahan bakar) yang dapat membesar cepat jika terpapar hembusan angin perkotaan.'
    }
    if (category === 'pohon_tumbang') {
      return 'Terpaan angin kencang (microburst) dikombinasikan dengan sistem perakaran dangkal atau pelapukan kambium pohon tua menyebabkan kegagalan struktural mekanis batang pohon.'
    }
    if (category === 'longsor' || latitude < -7.03) {
      return 'Kawasan perbukitan rentan terhadap penjenuhan pori tanah akibat akumulasi hujan terus-menerus yang mereduksi gaya geser penahan lereng.'
    }
    if (category === 'drainase_tersumbat' || category === 'sampah') {
      return 'Limpasan air hujan tertahan di badan jalan akibat penyempitan penampang hidrolik got oleh endapan lumpur dan sampah anorganik (bottleneck effect).'
    }
    return 'Kombinasi curah hujan lebat di hulu, pasang astronomi laut Jawa, dan penurunan tanah (land subsidence) menghambat aliran gravitasi alami air menuju laut.'
  }

  const getCivicAction = () => {
    if (category === 'kebakaran') {
      return 'Tutup hidung/mulut dengan kain basah untuk memfilter asap beracun, evakuasi merayap di bawah lapisan asap, hindari lift, amankan tabung gas jika memungkinkan, dan segera hubungi Damkar 113 / 112.'
    }
    if (category === 'pohon_tumbang') {
      return 'Jauhi kabel listrik yang tertimpa pohon untuk menghindari bahaya sengatan (step voltage), pasang tanda peringatan bagi pengendara, dan jangan berteduh di bawah pohon rapuh saat hujan badai.'
    }
    if (category === 'longsor' || latitude < -7.03) {
      return 'Amati tanda retakan dinding/tanah, jauhi lereng terjal, dan segera lapor atau evakuasi jika terdengar gemuruh tebing.'
    }
    if (category === 'drainase_tersumbat' || category === 'sampah') {
      return 'Hindari membuang sampah ke parit, bersihkan inlet saringan jalan, dan koordinasikan kerja bakti pembersihan lumpur.'
    }
    return 'Pantau perkembangan tinggi genangan, amankan instalasi listrik rumah, dan laporkan koordinat presisi via KotaKu Siaga.'
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#fdf9ff] border border-[#eddcf7] flex flex-col gap-3.5 shadow-xs font-sans">
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#4a154b]">
          <Lightbulb className="w-4 h-4 text-[#d97706]" />
          Belajar Dari Kondisi Lapangan
        </div>
        <span className="text-[10px] font-mono text-[#007a5a] bg-[#ebf7f3] px-2 py-0.5 rounded-full font-bold">
          Sains Ketahanan
        </span>
      </div>

      {/* Section 1: Mengapa Ini Terjadi? */}
      <div className="space-y-1">
        <h4 className="text-xs font-mono font-bold uppercase text-[#1d1d1d] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-[#cc4117]" />
          Mengapa Peristiwa Ini Terjadi di {locationName}?
        </h4>
        <p className="text-xs text-[#1d1d1d] leading-relaxed">
          {getScientificReason()}
        </p>
      </div>

      {/* Section 2: Apa Yang Dapat Dilakukan Warga? */}
      <div className="space-y-1 pt-2 border-t border-[#eddcf7]">
        <h5 className="text-xs font-mono font-bold uppercase text-[#007a5a] flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#007a5a]" />
          Apa yang Dapat Dilakukan Warga?
        </h5>
        <p className="text-xs text-[#696969] leading-relaxed">
          {getCivicAction()}
        </p>
      </div>

      {/* Link to Full Educational Module */}
      <div className="pt-2 border-t border-[#eddcf7]">
        <Link
          href={`/edukasi?modul=${recommendedModule.slug}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#4a154b] hover:text-[#611f69] group transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#4a154b]" />
          <span>Pelajari Kajian Ilmiah Lengkap: {recommendedModule.title}</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
