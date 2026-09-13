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

-- Insert Demo Reports (Kota Semarang)
INSERT INTO reports (report_code, title, category, description, district_name, address, latitude, longitude, urgency, status, reporter_name, is_demo, area_id, created_at) VALUES
  ('KKS-2026-00001', 'Rob Pesisir Bandarharjo 45cm', 'banjir', 'Genangan rob pesisir mencapai 45 cm di kawasan Bandarharjo, Semarang Utara. Pompa air darurat sedang beroperasi.', 'Semarang Utara', 'Jl. Bandarharjo, Semarang Utara', -6.9535, 110.4289, 'kritis', 'in_progress', 'Warga Bandarharjo', true, 'a1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
  ('KKS-2026-00002', 'Drainase Kaligawe Mampet Sedimen', 'drainase_tersumbat', 'Sedimentasi lumpur tebal dan tumpukan sampah plastik menyumbat saluran primer Kaligawe, Genuk. Aliran melambat drastis menjelang hujan.', 'Genuk', 'Jl. Kaligawe Raya, Genuk', -6.9620, 110.4550, 'tinggi', 'verified', 'Relawan Lingkungan', true, 'a1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 hours'),
  ('KKS-2026-00003', 'Parapet Rob Tambaklorok Bocor', 'infrastruktur_hijau', 'Rembesan air pada parapet pelindung pasang di kawasan pesisir Tambaklorok. Diperlukan penguatan struktur tanggul.', 'Semarang Utara', 'Jl. Tambaklorok, Pesisir Semarang Utara', -6.9580, 110.4150, 'sedang', 'investigating', 'Komunitas Pesisir', true, 'a1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '12 hours'),
  ('KKS-2026-00004', 'Genangan 20cm Gayamsari', 'genangan', 'Genangan air sisa hujan setinggi 20 cm di pertigaan jalan raya Gayamsari akibat drainase sekunder lambat surut.', 'Gayamsari', 'Jl. Gayamsari Raya, Semarang Timur', -6.9850, 110.4420, 'sedang', 'submitted', 'Warga Gayamsari', true, 'a1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '18 hours'),
  ('KKS-2026-00005', 'Retakan Tebing Candisari', 'longsor', 'Retakan tanah selebar 10 cm sepanjang 15 meter pada tebing permukiman Candisari setelah hujan deras kemarin sore.', 'Candisari', 'Kawasan Perbukitan Candisari, Semarang Selatan', -7.0250, 110.4280, 'tinggi', 'verified', 'Forum RW Candisari', true, 'a1000000-0000-0000-0000-000000000005', NOW() - INTERVAL '24 hours'),
  ('KKS-2026-00006', 'Genangan Rob Terboyo Megah 60cm', 'banjir', 'Banjir rob setinggi 60 cm merendam kawasan industri Terboyo Megah. Akses jalan terputus, kendaraan berat tidak bisa lewat.', 'Genuk', 'Jl. Terboyo Megah, Kawasan Industri Terboyo', -6.9614, 110.4456, 'kritis', 'in_progress', 'Operator Kawasan Terboyo', true, 'a1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hours'),
  ('KKS-2026-00007', 'Sampah Menumpuk Jl. Pemuda', 'sampah_menumpuk', 'Tumpukan sampah di median jalan mengganggu aliran drainase tepi jalan.', 'Semarang Tengah', 'Jl. Pemuda, Semarang Tengah', -6.9727, 110.4381, 'rendah', 'submitted', 'Warga Semarang Tengah', true, 'a1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '36 hours')
ON CONFLICT DO NOTHING;
