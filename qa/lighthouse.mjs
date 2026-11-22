// Lighthouse (mobile preset: simulated 4G + CPU ×4) for every language: scores + LCP / CLS / TBT.
//   node qa/lighthouse.mjs [baseUrl] [--desktop]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { executablePath } from './browser.mjs';

const BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'https://beginmap.github.io/begin-school/';
const desktop = process.argv.includes('--desktop');
const OUT = path.join('qa', 'out', 'lh');
fs.mkdirSync(OUT, { recursive: true });
const pages = [['he', ''], ['ar', 'ar/'], ['ru', 'ru/'], ['en', 'en/'], ['he-parents', 'parents/'], ['ru-parents', 'ru/parents/']];
const rows = [];
for (const [name, sub] of pages) {
  const file = path.join(OUT, `${name}${desktop ? '-desktop' : ''}.json`);
  const args = ['lighthouse', BASE + sub, '--quiet', '--output=json', `--output-path=${file}`, `--chrome-path=${executablePath}`, '--chrome-flags=--headless=new', '--only-categories=performance,accessibility,best-practices,seo'];
  if (desktop) args.push('--preset=desktop');
  execFileSync('npx', args, { stdio: 'inherit', shell: true });
  const r = JSON.parse(fs.readFileSync(file, 'utf8'));
  const c = r.categories, a = r.audits;
  const row = {
    page: name,
    perf: Math.round(c.performance.score * 100),
    a11y: Math.round(c.accessibility.score * 100),
    bp: Math.round(c['best-practices'].score * 100),
    seo: Math.round(c.seo.score * 100),
    LCP: a['largest-contentful-paint'].displayValue,
    CLS: a['cumulative-layout-shift'].displayValue,
    TBT: a['total-blocking-time'].displayValue,
    FCP: a['first-contentful-paint'].displayValue,
  };
  rows.push(row);
  console.log(JSON.stringify(row));
  const fails = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary').map((x) => x.id);
  if (fails.length) console.log('  failing:', fails.join(', '));
}
fs.writeFileSync(path.join(OUT, `summary${desktop ? '-desktop' : ''}.json`), JSON.stringify(rows, null, 2));
