# PANDUAN PENGEMBANGAN & WORKFLOW UPDATE: KOTAKU SIAGA
**Platform Civic Emergency & Flood Intelligence Hub Kota Semarang**
**Tim: PENTOL KABUL ALFAMART WIDURI (INFINITERA 2.0 2026)**

Dokumen ini adalah standar operasional resmi bagi insinyur dan developer yang akan melakukan pemeliharaan, penambahan fitur, atau deployment berkala pada platform KOTAKU SIAGA.

---

## 1. PRINSIP DASAR REKAYASA SISTEM
1. **Existing Stability > New Features:** Jangan pernah merombak framework, skema database, formula inti, atau autentikasi yang sedang berjalan.
2. **Minimal Change Principle:** Ubah sesedikit mungkin file existing. Utamakan modul baru terisolasi daripada rewrite komponen besar.
3. **No Fake Data & Scientific Integrity:** Jangan pernah menyamarkan data simulasi sebagai data live. Selalu laporkan data gap dan tingkat keyakinan sensor secara transparan.
4. **Zero Secrets in Git:** Jangan pernah melakukan commit file `.env`, `.env.local`, API key, atau `SUPABASE_SERVICE_ROLE_KEY`.

---

## 2. WORKFLOW PENGEMBANGAN FITUR (FEATURE UPDATE)

```text
1. Pull branch terbaru
   git pull origin main

2. Pastikan dependensi sinkron
   npm install

3. Jalankan server lokal
   npm run dev

4. Kembangkan fitur secara modular (komponen baru di /components/...)

5. Verifikasi Type Safety (TypeScript)
   npx tsc --noEmit (Harus 0 errors)

6. Verifikasi Linting
   npm run lint

7. Verifikasi Build Produksi
   npm run build (Harus 60/60 routes PASS)

8. Review Perubahan Git
   git status
   git diff

9. Commit dengan konvensi standar
   git add <nama-file>
   git commit -m "feat: [deskripsi fitur ringkas]"

10. Push ke remote repository
    git push origin main
```

---

## 3. WORKFLOW PERUBAHAN DATABASE (DATABASE MIGRATION)

Setiap perubahan database **WAJIB** mengikuti aturan *Additive & Non-Destructive*:

### Aturan Baku Database:
- **DILARANG:** `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, atau mengubah tipe data kolom aktif yang berpotensi menghilangkan data warga/laporan.
- **DIPERBOLEHKAN:** `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, dan pembuatan RLS policy baru.

### Prosedur Migration:
1. Buat file SQL migration baru di folder `supabase/` dengan format:
   `supabase/migration_XXX_<deskripsi_fitur>.sql`
2. Tuliskan query yang *idempotent* (menggunakan `IF NOT EXISTS` / `DO $$ BEGIN ... END $$`).
3. Uji coba migration pada database lokal atau Supabase staging.
4. Perbarui file `types/index.ts` jika ada penambahan kolom/tabel baru agar TypeScript tetap 100% type-safe.
5. Jalankan query migration pada Supabase Production Dashboard via SQL Editor.
6. Catat nomor dan tanggal eksekusi migration pada changelog.

---

## 4. MANAJEMEN ENVIRONMENT VARIABLES

| Kategori | Nama Variabel | Visibilitas | Deskripsi & Tujuan |
| :--- | :--- | :--- | :--- |
| **Public** | `NEXT_PUBLIC_APP_URL` | Client & Server | URL kanonikal aplikasi (misal: `https://kotaku-siaga.vercel.app`) |
| **Public** | `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Endpoint REST/PostgREST Supabase |
| **Public** | `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Client & Server | Public API key Supabase dengan batasan RLS |
| **Public** | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`| Client & Server | Sitekey Cloudflare Turnstile anti-bot |
| **Public** | `NEXT_PUBLIC_DEMO_MODE` | Client & Server | Flag demonstrasi (Default: `false`) |
| **Secret** | `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Master key Supabase untuk bypassing RLS pada background worker |
| **Secret** | `TURNSTILE_SECRET_KEY` | Server-Only | Secret key validasi respon Turnstile ke Cloudflare API |
| **Secret** | `OPENROUTER_API_KEY` | Server-Only | API Key LLM untuk Civic AI Copilot & fallback engine |
| **Secret** | `SEED_SECRET` | Server-Only | Kunci pengaman endpoint database seeding (`/api/seed`) |

---

## 5. SMOKE TEST SETELAH DEPLOYMENT PRODUKSI

Setelah push ke GitHub dan Vercel menyelesaikan deployment, jalankan verifikasi manual berikut:
1. **Homepage (`/`):** Pastikan widget risiko terbuka dan tombol *Emergency Lite Mode* dapat di-toggle.
2. **Peta GIS (`/peta`):** Pastikan marker CCTV, telemetri cuaca BMKG, dan *Safe Route Navigator* memuat polylines rute aman.
3. **Form Laporan (`/laporan/baru`):** Uji tombol *"Gunakan Lokasi GPS Saya"*, pastikan sistem menolak koordinat di luar batas Semarang dan mendeteksi spoofing.
4. **Detail Bukti Digital (`/laporan/[id]`):** Buka salah satu laporan, pastikan *Sertifikat Integritas Bukti Digital (SHA-256)* tampil lengkap.
5. **WhatsApp Share:** Klik tombol *"Bagikan ke WhatsApp"* dan periksa format teks darurat yang dihasilkan.
