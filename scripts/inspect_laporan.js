const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  
  await page.goto('https://kotaku-siaga.vercel.app/laporan/baru', { waitUntil: 'networkidle' });
  console.log('Form labels:', await page.locator('label').allTextContents());
  console.log('Inputs:', await page.locator('input, textarea, select').count());
  
  await browser.close();
})();
