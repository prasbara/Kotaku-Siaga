const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  
  page.on('response', async (res) => {
    if (res.url().includes('/api/auth/login')) {
      console.log('Login API status:', res.status());
      try {
        console.log('Login API response:', await res.json());
      } catch (e) {
        console.log('Login API text:', await res.text());
      }
    }
  });

  await page.goto('https://kotaku-siaga.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#identifier', 'operator.siaga');
  await page.fill('#password', 'Siaga@Prod_26!K7m');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('Current URL:', page.url());

  const errEl = await page.locator('div:has-text("tidak valid"), div:has-text("kendala")').allTextContents();
  console.log('Any error on page:', errEl);

  // Also test direct navigation to /dashboard
  await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle' });
  console.log('Dashboard URL:', page.url());

  await browser.close();
})();
