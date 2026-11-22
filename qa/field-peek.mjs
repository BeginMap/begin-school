// Quick look at the living field: screenshots at a few scroll positions + field stats.
import { launch } from './browser.mjs';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const browser = await launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const logs = [];
page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('suggest-done', '1'));
await page.waitForTimeout(2500);
console.log('stats', JSON.stringify(await page.evaluate(() => window.__field?.stats?.() ?? null)), await page.evaluate(() => document.documentElement.className));
const at = [0, 0.18, 0.4, 0.55, 0.75, 0.97];
for (const f of at) {
  await page.evaluate((f) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), f);
  await page.mouse.move(640, 400); await page.mouse.move(700, 420, { steps: 8 });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `qa/out/field-${String(Math.round(f * 100)).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
}
console.log(logs.slice(0, 20).join('\n'));
await browser.close();
