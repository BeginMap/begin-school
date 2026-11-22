// Renders every field state (no content) into qa/out/lab/<state>.jpg for tuning.
import { launch } from './browser.mjs';
import fs from 'node:fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const names = (process.argv[3] || 'hero,years,chaos,grid,day,campus,names,life,map,safe,route,faq,finale,page,lost').split(',');
fs.mkdirSync('qa/out/lab', { recursive: true });
const browser = await launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'body > *:not(#field){visibility:hidden!important} .lens{display:none}' });
await page.waitForTimeout(2500);
for (const n of names) {
  await page.evaluate((n) => window.__field.force(n), n);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `qa/out/lab/${n}.jpg`, type: 'jpeg', quality: 75 });
}
await browser.close();
console.log('lab done');
