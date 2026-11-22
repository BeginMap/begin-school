import { launch } from './browser.mjs';
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
await page.goto('http://127.0.0.1:4321/begin-school/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.evaluate(() => window.__st.refresh());
await page.waitForTimeout(500);
console.log(JSON.stringify(await page.evaluate(() => {
  const st = window.__st.getAll();
  const fin = document.getElementById('finale');
  const sec = document.getElementById('faq');
  return { docH: document.documentElement.scrollHeight, finTop: fin.getBoundingClientRect().top + scrollY, faqTop: sec.getBoundingClientRect().top + scrollY,
    triggers: st.map((s) => ({ t: (s.trigger?.id || s.trigger?.className || '').toString().slice(0, 30), start: Math.round(s.start), end: Math.round(s.end), pin: !!s.pin })).slice(-14) };
})));
await browser.close();
