// Fails the build if any language is missing a key (or has an extra one), has an empty string,
// an array of a different length, or placeholder text. Hebrew is the reference.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'i18n');
const LANGS = ['he', 'ar', 'ru', 'en'];
const load = (l) => JSON.parse(fs.readFileSync(path.join(DIR, `${l}.json`), 'utf8'));
const ref = load('he');
const errors = [];
const BAD = /lorem|ipsum|todo|tbd|xxx|\?\?\?/i;

function walk(a, b, p, lang) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return errors.push(`${lang}: ${p} should be an array`);
    if (a.length !== b.length) errors.push(`${lang}: ${p} has ${b.length} items, he has ${a.length}`);
    a.forEach((v, i) => b[i] !== undefined && walk(v, b[i], `${p}[${i}]`, lang));
    return;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return errors.push(`${lang}: ${p} should be an object`);
    for (const k of Object.keys(a)) {
      if (!(k in b)) errors.push(`${lang}: missing key ${p ? p + '.' : ''}${k}`);
      else walk(a[k], b[k], p ? `${p}.${k}` : k, lang);
    }
    for (const k of Object.keys(b)) if (!(k in a)) errors.push(`${lang}: extra key ${p ? p + '.' : ''}${k}`);
    return;
  }
  if (typeof a === 'string') {
    if (typeof b !== 'string') return errors.push(`${lang}: ${p} should be a string`);
    if (!b.trim()) errors.push(`${lang}: ${p} is empty`);
    if (BAD.test(b)) errors.push(`${lang}: ${p} looks like placeholder text`);
    const va = (a.match(/\{\w+\}/g) || []).sort().join();
    const vb = (b.match(/\{\w+\}/g) || []).sort().join();
    if (va !== vb) errors.push(`${lang}: ${p} placeholders ${vb || '∅'} ≠ he ${va || '∅'}`);
  }
}

for (const l of LANGS) walk(ref, l === 'he' ? ref : load(l), '', l);

if (errors.length) {
  console.error(`i18n check failed (${errors.length}):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`i18n ok: ${LANGS.join(', ')} have identical keys`);
