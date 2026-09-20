const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  
  await page.goto('https://kotaku-siaga.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#identifier', 'operator.siaga');
  await page.fill('#password', 'Siaga@Prod_26!K7m');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('https://kotaku-siaga.vercel.app/dashboard', { waitUntil: 'networkidle' });

  console.log('Dashboard title/heading:', await page.locator('h1, h2').allTextContents());
  const buttons = await page.locator('button').allTextContents();
  console.log('Sample buttons on dashboard:', buttons.slice(0, 15));

  await browser.close();
})();
