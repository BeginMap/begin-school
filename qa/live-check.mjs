// Smoke test of the deployed site: every page loads, no console errors, field on, images and fonts load.
import { launch } from './browser.mjs';
const BASE = process.argv[2] || 'https://beginmap.github.io/begin-school/';
const browser = await launch();
let bad = 0;
for (const sub of ['', 'ar/', 'ru/', 'en/', 'parents/', 'ar/parents/', 'ru/privacy/', 'nope/']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/nope/')) errs.push(`${r.status()} ${r.url()}`); });
  await page.goto(BASE + sub, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  await page.waitForTimeout(1200);
  const st = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    cls: document.documentElement.className,
    imgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).length,
    fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.style).filter((v, i, a) => a.indexOf(v) === i).join(', '),
    title: document.title,
  }));
  const ok = !errs.length && st.imgs === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'BAD'} /${sub} ${st.lang} [${st.cls}] broken-img:${st.imgs} fonts:${st.fonts} | ${st.title}${errs.length ? '\n   ' + errs.slice(0, 5).join('\n   ') : ''}`);
  await page.close();
}
await browser.close();
console.log(bad ? `${bad} pages with problems` : 'live: all pages OK');
