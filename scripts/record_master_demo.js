const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Injects virtual cursor and dynamic HUD bar into the page
async function injectVirtualEnvironment(page, initialHudText = 'KOTAKU SIAGA • PLATFORM PEMANTAUAN BENCANA KOTA SEMARANG') {
  await page.evaluate((hudText) => {
    // HUD overlay
    let hud = document.getElementById('demo-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'demo-hud';
      hud.style.cssText = `
        position: fixed;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(26, 8, 28, 0.94);
        backdrop-filter: blur(12px);
        color: #ffffff;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        padding: 6px 18px;
        border-radius: 9999px;
        border: 1px solid rgba(244, 237, 228, 0.25);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
        z-index: 9999999;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s ease;
      `;
      hud.innerHTML = `
        <span id="demo-hud-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #007a5a; display: inline-block; box-shadow: 0 0 8px #007a5a; animation: pulse 1.5s infinite;"></span>
        <span id="demo-hud-title" style="white-space: nowrap;">${hudText}</span>
      `;
      document.body.appendChild(hud);
    } else {
      const title = document.getElementById('demo-hud-title');
      if (title) title.textContent = hudText;
    }

    // Glowing cursor
    let cursor = document.getElementById('virtual-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'virtual-cursor';
      cursor.style.cssText = `
        position: fixed;
        width: 22px;
        height: 22px;
        border: 2px solid #ffffff;
        background: radial-gradient(circle, #ff4500 0%, #cc4117 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000000;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 14px rgba(204, 65, 23, 0.9), 0 0 4px rgba(0,0,0,0.5);
        transition: transform 0.1s ease-out;
        opacity: 0.95;
        top: 360px;
        left: 640px;
      `;
      document.body.appendChild(cursor);

      // Click ripple generator
      window.__triggerRipple = (x, y) => {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y}px;
          width: 8px;
          height: 8px;
          border: 2px solid #cc4117;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999998;
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
          transition: transform 0.45s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.45s ease-out;
        `;
        document.body.appendChild(ripple);
        requestAnimationFrame(() => {
          ripple.style.transform = 'translate(-50%, -50%) scale(5.5)';
          ripple.style.opacity = '0';
        });
        setTimeout(() => ripple.remove(), 500);
      };
    }
  }, initialHudText);
}

async function setHudText(page, text) {
  try {
    await page.evaluate((t) => {
      const el = document.getElementById('demo-hud-title');
      if (el) el.textContent = t;
    }, text);
  } catch (e) {}
}

async function moveCursor(page, x, y, duration = 350) {
  try {
    await page.evaluate(
      ({ x, y }) => {
        const c = document.getElementById('virtual-cursor');
        if (c) {
          c.style.left = `${x}px`;
          c.style.top = `${y}px`;
        }
      },
      { x, y }
    );
    await page.mouse.move(x, y, { steps: Math.max(5, Math.floor(duration / 30)) });
  } catch (e) {}
}

async function clickAt(page, x, y) {
  try {
    await moveCursor(page, x, y, 200);
    await page.evaluate(
      ({ x, y }) => {
        if (window.__triggerRipple) window.__triggerRipple(x, y);
        const c = document.getElementById('virtual-cursor');
        if (c) {
          c.style.transform = 'translate(-50%, -50%) scale(0.7)';
          setTimeout(() => {
            if (c) c.style.transform = 'translate(-50%, -50%) scale(1)';
          }, 180);
        }
      },
      { x, y }
    );
    await page.mouse.click(x, y);
    await sleep(250);
  } catch (e) {}
}

async function clickElement(page, selector, textHint = '') {
  try {
    const el = page.locator(selector).first();
    if ((await el.count()) > 0 && (await el.isVisible())) {
      const box = await el.boundingBox();
      if (box) {
        const targetX = Math.round(box.x + box.width / 2);
        const targetY = Math.round(box.y + box.height / 2);
        await moveCursor(page, targetX, targetY, 300);
        await clickAt(page, targetX, targetY);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

async function smoothScroll(page, targetScrollY, duration = 1200) {
  try {
    await page.evaluate(
      async ({ targetY, duration }) => {
        const startY = window.scrollY;
        const diff = targetY - startY;
        const startTime = performance.now();
        return new Promise((resolve) => {
          function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease in-out cubic
            const ease =
              progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            window.scrollTo(0, startY + diff * ease);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(step);
        });
      },
      { targetY: targetScrollY, duration }
    );
    await sleep(duration + 100);
  } catch (e) {}
}

(async () => {
  console.log('=== STARTING KOTAKU SIAGA MASTER VIDEO DEMO RECORDING ===');

  const recordingsDir = path.resolve(__dirname, '../recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,720',
      '--disable-dev-shm-usage',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1280, height: 720 },
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // =========================================================================
  // CHAPTER 1: BERANDA & OVERVIEW MULTI-SENSOR
  // =========================================================================
  console.log('Chapter 1: Opening & Beranda (Homepage)...');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 40000 });
  await injectVirtualEnvironment(page, '🌐 KOTAKU SIAGA • PLATFORM PEMANTAUAN BENCANA KOTA SEMARANG');
  await moveCursor(page, 200, 36, 400);
  await sleep(3500); // Penonton melihat logo, judul, tagline

  // Scroll perlahan melihat alert banner dan telemetry cards
  await setHudText(page, '📊 METRIK TELEMETRI BMKG, MUKA AIR & STATUS POMPA POLDER');
  await smoothScroll(page, 520, 1600);
  await moveCursor(page, 400, 380, 500);
  await sleep(3000);

  // Scroll melihat PantauSemar CCTV preview & geospatial section
  await setHudText(page, '📹 INTEGRASI 70 CCTV PANTAUSEMAR & PREVIEW GEOSPASIAL');
  await smoothScroll(page, 1150, 1800);
  await moveCursor(page, 620, 420, 500);
  await sleep(3000);

  // Scroll ke area Matriks Risiko Wilayah & Ketahanan Iklim SDG 11 & 13
  await setHudText(page, '🌱 KETAHANAN IKLIM & INDIKATOR KETANGGUHAN KOTA (SDG 11 & 13)');
  await smoothScroll(page, 1850, 1800);
  await sleep(3000);

  // Scroll kembali ke atas
  await setHudText(page, '🌐 KOTAKU SIAGA • NAVIGASI UTAMA LAYANAN PUBLIK');
  await smoothScroll(page, 0, 1500);
  await sleep(2000);

  // =========================================================================
  // CHAPTER 2: PETA PEMANTAUAN GEOSPASIAL (/peta)
  // =========================================================================
  console.log('Chapter 2: Peta Pemantauan Geospasial...');
  await setHudText(page, '🗺️ MENUJU PETA PEMANTAUAN GEOSPASIAL TERINTEGRASI (/peta)');
  await clickElement(page, 'nav a:has-text("Peta Pemantauan")');
  await page.waitForURL('**/peta**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await injectVirtualEnvironment(page, '🗺️ PETA INTERAKTIF: 70 TITIK SENSOR, CCTV, DAN WILAYAH RAWAN');
  await sleep(3500);

  // Interaksi marker Leaflet di peta
  await setHudText(page, '📍 MENELUSURI MARKER SENSOR KETINGGIAN AIR & CCTV');
  await moveCursor(page, 640, 380, 600);
  await sleep(1500);

  // Klik salah satu marker peta
  const marker = page.locator('.leaflet-marker-icon').nth(4);
  if ((await marker.count()) > 0) {
    const box = await marker.boundingBox();
    if (box) {
      await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 400);
      await clickAt(page, box.x + box.width / 2, box.y + box.height / 2);
      await setHudText(page, '🔍 DETAIL TELEMETRI TITIK PEMANTAUAN AKTIF');
      await sleep(3500); // Penonton melihat popup/drawer informasi titik
    }
  }

  // Coba klik marker lain
  const secondMarker = page.locator('.leaflet-marker-icon').nth(12);
  if ((await secondMarker.count()) > 0) {
    const box = await secondMarker.boundingBox();
    if (box) {
      await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 400);
      await clickAt(page, box.x + box.width / 2, box.y + box.height / 2);
      await sleep(3000);
    }
  }

  // Scroll sedikit untuk memperlihatkan panel kontrol / filter
  await smoothScroll(page, 300, 1000);
  await sleep(2500);
  await smoothScroll(page, 0, 800);

  // =========================================================================
  // CHAPTER 3: EDUKASI BENCANA (/edukasi)
  // =========================================================================
  console.log('Chapter 3: Edukasi Bencana...');
  await setHudText(page, '📚 MEMBUKA MODUL EDUKASI & KESIAPSIAGAAN BENCANA (/edukasi)');
  await clickElement(page, 'nav a:has-text("Edukasi Bencana")');
  await page.waitForURL('**/edukasi**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await injectVirtualEnvironment(page, '📚 PANDUAN KESIAPSIAGAAN, MITIGASI & SIMULASI INTERAKTIF');
  await sleep(3000);

  await smoothScroll(page, 480, 1400);
  await setHudText(page, '🛡️ PANDUAN TANGGAP DARURAT BANJIR ROB & JALUR EVAKUASI');
  await moveCursor(page, 500, 360, 400);
  await sleep(3500);

  await smoothScroll(page, 1100, 1400);
  await setHudText(page, '🔬 VISUALISASI INTERAKTIF KESTABILAN LERENG & MITIGASI');
  await sleep(3000);
  await smoothScroll(page, 0, 1200);

  // =========================================================================
  // CHAPTER 4: MATRIKS RISIKO KECAMATAN (/priorities)
  // =========================================================================
  console.log('Chapter 4: Matriks Risiko Kecamatan...');
  await setHudText(page, '📊 MEMBUKA MATRIKS PRIORITAS & RISIKO KECAMATAN (/priorities)');
  await clickElement(page, 'nav a:has-text("Matriks Risiko")');
  await page.waitForURL('**/priorities**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await injectVirtualEnvironment(page, '📊 MATRIKS RISIKO: SKOR D-RISK ISO 37120 PADA 16 KECAMATAN');
  await sleep(3000);

  // Scroll melihat breakdown risiko kecamatan
  await smoothScroll(page, 520, 1500);
  await setHudText(page, '🔍 ANALISIS FAKTOR KERENTANAN, KAPASITAS POMPA & DRAINASE');
  await moveCursor(page, 620, 400, 500);
  await sleep(3500);

  await smoothScroll(page, 1150, 1500);
  await sleep(3000);
  await smoothScroll(page, 0, 1000);

  // =========================================================================
  // CHAPTER 5: INTEGRITAS DATA & LINEAGE (/data)
  // =========================================================================
  console.log('Chapter 5: Integritas Data...');
  await setHudText(page, '🛡️ MEMBUKA PORTAL INTEGRITAS DATA & PROVENANCE (/data)');
  await clickElement(page, 'nav a:has-text("Integritas Data")');
  await page.waitForURL('**/data**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await injectVirtualEnvironment(page, '🛡️ TRANSPARANSI SUMBER: BMKG, PANTAUSEMAR, IOT & AUDIT TRAIL');
  await sleep(3000);

  await smoothScroll(page, 500, 1400);
  await setHudText(page, '📈 DATA LINEAGE, VALIDASI MULTI-SUMBER & FORMULA D-RISK');
  await sleep(3500);

  await smoothScroll(page, 1100, 1400);
  await setHudText(page, '🔒 JEJAK AUDIT SISTEM, TELEMETRI API & INTEGRITAS DATA');
  await sleep(3000);
  await smoothScroll(page, 0, 1000);

  // =========================================================================
  // CHAPTER 6: FORM LAPORAN WARGA & VALIDASI (/laporan/baru)
  // =========================================================================
  console.log('Chapter 6: Form Laporan Warga & Validasi...');
  await setHudText(page, '📢 MEMBUKA FORMULIR PELAPORAN GENANGAN OLEH WARGA');
  await clickElement(page, 'a:has-text("Lapor Genangan")');
  await page.waitForURL('**/laporan/baru**', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await injectVirtualEnvironment(page, '📢 WIZARD PELAPORAN WARGA: LANGKAH 1 IDENTITAS PELAPOR');
  await sleep(3000);

  // Demonstrasi validasi form kosong (error handling)
  await setHudText(page, '⚠️ DEMO VALIDASI: MEMASTIKAN DATA PELAPOR LENGKAP & VALID');
  const nextBtn = page.locator('button:has-text("Lanjutkan")').first();
  if ((await nextBtn.count()) > 0) {
    await clickElement(page, 'button:has-text("Lanjutkan")');
    await sleep(2000); // Terlihat validasi error
  }

  // Mengisi form dengan data demo yang kredibel
  await setHudText(page, '✍️ MENGISI IDENTITAS DEMO PELAPOR DENGAN AMAN');
  const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
  if ((await inputs.count()) >= 3) {
    await inputs.nth(0).fill('Budi Santoso (Warga Semarang)');
    await sleep(400);
    await inputs.nth(1).fill('budi.santoso@warga.semarangkota.go.id');
    await sleep(400);
    await inputs.nth(2).fill('081234567890');
    await sleep(800);
  }

  // Klik Lanjutkan ke Langkah 2
  await setHudText(page, '➡️ BERLANJUT KE LANGKAH 2: LOKASI & DETAIL BENCANA');
  await clickElement(page, 'button:has-text("Lanjutkan")');
  await sleep(3000);

  // Memperlihatkan kategori bencana yang tersedia
  await setHudText(page, '🌊 KATEGORI BENCANA: BANJIR ROB, GENANGAN, KEBAKARAN, DLL');
  await smoothScroll(page, 350, 1000);
  await sleep(3500);

  // Menuju halaman feed daftar laporan warga (/laporan)
  await setHudText(page, '📋 MEMERIKSA FEED DAFTAR LAPORAN WARGA TERVERIFIKASI (/laporan)');
  await clickElement(page, 'nav a:has-text("Laporan Warga")');
  await page.waitForURL('**/laporan', { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await injectVirtualEnvironment(page, '📋 DAFTAR LAPORAN WARGA: STATUS PENDING, TERVERIFIKASI & SEBARAN');
  await sleep(3000);

  await smoothScroll(page, 450, 1200);
  await sleep(3000);
  await smoothScroll(page, 0, 800);

  // =========================================================================
  // CHAPTER 7: LOGIN PETUGAS / PUSAT KENDALI OPERASI (/login)
  // =========================================================================
  console.log('Chapter 7: Login Petugas...');
  await setHudText(page, '🔐 MENUJU PORTAL MASUK PUSAT KENDALI OPERASI (/login)');
  await page.goto('https://kotaku-siaga.vercel.app/login', { waitUntil: 'networkidle' });
  await injectVirtualEnvironment(page, '🔐 OTENTIKASI RESMI PETUGAS PUSAT KENDALI (RBAC SUPABASE)');
  await sleep(3000);

  await setHudText(page, '⌨️ INPUT KREDENSIAL DEMO: operator.siaga');
  await moveCursor(page, 640, 280, 400);
  await page.fill('#identifier', 'operator.siaga');
  await sleep(600);

  await moveCursor(page, 640, 350, 400);
  await page.fill('#password', 'Siaga@Prod_26!K7m');
  await sleep(800);

  await setHudText(page, '🚀 MASUK KE PUSAT KENDALI OPERASI DARURAT');
  await clickElement(page, 'button[type="submit"]');
  await sleep(3000);

  // =========================================================================
  // CHAPTER 8: ADMIN COMMAND CENTER DASHBOARD (/dashboard)
  // =========================================================================
  console.log('Chapter 8: Dashboard Pusat Kendali Operasi...');
  await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle' });
  await injectVirtualEnvironment(page, '🏢 PUSAT KOMANDO & ANALITIK KEBENCANAAN KOTA SEMARANG');
  await sleep(3500);

  await setHudText(page, '📈 RINGKASAN STATUS OPERASIONAL & METRIK KESIAPSIAGAAN EOC');
  await smoothScroll(page, 420, 1400);
  await moveCursor(page, 450, 350, 400);
  await sleep(3500);

  await setHudText(page, '🔍 KORELASI SILANG MULTI-SUMBER & TABEL SKOR RISIKO TERBUKA');
  await smoothScroll(page, 950, 1500);
  await sleep(3500);

  await setHudText(page, '🗺️ KONTROL 16 LAYER TAKTIS PETA & LOG ESKALASI');
  await smoothScroll(page, 1500, 1500);
  await sleep(3500);

  await smoothScroll(page, 0, 1200);

  // Demonstrasikan fitur Kiosk Layar Lebar Command Center
  await setHudText(page, '🖥️ MEMBUKA LAYAR KIOSK MONITOR BESAR (/command-center)');
  const kioskBtn = page.locator('button:has-text("Layar Command Center")').first();
  if ((await kioskBtn.count()) > 0) {
    await clickElement(page, 'button:has-text("Layar Command Center")');
    await sleep(4000);
    await injectVirtualEnvironment(page, '🖥️ TAMPILAN MONITOR BESAR KIOSK PUSAT PENGENDALI BENCANA');
    await sleep(4000);
    // Kembali ke dashboard
    await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle' });
    await injectVirtualEnvironment(page, '🏢 KEMBALI KE PUSAT KOMANDO & ANALITIK KEBENCANAAN');
    await sleep(2000);
  }

  // =========================================================================
  // CHAPTER 9: FITUR SOS DARURAT 1-KLIK
  // =========================================================================
  console.log('Chapter 9: SOS Darurat...');
  await setHudText(page, '🚨 MEMBUKA LAYANAN SINYAL SOS DARURAT 1-KLIK');
  await clickElement(page, 'button:has-text("SOS")');
  await sleep(2000);
  await injectVirtualEnvironment(page, '🚨 MODAL DARURAT: BEACON SOS, CALL CENTER BPBD 112 & SAR');
  await moveCursor(page, 640, 360, 400);
  await sleep(4000); // Penonton melihat nomor kontak darurat 112, ambulans, instruksi evakuasi

  // Tutup modal SOS
  await setHudText(page, '✅ MENUTUP MODAL DARURAT');
  const closeSos = page.locator('button[aria-label*="Tutup"], button:has-text("Tutup"), .lucide-x').first();
  if ((await closeSos.count()) > 0) {
    await closeSos.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await sleep(1500);

  // =========================================================================
  // CHAPTER 10: CIVIC AI COPILOT 2.0
  // =========================================================================
  console.log('Chapter 10: Civic AI Copilot 2.0...');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle' });
  await injectVirtualEnvironment(page, '🤖 MEMBUKA ASISTEN KECERDASAN BUATAN CIVIC AI COPILOT 2.0');
  await sleep(2000);

  // Buka Copilot
  await clickElement(page, 'button:has-text("Civic AI Copilot")');
  await sleep(2500);
  await injectVirtualEnvironment(page, '🤖 CIVIC AI COPILOT: TELEMETRI REAL-TIME & KONSULTASI BENCANA');
  await moveCursor(page, 950, 450, 400);
  await sleep(3000);

  // Ajukan pertanyaan demo
  await setHudText(page, '💬 MENGAJUKAN PERTANYAAN KONDISI RISIKO BANJIR GENUK...');
  const chip = page.locator('button:has-text("Genuk")').first();
  if ((await chip.count()) > 0 && (await chip.isVisible())) {
    await chip.click();
  } else {
    const inputAi = page.locator('input[placeholder*="Tanyakan kondisi"]').first();
    if ((await inputAi.count()) > 0) {
      await inputAi.fill('Bagaimana kondisi risiko banjir di Kecamatan Genuk?');
      await sleep(500);
      await page.keyboard.press('Enter');
    }
  }

  // Tunggu respons AI muncul
  await sleep(6500);
  await setHudText(page, '💡 RESPONS CERDAS DILENGKAPI KUTIPAN SUMBER & REKOMENDASI WARGA');
  await sleep(4500);

  // Tutup Copilot
  await clickElement(page, 'button:has-text("Tutup Copilot")');
  await sleep(1500);

  // =========================================================================
  // CHAPTER 11: TAMPILAN RESPONSIF MOBILE
  // =========================================================================
  console.log('Chapter 11: Responsive Mobile Viewport...');
  await setHudText(page, '📱 PENGUJIAN DESAIN RESPONSIF PADA VIEWPORT MOBILE (SMARTPHONE)');
  await page.setViewportSize({ width: 390, height: 844 });
  await injectVirtualEnvironment(page, '📱 TAMPILAN MOBILE: ADAPTIF, RINGKAS & CEPAT DIAKSES WARGA');
  await sleep(3000);

  // Scroll mobile
  await smoothScroll(page, 450, 1400);
  await sleep(2500);
  await smoothScroll(page, 900, 1400);
  await sleep(2500);
  await smoothScroll(page, 0, 1000);

  // Buka mobile drawer
  await setHudText(page, '🍔 MENU HAMBURGER & AKSES CEPAT MOBILE DRAWER');
  const menuBtn = page.locator('button[aria-label*="menu"]').first();
  if ((await menuBtn.count()) > 0) {
    await menuBtn.click();
    await sleep(3500); // Penonton melihat drawer navigasi mobile lengkap
    await menuBtn.click(); // Tutup kembali
    await sleep(1500);
  }

  // Kembalikan ke desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await injectVirtualEnvironment(page, '💻 KEMBALI KE RESOLUSI STANDAR DESKTOP');
  await sleep(2000);

  // =========================================================================
  // CHAPTER 12: CLOSING & KESIMPULAN KETAHANAN IKLIM KOTA SEMARANG
  // =========================================================================
  console.log('Chapter 12: Closing...');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle' });
  await injectVirtualEnvironment(
    page,
    '✨ KOTAKU SIAGA: MENDUKUNG KETAHANAN BENCANA & IKLIM KOTA SEMARANG'
  );
  await smoothScroll(page, 0, 500);
  await moveCursor(page, 640, 240, 500);
  await sleep(5000); // Penonton melihat closing shot dengan tenang dan jelas

  console.log('Closing browser context to finalize video recording...');
  await context.close();
  await browser.close();

  console.log('Recording completed successfully!');
  const files = fs.readdirSync(recordingsDir);
  console.log('Files in recordings directory:', files);
})();
