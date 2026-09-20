const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'demo-hud';
    el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);background:rgba(29,29,29,0.92);color:#fff;font-family:sans-serif;font-size:12px;font-weight:bold;padding:6px 16px;border-radius:99px;border:1px solid rgba(255,255,255,0.2);box-shadow:0 4px 16px rgba(0,0,0,0.3);z-index:999998;pointer-events:none;display:flex;align-items:center;gap:8px;';
    el.innerHTML = '<span style="width:8px;height:8px;border-radius:50%;background:#007a5a;display:inline-block;box-shadow:0 0 8px #007a5a;"></span> DEMO RESMI • KOTAKU SIAGA SEMARANG';
    document.body.appendChild(el);
  });

  const hudText = await page.locator('#demo-hud').textContent();
  console.log('HUD text:', hudText);
  await browser.close();
})();
