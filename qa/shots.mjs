// Screenshots of every section: node qa/shots.mjs [--langs he,ru] [--widths 390,1440] [--mode normal|reduced|nojs] [--base URL]
// Output: qa/out/<mode>/<lang>-<width>-<NN>-<section>.jpg
import { launch } from './browser.mjs';
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://127.0.0.1:4321/begin-school/');
const LANGS = arg('langs', 'he,ar,ru,en').split(',');
const WIDTHS = arg('widths', '390,768,1440').split(',').map(Number);
const MODE = arg('mode', 'normal');
const ONLY = arg('only', '');
const HEIGHT = { 390: 844, 768: 1024, 1440: 900 };
const OUT = path.join('qa', 'out', MODE);
fs.mkdirSync(OUT, { recursive: true });

const SECTIONS = ['top', 'years', 'changes', 'day', 'day@0.5', 'day@1', 'campus', 'campus@0.35', 'campus@0.7', 'campus@1', 'names', 'life', 'beginmap', 'safe', 'getting', 'faq', 'finale'];
const errors = [];

const browser = await launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const lang of LANGS) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: HEIGHT[w] ?? 900 },
      deviceScaleFactor: 1,
      reducedMotion: MODE === 'reduced' ? 'reduce' : 'no-preference',
      javaScriptEnabled: MODE !== 'nojs',
      locale: lang,
      hasTouch: w < 768,
      isMobile: w < 768,
    });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${lang}-${w}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`${lang}-${w}: ${e.message}`));
    const url = BASE + (lang === 'he' ? '' : lang + '/');
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
    await page.waitForTimeout(MODE === 'nojs' ? 200 : 1800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) errors.push(`${lang}-${w}: horizontal overflow ${overflow}px`);
    let n = 0;
    for (const s of SECTIONS) {
      if (ONLY && !s.startsWith(ONLY)) continue;
      const [id, frac] = s.split('@');
      if (id === 'top') await page.evaluate(() => scrollTo(0, 0));
      else {
        const ok = await page.evaluate(([id, frac]) => {
          const el = document.getElementById(id);
          if (!el) return false;
          const pin = el.querySelector('.pin-spacer');
          const top = el.getBoundingClientRect().top + scrollY;
          if (frac !== undefined && pin) {
            const sp = pin.getBoundingClientRect();
            const start = sp.top + scrollY;
            scrollTo(0, start + (sp.height - innerHeight) * Number(frac));
          } else if (frac !== undefined) return 'skip';
          else scrollTo(0, top - (id === 'finale' ? 0 : 0));
          return true;
        }, [id, frac]);
        if (ok === 'skip' || !ok) continue;
        // let lenis / scrub catch up
        for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 1); await page.waitForTimeout(60); }
      }
      await page.waitForTimeout(MODE === 'nojs' ? 150 : 1300);
      const file = path.join(OUT, `${lang}-${w}-${String(n++).padStart(2, '0')}-${s.replace('@', '_')}.jpg`);
      await page.screenshot({ path: file, type: 'jpeg', quality: 72 });
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'errors.txt'), errors.join('\n'));
console.log(`shots done → ${OUT}; ${errors.length} problems`);
if (errors.length) console.log(errors.slice(0, 30).join('\n'));
