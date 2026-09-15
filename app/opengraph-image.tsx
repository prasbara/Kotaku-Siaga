import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'KotaKu Siaga — Pemantauan Risiko Banjir & Rob Kota Semarang'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#2e0036',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar: Badge & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              backgroundColor: '#e01e5a',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: 30,
              fontSize: 18,
              fontWeight: 'bold',
              letterSpacing: '0.05em',
            }}
          >
            SISTEM KESIAPSIAGAAN BENCANA
          </div>
          <div
            style={{
              color: '#f3e8f8',
              fontSize: 18,
              fontWeight: 500,
            }}
          >
            KOTA SEMARANG · JAWA TENGAH
          </div>
        </div>

        {/* Center content: Main Brand & Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            KotaKu Siaga
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#facc15',
              lineHeight: 1.2,
            }}
          >
            Pemantauan Risiko Banjir & Rob Kota Semarang
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#e2d4ea',
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Peta Risiko Spasial · CCTV Realtime · Telemetri Cuaca BMKG · Laporan Warga Lapangan · 16 Kecamatan
          </div>
        </div>

        {/* Bottom bar: Authority & URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '2px solid rgba(255, 255, 255, 0.15)',
            paddingTop: 24,
          }}
        >
          <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
            kotaku-siaga.vercel.app
          </div>
          <div style={{ color: '#f3e8f8', fontSize: 16 }}>
            Terintegrasi BPBD Call Center 112 Kota Semarang
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
