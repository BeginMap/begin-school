// Checks every link and image on every built page: internal ones against the local server,
// external ones with a real request (HEAD, then GET). Run with the preview server up.
import { parse } from 'node-html-parser';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const DIST = 'dist';
const pages = [];
const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!['_a', 'img', 'og'].includes(f)) walk(p); } else if (f.endsWith('.html')) pages.push(p); } };
walk(DIST);
const urls = new Map();
for (const p of pages) {
  const rel = path.relative(DIST, p).replace(/\\/g, '/').replace(/index\.html$/, '');
  const pageUrl = new URL(rel, BASE);
  const root = parse(fs.readFileSync(p, 'utf8'));
  for (const el of root.querySelectorAll('a[href], link[href], img[src], source[srcset], script[src], image[href]')) {
    const raw = el.getAttribute('href') ?? el.getAttribute('src') ?? el.getAttribute('srcset');
    const list = el.tagName === 'SOURCE' || el.hasAttribute('srcset') ? raw.split(',').map((s) => s.trim().split(' ')[0]) : [raw];
    for (const u of list) {
      if (!u || u.startsWith('#') || u.startsWith('tel:') || u.startsWith('mailto:') || u.startsWith('data:')) continue;
      const abs = new URL(u, pageUrl).toString().replace('https://beginmap.github.io/begin-school/', BASE);
      if (!urls.has(abs)) urls.set(abs, rel || '/');
    }
  }
}
let bad = 0;
const check = async (u) => {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(u, { method, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (link check)' }, signal: AbortSignal.timeout(20000) });
      if (r.ok) return r.status;
      if (method === 'GET') return r.status;
    } catch (e) { if (method === 'GET') return String(e.cause?.code || e.name); }
  }
};
const list = [...urls.keys()];
for (let i = 0; i < list.length; i += 8) {
  const res = await Promise.all(list.slice(i, i + 8).map(async (u) => [u, await check(u)]));
  for (const [u, s] of res) if (!(typeof s === 'number' && s < 400)) { bad++; console.log(`BROKEN ${s} ${u} (on ${urls.get(u)})`); }
}
console.log(`links: ${list.length} unique, ${bad} broken`);
