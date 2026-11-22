// Kinetic headings: text is split into lines → words → graphemes and revealed through a mask.
// Rules: Arabic is NEVER split into letters (it would break joining) — only words/lines.
// Hebrew, Cyrillic and Latin are split into graphemes with Intl.Segmenter.
// A run of words written in the opposite direction (e.g. Hebrew inside Russian) stays one unit,
// so the bidi order is never broken. Lines are recomputed after fonts load and on resize.
// Screen readers get the untouched text (visually hidden copy); the animated copy is aria-hidden.
import { gsap, ScrollTrigger, EASE } from './motion';

const RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const LTR = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/;
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

type Dir = 'rtl' | 'ltr' | 'n';
const dirOf = (w: string): Dir => (RTL.test(w) ? 'rtl' : LTR.test(w) ? 'ltr' : 'n');

const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' }) : null;
const graphemes = (s: string): string[] => (seg ? Array.from(seg.segment(s), (x: any) => x.segment) : Array.from(s));

interface Split { el: HTMLElement; box: HTMLElement; units: HTMLElement[]; width: number; revealed: boolean }
const splits = new Map<HTMLElement, Split>();

function build(el: HTMLElement): Split {
  const text = (el.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();
  const base: 'rtl' | 'ltr' = getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr';
  const arabicPage = (el.closest('[lang]') as HTMLElement | null)?.lang === 'ar';
  el.textContent = '';
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = text;
  const box = document.createElement('span');
  box.setAttribute('aria-hidden', 'true');
  box.className = 'kt';
  el.append(sr, box);

  // group words into units
  const words = text.split(' ');
  const units: { text: string; kind: 'word' | 'iso'; dir: Dir }[] = [];
  for (const w of words) {
    const d = dirOf(w);
    const last = units[units.length - 1];
    if (d !== 'n' && d !== base) {
      if (last && last.kind === 'iso' && last.dir === d) { last.text += ' ' + w; continue; }
      units.push({ text: w, kind: 'iso', dir: d });
    } else if (d === 'n' && last && last.kind === 'iso') {
      last.text += ' ' + w; // numbers / punctuation follow the run they sit in
    } else {
      units.push({ text: w, kind: 'word', dir: base });
    }
  }
  const out: HTMLElement[] = [];
  units.forEach((u, i) => {
    const s = document.createElement('span');
    s.className = 'kt-word';
    if (u.kind === 'iso') {
      s.dir = u.dir as string;
      s.textContent = u.text;
    } else if (arabicPage || ARABIC.test(u.text)) {
      s.textContent = u.text; // Arabic: words only
    } else {
      for (const g of graphemes(u.text)) {
        const c = document.createElement('span');
        c.className = 'kt-ch';
        c.textContent = g;
        s.append(c);
      }
    }
    box.append(s);
    if (i < units.length - 1) box.append(document.createTextNode(' '));
    out.push(s);
  });
  return { el, box, units: out, width: 0, revealed: false };
}

/** Wrap words into masked lines according to the current layout. */
function lines(sp: Split) {
  const { box, units } = sp;
  // flatten previous lines
  box.querySelectorAll(':scope > .kt-line').forEach((l) => l.replaceWith(...Array.from(l.childNodes)));
  const rows: Node[][] = [];
  let top = -Infinity;
  let cur: Node[] = [];
  for (const node of Array.from(box.childNodes)) {
    if (node.nodeType === 1 && units.includes(node as HTMLElement)) {
      const t = (node as HTMLElement).offsetTop;
      if (Math.abs(t - top) > 4) {
        if (cur.length) rows.push(cur);
        cur = [];
        top = t;
      }
    }
    cur.push(node);
  }
  if (cur.length) rows.push(cur);
  for (const r of rows) {
    const line = document.createElement('span');
    line.className = 'kt-line';
    box.insertBefore(line, r[0]);
    line.append(...r);
  }
  sp.width = box.clientWidth;
}

function targets(sp: Split): HTMLElement[] {
  const chars = sp.box.querySelectorAll<HTMLElement>('.kt-ch');
  const isoWords = Array.from(sp.box.querySelectorAll<HTMLElement>('.kt-word')).filter((w) => !w.querySelector('.kt-ch'));
  return [...Array.from(chars), ...isoWords].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}

export function initKinetic(root: ParentNode = document): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-kt]'));
  if (!els.length) return () => {};
  const made: Split[] = [];
  for (const el of els) {
    const sp = build(el);
    splits.set(el, sp);
    made.push(sp);
  }
  const ready = (document as any).fonts?.ready ?? Promise.resolve();
  const triggers: ScrollTrigger[] = [];
  let alive = true;

  ready.then(() => {
    if (!alive) return;
    for (const sp of made) {
      lines(sp);
      const tg = targets(sp);
      const perChar = sp.box.querySelector('.kt-ch') !== null;
      gsap.set(tg, { yPercent: 108, rotate: perChar ? 0.001 : 0 });
      const st = ScrollTrigger.create({
        trigger: sp.el,
        start: 'top 86%',
        once: true,
        onEnter: () => {
          sp.revealed = true;
          gsap.to(tg, {
            yPercent: 0,
            duration: perChar ? 1.0 : 1.1,
            ease: EASE.focus,
            stagger: perChar ? { each: 0.016, from: 'start' } : 0.07,
          });
        },
      });
      triggers.push(st);
    }
    // triggers are created out of page order (pins come later): sort before measuring
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });

  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      for (const sp of made) if (Math.abs(sp.box.clientWidth - sp.width) > 2) lines(sp);
    });
  };
  addEventListener('resize', onResize);

  return () => {
    alive = false;
    removeEventListener('resize', onResize);
    triggers.forEach((t) => t.kill());
    for (const sp of made) {
      const text = sp.el.querySelector('.visually-hidden')?.textContent ?? '';
      sp.el.textContent = text;
      splits.delete(sp.el);
    }
  };
}
