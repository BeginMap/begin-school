// Renders (1) the still frame of the field used without WebGL / without JS and
// (2) Open Graph images (1200×630) for every language. Needs the preview server running:
//   npx astro preview --port 4321   then   node scripts/build-stills.mjs
// Outputs are committed: src/assets/field-dark.webp, public/og/og-<lang>.jpg
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { launch } from '../qa/browser.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:4321/begin-school/';
const ROOT = process.cwd();
const browser = await launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// ---- 1. still frame of the field (hero state, no text)
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.addInitScript(() => { try { localStorage.setItem('suggest-done', '1'); localStorage.setItem('motion', 'on'); } catch {} });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'body > *:not(#field){visibility:hidden!important} .lens{display:none}' });
  await page.waitForTimeout(4500);
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).resize(1280).webp({ quality: 58 }).toFile(path.join(ROOT, 'src/assets/field-dark.webp'));
  console.log('field-dark.webp', fs.statSync(path.join(ROOT, 'src/assets/field-dark.webp')).size, 'bytes');
  await page.close();
}

// ---- 2. Open Graph images
const T = {
  he: { a: 'היי,', b: 'ז׳ של ספטמבר', s: 'בית הספר בגין, אילת', dir: 'rtl' },
  ar: { a: 'أهلًا بكم،', b: 'طلابَ الصف السابع الجدد', s: 'مدرسة بيغن، إيلات', dir: 'rtl' },
  ru: { a: 'Привет,', b: 'будущий ז׳', s: 'Школа «Бегин», Эйлат', dir: 'ltr' },
  en: { a: 'Hi there,', b: 'future 7th grader', s: 'Begin School, Eilat', dir: 'ltr' },
};
const fontDir = path.join(ROOT, 'node_modules/@fontsource-variable/rubik/files');
const fontFace = fs.readdirSync(fontDir).filter((f) => f.endsWith('.woff2')).map((f) => {
  const italic = f.includes('italic');
  const b64 = fs.readFileSync(path.join(fontDir, f)).toString('base64');
  return `@font-face{font-family:R;font-style:${italic ? 'italic' : 'normal'};font-weight:300 900;src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
}).join('');
const photo = fs.readFileSync(path.join(ROOT, 'public/img/courtyard-north-960-c.webp')).toString('base64');
const field = fs.readFileSync(path.join(ROOT, 'src/assets/field-dark.webp')).toString('base64');
fs.mkdirSync(path.join(ROOT, 'public/og'), { recursive: true });
for (const [lang, t] of Object.entries(T)) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const italic = lang === 'ar' ? 'normal' : 'italic';
  await page.setContent(`<!doctype html><html lang="${lang}" dir="${t.dir}"><head><style>${fontFace}
    *{margin:0;box-sizing:border-box} body{width:1200px;height:630px;background:#0c0c0b url(data:image/webp;base64,${field}) center/cover;font-family:R;color:#efede8;overflow:hidden;position:relative}
    .ph{position:absolute;top:0;bottom:0;${t.dir === 'rtl' ? 'left' : 'right'}:0;width:520px;background:url(data:image/webp;base64,${photo}) 38% center/cover}
    .ph:after{content:'';position:absolute;inset:0;background:linear-gradient(${t.dir === 'rtl' ? '270deg' : '90deg'},#0c0c0b 0%,rgba(12,12,11,0) 45%)}
    .tx{position:absolute;top:0;bottom:0;${t.dir === 'rtl' ? 'right' : 'left'}:64px;width:640px;display:flex;flex-direction:column;justify-content:center}
    h1{font-weight:${lang === 'ar' ? 800 : 860};font-style:${italic};font-size:${lang === 'ar' ? 84 : 96}px;line-height:${lang === 'ar' ? 1.15 : 0.98}}
    p{margin-top:34px;font-size:30px;font-weight:500;color:#cfcbc3;display:flex;align-items:center;gap:16px}
    i{width:16px;height:16px;border-radius:50%;background:#c9362f;display:inline-block;box-shadow:0 0 0 7px rgba(201,54,47,.25)}
  </style></head><body><div class="ph"></div><div class="tx"><h1>${t.a}<br>${t.b}</h1><p><i></i>${t.s}</p></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ROOT, `public/og/og-${lang}.jpg`), type: 'jpeg', quality: 82 });
  await page.close();
  console.log('og', lang);
}
await browser.close();
