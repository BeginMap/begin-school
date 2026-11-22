// Builds responsive black-and-white (and a few colour) variants of every photo in src/data/photos.ts.
//   assets-src/<src>  →  public/img/<id>-<width>[-c].{avif,webp}
//   + src/data/images.gen.json: intrinsic size, available widths and a tiny blurred placeholder (LQIP).
// Incremental: an output newer than its source is reused. Monochrome is baked in at build time —
// cheaper than a CSS grayscale filter on a phone, and the files are ~30 % smaller.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PHOTOS } from '../src/data/photos.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'img');
const WIDTHS = [480, 960, 1600];
fs.mkdirSync(OUT, { recursive: true });

const fresh = (out, src) => fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs;
const manifest = {};
let made = 0;

await Promise.all(
  PHOTOS.map(async (p) => {
    const src = path.join(ROOT, 'assets-src', p.src);
    if (!fs.existsSync(src)) throw new Error(`missing ${src} — run npm run assets`);
    const meta = await sharp(src).metadata();
    let W = meta.width, H = meta.height;
    let region = null;
    if (p.crop) {
      const [x, y, w, h] = p.crop;
      region = { left: Math.round(x * W), top: Math.round(y * H), width: Math.round(w * W), height: Math.round(h * H) };
      W = region.width; H = region.height;
    }
    const max = Math.min(p.max ?? 1600, W);
    const widths = WIDTHS.filter((w) => w < max).concat(max).filter((w, i, a) => a.indexOf(w) === i);
    const base = () => {
      let s = sharp(src);
      if (region) s = s.extract(region);
      return s;
    };
    const modes = p.color ? ['bw', 'c'] : ['bw'];
    for (const mode of modes) {
      for (const w of widths) {
        const name = `${p.id}-${w}${mode === 'c' ? '-c' : ''}`;
        const avif = path.join(OUT, name + '.avif'), webp = path.join(OUT, name + '.webp');
        if (fresh(avif, src) && fresh(webp, src)) continue;
        let s = base().resize({ width: w, withoutEnlargement: true });
        if (mode === 'bw') s = s.grayscale().linear(1.1, -10).gamma(1.05);
        const buf = await s.toBuffer();
        await sharp(buf).avif({ quality: mode === 'bw' ? 52 : 56, effort: 4 }).toFile(avif);
        await sharp(buf).webp({ quality: 74 }).toFile(webp);
        made++;
      }
    }
    const lq = await base().resize({ width: 24 }).grayscale().blur(0.5).webp({ quality: 40 }).toBuffer();
    manifest[p.id] = {
      w: W,
      h: H,
      widths,
      color: !!p.color,
      fb: !!p.fb,
      lqip: `data:image/webp;base64,${lq.toString('base64')}`,
    };
  }),
);

// Begin Map icon for the 'You won't get lost' block
await sharp(path.join(ROOT, 'assets-src/icons/icon-192.png')).resize(96).webp({ quality: 90 }).toFile(path.join(OUT, 'beginmap-icon.webp'));

fs.writeFileSync(path.join(ROOT, 'src', 'data', 'images.gen.json'), JSON.stringify(manifest, null, 1));
console.log(`images: ${PHOTOS.length} photos, ${made} new variant sets`);
