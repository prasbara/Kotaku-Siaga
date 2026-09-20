const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Injects virtual presentation environment: HUD, Story Overlays, Virtual Cursor & Click Ripple
async function injectPresentationEnvironment(page, initialHud = 'KOTAKU SIAGA • PRODUCT DEMO') {
  await page.evaluate((hudText) => {
    // 1. Top HUD bar
    let hud = document.getElementById('demo-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'demo-hud';
      hud.style.cssText = `
        position: fixed;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(24, 6, 26, 0.95);
        backdrop-filter: blur(14px);
        color: #ffffff;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 7px 22px;
        border-radius: 9999px;
        border: 1px solid rgba(244, 237, 228, 0.3);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
        z-index: 9999999;
        pointer-events: none;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.35s ease;
      `;
      hud.innerHTML = `
        <span id="demo-hud-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #007a5a; display: inline-block; box-shadow: 0 0 10px #007a5a;"></span>
        <span id="demo-hud-title" style="white-space: nowrap;">${hudText}</span>
      `;
      document.body.appendChild(hud);
    } else {
      const title = document.getElementById('demo-hud-title');
      if (title) title.textContent = hudText;
    }

    // 2. Storytelling / Keynote Overlay Card (for problem, architecture, workflow)
    let storyCard = document.getElementById('demo-story-card');
    if (!storyCard) {
      storyCard = document.createElement('div');
      storyCard.id = 'demo-story-card';
      storyCard.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 24px;
        max-width: 490px;
        background: rgba(28, 6, 30, 0.94);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(244, 237, 228, 0.25);
        border-left: 4px solid #cc4117;
        padding: 12px 18px;
        border-radius: 12px;
        color: #ffffff;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        z-index: 9999997;
        pointer-events: none;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.4s ease, transform 0.4s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      `;
      storyCard.innerHTML = `
        <div id="demo-story-tag" style="font-size: 9px; font-weight: 800; letter-spacing: 0.12em; color: #cc4117; text-transform: uppercase; margin-bottom: 3px;">PROBLEM STATEMENT</div>
        <div id="demo-story-desc" style="font-size: 11px; line-height: 1.45; color: #f4ede4;">...</div>
      `;
      document.body.appendChild(storyCard);
    }

    // 3. Virtual Cursor
    let cursor = document.getElementById('virtual-cursor');
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = 'virtual-cursor';
      cursor.style.cssText = `
        position: fixed;
        width: 22px;
        height: 22px;
        border: 2px solid #ffffff;
        background: radial-gradient(circle, #ff5722 0%, #cc4117 75%);
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
  }, initialHud);
}

async function setHud(page, text, dotColor = '#007a5a') {
  try {
    await page.evaluate(({ t, c }) => {
      const el = document.getElementById('demo-hud-title');
      const dot = document.getElementById('demo-hud-dot');
      if (el) el.textContent = t;
      if (dot) {
        dot.style.background = c;
        dot.style.boxShadow = `0 0 10px ${c}`;
      }
    }, { t: text, c: dotColor });
  } catch (e) {}
}

async function showStoryCard(page, tag, description, durationMs = 0) {
  try {
    await page.evaluate(({ tag, description }) => {
      const card = document.getElementById('demo-story-card');
      const tagEl = document.getElementById('demo-story-tag');
      const descEl = document.getElementById('demo-story-desc');
      if (card && tagEl && descEl) {
        tagEl.textContent = tag;
        descEl.textContent = description;
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }
    }, { tag, description });
    if (durationMs > 0) {
      await sleep(durationMs);
      await hideStoryCard(page);
    }
  } catch (e) {}
}

async function hideStoryCard(page) {
  try {
    await page.evaluate(() => {
      const card = document.getElementById('demo-story-card');
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
      }
    });
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

async function clickElement(page, selector) {
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

async function smoothScroll(page, targetScrollY, duration = 1500) {
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

// Injects the Technical Architecture Flow Modal
async function showArchitectureModal(page, durationMs = 7500) {
  await page.evaluate(() => {
    let modal = document.getElementById('arch-flow-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'arch-flow-modal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(18, 4, 20, 0.96);
        backdrop-filter: blur(20px);
        z-index: 99999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 24px;
        opacity: 0;
        transition: opacity 0.5s ease;
      `;
      modal.innerHTML = `
        <div style="max-width: 840px; width: 100%; background: #240926; border: 1px solid rgba(244, 237, 228, 0.2); border-radius: 20px; padding: 28px 36px; box-shadow: 0 20px 60px rgba(0,0,0,0.7);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #cc4117;"></span>
              <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #f4ede4;">ARSITEKTUR INTELEJEN KEBENCANAAN TERPADU</span>
            </div>
            <span style="font-size: 11px; font-family: monospace; color: #007a5a; background: rgba(0,122,90,0.15); padding: 4px 10px; border-radius: 20px; font-weight: bold;">ISO 37120 RESILIENCE ENGINE</span>
          </div>

          <h2 style="font-size: 21px; font-weight: 800; margin-bottom: 8px; color: #ffffff; letter-spacing: -0.02em;">
            Bagaimana KotaKu Siaga Memproses Data Multi-Sumber Menjadi Aksi Cepat
          </h2>
          <p style="font-size: 12px; color: #a69e94; margin-bottom: 22px; line-height: 1.5;">
            Integrasi geospasial real-time menghubungkan sensor fisik, telemetri cuaca, laporan warga, dan verifikasi EOC.
          </p>

          <div style="display: grid; grid-template-columns: 1fr auto 1.35fr auto 1fr; align-items: center; gap: 14px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06);">
            <!-- Box 1: Ingestion -->
            <div style="background: rgba(74,21,75,0.4); border: 1px solid rgba(244,237,228,0.2); border-radius: 10px; padding: 14px; text-align: center;">
              <div style="font-size: 10px; font-weight: bold; color: #d97706; text-transform: uppercase; margin-bottom: 6px;">1. DATA SOURCES</div>
              <div style="font-size: 11px; line-height: 1.6; color: #ffffff;">
                • 70 CCTV PantauSemar<br>
                • BMKG & Open-Meteo<br>
                • Laporan Warga Lapangan<br>
                • Sensor Polder & Pompa
              </div>
            </div>

            <div style="font-size: 20px; color: #cc4117;">➔</div>

            <!-- Box 2: Core Processing -->
            <div style="background: rgba(74,21,75,0.7); border: 2px solid #4a154b; border-radius: 10px; padding: 14px; text-align: center; box-shadow: 0 0 20px rgba(74,21,75,0.5);">
              <div style="font-size: 10px; font-weight: bold; color: #007a5a; text-transform: uppercase; margin-bottom: 6px;">2. KOTAKU SIAGA ENGINE</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 6px;">
                <div style="background: rgba(255,255,255,0.08); padding: 6px; border-radius: 6px; font-size: 10px; font-weight: bold;">MONITOR</div>
                <div style="background: rgba(255,255,255,0.08); padding: 6px; border-radius: 6px; font-size: 10px; font-weight: bold;">VALIDATE</div>
                <div style="background: rgba(255,255,255,0.08); padding: 6px; border-radius: 6px; font-size: 10px; font-weight: bold;">ANALYZE</div>
              </div>
              <div style="font-size: 10px; color: #f4ede4; margin-top: 8px;">D-RISK ISO 37120 + Civic AI Copilot</div>
            </div>

            <div style="font-size: 20px; color: #cc4117;">➔</div>

            <!-- Box 3: Action -->
            <div style="background: rgba(204,65,23,0.25); border: 1px solid #cc4117; border-radius: 10px; padding: 14px; text-align: center;">
              <div style="font-size: 10px; font-weight: bold; color: #ff5722; text-transform: uppercase; margin-bottom: 6px;">3. EOC COMMAND CENTER</div>
              <div style="font-size: 11px; line-height: 1.6; color: #ffffff;">
                • Verifikasi Bukti Cepat<br>
                • Dispatch BPBD & Damkar<br>
                • Rekomendasi Mitigasi Warga<br>
                • Audit Trail Terbuka
              </div>
            </div>
          </div>

          <div style="margin-top: 18px; text-align: center; font-size: 11px; color: #007a5a; font-weight: bold;">
            WORKFLOW: OBSERVE ➔ REPORT ➔ VALIDATE ➔ ANALYZE ➔ RESPOND ➔ MONITOR
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    requestAnimationFrame(() => {
      modal.style.opacity = '1';
    });
  });

  await sleep(durationMs);

  await page.evaluate(() => {
    const modal = document.getElementById('arch-flow-modal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 600);
    }
  });
  await sleep(600);
}

(async () => {
  console.log('=== KOTAKU SIAGA MASTER PRODUCT DEMO GENERATOR (TARGET: 5 - 7 MENIT) ===');

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
  // SCENE 1: HOOK + PROBLEM (00:00 - 00:30) [~30s]
  // =========================================================================
  console.log('[SCENE 1/10] 00:00 - 00:30 | HOOK + PROBLEM');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 45000 });
  await injectPresentationEnvironment(page, 'KOTAKU SIAGA • PLATFORM PEMANTAUAN RISIKO BANJIR & ROB SEMARANG');
  await moveCursor(page, 220, 36, 400);

  await showStoryCard(
    page,
    'PROBLEM STATEMENT',
    'Kota Semarang menghadapi tantangan banjir rob pasang laut dan genangan ekstrem yang membutuhkan data cepat, akurat, dan terverifikasi dalam satu pintu.'
  );
  await sleep(7500);

  await setHud(page, 'KONDISI RISIKO IKLIM KOTA SEMARANG & STATUS ANOMALI CUACA', '#cc4117');
  await smoothScroll(page, 480, 2000);
  await sleep(6000);

  await smoothScroll(page, 950, 2000);
  await sleep(6000);

  await smoothScroll(page, 0, 1500);
  await hideStoryCard(page);
  await sleep(2500);

  // =========================================================================
  // SCENE 2: SOLUTION OVERVIEW (00:30 - 01:00) [~30s]
  // =========================================================================
  console.log('[SCENE 2/10] 00:30 - 01:00 | SOLUTION OVERVIEW');
  await setHud(page, 'SOLUSI TERPADU: PEMANTAUAN, PELAPORAN WARGA & PUSAT KOMANDO', '#4a154b');
  await showStoryCard(
    page,
    'SOLUTION OVERVIEW',
    'KotaKu Siaga mengintegrasikan pemantauan kondisi wilayah, telemetri geospasial, laporan warga, validasi bukti anti-hoax, dan pusat kendali dalam satu ekosistem terpadu.'
  );
  await sleep(7000);

  await smoothScroll(page, 650, 2200);
  await sleep(6000);

  await smoothScroll(page, 1400, 2200);
  await sleep(6000);

  await smoothScroll(page, 0, 1600);
  await hideStoryCard(page);
  await sleep(2500);

  // =========================================================================
  // SCENE 3: REAL-TIME MONITORING & MAP (01:00 - 02:00) [~60s]
  // =========================================================================
  console.log('[SCENE 3/10] 01:00 - 02:00 | REAL-TIME MONITORING / MAP');
  await setHud(page, 'PETA GEOSPASIAL: 70 CCTV PANTAUSEMAR, SENSOR AIR & POLDER', '#007a5a');
  await showStoryCard(
    page,
    'EVIDENCE & SENSORS',
    'Menampilkan sebaran 70 titik CCTV PantauSemar, sensor elevasi muka air, stasiun pompa polder, dan zonasi risiko pesisir Kaligawe, Genuk, hingga Semarang Utara.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/peta', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'PETA GEOSPASIAL INTERAKTIF KOTA SEMARANG');
  await sleep(6000);

  // Klik marker kamera CCTV di kawasan rawan (Kaligawe / Genuk)
  await setHud(page, 'TELEMETRI CCTV & SENSOR ELEVASI DI TITIK RAWAN KALIGAWE', '#007a5a');
  const marker = page.locator('.leaflet-marker-icon').nth(4);
  if ((await marker.count()) > 0) {
    const box = await marker.boundingBox();
    if (box) {
      await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 400);
      await clickAt(page, box.x + box.width / 2, box.y + box.height / 2);
      await sleep(8000); // Penonton membaca data popup telemetri
    }
  }

  // Klik marker kedua untuk komparasi lokasi pesisir
  const marker2 = page.locator('.leaflet-marker-icon').nth(15);
  if ((await marker2.count()) > 0) {
    const box = await marker2.boundingBox();
    if (box) {
      await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2, 400);
      await clickAt(page, box.x + box.width / 2, box.y + box.height / 2);
      await sleep(7500);
    }
  }

  await smoothScroll(page, 320, 1500);
  await sleep(6000);
  await smoothScroll(page, 0, 1000);
  await hideStoryCard(page);
  await sleep(3000);

  // =========================================================================
  // SCENE 4: CITIZEN REPORTING (02:00 - 03:00) [~60s]
  // =========================================================================
  console.log('[SCENE 4/10] 02:00 - 03:00 | CITIZEN REPORTING');
  await setHud(page, 'PELAPORAN WARGA: ALUR RESMI PENGIRIMAN DATA GENANGAN', '#cc4117');
  await showStoryCard(
    page,
    'CITIZEN WORKFLOW',
    'Warga dapat langsung melaporkan kejadian bencana dengan verifikasi identitas, estimasi ketinggian air, geotagging presisi, dan bukti foto lapangan.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/laporan/baru', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'FORMULIR PELAPORAN WARGA (MULTI-STEP WIZARD)');
  await sleep(5000);

  // Demonstrasi validasi field wajib (error handling anti-spam)
  await setHud(page, 'VALIDASI SISTEM: MEMASTIKAN DATA TERVERIFIKASI & ANTI-SPAM', '#cc4117');
  await clickElement(page, 'button:has-text("Lanjutkan")');
  await sleep(4000);

  // Input Data Demo Warga
  await setHud(page, 'INPUT DATA IDENTITAS PELAPOR SECARA AMAN', '#007a5a');
  const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
  if ((await inputs.count()) >= 3) {
    await inputs.nth(0).fill('Budi Santoso (Warga Semarang)');
    await sleep(600);
    await inputs.nth(1).fill('budi.santoso@warga.semarangkota.go.id');
    await sleep(600);
    await inputs.nth(2).fill('081234567890');
    await sleep(1000);
  }

  // Masuk Langkah 2
  await setHud(page, 'LANGKAH 2: PEMILIHAN KATEGORI BENCANA & GEOLOKASI', '#4a154b');
  await clickElement(page, 'button:has-text("Lanjutkan")');
  await sleep(6000);

  await smoothScroll(page, 380, 1500);
  await sleep(7000);

  // Buka Feed Laporan Publik
  await setHud(page, 'TRANSPARANSI FEED: DAFTAR LAPORAN WARGA TERVERIFIKASI (/laporan)', '#007a5a');
  await page.goto('https://kotaku-siaga.vercel.app/laporan', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'FEED LAPORAN WARGA & STATUS PENANGANAN LAPANGAN');
  await sleep(5000);

  await smoothScroll(page, 450, 1500);
  await sleep(6000);
  await smoothScroll(page, 0, 1000);
  await hideStoryCard(page);
  await sleep(2500);

  // =========================================================================
  // SCENE 5: VALIDATION + ADMIN / COMMAND CENTER (03:00 - 04:00) [~60s]
  // =========================================================================
  console.log('[SCENE 5/10] 03:00 - 04:00 | VALIDATION & COMMAND CENTER');
  await setHud(page, 'OTENTIKASI PETUGAS PUSAT KENDALI OPERASI (EOC SIAGA)', '#4a154b');
  await showStoryCard(
    page,
    'COMMAND & CONTROL',
    'Petugas Pusat Kendali Operasi memverifikasi laporan masuk, memeriksa validitas bukti foto, mengeskalasi status, dan mengoordinasikan respons tanggap darurat.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'PORTAL LOGIN PUSAT KENDALI OPERASI (RBAC SUPABASE)');
  await sleep(4000);

  await page.fill('#identifier', 'operator.siaga');
  await sleep(600);
  await page.fill('#password', 'Siaga@Prod_26!K7m');
  await sleep(800);
  await clickElement(page, 'button[type="submit"]');
  await sleep(4000);

  // Dashboard Pusat Komando
  await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'DASHBOARD PUSAT KOMANDO & ANALITIK KEBENCANAAN');
  await sleep(6000);

  await setHud(page, 'MODERASI & VERIFIKASI BUKTI LAPORAN WARGA', '#007a5a');
  await smoothScroll(page, 450, 1600);
  await sleep(7000);

  await setHud(page, 'KORELASI SILANG MULTI-SUMBER & KONTROL 16 LAYER TAKTIS', '#4a154b');
  await smoothScroll(page, 1050, 1800);
  await sleep(7000);

  // Display Kiosk Layar Lebar Command Center
  await setHud(page, 'DISPLAY MONITOR BESAR KIOSK PUSAT PENGENDALI OPERASI', '#007a5a');
  await page.goto('https://kotaku-siaga.vercel.app/command-center', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'LAYAR KIOSK MONITOR BESAR PUSAT PENGENDALI BENCANA');
  await sleep(7500);

  await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'DASHBOARD PUSAT KOMANDO & ANALITIK KEBENCANAAN');
  await sleep(2500);

  await smoothScroll(page, 0, 1200);
  await hideStoryCard(page);
  await sleep(2500);

  // =========================================================================
  // SCENE 6 & 7: RISK MATRIX + DATA INTEGRITY (04:00 - 04:45) [~45s]
  // =========================================================================
  console.log('[SCENE 6 & 7/10] 04:00 - 04:45 | RISK MATRIX + DATA INTEGRITY');
  await setHud(page, 'MATRIKS RISIKO WILAYAH: INDEKS D-RISK ISO 37120 KOTA SEMARANG', '#007a5a');
  await showStoryCard(
    page,
    'EXPLAINABLE RISK AI',
    'Menilai indeks risiko objektif 16 kecamatan berdasarkan curah hujan, kapasitas pompa polder, kualitas drainase, dan histori keterpaparan iklim.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/priorities', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'MATRIKS RISIKO KECAMATAN (ISO 37120 SMART RESILIENT CITY)');
  await sleep(5000);

  await smoothScroll(page, 520, 1600);
  await sleep(6500);

  // Integritas Data & Lineage
  await setHud(page, 'INTEGRITAS DATA & PROVENANCE: TRANSKIP SUMBER RESMI DAN AUDIT TRAIL', '#4a154b');
  await page.goto('https://kotaku-siaga.vercel.app/data', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'PORTAL INTEGRITAS DATA & DATA LINEAGE AUDIT');
  await sleep(5000);

  await smoothScroll(page, 550, 1500);
  await sleep(6500);
  await smoothScroll(page, 0, 1000);
  await hideStoryCard(page);
  await sleep(2500);

  // =========================================================================
  // SCENE 8: AI COPILOT / EDUCATION / SOS (04:45 - 05:30) [~45s]
  // =========================================================================
  console.log('[SCENE 8/10] 04:45 - 05:30 | AI / EDUCATION / SOS');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'CIVIC AI COPILOT 2.0: KECERDASAN BUATAN BENCANA IKLIM');

  // Civic AI Copilot
  await setHud(page, 'KONSULTASI INTERAKTIF CIVIC AI COPILOT 2.0', '#007a5a');
  await showStoryCard(
    page,
    'CIVIC AI INTELLIGENCE',
    'Civic AI Copilot memproses telemetri multi-sumber secara real-time untuk menjawab kondisi spesifik wilayah dan rekomendasi mitigasi warga.'
  );
  await clickElement(page, 'button:has-text("Civic AI Copilot")');
  await sleep(3500);

  const chip = page.locator('button:has-text("Genuk")').first();
  if ((await chip.count()) > 0 && (await chip.isVisible())) {
    await chip.click();
  } else {
    const inputAi = page.locator('input[placeholder*="Tanyakan kondisi"]').first();
    if ((await inputAi.count()) > 0) {
      await inputAi.fill('Bagaimana cara melaporkan kondisi banjir di Genuk?');
      await sleep(400);
      await page.keyboard.press('Enter');
    }
  }
  await sleep(7500); // Penonton melihat jawaban AI terstruktur

  await clickElement(page, 'button:has-text("Tutup Copilot")');
  await sleep(2000);

  // Edukasi Bencana Singkat
  await setHud(page, 'MODUL EDUKASI BENCANA & SIMULASI KESTABILAN LERENG', '#4a154b');
  await page.goto('https://kotaku-siaga.vercel.app/edukasi', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'EDUKASI BENCANA & KESIAPSIAGAAN MANDIRI WARGA');
  await smoothScroll(page, 450, 1400);
  await sleep(6000);

  // SOS Darurat 1-Klik
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'LAYANAN SOS DARURAT 1-KLIK & HOTLINE BPBD 112');
  await setHud(page, 'LAYANAN SOS DARURAT 1-KLIK & HOTLINE BPBD 112 KOTA SEMARANG', '#cc4117');
  await clickElement(page, 'button:has-text("SOS")');
  await sleep(2000);
  await injectPresentationEnvironment(page, 'BEACON SOS DARURAT & HOTLINE TERINTEGRASI BPBD 112');
  await sleep(6500);

  const closeSos = page.locator('button[aria-label*="Tutup"], button:has-text("Tutup"), .lucide-x').first();
  if ((await closeSos.count()) > 0) {
    await closeSos.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await hideStoryCard(page);
  await sleep(2500);

  // =========================================================================
  // SCENE 9: END-TO-END SCENARIO (05:30 - 06:15) [~45s]
  // =========================================================================
  console.log('[SCENE 9/10] 05:30 - 06:15 | END-TO-END USER SCENARIO');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'SIMULASI SKENARIO END-TO-END: WARGA MENEMUKAN GENANGAN AIR');

  // Step 1: OBSERVE
  await setHud(page, '1. OBSERVE: WARGA MEMERIKSA STATUS PETA & CCTV DI LOKASI', '#007a5a');
  await showStoryCard(
    page,
    'STEP 1: OBSERVE',
    'Warga membuka KotaKu Siaga, melihat kondisi titik pemantauan dan elevasi genangan di wilayah Kaligawe.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/peta', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'PETA GEOSPASIAL INTERAKTIF KOTA SEMARANG');
  await sleep(5500);

  // Step 2: REPORT
  await setHud(page, '2. REPORT: WARGA MENGIRIMKAN LAPORAN GENANGAN LENGKAP BUKTI', '#cc4117');
  await showStoryCard(
    page,
    'STEP 2: REPORT',
    'Warga mengisi form laporan darurat dengan koordinat presisi dan bukti foto kejadian.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/laporan/baru', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'FORMULIR PELAPORAN WARGA (MULTI-STEP WIZARD)');
  await sleep(5500);

  // Step 3: VALIDATE & RESPOND
  await setHud(page, '3. VALIDATE & RESPOND: PUSAT KOMANDO MEMVALIDASI & MENGESKALASI', '#4a154b');
  await showStoryCard(
    page,
    'STEP 3: VALIDATE & RESPOND',
    'Operator EOC menerima laporan, memvalidasi bukti, memperbarui status, dan mengaktifkan koordinasi lapangan.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'DASHBOARD PUSAT KOMANDO & ANALITIK KEBENCANAAN');
  await sleep(6500);

  // Step 4: MONITOR
  await setHud(page, '4. MONITOR: STATUS TERUPDATE DAN DAPAT DIPANTAU SELURUH WARGA', '#007a5a');
  await showStoryCard(
    page,
    'STEP 4: MONITOR',
    'Status penanganan genangan langsung tercermin pada feed laporan publik dan peta risiko secara transparan.'
  );
  await page.goto('https://kotaku-siaga.vercel.app/laporan', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'FEED LAPORAN WARGA & STATUS PENANGANAN LAPANGAN');
  await sleep(6500);
  await hideStoryCard(page);

  // =========================================================================
  // SCENE 10: ARCHITECTURE FLOW & CLOSING (06:15 - 06:40) [~25s]
  // =========================================================================
  console.log('[SCENE 10/10] 06:15 - 06:40 | SYSTEM ARCHITECTURE DIAGRAM & CLOSING');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  await injectPresentationEnvironment(page, 'ARSITEKTUR INTELEJEN KEBENCANAAN TERPADU KOTA SEMARANG');

  // Menampilkan Diagram Alur Sistem selama 7.5 detik (sesuai instruksi poin 7)
  await showArchitectureModal(page, 7500);

  // Closing Shot pada Hero Homepage
  await setHud(page, 'KOTAKU SIAGA — CIVIC CLIMATE INTELLIGENCE FOR A SAFER SEMARANG', '#007a5a');
  await showStoryCard(
    page,
    'IMPACT & VISION',
    'Mengintegrasikan pemantauan risiko, data geospasial, laporan warga, dan kesiapsiagaan dalam satu platform untuk mendukung ketahanan bencana Kota Semarang.'
  );
  await smoothScroll(page, 0, 600);
  await moveCursor(page, 640, 240, 500);
  await sleep(8000); // Closing frame stabil dan bersih

  console.log('Finalizing video recording...');
  await context.close();
  await browser.close();

  console.log('Master Video Demo recording finished successfully!');
  const files = fs.readdirSync(recordingsDir);
  console.log('Recordings directory contains:', files);
})();
