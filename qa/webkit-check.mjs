// WebKit (Safari engine) smoke test with the WebKit build already on this machine.
import { webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const root = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const dir = fs.readdirSync(root).filter((d) => /^webkit-\d+$/.test(d)).sort().pop();
const exe = path.join(root, dir, 'Playwright.exe');
const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const browser = await webkit.launch({ executablePath: exe });
fs.mkdirSync('qa/out/webkit', { recursive: true });
for (const [lang, sub] of [['he', ''], ['ar', 'ar/'], ['ru', 'ru/']]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(BASE + sub, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => ({ cls: document.documentElement.className, gl2: !!document.createElement('canvas').getContext('webgl2') }));
  await page.screenshot({ path: `qa/out/webkit/${lang}-top.jpg`, type: 'jpeg', quality: 70 });
  await page.evaluate(() => document.getElementById('campus').scrollIntoView());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `qa/out/webkit/${lang}-campus.jpg`, type: 'jpeg', quality: 70 });
  console.log(lang, JSON.stringify(st), errs.length ? errs.slice(0, 4).join(' | ') : 'no errors');
  await page.close();
}
await browser.close();
