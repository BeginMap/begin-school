import { launch } from './browser.mjs';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
await page.goto('http://127.0.0.1:4321/begin-school/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
for (const id of ['faq', 'finale']) {
  await page.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 1); await page.waitForTimeout(80); }
  await page.waitForTimeout(1500);
  console.log(id, JSON.stringify(await page.evaluate(() => {
    const f = document.querySelector('[data-finale]');
    const r = f.getBoundingClientRect();
    return { top: Math.round(r.top), c: getComputedStyle(f).getPropertyValue('--c'), inline: f.style.cssText, op: getComputedStyle(f.querySelector('.finale__c')).opacity, story: document.documentElement.className };
  })));
}
await browser.close();
