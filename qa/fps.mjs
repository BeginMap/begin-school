// Frame-time measurement during a programmatic scroll through the whole home page.
//   node qa/fps.mjs [--langs he,ar,ru,en] [--gpu real|soft] [--cpu 4] [--width 390]
// gpu=real: the machine's GPU; gpu=soft: SwiftShader (software) — a pessimistic stand-in for a weak phone GPU.
import { launch } from './browser.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://127.0.0.1:4321/begin-school/');
const LANGS = arg('langs', 'he,ar,ru,en').split(',');
const GPU = arg('gpu', 'real');
const CPU = Number(arg('cpu', '4'));
const W = Number(arg('width', '390'));
const H = W < 768 ? 844 : 900;
const SPEED = Number(arg('speed', '1400')); // px per second
const CSS = arg('css', ''); // extra CSS to inject (experiments)

const args = GPU === 'soft' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [];
const browser = await launch({ args });
const rows = [];
for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: W < 768 ? 2.6 : 1, isMobile: W < 768, hasTouch: W < 768 });
  await ctx.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); } catch {} });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(BASE + (lang === 'he' ? '' : lang + '/'), { waitUntil: 'networkidle' });
  if (CSS) await page.addStyleTag({ content: CSS });
  if (process.argv.includes('--nofield')) await page.evaluate(() => window.__field?.setStill(true, true));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await page.waitForTimeout(3500);
  const res = await page.evaluate(async (speed) => {
    const total = document.documentElement.scrollHeight - innerHeight;
    const times = [];
    let last = performance.now();
    let y = 0;
    await new Promise((done) => {
      const step = (now) => {
        const dt = now - last;
        last = now;
        times.push(dt);
        y = Math.min(total, y + (speed * dt) / 1000);
        scrollTo(0, y);
        if (y >= total) done(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    // 2 s of idle after the scroll: the field must keep breathing
    const idle = [];
    await new Promise((done) => {
      const t0 = performance.now();
      let l = t0;
      const s = (now) => { idle.push(now - l); l = now; if (now - t0 < 2000) requestAnimationFrame(s); else done(); };
      requestAnimationFrame(s);
    });
    const st = (a) => {
      const b = a.slice(2).sort((p, q) => p - q);
      const avg = b.reduce((p, q) => p + q, 0) / b.length;
      return { frames: b.length, fps: +(1000 / avg).toFixed(1), p95: +b[Math.floor(b.length * 0.95)].toFixed(1), over33: +((b.filter((x) => x > 33.4).length / b.length) * 100).toFixed(1) };
    };
    return { scroll: st(times), idle: st(idle), field: window.__field?.stats?.() ?? null };
  }, SPEED);
  rows.push({ lang, ...res });
  console.log(`${lang} w${W} gpu=${GPU} cpu×${CPU}: scroll ${res.scroll.fps} fps (p95 ${res.scroll.p95} ms, >33ms ${res.scroll.over33}%), idle ${res.idle.fps} fps; field ${JSON.stringify(res.field)}`);
  await ctx.close();
}
await browser.close();
