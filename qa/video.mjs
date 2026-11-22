// Records a short video of the living background: scroll bursts, stop (spring settle), mouse moves,
// taps (ripples), hover over a button, a language switch. Output: qa/out/video/*.webm
import { launch } from './browser.mjs';
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
fs.mkdirSync('qa/out/video', { recursive: true });
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'qa/out/video', size: { width: 1280, height: 720 } } });
await ctx.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500); // intro + breathing at rest

// pointer: slow, then fast strokes across the hero
await page.mouse.move(200, 400);
await page.mouse.move(700, 360, { steps: 40 });
await page.mouse.move(1100, 300, { steps: 8 });
await page.mouse.move(300, 500, { steps: 6 });
await page.waitForTimeout(800);
// taps → ripples
for (const [x, y] of [[640, 360], [300, 250], [1000, 520]]) { await page.mouse.click(x, y); await page.waitForTimeout(450); }
await page.waitForTimeout(800);
// scroll bursts then stop: lines bend and stretch, then settle (~0.6 s)
for (let i = 0; i < 3; i++) {
  for (let k = 0; k < 10; k++) { await page.mouse.wheel(0, 180); await page.waitForTimeout(16); }
  await page.waitForTimeout(1100);
}
// hover a button: field focuses under it
const btn = page.locator('.hd__link').first();
await btn.hover();
await page.waitForTimeout(1200);
// language switch: wave in the new reading direction while the text changes
await page.locator('[data-lang-menu] summary').click();
await page.waitForTimeout(300);
await page.locator('[data-lang-link="ru"]').first().click();
await page.waitForTimeout(2200);
await page.locator('[data-lang-menu] summary').click();
await page.waitForTimeout(300);
await page.locator('[data-lang-link="ar"]').first().click();
await page.waitForTimeout(2200);
// idle: breathing never stops
await page.waitForTimeout(2000);
const v = page.video();
await ctx.close();
const p = await v.path();
fs.renameSync(p, 'qa/out/video/field.webm');
await browser.close();
console.log('video: qa/out/video/field.webm');
