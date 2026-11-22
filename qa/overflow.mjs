// Finds elements that stick out of the viewport horizontally (true overflow, also on mobile emulation).
import { launch } from './browser.mjs';
const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const langs = (process.argv[3] || 'he,ar,ru,en').split(',');
const widths = (process.argv[4] || '320,390').split(',').map(Number);
const browser = await launch();
let bad = 0;
for (const lang of langs) for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const sub of ['', 'parents/', 'privacy/']) {
    await page.goto(BASE + (lang === 'he' ? '' : lang + '/') + sub, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const res = await page.evaluate((W) => {
      const out = [];
      const sw = document.documentElement.scrollWidth;
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.right > W + 1 || r.left < -1) {
          // ignore descendants of clipping ancestors
          let p = el.parentElement, clipped = false;
          while (p && p !== document.body) {
            const o = getComputedStyle(p);
            if (/(hidden|clip|auto|scroll)/.test(o.overflowX)) { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1 && pr.left >= -1) { clipped = true; break; } }
            p = p.parentElement;
          }
          if (!clipped) out.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        }
      }
      return { sw, iw: innerWidth, out: out.slice(0, 12) };
    }, w);
    if (res.out.length || res.sw > w || res.iw > w) { bad++; console.log(`${lang} ${w} /${sub}: scrollW=${res.sw} innerW=${res.iw}\n  ` + res.out.join('\n  ')); }
  }
  await ctx.close();
}
await browser.close();
console.log(bad ? `${bad} pages with overflow` : 'no horizontal overflow');
