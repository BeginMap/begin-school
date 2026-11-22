// Language switch keeps the canvas (same WebGL context) and swaps the text; back button works.
import { launch } from './browser.mjs';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.evaluate(() => { window.__canvasId = Math.random(); document.getElementById('field').dataset.marker = String(window.__canvasId); });
const state = () => page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, h1: document.querySelector('h1')?.textContent?.trim().slice(0, 30), canvasSame: document.getElementById('field')?.dataset.marker === String(window.__canvasId), fieldOn: document.documentElement.classList.contains('field-on'), story: document.documentElement.classList.contains('story'), url: location.pathname }));
console.log('start', JSON.stringify(await state()));
for (const l of ['ru', 'ar', 'en', 'he']) {
  await page.locator('[data-lang-menu] summary').click();
  await page.waitForTimeout(250);
  await page.locator(`[data-lang-menu] [data-lang-link="${l}"]`).click();
  await page.waitForTimeout(1800);
  console.log(l, JSON.stringify(await state()));
}
await page.goBack();
await page.waitForTimeout(1500);
console.log('back', JSON.stringify(await state()));
await page.locator('.hd__link').click();
await page.waitForTimeout(1500);
console.log('parents', JSON.stringify(await state()));
console.log('errors:', errs.length ? errs.join(' | ') : 'none');
await browser.close();
