// Astro integration: after the build, isolate opposite-direction runs in every page's text.
//   RTL pages (he, ar): Latin runs ("Begin Map", "F-35", "GitHub Pages") → <bdi>
//   LTR pages (ru, en): Hebrew runs ("מחנך", "תיכון בגין / מלכת שבא") → <bdi>
// so punctuation and parentheses around them never jump. Elements that already set their own
// dir/lang, <bdi>, scripts, styles, SVG and <title> are left alone.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const LATIN_RUN = /[A-Za-z][A-Za-z0-9\-.\/'’ ]*[A-Za-z0-9]|[A-Za-z]/g;
const HEB_RUN = /[א-ת][֐-׿"'\-–\/ ]*[א-ת׳״]|[א-ת][׳״]?/g;
const SKIP = new Set(['script', 'style', 'title', 'svg', 'bdi', 'textarea', 'code', 'noscript']);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function walk(node, pageDir, re) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 1) {
      const tag = child.rawTagName?.toLowerCase();
      if (!tag || SKIP.has(tag)) continue;
      const d = child.getAttribute('dir');
      if (d && d !== pageDir) continue; // already isolated / other direction
      if (child.hasAttribute('data-kt')) continue; // kinetic headings handle direction themselves
      walk(child, pageDir, re);
    } else if (child.nodeType === 3) {
      const raw = child.rawText;
      const text = raw; // node-html-parser keeps entities in rawText
      re.lastIndex = 0;
      if (!re.test(text)) continue;
      re.lastIndex = 0;
      // never touch HTML entities (&quot; &amp; …)
      child.rawText = text
        .split(/(&[#\w]+;)/)
        .map((part, i) => (i % 2 ? part : part.replace(re, (m) => `<bdi>${m}</bdi>`)))
        .join('');
    }
  }
}

export function isolateFile(file) {
  const html = fs.readFileSync(file, 'utf8');
  const root = parse(html, { comment: true, blockTextElements: { script: true, style: true, noscript: true, pre: true } });
  const htmlEl = root.querySelector('html');
  const dir = htmlEl?.getAttribute('dir') || 'ltr';
  const body = root.querySelector('body');
  if (!body) return 0;
  walk(body, dir, dir === 'rtl' ? LATIN_RUN : HEB_RUN);
  // <html> may contain a 404 with mixed languages: elements with their own dir are skipped above
  fs.writeFileSync(file, root.toString());
  return 1;
}

export default function bidi() {
  return {
    name: 'bidi-isolate',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const root = fileURLToPath(dir);
        let n = 0;
        const visit = (d) => {
          for (const f of fs.readdirSync(d)) {
            const p = path.join(d, f);
            if (fs.statSync(p).isDirectory()) { if (f !== '_a' && f !== 'img') visit(p); }
            else if (f.endsWith('.html')) n += isolateFile(p);
          }
        };
        visit(root);
        console.log(`bidi: isolated mixed-direction text in ${n} pages`);
      },
    },
  };
}
