# PRODUCTION_DEPLOY.md — KotaKu Siaga Civic Radar v1.1

Panduan deployment production lengkap untuk KotaKu Siaga.

---

## Prerequisites

- **Node.js** v18+ dan **npm** v9+
- **Supabase** project (https://app.supabase.com)
- **Vercel** account (https://vercel.com) — untuk deployment
- **OpenRouter** API key (optional — untuk fitur AI analysis)

---

## 1. Local Configuration

### Salin environment template

```bash
cp .env.example .env.local
```

### Isi credential nyata di `.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
OPENROUTER_API_KEY=your_openrouter_key_here   # optional
NEXT_PUBLIC_DEMO_MODE=false
SEED_SECRET=your_random_secret_here           # optional
```

> **PENTING**: Jangan pernah commit `.env.local` ke repository.

---

## 2. Database Setup

### Jalankan schema production

Gunakan Supabase SQL Editor atau CLI:

```bash
# Salin isi supabase/schema.sql dan jalankan di Supabase SQL Editor
# ATAU gunakan Supabase CLI:
supabase db push
```

> **JANGAN** jalankan `seed.sql` di production database.
> `seed.sql` hanya untuk keperluan development lokal dan berisi data demo.

### Seed reference data (optional)

Jika ingin mengisi area kecamatan dan konten edukasi:

```bash
curl -X POST https://your-app.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secret": "your_SEED_SECRET_value"}'
```

Endpoint ini **hanya** menyeed areas dan educational_contents — **tidak** menyeed citizen reports.

---

## 3. Vercel Deployment

### Environment Variables

Masukkan semua variable ke **Vercel → Project → Settings → Environment Variables**:

| Variable | Environment | Deskripsi |
|----------|-------------|-----------|
| `NEXT_PUBLIC_APP_URL` | Production, Preview, Development | URL aplikasi |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development | **SERVER-ONLY** service role key |
| `OPENROUTER_API_KEY` | Production, Preview | OpenRouter API key (optional) |
| `NEXT_PUBLIC_DEMO_MODE` | Development | Set `false` di semua environment |
| `SEED_SECRET` | Development, Preview | Random secret untuk /api/seed |

> **PERINGATAN**: `SUPABASE_SERVICE_ROLE_KEY` harus **TIDAK pernah** diekspos ke client.
> Pastikan prefix-nya bukan `NEXT_PUBLIC_`.

### Deploy

```bash
# Install dependencies
npm install

# Lint check
npm run lint

# Build test lokal
npm run build

# Deploy ke Vercel
vercel --prod
```

---

## 4. Verification Endpoints

Setelah deployment, test endpoint berikut:

### Database Connected

```bash
# Jika DB dikonfigurasi dan kosong → returns empty array (bukan error)
GET /api/reports
# Expected: {"success": true, "data": [], "count": 0}

GET /api/flood-events
# Expected: {"success": true, "events": []}

GET /api/cctv
# Expected: 70 real PantauSemar cameras

GET /api/dashboard/stats
# Expected: real stats (zeros if empty, not fake data)
```

### Database Not Configured

```bash
# Jika DB belum dikonfigurasi → returns explicit error
GET /api/reports
# Expected: {"error": "Database not configured..."}, status 503
```

### CCTV

```bash
GET /api/cctv
# Expected: array of 70 real PantauSemar cameras
# Bukan mock/placeholder cameras
```

---

## 5. Cron Jobs

`vercel.json` mengatur cron job otomatis:

```json
{
  "crons": [
    { "path": "/api/cron/cctv-analysis", "schedule": "*/5 * * * *" }
  ]
}
```

Cron ini menjalankan analisis CCTV setiap 5 menit. Tidak menghasilkan fake observations.

---

## 6. Security Checklist

- [ ] Jangan commit `.env.local`
- [ ] Jangan expose `SUPABASE_SERVICE_ROLE_KEY` sebagai `NEXT_PUBLIC_*`
- [ ] `SEED_SECRET` harus string acak yang kuat (min 32 karakter)
- [ ] Jangan enable seed tanpa explicit secret
- [ ] `NEXT_PUBLIC_DEMO_MODE` harus `false` di production
- [ ] Hapus atau rotate API key yang sudah terekspos di chat/log
- [ ] Audit `vercel.json` — pastikan cron hanya menjalankan legitimate analysis

---

## 7. Production Invariants

Aplikasi KotaKu Siaga v1.1 production harus memenuhi semua invariant berikut:

- ✅ Tidak ada citizen report hardcoded
- ✅ Database tidak tersedia → API return 503 (bukan fake data)
- ✅ Database kosong → API return `[]` (bukan fabricated events)
- ✅ 70 kamera PantauSemar nyata dari `lib/data/cctv-pantausemar.ts`
- ✅ Simulator EOC hanya calculator — tidak insert ke database
- ✅ Seed endpoint terlindungi dengan SEED_SECRET
- ✅ Service role key tidak masuk ke browser bundle
