// axe-core (WCAG 2.2 A/AA) on every page and language, mobile and desktop, motion on and reduced.
import { launch } from './browser.mjs';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const LANGS = ['he', 'ar', 'ru', 'en'];
const PAGES = ['', 'parents/', 'privacy/', '404'];
const browser = await launch();
let total = 0;
for (const [w, h, rm] of [[390, 844, 'no-preference'], [1440, 900, 'reduce']]) {
  for (const lang of LANGS) {
    for (const p of PAGES) {
      if (p === '404' && lang !== 'he') continue;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: rm });
      await ctx.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
      const page = await ctx.newPage();
      const url = p === '404' ? BASE + 'no-such-page/' : BASE + (lang === 'he' ? '' : lang + '/') + p;
      await page.goto(url, { waitUntil: 'networkidle' });
      // walk the page so lazy content and reveals are in their final state
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(600);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      const v = r.violations;
      total += v.length;
      console.log(`${lang} ${p || 'home'} ${w}px ${rm}: ${v.length} violations, ${r.incomplete.length} incomplete`);
      for (const x of v) console.log(`  [${x.impact}] ${x.id}: ${x.help} — ${x.nodes.length} nodes; e.g. ${x.nodes[0].target.join(' ')} :: ${x.nodes[0].failureSummary?.split('\n')[1] ?? ''}`);
      await ctx.close();
    }
  }
}
await browser.close();
console.log(total ? `TOTAL ${total} violations` : 'axe: 0 violations');
process.exit(total ? 1 : 0);
