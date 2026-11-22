// Header, language switching, first-visit language offer, magnetic buttons and the focus-lens cursor.
import { store, motionOn } from './prefs';
import type { Field } from './field/field';

type Cleanup = () => void;
const RTL_LANGS = new Set(['he', 'ar']);

/** The header turns dark-on-light over paper sections. */
export function initHeader(): Cleanup {
  const html = document.documentElement;
  const secs = Array.from(document.querySelectorAll<HTMLElement>('main .sec, .ft'));
  let raf = 0;
  const check = () => {
    raf = 0;
    const y = 30;
    let light = false;
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { light = s.classList.contains('sec--light'); break; }
    }
    if ((html.dataset.onLight === '1') !== light) html.dataset.onLight = light ? '1' : '0';
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener('scroll', on, { passive: true });
  addEventListener('resize', on);
  check();
  return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
}

/** Remember the chosen language; sweep the field in the new reading direction while the page swaps. */
export function initLangLinks(field: Field | null): Cleanup {
  const onClick = (e: Event) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-lang-link]');
    if (!a) return;
    const l = a.dataset.langLink!;
    store.set('lang', l);
    store.set('suggest-done', '1');
    a.closest('details')?.removeAttribute('open');
    const cur = document.documentElement.lang;
    if (l !== cur) field?.langWave(RTL_LANGS.has(l) ? 'rtl' : 'ltr');
  };
  document.addEventListener('click', onClick);
  // close the language menu on outside click / Escape
  const menu = document.querySelector<HTMLDetailsElement>('[data-lang-menu]');
  const onDoc = (e: Event) => { if (menu?.open && !menu.contains(e.target as Node)) menu.open = false; };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary')?.focus(); } };
  document.addEventListener('pointerdown', onDoc);
  document.addEventListener('keydown', onKey);
  return () => {
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerdown', onDoc);
    document.removeEventListener('keydown', onKey);
  };
}

/** First visit: if the browser speaks ar / ru / en and this page is in another language — offer, never redirect. */
export function initLangSuggest(): Cleanup {
  const box = document.querySelector<HTMLElement>('[data-lang-suggest]');
  if (!box) return () => {};
  if (store.get('suggest-done') || store.get('lang')) return () => {};
  const page = document.documentElement.lang;
  const want = (navigator.languages || [navigator.language]).map((l) => l.slice(0, 2).toLowerCase()).find((l) => ['ar', 'ru', 'en', 'he'].includes(l));
  if (!want || want === page || want === 'he') return () => {};
  const card = box.querySelector<HTMLElement>(`[data-offer="${want}"]`);
  if (!card) return () => {};
  const t = setTimeout(() => { box.hidden = false; card.hidden = false; }, 1600);
  const done = () => { box.hidden = true; store.set('suggest-done', '1'); };
  const btn = card.querySelector('[data-suggest-close]');
  btn?.addEventListener('click', done);
  return () => { clearTimeout(t); btn?.removeEventListener('click', done); };
}

/** Motion switch in the header. */
export function initMotionToggle(apply: (on: boolean) => void): Cleanup {
  const btn = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  if (!btn) return () => {};
  const html = document.documentElement;
  const sync = () => btn.setAttribute('aria-pressed', motionOn() ? 'true' : 'false');
  sync();
  const onClick = () => {
    const on = !motionOn();
    store.set('motion', on ? 'on' : 'off');
    html.dataset.motion = on ? 'on' : 'off';
    sync();
    apply(on);
  };
  btn.addEventListener('click', onClick);
  return () => btn.removeEventListener('click', onClick);
}

/** Side progress line: ticks at section starts, a red dot for 'you are here', current section highlighted. */
export function initProgress(): Cleanup {
  const nav = document.querySelector<HTMLElement>('[data-progress]');
  if (!nav) return () => {};
  const items = Array.from(nav.querySelectorAll<HTMLElement>('[data-progress-item]'));
  let tops: number[] = [];
  let max = 1;
  const measure = () => {
    max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    tops = items.map((it) => {
      const el = document.getElementById(it.dataset.progressItem!);
      const top = el ? el.getBoundingClientRect().top + scrollY : 0;
      it.style.setProperty('--t', String(Math.min(1, top / max)));
      return top;
    });
    update();
  };
  let raf = 0;
  const update = () => {
    raf = 0;
    const y = scrollY;
    nav.style.setProperty('--p', String(Math.min(1, Math.max(0, y / max))));
    let cur = -1;
    tops.forEach((t, i) => { if (y + innerHeight * 0.5 >= t) cur = i; });
    items.forEach((it, i) => it.classList.toggle('is-cur', i === cur));
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', on, { passive: true });
  addEventListener('resize', measure);
  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  measure();
  return () => { removeEventListener('scroll', on); removeEventListener('resize', measure); ro.disconnect(); cancelAnimationFrame(raf); };
}
