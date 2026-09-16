// ============================================================
// KotaKu Siaga — Deterministic Civic Intelligence Fallback Engine
// Generates factual, grounded situational responses directly from
// CivicContext when OpenRouter LLM is offline or fails validation.
// Zero Hallucination · Strict Non-Contradiction Guarantee.
// ============================================================

import { CivicContext } from './civic-context-builder'

export function generateDeterministicCivicResponse(ctx: CivicContext): string {
  const locName = ctx.location.districtName || 'Kota Semarang'
  const isCityWide = ctx.location.isCityWide
  const intent = ctx.intent.intent

  // 1. EMERGENCY INTENT RESPONSE
  if (ctx.intent.isEmergency || intent === 'EMERGENCY_HELP') {
    return `[PUSAT TANGGAP DARURAT KOTAKU SIAGA]

Bila Anda atau keluarga berada dalam kondisi darurat (terjebak banjir, membutuhkan evakuasi, atau perahu karet):

1. Hubungi segera Call Center BPBD Kota Semarang: 112 (Bebas Pulsa 24 Jam)
2. Petugas EOC dan Tim Reaksi Cepat (TRC) siaga di posko terdekat
3. Bagikan lokasi koordinat terkini Anda kepada petugas melalui panggilan darurat

Status Wilayah Terkait: ${locName}
Waktu Pemantauan: ${ctx.timestampWib}

Langkah Cepat:
- Gunakan tombol [Panggilan Darurat 112] di bawah untuk sambungan instan
- Tetap berada di dataran/lantai yang lebih tinggi dan matikan sekring listrik utama`
  }

  // 2. REPORT GUIDANCE INTENT
  if (intent === 'REPORT_STATUS') {
    return `[PANDUAN LAPORAN KEBENCANAAN WARGA]

KotaKu Siaga menerima laporan resmi warga berbasis bukti digital:

1. Klik tombol [Laporkan Situasi] di bawah atau buka menu Lapor (/laporan/baru)
2. Sertakan foto kondisi lapangan (kamera langsung atau galeri)
3. Sistem akan memverifikasi integritas bukti dengan SHA-256 dan validasi koordinat GPS
4. Laporan yang terverifikasi otomatis dikelompokkan ke dalam radar pemantauan EOC

Wilayah Fokus: ${locName}
Waktu Sistem: ${ctx.timestampWib}`
  }

  // 3. GENERAL EDUCATION / D-RISK EXPLANATION INTENT
  if (intent === 'GENERAL_EDUCATION' || intent === 'CURRENT_RISK') {
    return `[ANALISIS RISIKO & FORMULA D-RISK (ISO 37120)]

Wilayah: ${locName}
Tingkat Kerentanan: ${ctx.risk.riskLevel} (Skor: ${ctx.risk.riskScore.toFixed(1)}/100)
Karakteristik Elevasi: ${ctx.risk.topographicElevation}

Komponen Penilaian Deterministik:
- Urgensi Lapangan (Bobot 35%): Validasi kedalaman genangan & hambatan akses
- Frekuensi Laporan (Bobot 25%): Klaster spasial laporan warga terverifikasi
- Rekam Historis Bencana (Bobot 15%): Arsip DIBI BNPB 2020–2026
- Kepadatan Penduduk (Bobot 15%): Data statistik BPS Kota Semarang
- Kerentanan Lingkungan (Bobot 10%): Elevasi DEM Ina-Geoportal & penurunan tanah

Catatan Penting:
Skor risiko menunjukkan indeks kerentanan spasial dan tingkat kesiapsiagaan infrastruktur wilayah, BUKAN berarti bencana sedang terjadi saat ini.

Sumber Data: D-RISK Engine · BIG Ina-Geoportal · BPS Semarang
Diperbarui: ${ctx.timestampWib}`
  }

  // 4. SITUATIONAL / FLOOD / WEATHER / CCTV STATUS (PRIMARY CORE)
  const isFloodConfirmed = ctx.synthesis.floodConfirmationStatus === 'CONFIRMED'
  const isDataAvailable = ctx.weather.isDataAvailable || ctx.reports.isDataAvailable

  let statusBadge = '[STATUS: BELUM TERKONFIRMASI]'
  let statusSummary = `${locName} saat ini belum memiliki laporan genangan terverifikasi pada data yang tersedia.`

  if (!isDataAvailable) {
    statusBadge = '[STATUS: DATA SEMENTARA TIDAK TERSEDIA]'
    statusSummary = `Data telemetri lapangan untuk ${locName} sedang mengalami pembaruan jaringan.`
  } else if (isFloodConfirmed) {
    statusBadge = `[STATUS: GENANGAN TERVERIFIKASI ±${ctx.reports.maxFloodDepthCm ?? 0} CM]`
    statusSummary = `Terpantau ${ctx.reports.verifiedCount} laporan genangan aktif terverifikasi di kawasan ${locName}.`
  }

  const rainInfo = ctx.weather.isDataAvailable
    ? `${ctx.weather.rainfallRateMmH ?? 0} mm/jam (${ctx.weather.rainfallCategory})`
    : 'Data stasiun cuaca sementara tidak tersedia'

  const cctvInfo = `${ctx.cctv.onlineCount}/${ctx.cctv.totalInDistrict} kamera online aktif (${ctx.cctv.observedFloodCount > 0 ? `${ctx.cctv.observedFloodCount} mendeteksi genangan` : 'kondisi visual normal'})`

  const lines: string[] = [
    `STATUS SITUASI: ${locName.toUpperCase()}`,
    '',
    `Status Pengamatan:`,
    `${statusBadge}`,
    '',
    `${statusSummary}`,
    '',
    `Curah Hujan: ${rainInfo}`,
    `Observasi Genangan: ${ctx.reports.summary}`,
    `CCTV PantauSemar: ${cctvInfo}`,
    `Indeks Risiko Wilayah: ${ctx.risk.riskLevel} (${ctx.risk.riskScore.toFixed(1)}/100)`,
    '',
    `Catatan Sistem:`,
    `${ctx.risk.note}`,
    '',
    `Sumber Data: BMKG · PantauSemar CCTV · Laporan Warga · D-RISK Engine`,
    `Waktu Pemantauan: ${ctx.timestampWib}`,
  ]

  if (isFloodConfirmed && ctx.risk.roadsToAvoid.length > 0) {
    lines.push('')
    lines.push(`Ruas Jalan Diimbau Waspada:`)
    ctx.risk.roadsToAvoid.forEach((r) => lines.push(`- ${r}`))
  }

  return lines.join('\n')
}
