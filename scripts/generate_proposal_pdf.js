const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_HTML = path.join(__dirname, '..', 'proposal_infinitera.html');
const OUTPUT_PDF = path.join(__dirname, '..', 'PROPOSAL_INFINITERA_2.0_KOTAKU_SIAGA.pdf');

// Ensure CSS styles for A4, margins, typography, page breaks, covers, tables, and callouts
const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Proposal Web Development INFINITERA 2.0 - KotaKu Siaga</title>
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
      font-size: 12pt;
      line-height: 1.5;
      color: #111111;
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
      padding: 60px 40px;
      box-sizing: border-box;
      background: linear-gradient(180deg, #ffffff 0%, #faf5fc 100%);
    }

    .cover-header {
      margin-top: 20px;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background-color: #4a154b;
      color: #ffffff;
      font-family: Arial, sans-serif;
      font-size: 11pt;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 25px;
    }

    .cover-title {
      font-family: Arial, sans-serif;
      font-size: 20pt;
      font-weight: 800;
      color: #1d1d1d;
      line-height: 1.3;
      margin-bottom: 15px;
      text-transform: uppercase;
    }

    .cover-subtitle {
      font-family: Arial, sans-serif;
      font-size: 13pt;
      color: #4a154b;
      font-weight: 600;
      line-height: 1.4;
      max-width: 85%;
      margin: 0 auto;
    }

    .cover-theme {
      margin-top: 30px;
      padding: 12px 20px;
      background: #f4ede4;
      border-left: 4px solid #4a154b;
      font-family: Arial, sans-serif;
      font-size: 10.5pt;
      color: #333333;
      text-align: left;
      display: inline-block;
      max-width: 80%;
    }

    .cover-center {
      margin: 40px 0;
    }

    .logo-box {
      width: 130px;
      height: 130px;
      background: #4a154b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 38pt;
      font-weight: bold;
      margin: 0 auto;
      box-shadow: 0 8px 24px rgba(74, 21, 75, 0.25);
      border: 4px solid #f4ede4;
    }

    .cover-footer {
      margin-bottom: 20px;
      font-family: Arial, sans-serif;
    }

    .cover-footer p {
      margin: 4px 0;
      font-size: 11pt;
    }

    .cover-footer .author {
      font-weight: bold;
      color: #1d1d1d;
      font-size: 12pt;
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
      font-size: 16pt;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #4a154b;
      padding-bottom: 5px;
      margin-top: 25px;
      margin-bottom: 15px;
      color: #4a154b;
    }

    h2 {
      font-size: 13pt;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #222222;
    }

    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 8px;
    }

    p {
      margin-top: 0;
      margin-bottom: 12px;
      text-indent: 1.25cm;
    }

    p.no-indent {
      text-indent: 0;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 12px;
      padding-left: 1.25cm;
    }

    li {
      margin-bottom: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0 20px 0;
      font-size: 10pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #777777;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f4ede4;
      color: #4a154b;
      font-weight: bold;
      font-family: Arial, sans-serif;
    }

    tr:nth-child(even) {
      background-color: #faf8f5;
    }

    .table-caption, .figure-caption {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      margin: 10px 0 6px 0;
      color: #333333;
    }

    .diagram-box {
      background: #fdfbf9;
      border: 1px solid #e6e6e6;
      border-left: 4px solid #4a154b;
      padding: 14px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      line-height: 1.35;
      margin: 15px 0;
      white-space: pre-wrap;
      page-break-inside: avoid;
    }

    .callout {
      background-color: #faf5fc;
      border: 1px solid #d9bdde;
      border-left: 5px solid #4a154b;
      padding: 12px 16px;
      margin: 15px 0;
      font-size: 10.5pt;
      page-break-inside: avoid;
    }

    .callout-title {
      font-family: Arial, sans-serif;
      font-weight: bold;
      color: #4a154b;
      margin-bottom: 4px;
    }

    .formula-box {
      background: #ffffff;
      border: 1px solid #dcdcdc;
      border-radius: 6px;
      padding: 12px;
      margin: 15px 0;
      text-align: center;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      font-weight: bold;
      color: #111111;
      page-break-inside: avoid;
    }

    .toc {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.8;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #bbbbbb;
      margin-bottom: 4px;
    }

    .toc-title {
      background: #ffffff;
      padding-right: 5px;
    }

    .toc-page {
      background: #ffffff;
      padding-left: 5px;
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
      <div class="cover-subtitle">KOTAKU SIAGA: PLATFORM CIVIC EMERGENCY & FLOOD INTELLIGENCE BERBASIS MULTI-SOURCE DATA FUSION DAN AUDIT DETERMINISTIK ISO 37120 UNTUK KETAHANAN KOTA SEMARANG</div>
      <div class="cover-theme">
        <strong>Subtema:</strong><br>
        1. SDG 11 — Kota dan Permukiman yang Berkelanjutan (Target 11.5)<br>
        2. SDG 13 — Penanganan Perubahan Iklim (Target 13.1)
      </div>
    </div>

    <div class="cover-center">
      <div class="logo-box">KS</div>
      <p style="font-family: Arial, sans-serif; font-size: 11pt; color: #4a154b; font-weight: bold; margin-top: 15px; letter-spacing: 1px;">KOTAKU SIAGA SEMARANG</p>
    </div>

    <div class="cover-footer">
      <p>Disusun Oleh:</p>
      <p class="author">TIM PRASBARA</p>
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
      <div class="toc-item"><span class="toc-title"><strong>BAB I PENDAHULUAN</strong></span><span class="toc-page">1</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">1.1 Latar Belakang Masalah</span><span class="toc-page">1</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">1.2 Rumusan Tujuan</span><span class="toc-page">2</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">1.3 Manfaat Solusi</span><span class="toc-page">3</span></div>
      <div class="toc-item"><span class="toc-title"><strong>BAB II PEMBAHASAN</strong></span><span class="toc-page">4</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.1 Penjelasan Platform KotaKu Siaga</span><span class="toc-page">4</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.2 Metode Pengembangan Perangkat Lunak</span><span class="toc-page">5</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.3 Spesifikasi Teknologi dan Alat Bantu (Tech Stack)</span><span class="toc-page">6</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.4 Arsitektur Sistem, Alur Data, dan Alur Pengguna</span><span class="toc-page">8</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.5 Rincian Fitur dan Fungsi Utama</span><span class="toc-page">10</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.6 Analisis Permasalahan dan Rekayasa Solusi</span><span class="toc-page">13</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">2.7 Estimasi Dampak dan Rencana Implementasi Nyata</span><span class="toc-page">14</span></div>
      <div class="toc-item"><span class="toc-title"><strong>BAB III PENUTUP</strong></span><span class="toc-page">16</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">3.1 Kesimpulan</span><span class="toc-page">16</span></div>
      <div class="toc-item" style="padding-left: 20px;"><span class="toc-title">3.2 Saran dan Roadmap Pengembangan Mendatang</span><span class="toc-page">16</span></div>
      <div class="toc-item"><span class="toc-title"><strong>DAFTAR PUSTAKA</strong></span><span class="toc-page">17</span></div>
      <div class="toc-item"><span class="toc-title"><strong>LAMPIRAN</strong></span><span class="toc-page">18</span></div>
    </div>
  </div>

  <!-- BAB I -->
  <div>
    <h1>BAB I — PENDAHULUAN</h1>

    <h2>1.1 Latar Belakang Masalah</h2>
    <p>Kota Semarang sebagai ibu kota Provinsi Jawa Tengah merupakan pusat aglomerasi ekonomi, logistik, dan industri di kawasan pesisir utara (Pantura) Pulau Jawa. Namun, secara geomorfologis dan klimatologis, Kota Semarang menghadapi kerentanan bencana hidrometeorologi yang sangat tinggi. Kota ini terbagi menjadi dua tipologi lanskap yang kontras: kawasan perbukitan di bagian selatan yang rawan longsor, serta dataran aluvial pantai di bagian utara dan timur yang terus-menerus terancam oleh <strong>banjir rob pasang air laut</strong> dan <strong>banjir genangan limpasan air hujan</strong>.</p>
    
    <p>Kajian Badan Penanggulangan Bencana Daerah (BPBD) Kota Semarang dan Badan Informasi Geospasial (BIG) menunjukkan bahwa pesisir Semarang bawah (meliputi Kecamatan Genuk, Semarang Utara, Semarang Timur, dan Tugu) mengalami laju penurunan muka tanah (<em>land subsidence</em>) berkisar antara 4 hingga 10 cm per tahun. Di sisi lain, ketinggian rata-rata daratan di kawasan ini hanya berada pada rentang 0 hingga 2,5 meter di atas permukaan laut (DPL). Ketika pasang astronomis air laut bertemu dengan intensitas hujan tinggi, koridor arteri logistik nasional (seperti Jalan Raya Kaligawe) serta ribuan pemukiman warga lumpuh total berhari-hari.</p>

    <p>Meskipun Pemerintah Kota Semarang telah membangun 70 titik kamera pemantau (<em>PantauSemar</em>) dan sistem rumah pompa polder, <strong>rantai informasi tanggap darurat masyarakat masih terfragmentasi</strong>. Terdapat tiga kelemahan mendasar (<em>gap</em>) pada sistem yang ada saat ini:</p>
    <ol>
      <li><strong>Fragmentasi Data Real-Time:</strong> Warga dan relawan harus memantau berbagai sumber terpisah (portal BMKG, media sosial, grup WhatsApp, dan portal streaming CCTV) untuk mengetahui apakah jalan tertentu aman dilewati atau terendam air.</li>
      <li><strong>Kelemahan Integritas Pelaporan Warga (Crowdsourcing):</strong> Saluran pelaporan publik konvensional sering dihujani spam bot, laporan fiktif, serta manipulasi foto bukti yang tidak dapat diverifikasi secara ilmiah sebelum petugas diterjunkan.</li>
      <li><strong>Subjektivitas Penentuan Skala Prioritas Tanggap Bencana:</strong> Disposisi pompa bergerak dan tim penyelamat kerap didorong oleh tekanan isu viral di media sosial, bukan berdasarkan kalkulasi risiko objektif berbasis kepadatan penduduk, kerentanan elevasi, dan data curah hujan.</li>
    </ol>

    <p>Untuk menyelesaikan masalah struktural tersebut, platform <strong>KotaKu Siaga</strong> dibangun sebagai pusat intelijen kedaruratan warga (<em>Civic Emergency & Flood Intelligence Hub</em>). Platform ini menggabungkan integrasi data terbuka (BMKG, Ina-Geoportal DEM, CCTV PantauSemar), sistem pelaporan warga berintegritas tinggi tanpa kata sandi (<em>Passwordless OTP + SHA-256 Hashing</em>), asisten analitik hidrologi cerdas (<em>Civic AI Copilot</em> dengan guardrail ketat), serta formula audit risiko objektif berbasis standar internasional <strong>ISO 37120</strong>.</p>

    <p>Inovasi ini mendukung langsung tema INFINITERA 2.0, yaitu <em>"Bridging Innovation and Sustainability to Create Meaningful Impact for Future Generations"</em>, khususnya pada subtema <strong>SDG 11 (Kota dan Permukiman yang Berkelanjutan — Target 11.5)</strong> dan <strong>SDG 13 (Penanganan Perubahan Iklim — Target 13.1)</strong>.</p>

    <h2>1.2 Rumusan Tujuan</h2>
    <p>Berdasarkan latar belakang di atas, perancangan platform KotaKu Siaga memiliki tujuan terukur sebagai berikut:</p>
    <ul>
      <li><strong>Tujuan Utama:</strong> Membangun platform web terpadu untuk pemantauan, mitigasi, dan tanggap darurat banjir rob serta bencana hidrometeorologi 16 kecamatan di Kota Semarang secara transparan dan berbasis data nyata (<em>zero fake data</em>).</li>
      <li><strong>Tujuan Pengguna (Warga):</strong> Menyediakan alur pelaporan darurat 4-langkah yang cepat tanpa kewajiban mengingat kata sandi, dilengkapi panduan keselamatan mandiri Tas Siaga Bencana 72 Jam.</li>
      <li><strong>Tujuan Pengguna (Petugas & Operator Posko EOC):</strong> Menyediakan instrumen pemantauan multi-layer (CCTV, radar hujan Doppler, layer angin, klaster laporan warga) serta lembar situasi taktis (<em>Situation Brief</em>) yang dapat langsung dicetak untuk koordinasi lapangan.</li>
      <li><strong>Tujuan Rekayasa Teknologi:</strong> Mengintegrasikan konsep <em>Multi-Source Data Fusion</em>, verifikasi anti-bot Cloudflare Turnstile, kriptografi integritas bukti SHA-256, serta kalkulator deterministik D-RISK v2.4 berbasis formula ISO 37120.</li>
    </ul>

    <h2>1.3 Manfaat Solusi</h2>
    <p>Manfaat yang dihasilkan dari implementasi platform ini dikelompokkan ke dalam empat pilar:</p>
    <ul>
      <li><strong>Bagi Warga Kota Semarang:</strong> Memberikan akses instan terhadap kondisi jalan dan genangan secara visual melalui 70 kamera CCTV live, status curah hujan terkini, serta tombol SOS darurat langsung ke Call Center 112.</li>
      <li><strong>Bagi Pemerintah Daerah (BPBD & DPU Kota Semarang):</strong> Meningkatkan efisiensi alokasi logistik dan pompa air mobile ke titik dengan skor risiko kritis tertinggi berdasarkan data kuantitatif, sekaligus mengeliminasi laporan palsu.</li>
      <li><strong>Bagi Ketahanan Lingkungan dan Iklim:</strong> Mendokumentasikan rekam spasial kejadian banjir secara berkala untuk evaluasi jangka panjang tata ruang kota dan sistem polder drainase.</li>
      <li><strong>Bagi Perkembangan Rekayasa Web:</strong> Menjadi bukti bahwa aplikasi kebencanaan publik dapat dibangun secara tangguh, aman, berperforma tinggi, dan tetap memiliki estetika visual yang tenang serta mudah diakses (<em>accessible</em>).</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- BAB II -->
  <div>
    <h1>BAB II — PEMBAHASAN</h1>

    <h2>2.1 Penjelasan Platform KotaKu Siaga</h2>
    <p><strong>KotaKu Siaga</strong> (URL: <code>https://kotaku-siaga.vercel.app</code>) adalah platform web <em>Progressive Civic Web Application</em> yang dirancang khusus untuk memitigasi risiko banjir dan kedaruratan lingkungan di Kota Semarang. Nilai proposisi utama (<em>value proposition</em>) dari platform ini adalah:</p>
    
    <div class="callout">
      <div class="callout-title">Nilai Proposisi Inti: "Truthful Civic Intelligence"</div>
      KotaKu Siaga menyatukan pengamatan visual 70 kamera CCTV pemerintah, telemetri cuaca BMKG/WMO, dan laporan warga terotentikasi ke dalam satu peta spasial terpadu, yang diolah menggunakan formula deterministik ISO 37120 tanpa rekayasa angka (zero dummy incidents).
    </div>

    <p>Platform melayani dua aktor utama: <strong>Masyarakat Umum</strong> yang membutuhkan informasi jalur bebas banjir serta kanal pelaporan yang mudah, dan <strong>Operator Kedaruratan (BPBD/DPU)</strong> yang memerlukan gambaran taktis operasional wilayah.</p>

    <div class="table-caption">Tabel 2.1 Ringkasan Halaman dan Rute Aplikasi KotaKu Siaga</div>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Rute Halaman</th>
          <th style="width: 25%;">Nama Modul</th>
          <th style="width: 55%;">Fungsi dan Implementasi Aktual</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/</code></td>
          <td>Beranda (Landing Page)</td>
          <td>Ringkasan status risiko 16 kecamatan, telemetri cuaca maritim real-time, status darurat kota, dan navigasi cepat.</td>
        </tr>
        <tr>
          <td><code>/peta</code></td>
          <td>Peta Spasial GIS Terpadu</td>
          <td>Peta Leaflet multi-layer (partikel angin Windy, radar presipitasi, gelombang laut, 70 CCTV PantauSemar, klaster insiden).</td>
        </tr>
        <tr>
          <td><code>/laporan/baru</code></td>
          <td>Wizard Pelaporan Warga</td>
          <td>Formulir pelaporan 4-langkah: Identitas, Bukti Foto (SHA-256) & GPS, Detail Genangan, serta Verifikasi Email OTP Supabase + Turnstile.</td>
        </tr>
        <tr>
          <td><code>/priorities/[area]</code></td>
          <td>Audit Deterministik ISO 37120</td>
          <td>Kajian risiko per kecamatan dengan 6 parameter kuantitatif dan fitur Cetak Lembar Situasi Taktis (A4 PDF).</td>
        </tr>
        <tr>
          <td><code>/edukasi</code></td>
          <td>Literasi Ketahanan Iklim</td>
          <td>Modul sains hidrologi/drainase Semarang, kuis interaktif, dan Checklist Mandiri Tas Siaga 72 Jam (LocalStorage).</td>
        </tr>
        <tr>
          <td><code>/dashboard</code></td>
          <td>Dashboard Taktis Operator</td>
          <td>Manajemen tiket laporan, pengelompokan insiden spasial, kontrol 16 layer taktis, dan verifikasi status operasional pompa.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.2 Metode Pengembangan Perangkat Lunak</h2>
    <p>Pengembangan sistem KotaKu Siaga mengadopsi metodologi <strong>Iterative Domain-Driven Development</strong> yang menggabungkan siklus Agile dengan prinsip rekayasa sistem kebencanaan (<em>Disaster Informatics Lifecycle</em>). Tahapan yang dijalankan meliputi:</p>
    
    <ol>
      <li><strong>Tahap 1 — Analisis Kebutuhan Hidrometeorologi:</strong> Mengidentifikasi karakteristik topografi Semarang (kontur 0–350m DPL), titik rawan rob Kali Tenggang & Kali Sringin, serta katalog data terbuka BMKG dan Diskominfo Kota Semarang.</li>
      <li><strong>Tahap 2 — Perancangan Arsitektur Multi-Tier:</strong> Merancang pemisahan ketat antara Server Components (rendering cepat SEO-friendly), Client Boundaries (interaktivitas Leaflet & formulir dinamis), serta Edge API Routes yang aman.</li>
      <li><strong>Tahap 3 — Implementasi & Integrasi Data:</strong> Membangun integrasi REST API cuaca Open-Meteo, parser streaming CCTV PantauSemar, modul Supabase Auth OTP, Cloudflare Turnstile, dan multi-key AI provider pool.</li>
      <li><strong>Tahap 4 — Security Hardening & Audit Kriptografi:</strong> Menerapkan hashing SHA-256 pada upload berkas di peramban, Row Level Security (RLS) PostgreSQL, sanitasi input/output AI guardrail, dan rate limiter per IP.</li>
      <li><strong>Tahap 5 — Pengujian & Final Hardening:</strong> Menjalankan kompilasi statis 60 rute (<em>Next.js build PASS</em>), pengujian responsivitas dari viewport 320px hingga 1920px, serta penghapusan data dummy untuk integritas rilis produksi.</li>
    </ol>

    <div class="page-break"></div>

    <h2>2.3 Spesifikasi Teknologi dan Alat Bantu (Tech Stack)</h2>
    <p>Pemilihan teknologi didasarkan pada keandalan operasional, kecepatan komputasi tanpa ketergantungan server berat (<em>CPU-friendly & serverless compatible</em>), serta standar keamanan modern:</p>

    <div class="table-caption">Tabel 2.2 Spesifikasi Teknologi dan Implementasi Aktual KotaKu Siaga</div>
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Kategori</th>
          <th style="width: 25%;">Teknologi / Library</th>
          <th style="width: 53%;">Implementasi dan Peran dalam Sistem</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Frontend Core</strong></td>
          <td>Next.js 15.5 (App Router), React 19, TypeScript</td>
          <td>Fondasi aplikasi web modern dengan Server-Side Rendering (SSR) dan Static Site Generation (SSG) pada 16 halaman kecamatan.</td>
        </tr>
        <tr>
          <td><strong>Styling & UI</strong></td>
          <td>Tailwind CSS, Lucide React Icons</td>
          <td>Desain antarmuka responsif dengan palet tematik Aubergine (#4a154b), Emerald (#007a5a), Coral Red (#cc4117), dan Surface (#fdfbf9).</td>
        </tr>
        <tr>
          <td><strong>Geospasial / GIS</strong></td>
          <td>Leaflet.js, React-Leaflet, OpenStreetMap</td>
          <td>Peta interaktif penampil 70 CCTV, visualisasi layer angin/hujan/gelombang, klastering laporan warga, dan marker rumah pompa.</td>
        </tr>
        <tr>
          <td><strong>Database & Storage</strong></td>
          <td>Supabase PostgreSQL, Supabase Storage</td>
          <td>Penyimpanan data relasional laporan bencana, indeks geospasial (Latitude/Longitude), audit log, dan berkas foto bukti lapangan.</td>
        </tr>
        <tr>
          <td><strong>Autentikasi & Anti-Bot</strong></td>
          <td>Supabase Auth (Email OTP), Cloudflare Turnstile</td>
          <td>Verifikasi identitas pelapor tanpa kata sandi via kode 6-digit email serta proteksi anti-spam bot tanpa captcha visual yang mengganggu.</td>
        </tr>
        <tr>
          <td><strong>Integritas Bukti</strong></td>
          <td>Web Cryptography API (SubtleCrypto SHA-256)</td>
          <td>Pembangkitan hash unik 64-karakter heksadesimal pada foto di sisi klien untuk menjamin keaslian bukti visual di persidangan/posko.</td>
        </tr>
        <tr>
          <td><strong>Artificial Intelligence</strong></td>
          <td>OpenRouter AI (Multi-Key Pool) & Heuristic Engine</td>
          <td>Asisten dialog hidrologi (Civic AI Copilot) dengan guardrail domain ketat dan cadangan analitik heuristik lokal saat jaringan API terganggu.</td>
        </tr>
        <tr>
          <td><strong>Sumber Data Cuaca</strong></td>
          <td>Open-Meteo API, WMO Telemetry, BMKG Maritim</td>
          <td>Penyedia telemetri curah hujan per jam, kecepatan angin, kelembaban, tutupan awan, dan tinggi gelombang pesisir Semarang.</td>
        </tr>
        <tr>
          <td><strong>Hosting & CI/CD</strong></td>
          <td>Vercel Edge Network, GitHub Actions</td>
          <td>Penyedia deployment serverless global dengan otomatisasi build pada setiap pembaruan branch <code>main</code>.</td>
        </tr>
      </tbody>
    </table>

    <h2>2.4 Arsitektur Sistem, Alur Data, dan Alur Pengguna</h2>

    <h3>A. Diagram Arsitektur Sistem Multi-Tier</h3>
    <p class="no-indent">Arsitektur KotaKu Siaga menerapkan pola <em>Decoupled Multi-Tier Cloud Architecture</em> yang menjaga pemisahan wewenang antara layer penyajian, logika bisnis, dan sumber data:</p>

    <div class="diagram-box">
+-----------------------------------------------------------------------------------+
|                            CLIENT LAYER (Browser / Mobile)                        |
|  - Next.js Client Components (Leaflet GIS, 4-Step Wizard, Turnstile, SubtleCrypto)|
|  - Responsive Viewport (320px - 1920px) | LocalStorage (Tas Siaga 72 Jam)         |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / TLS 1.3
                                           v
+-----------------------------------------------------------------------------------+
|                        NEXT.JS 15 EDGE & APP SERVER LAYER                         |
|  - Route Middleware (RBAC, Rate Limiting 60 req/min, IP Inspection)               |
|  - Server-Side Rendering (SSG 16 Kecamatan, ISR Weather Telemetry Cache)          |
|  - Server Actions & Edge API Routes (/api/reports, /api/weather, /api/ai/chat)    |
+-------------------+----------------------+--------------------+-------------------+
                    |                      |                    |
        +-----------v-----------+          |          +---------v----------+
        | SUPABASE DATA TIER    |          |          | EXTERNAL API TIER  |
        | - PostgreSQL DB + RLS |          |          | - Open-Meteo / WMO |
        | - Supabase Auth (OTP) |          |          | - 70 CCTV Streams  |
        | - Evidence Storage    |          |          | - OpenRouter AI    |
        +-----------------------+          |          +--------------------+
                                           |
                               +-----------v------------+
                               | DETERMINISTIC ENGINE   |
                               | - D-RISK ISO 37120     |
                               | - Spatial Clust. (1km) |
                               | - Heuristic Fallback   |
                               +------------------------+
    </div>

    <div class="page-break"></div>

    <h3>B. Alur Pengguna (User Flow) Pelaporan Warga</h3>
    <p class="no-indent">Alur pelaporan dirancang seringkas mungkin untuk kondisi darurat namun tetap memiliki verifikasi bertingkat:</p>

    <div class="diagram-box">
[Warga Membuka Halaman /laporan/baru]
                 |
                 v
[LANGKAH 1: Identitas Pelapor]
(Input Nama, Email Aktif, Nomor HP - Terlindungi Privasi)
                 |
                 v
[LANGKAH 2: Bukti Foto & Koordinat Lokasi]
(Pilih Foto Kamera -> Komputasi Kriptografis SHA-256 di Browser -> Ambil GPS / Pilih Kecamatan)
                 |
                 v
[LANGKAH 3: Rincian Genangan]
(Pilih Kategori: Banjir Rob / Genangan Hujan / Saluran Tersumbat -> Estimasi Ketinggian Air)
                 |
                 v
[LANGKAH 4: Verifikasi Kemanusiaan & Identitas]
(Lolos Cloudflare Turnstile Anti-Bot -> Kirim 6-Digit OTP ke Email -> Verifikasi Kode)
                 |
                 v
[SISTEM: Pemrosesan Backend & Pengelompokan Spasial]
(Validasi Server -> Hashing Check -> Pencocokan Radius 1.0 km -> Terbitkan Tiket Resmi)
                 |
                 v
[LAYAR SUKSES: Tiket Laporan SMG-2026-XXXX Diterbitkan + Tautan Pantau di Peta]
    </div>

    <h2>2.5 Rincian Fitur dan Fungsi Utama</h2>

    <h3>1. Peta Spasial Risiko Interaktif Multi-Layer (<code>/peta</code>)</h3>
    <p><strong>Tujuan:</strong> Memberikan visibilitas menyeluruh terkait sebaran risiko banjir, titik genangan aktual, dan fasilitas drainase.</p>
    <p><strong>Implementasi:</strong> Dibangun menggunakan Leaflet GIS dengan kontrol multi-layer berkontras tinggi. Menampilkan 6 layer tematik: Peta Spasial GIS (titik pompa, polder, laporan), Aliran Angin Permukaan (10m), Radar Presipitasi Hujan, Gelombang Pasang Laut Jawa, Tutupan Awan, dan Garis Tekanan Barometrik.</p>
    <p><strong>Kamera CCTV PantauSemar:</strong> Mengintegrasikan 70 kamera streaming Diskominfo Kota Semarang yang diklasifikasikan ke dalam zona genangan jalan protokol dan polder rumah pompa.</p>

    <h3>2. Wizard Pelaporan Warga Tanpa Kata Sandi (<code>/laporan/baru</code>)</h3>
    <p><strong>Tujuan:</strong> Mengakomodasi pelaporan kejadian darurat dari warga secara cepat tanpa hambatan registrasi akun tradisional.</p>
    <p><strong>Keamanan Kriptografis:</strong> Menggunakan Web Cryptography API untuk menghitung hash SHA-256 dari foto yang diunggah secara instan di peramban. Hash ini dicatat ke dalam database untuk mencegah rekayasa bukti visual.</p>
    <p><strong>Supabase Email OTP:</strong> Verifikasi kepemilikan email aktif menggunakan token 6-digit atau Magic Link, memastikan pelapor adalah warga nyata dan dapat dihubungi oleh petugas lapangan.</p>

    <h3>3. Formula Audit Deterministik D-RISK v2.4 ISO 37120 (<code>/priorities/[area]</code>)</h3>
    <p><strong>Tujuan:</strong> Menghilangkan keputusan berbasis opini atau isu viral dalam penentuan skala prioritas penanganan genangan.</p>
    <p><strong>Implementasi Matematis:</strong> Skor prioritas dihitung menggunakan formula multi-kriteria berbasis data objektif:</p>

    <div class="formula-box">
      $$\text{Skor Prioritas} = (0.35 \times U) + (0.25 \times L) + (0.15 \times H) + (0.15 \times P) + (0.10 \times K)$$
    </div>

    <p>Di mana komponen formula terdiri atas:</p>
    <ul>
      <li><strong>$U$ (Field Urgency — 35%):</strong> Tingkat kedalaman air terlaporkan dan dampak terhadap akses transportasi utama.</li>
      <li><strong>$L$ (Report Frequency — 25%):</strong> Kepadatan klaster laporan warga terverifikasi dalam radius 1,0 km dalam 7 hari terakhir.</li>
      <li><strong>$H$ (Historical Disaster — 15%):</strong> Indeks rekam historis bencana dari katalog Data Informasi Bencana Indonesia (DIBI BNPB 2020–2026).</li>
      <li><strong>$P$ (Population Density — 15%):</strong> Angka kepadatan penduduk per kilometer persegi berdasarkan sensus resmi BPS Kota Semarang.</li>
      <li><strong>$K$ (Environmental Vulnerability — 10%):</strong> Elevasi topografi rata-rata (Ina-Geoportal DEM NAS) dan laju penurunan tanah kawasan pesisir.</li>
    </ul>

    <p>Halaman ini dilengkapi fitur <strong>Cetak Lembar Situasi Taktis (A4 PDF)</strong> berbasis CSS <code>@media print</code> untuk mempermudah distribusi lembar analisis ke posko lapangan.</p>

    <div class="page-break"></div>

    <h3>4. Civic AI Copilot dengan Guardrail & Fallback Heuristik (<code>ChatAssistant.tsx</code>)</h3>
    <p><strong>Tujuan:</strong> Menyediakan asisten pintar berbasis model bahasa besar (LLM) untuk menginterpretasikan telemetri hidrologi Semarang bagi warga awam.</p>
    <p><strong>Sistem Guardrail:</strong> Modul <code>guardrails.ts</code> melakukan klasifikasi intensi secara otomatis pada layer aplikasi. Kueri di luar konteks kebencanaan Semarang (seperti politik, hiburan, atau upaya injeksi prompt sistem) secara otomatis ditolak dengan pesan standar yang sopan.</p>
    <p><strong>Offline Deterministic Fallback Engine:</strong> Jika terjadi kendala kuota atau putusnya koneksi ke API OpenRouter (HTTP 429/5xx), server beralih secara halus ke mesin heuristik lokal berbasis data pengetahuan hidrologi Semarang, menjamin platform tidak pernah menghasilkan pesan galat kosong.</p>

    <h3>5. Checklist Mandiri Tas Siaga Bencana 72 Jam (<code>/edukasi</code>)</h3>
    <p><strong>Tujuan:</strong> Meningkatkan kesiapsiagaan mandiri keluarga saat menghadapi peringatan dini banjir.</p>
    <p><strong>Implementasi:</strong> Memuat 10 item logistik esensial (Air minum, Makanan kaleng, Obat pribadi, P3K, Senter, Power bank, Dokumen kedap air, Pakaian hangat, Peluit darurat, Masker) dengan indikator progres visual dan penyimpanan lokal (<em>LocalStorage</em>) demi menjaga privasi keluarga.</p>

    <h2>2.6 Analisis Permasalahan dan Rekayasa Solusi</h2>

    <div class="table-caption">Tabel 2.3 Matriks Permasalahan Lapangan dan Rekayasa Solusi Teknis</div>
    <table>
      <thead>
        <tr>
          <th style="width: 20%;">Tantangan Lapangan</th>
          <th style="width: 25%;">Dampak Potensial</th>
          <th style="width: 25%;">Solusi Rekayasa</th>
          <th style="width: 30%;">Implementasi Kode Sumber</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Spam & Bot Pelaporan Palsu</strong></td>
          <td>Beban kerja posko darurat terbuang untuk memeriksa lokasi yang tidak terendam banjir.</td>
          <td>Integrasi Cloudflare Turnstile pada level klien dan verifikasi token kriptografis di sisi server.</td>
          <td><code>components/ui/TurnstileWidget.tsx</code> & validasi <code>challenges.cloudflare.com</code> pada <code>/api/reports</code>.</td>
        </tr>
        <tr>
          <td><strong>Manipulasi Bukti Foto Lapangan</strong></td>
          <td>Penggunaan foto lama atau foto dari internet untuk klaim bantuan darurat palsu.</td>
          <td>Kalkulasi hash kriptografi SHA-256 pada array buffer gambar sebelum berkas dikirim ke server.</td>
          <td><code>crypto.subtle.digest('SHA-256')</code> pada modul <code>app/laporan/baru/page.tsx</code>.</td>
        </tr>
        <tr>
          <td><strong>Ketergantungan API AI Eksternal</strong></td>
          <td>Platform macet atau tidak responsif saat kuota OpenRouter habis di tengah bencana.</td>
          <td>Multi-key pool dengan failover otomatis ke mesin pengetahuan heuristik deterministik lokal.</td>
          <td>Pool 4 API Key di <code>lib/ai/openrouter.ts</code> dan fungsi <code>generateLocalHeuristicResponse</code> di <code>/api/ai/chat</code>.</td>
        </tr>
        <tr>
          <td><strong>Pelaporan Terisolasi (Single Reporter)</strong></td>
          <td>Petugas ragu mengambil tindakan pada laporan tunggal tanpa bukti pembanding.</td>
          <td>Algoritma Spatial Haversine Clustering untuk mengelompokkan laporan dalam radius 1,0 km.</td>
          <td>Kalkulasi klaster spasial pada <code>lib/spatial/corroboration.ts</code> dan penandaan status multi-pelapor.</td>
        </tr>
        <tr>
          <td><strong>Aksesibilitas Tombol Darurat Mobile</strong></td>
          <td>Tombol SOS tertutup oleh widget chat asisten pada layar ponsel kecil.</td>
          <td>Arsitektur penataan z-index dan posisi safe-area bertingkat (SOS di <code>z-50</code>, Copilot di <code>z-40</code>).</td>
          <td>Tata letak bertingkat collision-free pada <code>ChatAssistant.tsx</code> dan <code>SOSModal.tsx</code>.</td>
        </tr>
      </tbody>
    </table>

    <div class="page-break"></div>

    <h2>2.7 Estimasi Dampak dan Rencana Implementasi Nyata</h2>
    <p>Penerapan platform KotaKu Siaga dirancang untuk memberikan kontribusi nyata terhadap target pembangunan berkelanjutan pemerintah daerah:</p>

    <div class="table-caption">Tabel 2.4 Matriks Kontribusi Terhadap Target Pembangunan Berkelanjutan (SDG)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 25%;">Target SDG Resmi</th>
          <th style="width: 35%;">Indikator Keberhasilan</th>
          <th style="width: 40%;">Kontribusi Langsung KotaKu Siaga</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>SDG 11.5</strong><br>(Pengurangan Dampak Kerugian Bencana Perkotaan)</td>
          <td>Penurunan waktu tanggap darurat (<em>response time</em>) pompa bergerak dan evakuasi warga terdampak.</td>
          <td>Mempersingkat verifikasi situasi dari berjam-jam menjadi hitungan menit melalui integrasi 70 streaming CCTV dan klaster laporan terverifikasi OTP.</td>
        </tr>
        <tr>
          <td><strong>SDG 13.1</strong><br>(Penguatan Ketahanan & Kapasitas Adaptasi Iklim)</td>
          <td>Peningkatan literasi kesiapsiagaan warga pesisir terhadap ancaman rob dan kenaikan air laut.</td>
          <td>Menyediakan modul edukasi sains hidrologi Semarang, simulasi visual polder, dan panduan kesiapan Tas Siaga Bencana 72 Jam.</td>
        </tr>
      </tbody>
    </table>

    <h3>Rencana Diseminasi dan Uji Lapangan Bertahap</h3>
    <p>Untuk memastikan platform dapat beroperasi secara nyata, tim telah menyusun tiga tahapan diseminasi:</p>
    <ul>
      <li><strong>Fase 1 (Pilot Project — 3 Bulan):</strong> Sosialisasi dan uji coba di kawasan rawan rob utama (Kecamatan Genuk dan Semarang Utara) bekerja sama dengan forum relawan bencana tingkat kelurahan (FPRB).</li>
      <li><strong>Fase 2 (Integrasi Sistem Pemkot — 6 Bulan):</strong> Pengintegrasian webhook API laporan langsung ke sistem dashboard operasional BPBD Kota Semarang dan Dinas Pekerjaan Umum (DPU).</li>
      <li><strong>Fase 3 (Ekspansi 16 Kecamatan — 12 Bulan):</strong> Penerapan menyeluruh untuk pemantauan potensi longsor di Semarang atas (Gombel, Candisari, Gunungpati) serta genangan di seluruh jalan protokol kota.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- BAB III -->
  <div>
    <h1>BAB III — PENUTUP</h1>

    <h2>3.1 Kesimpulan</h2>
    <p>Platform <strong>KotaKu Siaga</strong> hadir sebagai wujud nyata penerapan teknologi web modern untuk menyelesaikan permasalahan bencana hidrometeorologi menahun di Kota Semarang. Dengan mengedepankan prinsip <em>Truthful Civic Intelligence</em>, platform ini berhasil menjawab tiga tantangan utama sistem penanganan bencana konvensional:</p>
    <ol>
      <li>Mengintegrasikan data terfragmentasi (telemetri atmosfer terbuka, 70 CCTV PantauSemar, dan model elevasi digital Ina-Geoportal) ke dalam satu peta interaktif berkinerja tinggi.</li>
      <li>Menyediakan saluran pelaporan darurat warga tanpa kata sandi yang terlindungi dari spam bot melalui Cloudflare Turnstile serta memiliki integritas bukti melalui kriptografi SHA-256.</li>
      <li>Menerapkan formula deterministik D-RISK v2.4 berbasis ISO 37120 untuk pengambilan keputusan alokasi pompa air dan personel secara transparan, akuntabel, dan bebas dari bias viralitas media sosial.</li>
    </ol>
    <p>Seluruh fitur yang dijabarkan dalam proposal ini telah terimplementasi secara penuh pada repositori kode sumber dan dapat diuji secara langsung pada tautan produksi <code>https://kotaku-siaga.vercel.app</code> dengan 0 kesalahan kompilasi (<em>build clean</em>).</p>

    <h2>3.2 Saran dan Rencana Pengembangan Mendatang</h2>
    <p>Untuk meningkatkan kapabilitas sistem pada iterasi pengembangan berikutnya, tim merencanakan pengembangan lanjutan berikut:</p>
    <ul>
      <li><strong>Integrasi Sensor IoT Tinggi Muka Air (TMA) Berbiaya Rendah:</strong> Memasang sensor ultrasonik berbasis mikrokontroler ESP32/LoRaWAN pada saluran kolektor sekunder yang terhubung langsung ke API telemetri KotaKu Siaga.</li>
      <li><strong>Rute Evakuasi Spasial Dinamis (Dynamic Safe Routing):</strong> Menambahkan algoritma pencarian rute terpendek yang otomatis menghindari ruas jalan yang sedang tergenang air lebih dari 30 cm.</li>
      <li><strong>Integrasi Notifikasi Siaga Berbasis Pesan Instan (WhatsApp Emergency Bot):</strong> Mengirimkan peringatan dini pasang air laut maksimum secara otomatis kepada ketua RW/RT di kawasan pesisir yang terdaftar.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- DAFTAR PUSTAKA -->
  <div>
    <h1>DAFTAR PUSTAKA</h1>
    <ol style="padding-left: 1.25cm; font-size: 11pt; line-height: 1.6;">
      <li>Badan Informasi Geospasial (BIG). (2022). <em>Model Elevasi Digital Nasional (DEMNAS) Lembar Semarang</em>. Ina-Geoportal Indonesia.</li>
      <li>Badan Pusat Statistik (BPS) Kota Semarang. (2025). <em>Kota Semarang Dalam Angka 2025: Statistik Kependudukan dan Geografi Kecamatan</em>. BPS Kota Semarang.</li>
      <li>Badan Meteorologi, Klimatologi, dan Geofisika (BMKG). (2026). <em>Stasiun Meteorologi Maritim Tanjung Emas: Data Pengamatan Pasang Surut dan Curah Hujan Harian</em>. BMKG Republik Indonesia.</li>
      <li>Badan Penanggulangan Bencana Daerah (BPBD) Kota Semarang. (2024). <em>Kajian Risiko Bencana (KRB) Kota Semarang 2024–2028</em>. Dokumen Resmi Pemkot Semarang.</li>
      <li>Cloudflare, Inc. (2025). <em>Cloudflare Turnstile: Privacy-Preserving Alternative to CAPTCHA</em>. Cloudflare Developer Documentation.</li>
      <li>International Organization for Standardization (ISO). (2018). <em>ISO 37120: Sustainable Cities and Communities — Indicators for City Services and Quality of Life</em>. Geneva: ISO.</li>
      <li>Open-Meteo GmbH. (2026). <em>Open-Meteo Weather Forecast API Documentation: High-Resolution Atmospheric Models (ECMWF & GFS)</em>. Open-Meteo Open Data.</li>
      <li>Supabase, Inc. (2026). <em>Supabase Architecture, PostgreSQL Row Level Security (RLS), and Passwordless Email OTP Authentication</em>. Supabase Documentation.</li>
      <li>Vercel, Inc. (2026). <em>Next.js 15 App Router: Server Components, Streaming, and Edge API Routes</em>. Vercel Engineering Guides.</li>
      <li>World Meteorological Organization (WMO). (2021). <em>Guidelines on Multi-Hazard Early Warning Systems (MHEWS)</em>. WMO-No. 1255. Geneva.</li>
    </ol>
  </div>

  <div class="page-break"></div>

  <!-- LAMPIRAN -->
  <div>
    <h1>LAMPIRAN</h1>

    <h2>Lampiran 1: Tautan Repositori dan Rilis Produksi</h2>
    <ul>
      <li><strong>Tautan Website Produksi (Deployment):</strong> <a href="https://kotaku-siaga.vercel.app">https://kotaku-siaga.vercel.app</a></li>
      <li><strong>Tautan Repositori GitHub Publik:</strong> <a href="https://github.com/prasbara/Kotaku-Siaga">https://github.com/prasbara/Kotaku-Siaga</a></li>
      <li><strong>Branch Rilis Utama:</strong> <code>main</code> (Commit ID: <code>349d3ad</code>)</li>
    </ul>

    <h2>Lampiran 2: Akun Demo Pengujian Dewan Juri</h2>
    <p>Untuk menguji antarmuka operator posko dan fitur pelaporan warga, juri dapat menggunakan parameter berikut:</p>
    <ul>
      <li><strong>Pengujian Pelaporan Warga:</strong> Buka <code>/laporan/baru</code>, masukkan nama, email aktif penguji, unggah sembarang foto, dan masukkan kode OTP yang masuk ke inbox email (atau gunakan email berakhiran <code>@infinitera.test</code>).</li>
      <li><strong>Pengujian Peta Multi-Layer:</strong> Buka <code>/peta</code>, pilih dropdown katalog lapisan untuk beralih antara GIS, Aliran Angin, Radar Hujan, dan streaming 70 kamera CCTV.</li>
      <li><strong>Pengujian Cetak Lembar Situasi:</strong> Buka <code>/priorities/genuk</code> dan klik tombol <em>"Cetak Lembar Situasi (A4)"</em>.</li>
    </ul>

    <h2>Lampiran 3: Skema Tabel Basis Data Utama (Supabase PostgreSQL)</h2>
    <div class="diagram-box">
-- Tabel 1: Laporan Kedaruratan Warga
CREATE TABLE citizen_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_code VARCHAR(32) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  urgency VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  reporter_name VARCHAR(150) NOT NULL,
  reporter_email VARCHAR(255) NOT NULL,
  reporter_phone VARCHAR(50) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  photo_sha256 VARCHAR(64),
  cluster_id UUID REFERENCES incident_clusters(id),
  status VARCHAR(30) DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel 2: Klaster Spasial Kejadian Terverifikasi (Radius 1.0 km)
CREATE TABLE incident_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_code VARCHAR(32) UNIQUE NOT NULL,
  centroid_lat NUMERIC(9,6) NOT NULL,
  centroid_lng NUMERIC(9,6) NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  independent_reporters INT DEFAULT 1,
  corroborated_by_cctv BOOLEAN DEFAULT FALSE,
  severity_level VARCHAR(20) DEFAULT 'SEDANG',
  status VARCHAR(30) DEFAULT 'ACTIVE',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf8');
console.log('HTML proposal written successfully to: ' + OUTPUT_HTML);

// Generate PDF using Microsoft Edge headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${OUTPUT_PDF}" --no-pdf-header-footer "${OUTPUT_HTML}"`;

console.log('Executing PDF compilation via Edge...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF compiled successfully to: ' + OUTPUT_PDF);
  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`PDF File Size: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`);
} catch (err) {
  console.error('Failed to compile PDF via Edge:', err);
  process.exit(1);
}
