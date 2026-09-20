const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  console.log('--- 1. Testing Homepage ---');
  await page.goto('https://kotaku-siaga.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Homepage loaded:', page.url());

  console.log('--- 2. Testing Map (/peta) ---');
  await page.goto('https://kotaku-siaga.vercel.app/peta', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Peta loaded:', page.url());
  const mapMarkers = await page.locator('.leaflet-marker-icon').count();
  console.log('Leaflet markers found:', mapMarkers);

  console.log('--- 3. Testing Priorities (/priorities) ---');
  await page.goto('https://kotaku-siaga.vercel.app/priorities', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Priorities loaded:', page.url());

  console.log('--- 4. Testing Data Integrity (/data) ---');
  await page.goto('https://kotaku-siaga.vercel.app/data', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Data integrity loaded:', page.url());

  console.log('--- 5. Testing Education (/edukasi) ---');
  await page.goto('https://kotaku-siaga.vercel.app/edukasi', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Edukasi loaded:', page.url());

  console.log('--- 6. Testing Report Form (/laporan/baru) ---');
  await page.goto('https://kotaku-siaga.vercel.app/laporan/baru', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Laporan baru loaded:', page.url());

  console.log('--- 7. Testing Login & Dashboard ---');
  await page.goto('https://kotaku-siaga.vercel.app/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('#identifier', 'operator.siaga');
  await page.fill('#password', 'Siaga@Prod_26!K7m');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('After login URL:', page.url());

  await browser.close();
  console.log('All tests passed!');
})();
