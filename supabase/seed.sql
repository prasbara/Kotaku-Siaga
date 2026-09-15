-- ============================================================
-- KotaKu Siaga — Seed Data SQL (Kota Semarang)
-- Run after schema.sql to populate verified baseline data
-- All records are marked is_demo = true
-- ============================================================

-- Insert Demo Areas (Kecamatan di Kota Semarang)
INSERT INTO areas (id, name, latitude, longitude, population_density, environmental_vulnerability) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Kecamatan Semarang Utara', -6.9554, 110.4182, 92, 92),
  ('a1000000-0000-0000-0000-000000000002', 'Kecamatan Genuk', -6.9542, 110.4721, 75, 88),
  ('a1000000-0000-0000-0000-000000000003', 'Kecamatan Gayamsari', -6.9850, 110.4420, 80, 78),
  ('a1000000-0000-0000-0000-000000000004', 'Kecamatan Semarang Timur', -6.9742, 110.4350, 88, 70),
  ('a1000000-0000-0000-0000-000000000005', 'Kecamatan Candisari', -7.0250, 110.4280, 68, 65),
  ('a1000000-0000-0000-0000-000000000006', 'Kecamatan Tembalang', -7.0580, 110.4480, 60, 60),
  ('a1000000-0000-0000-0000-000000000007', 'Kecamatan Tugu', -6.9680, 110.3350, 52, 74)
ON CONFLICT DO NOTHING;

-- Insert Educational Contents
INSERT INTO educational_contents (category, title, content) VALUES
  ('banjir', 'Banjir Rob & Dinamika Pesisir Semarang', '["Hindari arus air laut pasang yang deras pada akses pantura.","Matikan instalasi listrik di rumah jika air rob mulai masuk ke teras/lantai.","Waspadai penurunan tanah (subsidence) yang mempercepat genangan air laut.","Perhatikan status pompa polder BBWS dan pintu air sungai terdekat.","Bawa dokumen berharga ke lantai dua atau tempat terlindung.","Pantau visual CCTV PantauSemar untuk memonitor ketinggian genangan jalan sebelum bepergian."]'),
  ('genangan', 'Mitigasi Genangan Drainase Perkotaan', '["Pastikan saringan selokan (inlet) depan rumah bersih dari sampah plastik dan dedaunan.","Jangan menutup seluruh saluran drainase dengan semen tanpa bak kontrol pembersih.","Segera laporkan titik sumbatan melalui KotaKu Siaga untuk percepatan pengerukan dinas PU.","Buat sumur resapan atau biopori di pekarangan rumah untuk mempercepat infiltrasi air.","Hindari melintasi genangan dengan kendaraan roda dua jika ketinggian melebihi knalpot."]'),
  ('drainase_tersumbat', 'Bahaya Sedimentasi Saluran Primer & Sekunder', '["Sedimentasi lumpur tebal mengurangi daya tampung saluran pembuang hingga 70%.","Sampah anorganik menjadi pemicu utama terbentuknya bendung balik (backwater effect).","Periksa kemiringan dan kelancaran aliran parit lingkungan secara berkala.","Gotong royong rutin warga sebelum puncak musim hujan sangat efektif mencegah banjir lokal.","Satu titik sumbatan pada gorong-gorong utama dapat melumpuhkan aliran satu kelurahan."]'),
  ('sampah_menumpuk', 'Dampak Penumpukan Sampah terhadap Sistem Polder', '["Sampah yang hanyut ke muara sungai dapat merusak baling-baling pompa stasiun polder.","TPS liar di sempadan sungai mempercepat pendangkalan dasar sungai dan bau tidak sedap.","Gunakan layanan pengangkutan sampah resmi DLH Kota Semarang.","Laporkan tumpukan sampah liar di badan jalan atau tanggul sungai via aplikasi.","Pilah sampah plastik dan anorganik dari sumber rumah tangga."]'),
  ('longsor', 'Kewaspadaan Rekahan Lereng & Perbukitan Semarang', '["Waspadai retakan tanah berbentuk tapal kuda pada tebing lereng Candisari dan Gombel.","Perhatikan kemiringan tiang listrik, pagar rumah, atau pohon yang terjadi tiba-tiba.","Munculnya rembesan air keruh di kaki lereng menandakan tanah sudah jenuh air.","Segera evakuasi ke tempat aman jika terdengar suara gemuruh kecil dari arah perbukitan.","Pertahankan vegetasi berakar kuat penahan erosi dan hindari pemotongan lereng terjal."]'),
  ('infrastruktur_hijau', 'Peran Sabuk Mangrove & Hutan Kota Pesisir', '["Rumpun mangrove pesisir Semarang Utara berfungsi meredam gelombang pasang air laut.","Taman kota dan vegetasi menyerap ratusan liter air hujan per jam ke dalam tanah.","Laporkan kerusakan dinding penahan atau tanggul hijau pelindung pantai.","Dukung program penanaman mangrove dan penghijauan sempadan sungai BKB/BKT.","Infrastruktur hijau menurunkan suhu perkotaan dan mencegah abrasi garis pantai."]')
ON CONFLICT DO NOTHING;

-- PRODUCTION: No citizen reports or flood events are seeded.
-- Reports originate solely from live citizens and field officers.
