# KOTAKU SIAGA
**Platform Civic Emergency & Flood Intelligence Hub Berbasis Multi-Source Data Fusion dan Audit Deterministik ISO 37120 untuk Ketahanan Kota Semarang**

> **Kompetisi:** INFINITERA 2.0 — Web Development 2026  
> **Tim Pengembang:** PENTOL KABUL ALFAMART WIDURI  
> **Kategori:** Civic Technology, Disaster Informatics, Climate Resilience & Urban AI

---

## 1. Ringkasan Eksekutif
**KOTAKU SIAGA** adalah platform intelijen kebencanaan dan kedaruratan terpadu yang dirancang khusus untuk memitigasi risiko banjir limpasan, rob air laut, dan genangan kronis di Kota Semarang. 

Platform ini menggabungkan:
1. **Multi-Source Data Fusion (7 Stream Real-time):** Mengintegrasikan prakiraan cuaca & curah hujan BMKG, pasang laut maritim, elevasi topografi DEMNAS, katalog sejarah bencana BNPB, deteksi genangan AI kamera CCTV PantauSemar, laporan spasial warga terverifikasi, serta telemetri rumah pompa drainase.
2. **Audit Deterministik ISO 37120 & Algoritma D-RISK v2.4:** Menyajikan kalkulasi risiko berbasis indikator ketahanan perkotaan ISO 37120 yang transparan, dapat dipertanggungjawabkan (*explainable*), dan bebas dari halusinasi *black-box AI*.
3. **Sertifikat Integritas Bukti Digital (Chain-of-Custody):** Hashing instan SHA-256 via Web Crypto API sebelum transmisi, Cloudflare Turnstile anti-bot, Email OTP 6-digit, dan validasi *Haversine spatial corroboration*.
4. **Strict Geofencing Kota Semarang (18 km Limit) & Anti-FakeGPS Defense:** Menolak pelaporan di luar wilayah administratif Semarang (HTTP 422) dan menyaring anomali GPS mock/spoofing.
5. **Emergency Lite Mode (<30KB Payload):** Antarmuka ramah hemat baterai dan jaringan lambat dengan tombol panggilan 1-tap ke Call Center 112 / PSC 119 / TRC BPBD Kota Semarang.
6. **Dynamic Flood-Avoidance Safe Route Navigator:** Navigasi rute evakuasi cerdas pada peta GIS yang secara otomatis menghindari ruas jalan tergenang rob (Kaligawe, Pelabuhan Tanjung Emas, Mangkang).
7. **WhatsApp Emergency Situation Share Hub:** Diseminasi cepat format pesan resmi darurat ke grup RT/RW dan warga sekitar.

---

## 2. Tech Stack & Arsitektur

- **Framework:** Next.js 15 (App Router, Server Components & Edge Handlers) + TypeScript 5
- **Styling:** Vanilla Tailwind CSS + Design System Token Palette + Lucide Icons
- **GIS Mapping:** Leaflet.js Vanilla Engine + OpenStreetMap + Windy Radar Layer
- **Visualisasi Data:** Recharts Dataviz + SVG Sparklines
- **Database & Storage:** Supabase Managed PostgreSQL + Row-Level Security (RLS) + Supabase Storage
- **Keamanan:** Cloudflare Turnstile CAPTCHA + Web Crypto API SHA-256 + HMAC Signed Sessions + Rate Limiter
- **AI Intelligence:** OpenRouter API (Civic AI Copilot) + Strict Domain Guardrails & Heuristic Engine Fallback

---

## 3. Daftar Halaman & Rute Utama

| Rute | Deskripsi Fungsional |
| :--- | :--- |
| `/` | Beranda Intelijen Kebencanaan + Public Disaster Risk Widget + Emergency Lite Mode Toggle |
| `/peta` | GIS Workspace Interaktif, Layer CCTV PantauSemar, Windy Live Radar & Safe Route Navigator |
| `/laporan/baru` | Form Pelaporan Kedaruratan Warga + 1-Click GPS Quick Match + Anti-FakeGPS + Turnstile + OTP |
| `/laporan/[id]` | Detail Laporan Warga + Sertifikat Integritas Bukti Digital SHA-256 (Chain-of-Custody) |
| `/priorities` | Matriks Deterministik Prioritas Risiko Wilayah (16 Kecamatan Kota Semarang) |
| `/priorities/[area]` | Lembar Situasi & Audit Deterministik Wilayah ISO 37120 (Ramah Cetak A4 PDF) |
| `/dashboard` | EOC Operator Command Dashboard (Insiden Aktif, Klaster Bencana, Triage TRC BPBD) |
| `/edukasi` | Panduan Evakuasi Banjir & Checklist Tas Siaga Bencana 72 Jam |
| `/data` | Katalog Keterbukaan Data Spasial & Metadata Sensor |
| `/login` | Portal Autentikasi Petugas Operator EOC BPBD |
| `/presentasi` | Presentasi Pitch Deck Interaktif untuk Dewan Juri |

---

## 4. Panduan Menjalankan Lokal

### 1. Instalasi Dependensi
```bash
git clone https://github.com/prasbara/Kotaku-Siaga.git
cd Kotaku-Siaga
npm install
```

### 2. Konfigurasi Variabel Lingkungan
Salin template konfigurasi:
```bash
cp .env.example .env.local
```
Lengkapi nilai variabel publik dan kredensial Supabase pada file `.env.local`.

### 3. Setup Database Supabase
1. Buka dashboard Supabase SQL Editor.
2. Eksekusi skema utama dari file `supabase/schema.sql`.
3. Eksekusi file migrasi dari `supabase/migration_001_otp_sos_clustering.sql`.
4. Buat storage bucket publik bernama `report-photos`.

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 5. Quality Assurance & Verifikasi Build

```bash
# 1. Typecheck Strict (0 Errors)
npx tsc --noEmit

# 2. Static Code Analysis (Linting)
npm run lint

# 3. Production Build Compilation (60/60 Static & Dynamic Routes)
npm run build
```

---

## 6. Penyelarasan Target SDG (Sustainable Development Goals)

- **SDG 11:** Sustainable Cities and Communities (Indikator 11.5 — Pengurangan dampak bencana perkotaan).
- **SDG 13:** Climate Action (Indikator 13.1 — Penguatan ketahanan dan adaptasi terhadap bahaya iklim).
- **SDG 9:** Industry, Innovation and Infrastructure (Infrastruktur data terbuka dan pemantauan drainase pintar).
- **SDG 16:** Peace, Justice and Strong Institutions (Transparansi alokasi sumber daya darurat dan integritas bukti audit).

---

*© 2026 Tim PENTOL KABUL ALFAMART WIDURI — INFINITERA 2.0 Web Development Competition.*
