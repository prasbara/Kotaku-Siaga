import Link from 'next/link'

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-12 mt-auto">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Top Header Row with SDGs */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-outline-variant/20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="font-headline font-bold text-xl text-on-surface">KotaKu Siaga</span>
              <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary/30 font-semibold tracking-wider uppercase">
                Civic Intelligence Platform
              </span>
            </div>
            <p className="font-body text-sm text-on-surface-variant max-w-xl">
              Platform kolaboratif monitoring risiko hidrometeorologis, rob pesisir, dan resiliensi iklim Kota Semarang dengan prinsip transparansi data terbuka deterministik.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-surface-container border border-outline-variant/40">
              <span className="material-symbols-outlined text-secondary text-[20px]">location_city</span>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase font-semibold">SDG GOAL 11</span>
                <span className="text-xs text-on-surface font-semibold">Kota Berkelanjutan</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-surface-container border border-outline-variant/40">
              <span className="material-symbols-outlined text-primary text-[20px]">cyclone</span>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-on-surface-variant uppercase font-semibold">SDG GOAL 13</span>
                <span className="text-xs text-on-surface font-semibold">Aksi Iklim Terpadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase text-primary font-semibold tracking-wider">
              Transparansi Data & Audit
            </span>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Formula Deterministik Terbuka & Bebas Biaya API. Seluruh bobot spasial dihitung dengan standar ISO 37120 tanpa monopoli vendor.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-mono text-xs text-on-surface">Uptime Sensor 99.82% Realtime</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase text-primary font-semibold tracking-wider">
              Sumber Data Terbuka
            </span>
            <p className="text-on-surface-variant text-xs leading-relaxed">
              Terintegrasi dengan BMKG Maritim Stasiun Tanjung Emas, OpenStreetMap ID, BNPB InaRISK, BBWS Pemali-Juana, dan Portal Satu Data Kota Semarang.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase text-primary font-semibold tracking-wider">
              Kontak Darurat & Koordinasi
            </span>
            <div className="flex flex-col gap-1 text-xs text-on-surface-variant">
              <span>EOC Call Center: <strong className="text-error font-mono font-bold">(024) 112</strong> (BPBD Semarang)</span>
              <span>Posko Terpadu: Jl. Pemuda No. 148, Balai Kota Semarang</span>
              <span>Kanal WhatsApp Bot: <span className="font-mono text-on-surface">+62 811-2600-112</span></span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-outline-variant/20 gap-4 text-xs text-on-surface-variant">
          <span className="font-mono text-[11px]">
            © 2024–2026 Pemerintah Kota Semarang & Koalisi Komunitas Resiliensi Pesisir.
          </span>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/data" className="hover:text-primary transition-colors">Katalog Dataset</Link>
            <Link href="/priorities" className="hover:text-primary transition-colors">Metodologi & Bobot</Link>
            <Link href="/edukasi" className="hover:text-primary transition-colors">Panduan Evakuasi</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
