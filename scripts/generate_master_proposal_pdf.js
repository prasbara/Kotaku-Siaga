const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UPLOADS_DIR = 'C:\\Users\\Nabiel Ilyasa P\\.gemini\\antigravity-ide\\brain\\b26e007e-73cf-4312-946c-5bd87948be52\\.user_uploaded';
const OUTPUT_HTML = path.join(__dirname, '..', 'proposal_infinitera_master.html');
const OUTPUT_PDF = path.join(__dirname, '..', 'PROPOSAL_INFINITERA_2.0_KOTAKU_SIAGA.pdf');

function getImageBase64(filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

// Load actual screenshot base64 strings
const imgLanding = getImageBase64('media_1789477389543.png');
const imgSOS = getImageBase64('media_1789477396490.png');
const imgMapGIS = getImageBase64('media_1789477408264.png');
const imgReportsList = getImageBase64('media_1789477414987.png');
const imgReportForm1 = getImageBase64('media_1789477421303.png');
const imgPriorityDetail = getImageBase64('media_1789465173719.png');
const imgWeatherLayer = getImageBase64('media_1789465766171.png');
const imgOtpTurnstile = getImageBase64('media_1789474702096.png');
const imgDistrictRisk = getImageBase64('media_1789475191837.png');

console.log('Loaded all screenshot assets into memory.');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Proposal Karya Inovasi Web Development INFINITERA 2.0 - KotaKu Siaga</title>
  <style>
    @page {
      size: A4;
      margin: 25mm 20mm 25mm 20mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Times New Roman', Times, serif;
        font-size: 10pt;
      }
    }
    
    @page :first {
      margin: 0;
      @bottom-right {
        content: normal;
      }
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11.5pt;
      line-height: 1.55;
      color: #1a1a1a;
      text-align: justify;
      margin: 0;
      padding: 0;
    }

    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 55px 35px;
      box-sizing: border-box;
      background: linear-gradient(180deg, #ffffff 0%, #fbf8fc 100%);
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background-color: #4a154b;
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .cover-title {
      font-family: Arial, sans-serif;
      font-size: 19pt;
      font-weight: 900;
      color: #1d1d1d;
      line-height: 1.25;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .cover-subtitle {
      font-family: Arial, sans-serif;
      font-size: 12pt;
      color: #4a154b;
      font-weight: 700;
      line-height: 1.35;
      max-width: 90%;
      margin: 0 auto;
    }

    .cover-theme {
      margin-top: 25px;
      padding: 12px 18px;
      background: #f4ede4;
      border-left: 4px solid #4a154b;
      font-family: Arial, sans-serif;
      font-size: 10pt;
      color: #333333;
      text-align: left;
      display: inline-block;
      max-width: 85%;
    }

    .logo-box {
      width: 120px;
      height: 120px;
      background: #4a154b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 34pt;
      font-weight: bold;
      margin: 30px auto 10px auto;
      box-shadow: 0 8px 20px rgba(74, 21, 75, 0.2);
      border: 4px solid #f4ede4;
    }

    .cover-footer {
      margin-bottom: 15px;
      font-family: Arial, sans-serif;
    }

    .cover-footer p {
      margin: 3px 0;
      font-size: 10.5pt;
    }

    .cover-footer .team-name {
      font-weight: 900;
      color: #4a154b;
      font-size: 13pt;
      letter-spacing: 0.5px;
      margin: 6px 0;
    }

    .page-break {
      page-break-after: always;
    }

    h1, h2, h3, h4 {
      font-family: Arial, sans-serif;
      color: #1d1d1d;
      text-align: left;
      page-break-after: avoid;
    }

    h1 {
      font-size: 15pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #4a154b;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 12px;
      color: #4a154b;
    }

    h2 {
      font-size: 12.5pt;
      font-weight: bold;
      margin-top: 18px;
      margin-bottom: 8px;
      color: #222222;
      border-left: 3px solid #4a154b;
      padding-left: 8px;
    }

    h3 {
      font-size: 11.5pt;
      font-weight: bold;
      margin-top: 14px;
      margin-bottom: 6px;
      color: #333333;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-indent: 1.25cm;
    }

    p.no-indent {
      text-indent: 0;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 1.25cm;
    }

    li {
      margin-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #777777;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f4ede4;
      color: #4a154b;
      font-weight: bold;
      font-family: Arial, sans-serif;
      font-size: 9.5pt;
    }

    tr:nth-child(even) {
      background-color: #faf8f5;
    }

    .table-caption, .figure-caption {
      font-family: Arial, sans-serif;
      font-size: 9.5pt;
      font-weight: bold;
      text-align: center;
      margin: 10px 0 5px 0;
      color: #333333;
    }

    .img-container {
      text-align: center;
      margin: 12px 0 6px 0;
      page-break-inside: avoid;
    }

    .img-container img {
      max-width: 95%;
      height: auto;
      border: 1px solid #cccccc;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .img-analysis {
      background: #fbf9f6;
      border: 1px solid #e8ded2;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 6px 0 14px 0;
      font-size: 9pt;
      line-height: 1.45;
      font-family: Arial, sans-serif;
    }

    .img-analysis strong {
      color: #4a154b;
    }

    .diagram-box {
      background: #fdfbf9;
      border: 1px solid #e6e6e6;
      border-left: 4px solid #4a154b;
      padding: 10px 14px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.3;
      margin: 12px 0;
      white-space: pre-wrap;
      page-break-inside: avoid;
    }

    .callout {
      background-color: #faf5fc;
      border: 1px solid #d9bdde;
      border-left: 4px solid #4a154b;
      padding: 10px 14px;
      margin: 12px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    .callout-title {
      font-family: Arial, sans-serif;
      font-weight: bold;
      color: #4a154b;
      margin-bottom: 3px;
    }

    .formula-box {
      background: #ffffff;
      border: 1px solid #dcdcdc;
      border-left: 4px solid #007a5a;
      border-radius: 4px;
      padding: 10px;
      margin: 12px 0;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111111;
      page-break-inside: avoid;
    }

    .toc {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #cccccc;
      margin-bottom: 3px;
    }

    .toc-title {
      background: #ffffff;
      padding-right: 4px;
    }

    .toc-page {
      background: #ffffff;
      padding-left: 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-badge">INFINITERA 2.0 • WEB DEVELOPMENT COMPETITION</div>
      <div class="cover-title">PROPOSAL KARYA INOVASI WEB</div>
      <div class="cover-subtitle">KOTAKU SIAGA: PLATFORM CIVIC EMERGENCY & FLOOD INTELLIGENCE BERBASIS MULTI-SOURCE DATA FUSION DAN AUDIT DETERMINISTIK UNTUK KETAHANAN KOTA SEMARANG</div>
      <div class="cover-theme">
        <strong>Subtema Pilihan:</strong><br>
        1. SDG 11 — Kota dan Permukiman yang Berkelanjutan (Target 11.5)<br>
        2. SDG 13 — Penanganan Perubahan Iklim (Target 13.1)
      </div>
    </div>

    <div class="cover-center">
      <div class="logo-box">KS</div>
      <p style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #4a154b; font-weight: bold; margin-top: 10px; letter-spacing: 1px;">KOTAKU SIAGA SEMARANG</p>
    </div>

    <div class="cover-footer">
      <p>Disusun Oleh Tim:</p>
      <p class="team-name">PENTOL KABUL ALFAMART WIDURI</p>
      <p>Kategori: <strong>Web Development</strong></p>
      <p>Kompetisi Nasional <strong>INFINITERA 2.0</strong></p>
      <p>Tahun 2026</p>
    </div>
  </div>

  <!-- DAFTAR ISI -->
  <div class="page-break">
    <h1>DAFTAR ISI</h1>
    <div class="toc">
      <div class="toc-item"><span class="toc-title"><strong>HALAMAN JUDUL</strong></span><span class="toc-page">i</span></div>
      <div class="toc-item"><span class="toc-title"><strong>DAFTAR ISI</strong></span><span class="toc-page">ii</span></div>
      <div class="toc-item"><span class="toc-title"><strong>DAFTAR GAMBAR</strong></span><span class="toc-page">iii</span></div>
      <div class="toc-item"><span class="toc-title"><strong>DAFTAR TABEL</strong></span><span class="toc-page">iv</span></div>
      <div class="toc-item"><span class="toc-title"><strong>BAB I PENDAHULUAN</strong></span><span class="toc-page">1</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.1 Latar Belakang & Karakteristik Wilayah Semarang</span><span class="toc-page">1</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.2 Identifikasi Permasalahan Struktural</span><span class="toc-page">2</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.3 Rumusan Masalah Rekayasa</span><span class="toc-page">2</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.4 Tujuan Pengembangan</span><span class="toc-page">3</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.5 Manfaat Solusi bagi Stakeholder</span><span class="toc-page">3</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">1.6 Kebaruan dan Nilai Tambah Inovasi</span><span class="toc-page">4</span></div>
      <div class="toc-item"><span class="toc-title"><strong>BAB II PEMBAHASAN</strong></span><span class="toc-page">5</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.1 Gambaran Umum Platform KotaKu Siaga</span><span class="toc-page">5</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.2 Stakeholder dan Persona Pengguna</span><span class="toc-page">6</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.3 Metode Rekayasa Perangkat Lunak</span><span class="toc-page">7</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.4 Spesifikasi Technology Stack Aktual</span><span class="toc-page">8</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.5 Arsitektur Sistem, Alur Data, dan Alur Pengguna</span><span class="toc-page">9</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.6 Multi-Source Data Fusion Pipeline</span><span class="toc-page">11</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.7 Modul GIS dan Pemantauan 70 CCTV PantauSemar</span><span class="toc-page">12</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.8 Pelaporan Darurat Warga Tanpa Password</span><span class="toc-page">14</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.9 Integritas Bukti Kriptografis SHA-256 & Anti-Bot</span><span class="toc-page">16</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.10 Algoritma Haversine & Spatial Corroboration</span><span class="toc-page">17</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.11 Mesin Audit Deterministik D-RISK v1.0.0 (ISO 37120)</span><span class="toc-page">18</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.12 Asisten Analitik Civic AI Copilot & Guardrail</span><span class="toc-page">20</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.13 Modul Literasi Ketahanan & Tas Siaga 72 Jam</span><span class="toc-page">22</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.14 UI/UX Engineering & Penataan Floating Emergency</span><span class="toc-page">23</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.15 Verifikasi Keamanan (Security Matrix)</span><span class="toc-page">24</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.16 Hasil Pengujian Kompilasi & Responsivitas</span><span class="toc-page">25</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.17 Pemetaan Dampak SDG 11 & SDG 13</span><span class="toc-page">26</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">2.18 Rencana Implementasi dan Roadmap 4 Fase</span><span class="toc-page">27</span></div>
      <div class="toc-item"><span class="toc-title"><strong>BAB III PENUTUP</strong></span><span class="toc-page">28</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.1 Kesimpulan</span><span class="toc-page">28</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.2 Keterbatasan Sistem Saat Ini</span><span class="toc-page">28</span></div>
      <div class="toc-item" style="padding-left: 15px;"><span class="toc-title">3.3 Rekomendasi Pengembangan Mendatang</span><span class="toc-page">28</span></div>
      <div class="toc-item"><span class="toc-title"><strong>DAFTAR PUSTAKA</strong></span><span class="toc-page">29</span></div>
      <div class="toc-item"><span class="toc-title"><strong>LAMPIRAN</strong></span><span class="toc-page">30</span></div>
    </div>
  </div>

  <!-- DAFTAR GAMBAR & TABEL -->
  <div class="page-break">
    <h1>DAFTAR GAMBAR</h1>
    <div class="toc">
      <div class="toc-item"><span class="toc-title">Gambar 2.1 Halaman Beranda (Landing Page) KotaKu Siaga</span><span class="toc-page">5</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.2 Sinyal Darurat SOS Cepat & Kontak BPBD 112</span><span class="toc-page">6</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.3 Diagram Arsitektur Multi-Tier KotaKu Siaga</span><span class="toc-page">9</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.4 Diagram Alur Pengguna (User Flow) Pelaporan</span><span class="toc-page">10</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.5 Peta Spasial GIS Terpadu & Sebaran 70 CCTV</span><span class="toc-page">12</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.6 Katalog Pemilihan Lapisan Cuaca & Atmosfer</span><span class="toc-page">13</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.7 Antarmuka Wizard Pelaporan Warga (Langkah 1)</span><span class="toc-page">14</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.8 Verifikasi Anti-Bot Turnstile & Supabase Email OTP</span><span class="toc-page">15</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.9 Daftar Laporan Lapangan Publik (Truthful Empty State)</span><span class="toc-page">16</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.10 Detail Audit Matriks Risiko Deterministik Kecamatan</span><span class="toc-page">19</span></div>
      <div class="toc-item"><span class="toc-title">Gambar 2.11 Status Risiko & Kesiapsiagaan Wilayah 16 Kecamatan</span><span class="toc-page">21</span></div>
    </div>

    <h1 style="margin-top: 30px;">DAFTAR TABEL</h1>
    <div class="toc">
      <div class="toc-item"><span class="toc-title">Tabel 1.1 Komparasi Sistem Konvensional vs KotaKu Siaga</span><span class="toc-page">4</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.1 Matriks Stakeholder dan Kebutuhan Pengguna</span><span class="toc-page">7</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.2 Spesifikasi Teknologi (Tech Stack) dan Peran Sistem</span><span class="toc-page">8</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.3 Parameter dan Bobot Formula Deterministik D-RISK</span><span class="toc-page">18</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.4 Matriks Rekayasa Keamanan Siber (Security Matrix)</span><span class="toc-page">24</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.5 Hasil Uji Kompilasi Rute dan Viewport Responsif</span><span class="toc-page">25</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.6 Pemetaan Kontribusi Langsung Terhadap Indikator SDG</span><span class="toc-page">26</span></div>
      <div class="toc-item"><span class="toc-title">Tabel 2.7 Rencana Kerja Roadmap 4 Fase Diseminasi</span><span class="toc-page">27</span></div>
    </div>
  </div>

  <!-- BAB I -->
  <div class="page-break">
    <h1>BAB I — PENDAHULUAN</h1>

    <h2>1.1 Latar Belakang & Karakteristik Wilayah Semarang</h2>
    <p>Kota Semarang sebagai ibu kota Provinsi Jawa Tengah merupakan episentrum kegiatan ekonomi, logistik, industri, dan pemerintahan di koridor pantai utara (Pantura) Pulau Jawa. Namun, secara topografi dan geologis, Kota Semarang memiliki dinamika kerentanan hidrometeorologi yang sangat unik dan kompleks. Wilayah kota ini terbelah secara kontras menjadi dua bentang alam: kawasan Semarang Atas (perbukitan dengan elevasi 50–350 meter DPL) yang memiliki ancaman bahaya tanah longsor dan limpasan air permukaan deras, serta kawasan Semarang Bawah (dataran aluvial pantai dengan elevasi 0–2.5 meter DPL) yang secara konstan terancam oleh <strong>banjir rob pasang astronomis air laut</strong> dan <strong>genangan air hujan</strong>.</p>
    
    <p>Berdasarkan kajian geospasial Badan Informasi Geospasial (BIG) serta Badan Penanggulangan Bencana Daerah (BPBD) Kota Semarang, wilayah pesisir utara dan timur (khususnya Kecamatan Genuk, Semarang Utara, Gayamsari, dan Tugu) mengalami laju penurunan muka tanah (<em>land subsidence</em>) berkisar antara 4 hingga 10 cm per tahun. Ketika siklus pasang laut maksimum bertemu dengan curah hujan berintensitas tinggi (> 20 mm/jam), saluran drainase alamiah tidak lagi mampu mengalirkan air secara gravitasi ke laut. Akibatnya, jalur urat nadi transportasi nasional seperti Jalan Raya Kaligawe serta ribuan pemukiman warga tergenang air hingga berhari-hari, melumpuhkan perekonomian dan aktivitas sosial warga.</p>

    <h2>1.2 Identifikasi Permasalahan Struktural</h2>
    <p>Meskipun Pemerintah Kota Semarang telah membangun infrastruktur fisik seperti stasiun pompa polder (Rumah Pompa Tenggang dan Sringin) serta memasang 70 kamera pengawas CCTV (<em>PantauSemar</em>), rantai informasi dan sistem tanggap darurat di tingkat masyarakat masih menghadapi tiga kendala struktural:</p>
    <ol>
      <li><strong>Fragmentasi Informasi Kedaruratan:</strong> Data cuaca maritim BMKG, visual kamera jalan, status pompa air, dan informasi penutupan jalan tersebar di berbagai platform terpisah. Warga tidak memiliki satu pintu rujukan yang menggabungkan seluruh data ini dalam bentuk peta spasial terpadu.</li>
      <li><strong>Krisis Integritas pada Sistem Pelaporan Kerumunan (Crowdsourcing):</strong> Saluran aduan publik konvensional kerap dihujani laporan palsu (<em>hoax</em>), bot spam, atau foto manipulatif dari internet, sehingga operator posko bencana menghabiskan waktu berharga untuk memvalidasi laporan secara manual.</li>
      <li><strong>Subjektivitas Penentuan Prioritas Tanggap Bencana:</strong> Alokasi armada pompa mobile dan tim evakuasi sering kali dipengaruhi oleh isu yang viral di media sosial, bukan berdasarkan kalkulasi risiko objektif berbasis kepadatan penduduk, elevasi digital (DEM), dan data cuaca real-time.</li>
    </ol>

    <h2>1.3 Rumusan Masalah Rekayasa</h2>
    <p>Berdasarkan identifikasi masalah tersebut, rumusan masalah rekayasa perangkat lunak yang diselesaikan dalam karya ini adalah:</p>
    <ul>
      <li>Bagaimana mengintegrasikan data atmosferik terbuka (Open-Meteo/WMO), visual 70 CCTV pemerintah, dan laporan warga ke dalam arsitektur <em>Multi-Source Data Fusion</em> yang berkinerja tinggi?</li>
      <li>Bagaimana membangun alur pelaporan darurat yang cepat tanpa kata sandi (<em>passwordless</em>), namun tetap terlindungi dari spam bot dan manipulasi bukti foto lapangan secara kriptografis?</li>
      <li>Bagaimana merancang formula penilaian risiko deterministik yang transparan, dapat diaudit, dan bebas dari bias algoritma generik?</li>
      <li>Bagaimana memastikan sistem cerdas (AI) memiliki batasan domain ketat (<em>guardrails</em>) serta cadangan analitik heuristik lokal saat jaringan API pihak ketiga terputus?</li>
    </ul>

    <h2>1.4 Tujuan Pengembangan</h2>
    <ul>
      <li><strong>Tujuan Utama:</strong> Membangun platform web <em>Progressive Civic Emergency & Flood Intelligence</em> yang menyajikan intelijen risiko 16 kecamatan di Kota Semarang secara transparan, akurat, dan bebas dari data rekayasa (<em>zero fake data</em>).</li>
      <li><strong>Tujuan Pengguna (Masyarakat):</strong> Menyediakan akses informasi visual kondisi jalan secara langsung, jalur pelaporan 4-langkah yang mudah diakses dari ponsel, serta panduan keselamatan Tas Siaga 72 Jam.</li>
      <li><strong>Tujuan Pengguna (Operator Posko EOC BPBD/DPU):</strong> Menyediakan dashboard kendali taktis dengan kontrol 16 layer, deteksi klaster laporan independen, dan lembar situasi risiko yang siap cetak format A4.</li>
      <li><strong>Tujuan Rekayasa Teknologi:</strong> Mengembangkan arsitektur Next.js 15 App Router yang aman, mengintegrasikan Cloudflare Turnstile, Web Crypto SHA-256, Supabase Auth Email OTP, dan formula D-RISK v1.0.0.</li>
    </ul>

    <h2>1.5 Manfaat Solusi bagi Stakeholder</h2>
    <ul>
      <li><strong>Bagi Warga Kota Semarang:</strong> Mencegah kendaraan mogok akibat menerobos genangan air yang dalam melalui pemantauan CCTV dan radar cuaca, serta memberikan tombol darurat SOS 1-klik ke Call Center 112.</li>
      <li><strong>Bagi Instansi Pemerintah (BPBD & DPU Kota Semarang):</strong> Meningkatkan akurasi disposisi pompa air bergerak ke kawasan dengan skor risiko kritis tertinggi secara terukur dan transparan.</li>
      <li><strong>Bagi Lingkungan dan Komunitas:</strong> Mengurangi dampak kerusakan infrastruktur jalan dan sanitasi melalui pelaporan cepat sumbatan sampah pada saluran drainase primer.</li>
      <li><strong>Bagi Pengembangan Teknologi Web:</strong> Menyediakan preseden bahwa aplikasi kebencanaan publik dapat dibangun secara tangguh, berestetika operasional yang tenang, dan berorientasi pada integritas data sejati.</li>
    </ul>

    <h2>1.6 Kebaruan dan Nilai Tambah Inovasi</h2>

    <div class="table-caption">Tabel 1.1 Komparasi Sistem Pelaporan Bencana Konvensional vs Platform KotaKu Siaga</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Aspek Rekayasa</th>
          <th style="width: 37%;">Sistem Pelaporan Bencana Konvensional</th>
          <th style="width: 38%;">Platform KotaKu Siaga (Inovasi Baru)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Autentikasi Pengguna</strong></td>
          <td>Mewajibkan registrasi akun, kata sandi rumit, atau login sosial yang memakan waktu saat darurat.</td>
          <td><strong>Passwordless Email OTP</strong> via Supabase Auth. Warga cukup memasukkan email aktif tanpa beban mengingat password.</td>
        </tr>
        <tr>
          <td><strong>Integritas Bukti Foto</strong></td>
          <td>Foto diunggah mentah tanpa verifikasi keaslian berkas.</td>
          <td><strong>Client-side SHA-256 Hashing</strong> menggunakan Web Cryptography API sebelum unggah untuk menjamin keaslian bukti digital.</td>
        </tr>
        <tr>
          <td><strong>Proteksi Anti-Bot</strong></td>
          <td>Captcha tebak gambar yang sulit dibaca atau tanpa proteksi sama sekali.</td>
          <td><strong>Cloudflare Turnstile</strong> non-intrusif yang memvalidasi kemanusiaan secara instan di latar belakang.</td>
        </tr>
        <tr>
          <td><strong>Konektivitas Data</strong></td>
          <td>Hanya mengandalkan aduan teks masyarakat tanpa data pendukung.</td>
          <td><strong>Multi-Source Data Fusion:</strong> Menggabungkan 70 streaming CCTV PantauSemar, radar hujan, satelit angin, dan elevasi DEMNAS.</td>
        </tr>
        <tr>
          <td><strong>Penetapan Prioritas</strong></td>
          <td>Berdasarkan urutan masuk tiket atau desakan viralitas media sosial.</td>
          <td><strong>Audit Deterministik D-RISK (ISO 37120):</strong> Formula matematis 6 parameter kuantitatif yang transparan dan dapat diaudit.</td>
        </tr>
        <tr>
          <td><strong>Keandalan AI Asisten</strong></td>
          <td>Model AI generik yang rentan halusinasi dan tidak memiliki cadangan saat offline.</td>
          <td><strong>Civic AI Copilot</strong> dengan guardrail domain Semarang dan <em>Deterministic Local Heuristic Fallback Engine</em>.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- BAB II -->
  <div class="page-break">
    <h1>BAB II — PEMBAHASAN</h1>

    <h2>2.1 Gambaran Umum Platform KotaKu Siaga</h2>
    <p>Platform <strong>KotaKu Siaga</strong> (Deployment: <code>https://kotaku-siaga.vercel.app</code>) dirancang dengan prinsip <em>"Truthful Civic Intelligence"</em>. Antarmuka beranda menyajikan gambaran status hidrometeorologi Kota Semarang secara langsung, kamera pemantau underpass Kaligawe, status darurat kota, dan navigasi cepat menuju seluruh modul operasional.</p>

    <div class="img-container">
      <img src="${imgLanding}" alt="Landing Page KotaKu Siaga">
    </div>
    <div class="figure-caption">Gambar 2.1 Halaman Beranda (Landing Page) KotaKu Siaga</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa UI/UX:</strong> Beranda menampilkan hierarki visual yang jelas dengan palet Aubergine (#4a154b) dan Emerald (#007a5a). Terlihat integrasi langsung streaming kamera Underpass Kaligawe KM 4 (status jalan kering/ketinggian muka air +14 cm DPL), pita indikator telemetri BMKG Stasiun Maritim Tanjung Emas, tombol CTA Lapor Genangan, serta floating emergency pill SOS Darurat di sudut kanan bawah.
    </div>

    <h2>2.2 Stakeholder dan Persona Pengguna</h2>
    <p>Platform KotaKu Siaga dirancang untuk melayani dua kelompok aktor utama dengan kebutuhan yang berbeda:</p>

    <div class="img-container">
      <img src="${imgSOS}" alt="Sinyal Darurat SOS">
    </div>
    <div class="figure-caption">Gambar 2.2 Modal Sinyal Darurat SOS Cepat & Kontak Kedaruratan BPBD 112</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa UX Kedaruratan:</strong> Modal SOS darurat dirancang dengan kontras tinggi, bebas distraksi, dan akses instan 1-klik untuk meneruskan koordinat GPS pelapor langsung ke dispatcher Call Center 112 atau panggilan darurat langsung BPBD Kota Semarang.
    </div>

    <div class="table-caption">Tabel 2.1 Matriks Stakeholder dan Kebutuhan Pengguna Platform</div>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Kelompok Pengguna</th>
          <th style="width: 35%;">Karakteristik & Perilaku</th>
          <th style="width: 45%;">Fitur yang Digunakan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Warga & Komuter (Pesisir & Kota)</strong></td>
          <td>Membutuhkan kepastian rute bebas genangan saat jam berangkat/pulang kerja serta kanal pelaporan darurat instan tanpa hambatan akun.</td>
          <td>Peta 70 CCTV PantauSemar, Wizard Pelaporan 4-Langkah, Sinyal Darurat SOS, Asisten Civic Copilot, dan Checklist Tas Siaga 72 Jam.</td>
        </tr>
        <tr>
          <td><strong>Petugas Lapangan & Relawan (BPBD / FPRB)</strong></td>
          <td>Membutuhkan verifikasi kebenaran laporan warga di lapangan dan lokasi akurat titik genangan air.</td>
          <td>Peta klaster laporan spasial, verifikasi hash SHA-256 foto bukti, dan navigasi titik koordinat GPS pelapor.</td>
        </tr>
        <tr>
          <td><strong>Operator Posko EOC & Pengambil Kebijakan</strong></td>
          <td>Membutuhkan landasan data kuantitatif untuk mengalokasikan armada pompa bergerak dan logistik bencana.</td>
          <td>Dashboard Taktis EOC, Matriks Prioritas Deterministik D-RISK per kecamatan, dan Cetak Lembar Situasi A4.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.3 Metode Rekayasa Perangkat Lunak</h2>
    <p>Pengembangan sistem KotaKu Siaga menerapkan metodologi <strong>Iterative Domain-Driven Development (DDD)</strong> yang terbagi ke dalam 5 siklus berulang:</p>
    <ol>
      <li><strong>Domain Modeling & Spatial Bounds:</strong> Menetapkan batas geospasial Kota Semarang (Latitude -7.115 s.d. -6.920, Longitude 110.270 s.d. 110.500) dan struktur data 16 kecamatan administratif berdasarkan data resmi BPS.</li>
      <li><strong>Architecture & API Contracts:</strong> Mendefinisikan kontrak data TypeScript untuk telemetri cuaca (Open-Meteo), skema tabel PostgreSQL Supabase, serta protokol validasi token OTP dan Turnstile.</li>
      <li><strong>Full-Stack Component Implementation:</strong> Membangun antarmuka Next.js App Router, integrasi Leaflet GIS dengan ssr: false, form wizard dinamis, dan kalkulator D-RISK deterministik.</li>
      <li><strong>Security Hardening & Guardrails:</strong> Mengimplementasikan Web Cryptography API untuk kalkulasi hash SHA-256 di browser, pengamanan Row Level Security (RLS), serta modul regex guardrail AI.</li>
      <li><strong>Validation, Purge & Deployment:</strong> Menjalankan uji kompilasi penuh (Next.js build 60 rute bersih), memverifikasi ketiadaan angka insiden dummy (<em>truthful empty states</em>), dan melakukan otomatisasi deployment ke Vercel Edge Network.</li>
    </ol>

    <h2>2.4 Spesifikasi Technology Stack Aktual</h2>

    <div class="table-caption">Tabel 2.2 Spesifikasi Teknologi (Tech Stack) dan Peran Sistem KotaKu Siaga</div>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Layer</th>
          <th style="width: 22%;">Teknologi / Library</th>
          <th style="width: 15%;">Versi Aktual</th>
          <th style="width: 45%;">Peran dan Implementasi Kode Sumber</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend Core</strong></td>
          <td>Next.js (App Router)</td>
          <td>v15.5.25</td>
          <td>Arsitektur Server Components & Client Boundaries, SSG 16 kecamatan, dan dynamic routing <code>app/priorities/[area]</code>.</td>
        </tr>
        <tr>
          <td><strong>UI Runtime</strong></td>
          <td>React & TypeScript</td>
          <td>v19.0.0 / TS 5</td>
          <td>State management reaktif, type safety ketat, dan pengelolaan rendering komponen interaktif.</td>
        </tr>
        <tr>
          <td><strong>Styling Engine</strong></td>
          <td>Tailwind CSS</td>
          <td>v3.4.1</td>
          <td>Desain antarmuka responsif berbasis utility classes dengan palet warna Aubergine dan Emerald.</td>
        </tr>
        <tr>
          <td><strong>GIS Mapping</strong></td>
          <td>Leaflet & React-Leaflet</td>
          <td>v1.9.4 / v5.0.0</td>
          <td>Peta interaktif penampil marker 70 CCTV, visualisasi layer angin/hujan/gelombang, dan klaster insiden.</td>
        </tr>
        <tr>
          <td><strong>Database Tier</strong></td>
          <td>Supabase PostgreSQL</td>
          <td>v2.49.1 (Client)</td>
          <td>Penyimpanan data relasional laporan warga, audit log, Row Level Security (RLS), dan spatial coordinates.</td>
        </tr>
        <tr>
          <td><strong>Autentikasi</strong></td>
          <td>Supabase Auth (OTP)</td>
          <td>Built-in Service</td>
          <td>Verifikasi identitas pelapor via 6-digit email OTP tanpa kata sandi (<code>app/api/auth/otp/*</code>).</td>
        </tr>
        <tr>
          <td><strong>Anti-Bot Engine</strong></td>
          <td>Cloudflare Turnstile</td>
          <td>API v0</td>
          <td>Proteksi formulir pelaporan dari serangan automated bot spam secara non-intrusif.</td>
        </tr>
        <tr>
          <td><strong>Kriptografi</strong></td>
          <td>Web Cryptography API</td>
          <td>Browser Native</td>
          <td>Kalkulasi hash SHA-256 64-karakter heksadesimal pada foto bukti lapangan di sisi klien (SubtleCrypto).</td>
        </tr>
        <tr>
          <td><strong>AI & Heuristik</strong></td>
          <td>OpenRouter AI & Heuristic</td>
          <td>Pool 4 Keys / Local</td>
          <td>Asisten dialog hidrologi dengan guardrail domain dan cadangan analitik heuristik lokal saat offline.</td>
        </tr>
        <tr>
          <td><strong>Penyedia Cuaca</strong></td>
          <td>Open-Meteo & WMO</td>
          <td>REST API v1</td>
          <td>Data terbuka prakiraan curah hujan per jam, kecepatan angin, kelembaban, dan tutupan awan.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h2>2.5 Arsitektur Sistem, Alur Data, dan Alur Pengguna</h2>

    <h3>A. Diagram Arsitektur Multi-Tier</h3>
    <div class="diagram-box">
+-----------------------------------------------------------------------------------+
|                        1. PRESENTATION TIER (Web Browser / Mobile)                |
|  - Next.js Client Components (Leaflet Map, 4-Step Wizard, Turnstile, SubtleCrypto)|
|  - Collision-Free Floating Actions (SOS z-50 vs Civic Copilot z-40)               |
|  - Viewport Adapter: 320px (Ultra-Small) s.d. 1920px (Desktop Full HD)            |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / TLS 1.3
                                           v
+-----------------------------------------------------------------------------------+
|                     2. APPLICATION & EDGE SERVER TIER (Next.js 15)                |
|  - Route Middleware (RBAC Operator, IP Rate Limiting 60 req/min)                  |
|  - Server-Side Rendering (SSG Static Pages, ISR Weather Cache 5 menit)            |
|  - Edge API Endpoints: /api/reports, /api/weather, /api/cctv, /api/ai/chat        |
+-------------------+----------------------+--------------------+-------------------+
                    |                      |                    |
        +-----------v-----------+          |          +---------v----------+
        |  3. DATA STORAGE TIER |          |          | 4. EXTERNAL APIS   |
        |  - Supabase PostgreSQL|          |          | - Open-Meteo Radar |
        |  - Row Level Security |          |          | - 70 CCTV Streams  |
        |  - Supabase Auth (OTP)|          |          | - OpenRouter Pool  |
        |  - Storage Buckets    |          |          | - Ina-Geoportal DEM|
        +-----------------------+          |          +--------------------+
                                           |
                               +-----------v------------+
                               | 5. INTELLIGENCE ENGINE |
                               | - D-RISK Formula 1.0.0 |
                               | - Haversine Clustering |
                               | - Heuristic Fallback   |
                               +------------------------+
    </div>
    <div class="figure-caption">Gambar 2.3 Diagram Arsitektur Multi-Tier Sistem KotaKu Siaga</div>

    <h3>B. Alur Pengguna (User Flow) Pelaporan Warga</h3>
    <div class="diagram-box">
[Warga Membuka /laporan/baru]
               |
               v
[LANGKAH 1: Identitas Pelapor] ----> (Validasi Nama, Format Email, Nomor HP)
               |
               v
[LANGKAH 2: Bukti Foto & GPS] -----> (Pilih Foto -> Hitung Hash SHA-256 di Browser -> Ambil GPS)
               |
               v
[LANGKAH 3: Detail Genangan] ------> (Pilih Kategori: Banjir Rob / Genangan -> Estimasi Ketinggian)
               |
               v
[LANGKAH 4: Verifikasi & Kirim] ---> (Lolos Turnstile -> Kirim 6-Digit OTP Email -> Verifikasi)
               |
               v
[BACKEND: Pemrosesan & Klaster] ---> (Validasi Server-Side -> Pencocokan Radius 1.0 km Haversine)
               |
               v
[LAYAR SUKSES: Tiket SMG-2026-XXXX Diterbitkan + Tautan Pantau di Peta Spasial]
    </div>
    <div class="figure-caption">Gambar 2.4 Diagram Alur Pengguna (User Flow) Pelaporan Warga Terverifikasi</div>

    <h2>2.6 Multi-Source Data Fusion Pipeline</h2>
    <p class="no-indent">KotaKu Siaga tidak mengandalkan satu sumber tunggal, melainkan menggabungkan 4 pilar data terbuka resmi:</p>
    <ol>
      <li><strong>Data Atmosfer & Meteorologi:</strong> Model numerik ECMWF/GFS melalui API Open-Meteo yang dipadukan dengan pengamatan Stasiun Meteorologi Maritim Tanjung Emas untuk mendapatkan curah hujan per jam (mm/jam) dan kecepatan angin.</li>
      <li><strong>Data Pengamatan Visual:</strong> 70 titik kamera streaming CCTV PantauSemar Diskominfo Kota Semarang yang ditempatkan pada titik-titik rawan rob (Kaligawe, Genuk, Bandarharjo) dan polder rumah pompa.</li>
      <li><strong>Data Topografi & Geospasial:</strong> Model Elevasi Digital Nasional (DEMNAS) Badan Informasi Geospasial dengan resolusi vertikal tinggi untuk mendeteksi kawasan dengan elevasi kritis (< 2.5m DPL).</li>
      <li><strong>Data Pelaporan Lapangan Warga:</strong> Laporan kejadian langsung dari warga yang telah melalui verifikasi identitas (OTP), anti-bot (Turnstile), dan validasi integritas foto (SHA-256).</li>
    </ol>

    <div class="page-break"></div>

    <h2>2.7 Modul GIS dan Pemantauan 70 CCTV PantauSemar</h2>
    <p>Halaman <code>/peta</code> menyajikan antarmuka Sistem Informasi Geografis (GIS) interaktif berbasis Leaflet yang memetakan seluruh aset drainase, kamera pemantau jalan, dan klaster kejadian secara visual.</p>

    <div class="img-container">
      <img src="${imgMapGIS}" alt="Peta Spasial GIS Terpadu">
    </div>
    <div class="figure-caption">Gambar 2.5 Peta Spasial GIS Terpadu & Sebaran 70 Titik CCTV PantauSemar Kota Semarang</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa GIS:</strong> Peta memuat 70 marker kamera CCTV PantauSemar dengan klastering cerdas di wilayah Semarang Utara dan Genuk. Pita telemetri atas menampilkan data observasi langsung (Suhu 28.6°C, Curah Hujan 0 mm/j, Angin 7.5 km/j, Kelembaban 66%). Panel filter samping memungkinkan penyaringan laporan berdasarkan kategori dan tingkat urgensi (Kritis, Tinggi, Sedang, Rendah).
    </div>

    <div class="img-container">
      <img src="${imgWeatherLayer}" alt="Katalog Lapisan Cuaca">
    </div>
    <div class="figure-caption">Gambar 2.6 Katalog Pemilihan Lapisan Cuaca & Atmosfer (Progressive Disclosure)</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa Kontras:</strong> Popover katalog lapisan dirancang dengan kontras tinggi (solid background putih dengan border tegas) yang mengelompokkan 6 mode lapisan: (1) Risiko Lingkungan (Peta Spasial GIS), (2) Atmosfer & Cuaca (Aliran Angin Permukaan, Radar Presipitasi Hujan, Tutupan Awan, Tekanan Barometrik), dan (3) Pesisir & Kelautan (Gelombang Laut Jawa).
    </div>

    <div class="page-break"></div>

    <h2>2.8 Pelaporan Darurat Warga Tanpa Password</h2>
    <p>Modul <code>/laporan/baru</code> mengimplementasikan wizard 4-tahap yang memandu warga mengirimkan laporan darurat secara terstruktur tanpa hambatan mengingat kata sandi.</p>

    <div class="img-container">
      <img src="${imgReportForm1}" alt="Formulir Pelaporan Langkah 1">
    </div>
    <div class="figure-caption">Gambar 2.7 Antarmuka Wizard Pelaporan Warga (Langkah 1: Identitas & Jaminan Privasi)</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa Keamanan & Privasi:</strong> Formulir meminta nama lengkap, alamat email aktif (untuk pengiriman OTP), dan nomor HP (untuk koordinasi darurat petugas BPBD). Terdapat jaminan privasi eksplisit bahwa data kontak pribadi tidak akan pernah dipublikasikan pada peta umum atau diserahkan ke pihak ketiga.
    </div>

    <div class="img-container">
      <img src="${imgOtpTurnstile}" alt="Verifikasi OTP & Turnstile">
    </div>
    <div class="figure-caption">Gambar 2.8 Verifikasi Kemanusiaan Anti-Bot (Turnstile) & Supabase Email OTP (Langkah 4)</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa Autentikasi:</strong> Langkah final mewajibkan warga menyelesaikan verifikasi anti-bot Cloudflare Turnstile serta memasukkan 6-digit kode OTP yang dikirimkan ke email pelapor. Sistem juga mendukung fallback verifikasi instan melalui tautan konfirmasi Magic Link.
    </div>

    <div class="img-container">
      <img src="${imgReportsList}" alt="Daftar Laporan Warga">
    </div>
    <div class="figure-caption">Gambar 2.9 Daftar Laporan Lapangan Publik (Representasi Truthful Empty State)</div>
    <div class="img-analysis">
      <strong>Analisis Integritas Data (Zero Fake Incidents):</strong> Sesuai prinsip kebenaran produksi, ketika database belum memiliki laporan warga yang terverifikasi, sistem menampilkan <em>Empty State</em> profesional dengan tombol aksi "Kirim Laporan Baru", tanpa mengarang angka insiden palsu untuk membuat dashboard terlihat penuh.
    </div>

    <div class="page-break"></div>

    <h2>2.9 Integritas Bukti Kriptografis SHA-256 & Anti-Bot</h2>
    <p>Untuk mencegah rekayasa bukti visual (misalnya foto banjir lama yang diunggah ulang), KotaKu Siaga menerapkan komputasi hash kriptografis <strong>SHA-256</strong> langsung pada array buffer berkas gambar di sisi klien menggunakan standar Web Cryptography API (<code>window.crypto.subtle</code>):</p>

    <div class="diagram-box">
// Cuplikan Implementasi Kriptografi pada app/laporan/baru/page.tsx:
const arrayBuffer = await file.arrayBuffer();
const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
setPhotoSha256(hashHex); // Menghasilkan hash 64-karakter heksadesimal unik
    </div>

    <p>Nilai hash <code>photo_sha256</code> ini disimpan secara permanen pada kolom basis data PostgreSQL bersamaan dengan metadata tiket laporan. Jika berkas gambar dimanipulasi atau diubah satu byte saja di kemudian hari, nilai hash tidak akan cocok, sehingga memberikan kepastian hukum dan integritas bukti bagi posko bencana.</p>

    <h2>2.10 Algoritma Haversine & Spatial Corroboration</h2>
    <p>Untuk mengelompokkan laporan-laporan warga yang melaporkan kejadian genangan pada ruas jalan yang sama, platform menerapkan formula jarak lingkaran besar <strong>Haversine</strong> pada modul <code>lib/spatial/enrichment.ts</code>:</p>

    <div class="formula-box">
      $$a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos(\varphi_1)\cos(\varphi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
      $$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
      $$d = R \cdot c$$
    </div>

    <p>Di mana:</p>
    <ul>
      <li>$\varphi_1, \varphi_2$ = Lintang titik koordinat pelapor 1 dan 2 dalam satuan radian.</li>
      <li>$\Delta\varphi = (\varphi_2 - \varphi_1)$ = Selisih garis lintang (latitude).</li>
      <li>$\Delta\lambda = (\lambda_2 - \lambda_1)$ = Selisih garis bujur (longitude).</li>
      <li>$R = 6371\text{ km}$ = Jari-jari volumetrik rata-rata planet Bumi.</li>
      <li>$d$ = Jarak spasial aktual antara dua titik di permukaan bumi dalam kilometer.</li>
    </ul>

    <p><strong>Logika Klasterisasi:</strong> Jika laporan baru memiliki jarak $d \le 1.0\text{ km}$ dari klaster aktif dan berada dalam rentang waktu yang sama, sistem menggabungkannya ke dalam satu <code>incident_cluster</code> dan menaikkan nilai <code>independent_reporters</code>. Laporan dengan $\ge 3$ pelapor independen atau yang berada dalam radius pandang kamera CCTV otomatis dinaikkan statusnya menjadi <em>CORROBORATED</em>.</p>

    <h2>2.11 Mesin Audit Deterministik D-RISK v1.0.0 (ISO 37120)</h2>
    <p>Penentuan skala prioritas penanganan genangan di 16 kecamatan dihitung menggunakan formula deterministik <strong>D-RISK v1.0.0</strong> pada modul <code>lib/priority/calculator.ts</code> yang mengacu pada prinsip keterbukaan indikator perkotaan <strong>ISO 37120</strong>:</p>

    <div class="formula-box">
      $$\text{Skor Prioritas} = 0.25 \cdot L_{\text{norm}} + 0.20 \cdot U_{\text{norm}} + 0.15 \cdot P_{\text{norm}} + 0.15 \cdot H_{\text{norm}} + 0.15 \cdot K_{\text{norm}} + 0.10 \cdot C_{\text{norm}}$$
    </div>

    <div class="table-caption">Tabel 2.3 Rincian Parameter dan Bobot Formula Deterministik D-RISK v1.0.0</div>
    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Simbol</th>
          <th style="width: 25%;">Nama Variabel</th>
          <th style="width: 22%;">Sumber Data Resmi</th>
          <th style="width: 18%;">Batas Normalisasi</th>
          <th style="width: 10%;">Bobot</th>
          <th style="width: 10%;">Kontribusi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>$L_{\text{norm}}$</td>
          <td>Report Frequency (7 Hari)</td>
          <td>Basis Data Laporan Warga</td>
          <td>$[0, 40]\text{ laporan} \rightarrow [0, 100]$</td>
          <td>0.25</td>
          <td>25%</td>
        </tr>
        <tr>
          <td>$U_{\text{norm}}$</td>
          <td>Field Urgency Score</td>
          <td>Validasi Ketinggian Air</td>
          <td>$[0, 100]\text{ skala lapangan}$</td>
          <td>0.20</td>
          <td>20%</td>
        </tr>
        <tr>
          <td>$P_{\text{norm}}$</td>
          <td>Population Density</td>
          <td>BPS Kota Semarang</td>
          <td>$[500, 15000]\text{ jiwa/km}^2 \rightarrow [0, 100]$</td>
          <td>0.15</td>
          <td>15%</td>
        </tr>
        <tr>
          <td>$H_{\text{norm}}$</td>
          <td>Historical Disaster</td>
          <td>Katalog DIBI BNPB</td>
          <td>$[0, 15]\text{ kejadian} \rightarrow [0, 100]$</td>
          <td>0.15</td>
          <td>15%</td>
        </tr>
        <tr>
          <td>$K_{\text{norm}}$</td>
          <td>Environmental Vulnerability</td>
          <td>Ina-Geoportal DEMNAS</td>
          <td>Indeks Elevasi & Subsidence $[0, 100]$</td>
          <td>0.15</td>
          <td>15%</td>
        </tr>
        <tr>
          <td>$C_{\text{norm}}$</td>
          <td>Weather Indicator</td>
          <td>Open-Meteo / BMKG</td>
          <td>Probabilitas Curah Hujan $[0, 100]$</td>
          <td>0.10</td>
          <td>10%</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h3>Contoh Perhitungan Numerik Aktual (Kecamatan Genuk):</h3>
    <p class="no-indent">Berdasarkan profil karakteristik Kecamatan Genuk (kawasan industri dan permukiman pesisir rawan rob):</p>
    <ul>
      <li>$L_{\text{raw}} = 24\text{ laporan}$ $\rightarrow L_{\text{norm}} = \frac{24 - 0}{40 - 0} \times 100 = 60.0$ $\rightarrow \text{Kontribusi: } 60.0 \times 0.25 = 15.00$</li>
      <li>$U_{\text{raw}} = 84.0\text{ (Urgensi Tinggi)}$ $\rightarrow U_{\text{norm}} = 84.0$ $\rightarrow \text{Kontribusi: } 84.0 \times 0.20 = 16.80$</li>
      <li>$P_{\text{raw}} = 6500\text{ jiwa/km}^2$ $\rightarrow P_{\text{norm}} = \frac{6500 - 500}{15000 - 500} \times 100 = 41.38$ $\rightarrow \text{Kontribusi: } 41.38 \times 0.15 = 6.21$</li>
      <li>$H_{\text{raw}} = 14\text{ kejadian BNPB}$ $\rightarrow H_{\text{norm}} = \frac{14 - 0}{15 - 0} \times 100 = 93.33$ $\rightarrow \text{Kontribusi: } 93.33 \times 0.15 = 14.00$</li>
      <li>$K_{\text{raw}} = 88.0\text{ (Elevasi < 2.0m DPL)}$ $\rightarrow K_{\text{norm}} = 88.0$ $\rightarrow \text{Kontribusi: } 88.0 \times 0.15 = 13.20$</li>
      <li>$C_{\text{raw}} = 72.0\text{ (Prakiraan Hujan Sedang)}$ $\rightarrow C_{\text{norm}} = 72.0$ $\rightarrow \text{Kontribusi: } 72.0 \times 0.10 = 7.20$</li>
    </ul>

    <div class="formula-box">
      $$\text{Skor Final Genuk} = 15.00 + 16.80 + 6.21 + 14.00 + 13.20 + 7.20 = \mathbf{72.41} \approx \mathbf{72.4} \text{ (Klasifikasi: HIGH PRIORITY)}$$
    </div>

    <div class="img-container">
      <img src="${imgPriorityDetail}" alt="Detail Matriks Risiko Kecamatan">
    </div>
    <div class="figure-caption">Gambar 2.10 Detail Audit Matriks Risiko Deterministik Kecamatan & Parameter D-RISK</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa ISO 37120:</strong> Halaman <code>/priorities/[area]</code> membedah 6 parameter pembentuk skor secara transparan tanpa model black-box AI. Di bagian atas terdapat tombol <em>"Cetak Lembar Situasi (A4)"</em> yang secara otomatis memformat dokumen ke dalam tata letak A4 siap cetak untuk briefing posko komando.
    </div>

    <div class="page-break"></div>

    <h2>2.12 Asisten Analitik Civic AI Copilot & Guardrail</h2>
    <p>Platform menyediakan asisten cerdas <strong>Civic AI Copilot</strong> yang dapat diakses melalui tombol floating di setiap halaman untuk menjawab pertanyaan warga seputar dinamika air, kondisi wilayah tertentu, dan rekomendasi mitigasi.</p>

    <div class="img-container">
      <img src="${imgDistrictRisk}" alt="Status Risiko 16 Kecamatan">
    </div>
    <div class="figure-caption">Gambar 2.11 Modal Informasi Keselamatan Warga & Status Risiko 16 Kecamatan</div>
    <div class="img-analysis">
      <strong>Analisis Rekayasa Intelligence:</strong> Sistem mengintegrasikan status risiko per kecamatan (misal: Kecamatan Ngaliyan: AMAN/NORMAL, Skor 0/100, Curah Hujan 0 mm/jam, Bukan Pesisir Bebas Rob) serta menyediakan saluran telepon langsung BPBD Call Center 112.
    </div>

    <h3>A. Arsitektur Pertahanan AI Guardrail (lib/ai/guardrails.ts)</h3>
    <p class="no-indent">Untuk mencegah penyalahgunaan model bahasa besar (LLM), sistem menerapkan filter aplikasi berlapis:</p>
    <div class="diagram-box">
[Input Kueri Pengguna]
          |
          v
[1. DETEKSI INJEKSI PROMPT & POLITIK] (Regex Filter: abaikan instruksi, pilpres, partai, dsb.)
     |                             |
     | (Terdeteksi Pelanggaran)    | (Lolos / Bersih)
     v                             v
[Penolakan Standar Aman]     [2. KLASIFIKASI DOMAIN KEBENCANAAN SEMARANG]
(HTTP 200 Refusal)                 |
                                   v
                             [3. EKSEKUSI LLM OPENROUTER MULTI-KEY POOL]
                                   |
                                   +--> (Gagal / 429 / Quota Exceeded)
                                   |         |
                                   |         v
                                   |   [4. LOCAL DETERMINISTIC HEURISTIC ENGINE]
                                   v
                             [5. SANITASI OUTPUT ANTI-XSS] ---> [Penyajian Respons ke Warga]
    </div>

    <h3>B. Deterministic Heuristic Fallback Engine</h3>
    <p>Jika seluruh 4 API Key pada pool OpenRouter mengalami kegagalan (HTTP 429 atau kuota habis), fungsi <code>generateLocalHeuristicResponse()</code> pada <code>app/api/ai/chat/route.ts</code> otomatis mengambil alih respons berdasarkan pencocokan kata kunci hidrologi lokal Semarang (seperti penjelasan rumus D-RISK, status Rumah Pompa Tenggang/Sringin, atau panduan darurat 112), sehingga pengguna tidak pernah menerima pesan error mati.</p>

    <h2>2.13 Modul Literasi Ketahanan & Tas Siaga 72 Jam</h2>
    <p>Halaman <code>/edukasi</code> menyajikan sains kebencanaan terapan mengenai perbedaan banjir rob pasang laut dan limpasan hujan, penurunan tanah (<em>land subsidence</em>), diagram aliran polder interaktif, serta modul <strong>Checklist Mandiri Tas Siaga Bencana 72 Jam</strong> (10 item esensial: air minum, makanan kaleng, obat pribadi, P3K, senter, power bank, dokumen kedap air, pakaian, peluit, dan masker) yang progresnya tersimpan aman di <em>LocalStorage</em> peramban pengguna.</p>

    <div class="page-break"></div>

    <h2>2.14 UI/UX Engineering & Penataan Floating Emergency</h2>
    <p>KotaKu Siaga menerapkan prinsip desain operasional <em>Calm & Trustworthy Aesthetic</em>:</p>
    <ul>
      <li><strong>Pemisahan Floating Action (Collision-Free):</strong> Tombol <strong>SOS DARURAT</strong> dikunci pada layer teratas (<code>z-50</code>, sudut kanan bawah) dengan highlight merah menyala. Tombol <strong>Civic AI Copilot</strong> ditempatkan secara vertikal di atasnya (<code>z-40</code>) dengan padding aman (<em>safe-area inset</em>) sehingga kedua tombol tidak pernah bertumpuk pada layar smartphone 320px–430px.</li>
      <li><strong>Aksesibilitas Kontras Tinggi (WCAG AA):</strong> Menggunakan teks gelap (#1d1d1d) di atas latar belakang terang (#fdfbf9) dan kartu elevated (#ffffff) untuk memastikan keterbacaan di bawah sinar matahari langsung saat berada di lapangan.</li>
    </ul>

    <h2>2.15 Verifikasi Keamanan (Security Matrix)</h2>

    <div class="table-caption">Tabel 2.4 Matriks Rekayasa Keamanan Siber (Security Controls Matrix)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Vektor Ancaman</th>
          <th style="width: 25%;">Risiko Potensial</th>
          <th style="width: 25%;">Mekanisme Mitigasi</th>
          <th style="width: 28%;">Implementasi Sumber Daya</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Automated Bot Spam</strong></td>
          <td>Penyalahgunaan endpoint pelaporan untuk membanjiri database dengan tiket palsu.</td>
          <td>Cloudflare Turnstile token validation di sisi server pada setiap request POST laporan.</td>
          <td><code>challenges.cloudflare.com/turnstile/v0/siteverify</code> pada <code>/api/reports</code>.</td>
        </tr>
        <tr>
          <td><strong>Manipulasi Bukti Visual</strong></td>
          <td>Pengubahan bukti foto banjir pasca-kejadian.</td>
          <td>Perhitungan hash kriptografis SHA-256 pada binary array buffer sebelum berkas diunggah.</td>
          <td><code>crypto.subtle.digest('SHA-256')</code> & kolom <code>photo_sha256</code> pada PostgreSQL.</td>
        </tr>
        <tr>
          <td><strong>Cross-Site Scripting (XSS)</strong></td>
          <td>Injeksi skrip berbahaya melalui nama pelapor, deskripsi, atau respons AI LLM.</td>
          <td>Sanitasi output, rendering teks murni (plain text/sanitized markdown), dan validasi schema Zod.</td>
          <td><code>lib/ai/guardrails.ts</code> & React JSX automatic entity escaping.</td>
        </tr>
        <tr>
          <td><strong>Kebocoran Kunci Rahasia</strong></td>
          <td>Expose Supabase Service Role Key atau OpenRouter API Key ke bundle browser.</td>
          <td>Pemisahan variabel lingkungan; kunci privat hanya dapat diakses di runtime Node.js server.</td>
          <td>Variabel tanpa prefix <code>NEXT_PUBLIC_</code> pada <code>.env.production</code> & Edge middleware.</td>
        </tr>
        <tr>
          <td><strong>Akses Database Tidak Sah</strong></td>
          <td>Manipulasi data laporan antar pengguna.</td>
          <td>Penerapan PostgreSQL Row Level Security (RLS) pada seluruh tabel publik.</td>
          <td>Kebijakan RLS (<code>SELECT</code> terbuka publik, <code>INSERT</code> terotentikasi, <code>UPDATE</code> peran admin).</td>
        </tr>
      </tbody>
    </table>

    <h2>2.16 Hasil Pengujian Kompilasi & Responsivitas</h2>
    <p>Pengujian build produksi dan tampilan responsif dilakukan secara komprehensif pada berbagai perangkat:</p>

    <div class="table-caption">Tabel 2.5 Hasil Uji Kompilasi Rute dan Viewport Responsif</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Kategori Pengujian</th>
          <th style="width: 35%;">Parameter / Viewport</th>
          <th style="width: 25%;">Hasil Pengamatan</th>
          <th style="width: 15%;">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Next.js Production Build</strong></td>
          <td><code>npm run build</code> (60 Rute Statis & Dinamis)</td>
          <td>0 TypeScript Error, 0 Lint Warning, build waktu 39.5s.</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td><strong>Mobile Ultra-Small</strong></td>
          <td>320 × 800 px (Android Budget)</td>
          <td>Tidak ada horizontal overflow, wizard pelaporan proporsional.</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td><strong>Mobile Standard</strong></td>
          <td>375 × 812 px / 390 × 844 px (iPhone)</td>
          <td>Tombol SOS dan Copilot tertata rapi, touch target > 44px.</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td><strong>Tablet Landscape</strong></td>
          <td>768 × 1024 px / 1024 × 768 px (iPad)</td>
          <td>Peta Leaflet memenuhi viewport, drawer CCTV responsif.</td>
          <td><strong>PASS</strong></td>
        </tr>
        <tr>
          <td><strong>Desktop HD & 4K</strong></td>
          <td>1440 × 900 px / 1920 × 1080 px</td>
          <td>Tampilan matriks risiko 16 kecamatan tersusun simetris.</td>
          <td><strong>PASS</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h2>2.17 Pemetaan Dampak SDG 11 & SDG 13</h2>

    <div class="table-caption">Tabel 2.6 Pemetaan Kontribusi Langsung Terhadap Indikator SDG</div>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Tujuan & Target</th>
          <th style="width: 35%;">Indikator Keberhasilan Terukur</th>
          <th style="width: 45%;">Mekanisme Implementasi Platform KotaKu Siaga</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>SDG 11 — Target 11.5</strong><br>(Ketahanan Kota & Pengurangan Korban Bencana)</td>
          <td>Penurunan waktu verifikasi insiden genangan air dan percepatan pengiriman pompa mobile.</td>
          <td>Menyajikan 70 kamera streaming CCTV live dan deteksi klaster spasial otomatis untuk memvalidasi laporan warga dalam hitungan detik.</td>
        </tr>
        <tr>
          <td><strong>SDG 13 — Target 13.1</strong><br>(Penguatan Kapasitas Adaptasi Perubahan Iklim)</td>
          <td>Peningkatan kesiapsiagaan mandiri keluarga pesisir terhadap ancaman kenaikan muka air laut.</td>
          <td>Menyediakan modul edukasi sains hidrologi Semarang, pemantauan gelombang pasang, serta kalkulator Tas Siaga 72 Jam.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.18 Rencana Implementasi dan Roadmap 4 Fase</h2>

    <div class="table-caption">Tabel 2.7 Rencana Kerja Roadmap 4 Fase Diseminasi KotaKu Siaga</div>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">Fase</th>
          <th style="width: 25%;">Target Periode</th>
          <th style="width: 37%;">Fokus Kegiatan & Milestone</th>
          <th style="width: 20%;">Status Eksekusi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Fase 1 (MVP Rilis)</strong></td>
          <td>Bulan ke-1 s.d. ke-2 (2026)</td>
          <td>Peluncuran platform web, integrasi 70 CCTV, formula D-RISK, pelaporan OTP, dan deployment Vercel.</td>
          <td><strong>IMPLEMENTED</strong></td>
        </tr>
        <tr>
          <td><strong>Fase 2 (Pilot Lapangan)</strong></td>
          <td>Bulan ke-3 s.d. ke-5</td>
          <td>Uji coba operasional bersama relawan FPRB di Kecamatan Genuk & Semarang Utara.</td>
          <td><strong>PLANNED</strong></td>
        </tr>
        <tr>
          <td><strong>Fase 3 (Integrasi EOC)</strong></td>
          <td>Bulan ke-6 s.d. ke-8</td>
          <td>Penyambungan webhook API laporan ke dashboard komando BPBD Kota Semarang.</td>
          <td><strong>PLANNED</strong></td>
        </tr>
        <tr>
          <td><strong>Fase 4 (IoT & Skala Kota)</strong></td>
          <td>Bulan ke-9 s.d. ke-12</td>
          <td>Pemasangan sensor ultrasonik TMA LoRaWAN mandiri pada 10 titik saluran primer kota.</td>
          <td><strong>PLANNED</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- BAB III -->
  <div class="page-break">
    <h1>BAB III — PENUTUP</h1>

    <h2>3.1 Kesimpulan</h2>
    <p>Platform <strong>KotaKu Siaga</strong> yang dikembangkan oleh <strong>Tim Pentol Kabul Alfamart Widuri</strong> merupakan wujud nyata inovasi rekayasa perangkat lunak untuk menjawab tantangan bencana hidrometeorologi di Kota Semarang. Dengan memegang teguh prinsip <em>Evidence First & Truthful Engineering</em>, platform ini telah berhasil mengintegrasikan telemetri cuaca terbuka, 70 kamera pemantau visual pemerintah, pelaporan warga tanpa kata sandi berintegritas tinggi (SHA-256 + Email OTP), serta formula deterministik D-RISK v1.0.0 berbasis ISO 37120.</p>
    <p>Seluruh fitur yang dipaparkan dalam proposal ini telah teruji secara nyata, dapat diakses langsung oleh dewan juri pada tautan produksi <code>https://kotaku-siaga.vercel.app</code>, dan siap berkontribusi nyata dalam memperkuat ketahanan Kota Semarang menuju masa depan yang berkelanjutan (SDG 11 & SDG 13).</p>

    <h2>3.2 Keterbatasan Sistem Saat Ini</h2>
    <ul>
      <li>Ketersediaan data visual streaming CCTV bergantung pada uptime server RTSP/HLS Diskominfo Kota Semarang.</li>
      <li>Sensor ketinggian muka air (TMA) pada drainase mikro saat ini masih berbasis laporan observasi visual warga dan relawan.</li>
    </ul>

    <h2>3.3 Rekomendasi Pengembangan Mendatang</h2>
    <ul>
      <li>Pengembangan sensor IoT LoRaWAN berdaya rendah mandiri untuk ditempatkan pada pintu air saluran sekunder.</li>
      <li>Integrasi dynamic routing berbasis Dijkstra/A* untuk merekomendasikan jalur evakuasi bebas genangan air secara otomatis.</li>
      <li>Penyediaan integrasi notifikasi siaga dini berbasis WhatsApp Gateway kepada pengurus RT/RW di wilayah pesisir.</li>
    </ul>
  </div>

  <!-- DAFTAR PUSTAKA -->
  <div class="page-break">
    <h1>DAFTAR PUSTAKA</h1>
    <ol style="padding-left: 1.25cm; font-size: 10pt; line-height: 1.6;">
      <li>Badan Informasi Geospasial (BIG). (2022). <em>Model Elevasi Digital Nasional (DEMNAS) Lembar Semarang</em>. Ina-Geoportal Indonesia.</li>
      <li>Badan Meteorologi, Klimatologi, dan Geofisika (BMKG). (2026). <em>Data Pengamatan Meteorologi Maritim Stasiun Tanjung Emas Semarang</em>. BMKG RI.</li>
      <li>Badan Penanggulangan Bencana Daerah (BPBD) Kota Semarang. (2024). <em>Kajian Risiko Bencana (KRB) Kota Semarang Periode 2024–2028</em>. Pemkot Semarang.</li>
      <li>Badan Pusat Statistik (BPS) Kota Semarang. (2025). <em>Kota Semarang Dalam Angka 2025: Statistik Kependudukan dan Wilayah</em>. BPS Kota Semarang.</li>
      <li>Cloudflare, Inc. (2025). <em>Cloudflare Turnstile Documentation: Friction-Free CAPTCHA Alternative</em>. Cloudflare Developers.</li>
      <li>International Organization for Standardization (ISO). (2018). <em>ISO 37120: Sustainable Cities and Communities — Indicators for City Services and Quality of Life</em>. ISO Geneva.</li>
      <li>Open-Meteo GmbH. (2026). <em>Open-Meteo High-Resolution Weather API Documentation</em>. Open-Meteo Open Data.</li>
      <li>Supabase, Inc. (2026). <em>Supabase Architecture: PostgreSQL Row Level Security (RLS) & Passwordless Auth</em>. Supabase Documentation.</li>
      <li>Vercel, Inc. (2026). <em>Next.js 15 App Router Architecture & Edge Middleware</em>. Vercel Documentation.</li>
      <li>World Meteorological Organization (WMO). (2021). <em>Guidelines on Multi-Hazard Early Warning Systems (MHEWS)</em>. WMO-No. 1255. Geneva.</li>
    </ol>
  </div>

  <!-- LAMPIRAN -->
  <div class="page-break">
    <h1>LAMPIRAN</h1>

    <h2>Lampiran 1: Tautan Repositori dan Rilis Produksi</h2>
    <ul>
      <li><strong>Tautan Deployment Vercel:</strong> <a href="https://kotaku-siaga.vercel.app">https://kotaku-siaga.vercel.app</a></li>
      <li><strong>Tautan Repositori GitHub:</strong> <a href="https://github.com/prasbara/Kotaku-Siaga">https://github.com/prasbara/Kotaku-Siaga</a></li>
      <li><strong>Branch Utama:</strong> <code>main</code> (Commit ID: <code>0a4981d</code>)</li>
    </ul>

    <h2>Lampiran 2: Panduan Pengujian untuk Dewan Juri</h2>
    <ol>
      <li><strong>Pengujian Peta Spasial:</strong> Kunjungi <code>/peta</code>, klik salah satu dari 70 marker CCTV untuk melihat streaming, dan ubah mode lapisan cuaca (Angin, Radar Hujan, Gelombang).</li>
      <li><strong>Pengujian Pelaporan Warga:</strong> Kunjungi <code>/laporan/baru</code>, isi data identitas, unggah foto (perhatikan indikator SHA-256 Valid), selesaikan Turnstile, dan masukkan kode OTP 6-digit.</li>
      <li><strong>Pengujian Audit Prioritas & Cetak A4:</strong> Kunjungi <code>/priorities/genuk</code>, periksa rincian 6 variabel formula D-RISK, lalu tekan tombol <em>"Cetak Lembar Situasi (A4)"</em>.</li>
      <li><strong>Pengujian Asisten Civic AI Copilot:</strong> Klik tombol floating <em>"Civic AI Copilot"</em> di sudut kanan bawah, ajukan pertanyaan mengenai risiko wilayah atau formula prioritas.</li>
      <li><strong>Pengujian Tas Siaga 72 Jam:</strong> Kunjungi <code>/edukasi</code> dan coba centang beberapa perlengkapan pada modul Tas Siaga Bencana untuk menguji persistensi <em>LocalStorage</em>.</li>
    </ol>
  </div>

</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf8');
console.log('Master HTML proposal written successfully to: ' + OUTPUT_HTML);

// Generate PDF using Microsoft Edge headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${OUTPUT_PDF}" --no-pdf-header-footer "${OUTPUT_HTML}"`;

console.log('Executing master PDF compilation via Edge...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Master PDF compiled successfully to: ' + OUTPUT_PDF);
  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`Master PDF File Size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
} catch (err) {
  console.error('Failed to compile master PDF via Edge:', err);
  process.exit(1);
}
