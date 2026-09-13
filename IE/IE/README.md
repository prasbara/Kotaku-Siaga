# KotaKu Siaga

**Platform Kolaboratif Pemantauan dan Respons Bencana Iklim**

> Data Lingkungan. Respons Lebih Cepat. Kota Lebih Tangguh.

KotaKu Siaga menghubungkan laporan warga, pemetaan risiko, dan analisis AI untuk membantu membangun kota yang lebih siap menghadapi bencana iklim.

## Tech Stack

- **Frontend:** Next.js 15 + TypeScript
- **UI:** Tailwind CSS + shadcn-style components
- **Map:** Leaflet.js (vanilla, no react-leaflet)
- **Charts:** Recharts
- **Backend:** Next.js API Routes
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **AI:** OpenRouter API (via backend routes)

## Quick Start

### 1. Clone & Install

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` ke `.env.local` dan isi dengan nilai yang benar:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3-haiku
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
```

### 3. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Jalankan SQL dari `supabase/schema.sql` di SQL Editor
3. (Opsional) Jalankan SQL dari `supabase/seed.sql` untuk data demo
4. Buat storage bucket bernama `report-photos` (Public)
5. Tambahkan storage policies (lihat schema.sql)

Atau gunakan API endpoint untuk seed data:
```
POST /api/seed
```

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Halaman

| Route | Deskripsi |
|---|---|
| `/` | Landing Page |
| `/peta` | Peta Interaktif |
| `/laporan/baru` | Form Laporan Warga |
| `/laporan/[id]` | Detail Laporan |
| `/dashboard` | Analytics Dashboard |
| `/dashboard/prioritas` | Sistem Skor Prioritas |
| `/edukasi` | Modul Edukasi |
| `/login` | Halaman Login |
| `/register` | Halaman Register |

## API Endpoints

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/reports` | GET, POST | CRUD laporan |
| `/api/reports/[id]` | GET, PATCH | Detail laporan |
| `/api/ai/analyze-report` | POST | Analisis AI laporan |
| `/api/ai/chat` | POST | Chat assistant |
| `/api/ai/aggregate-analysis` | POST | Analisis agregat area |
| `/api/dashboard/stats` | GET | Statistik dashboard |
| `/api/priority-scores` | GET | Skor prioritas area |
| `/api/upload` | POST | Upload foto |
| `/api/education` | GET | Konten edukasi |
| `/api/seed` | POST | Seed demo data |

## Demo Mode

Set `NEXT_PUBLIC_DEMO_MODE=true` untuk menampilkan banner "MODE SIMULASI".

Jalankan `POST /api/seed` untuk populate data demo ke Supabase.

## SDG Support

- **SDG 13** — Climate Action
- **SDG 11** — Sustainable Cities and Communities  
- **SDG 9** — Industry, Innovation and Infrastructure
- **SDG 4** — Quality Education

## Deployment (Vercel)

1. Push ke GitHub
2. Import project di Vercel
3. Set environment variables di Vercel dashboard
4. Deploy

---

*KotaKu Siaga — Civic Technology for Climate Resilience*
