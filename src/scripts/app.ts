// Entry point. Runs once per full page load; Astro's client router swaps pages around the
// persistent <canvas id="field">, so the living background survives section and language changes.
import { Field } from './field/field';
import { ScrollTrigger } from './motion';
import { applyMotionAttr, motionOn, finePointer, onSystemMotionChange } from './prefs';
import { initKinetic } from './kinetic';
import { initFocusPhotos, initYears, initChanges, initDay, initNames, initLife, initRoute, initFinale } from './sections';
import { initHeader, initLangLinks, initLangSuggest, initMotionToggle, initMagnetic, initLens } from './ui';
import Lenis from 'lenis';

type Cleanup = () => void;
const html = document.documentElement;

let field: Field | null = null;
let lenis: Lenis | null = null;
let pageCleanups: Cleanup[] = [];
let firstLoad = true;
let fieldFailed = false;

// ------------------------------------------------------------------ living background
function startField() {
  const canvas = document.getElementById('field') as HTMLCanvasElement | null;
  if (!canvas || field) return;
  const f = new Field(canvas);
  if (!f.init()) {
    fieldFailed = true;
    html.classList.add('field-fallback');
    return;
  }
  field = f;
  (window as any).__field = f; // for the QA scripts
  f.setStill(!motionOn());
  const onHome = html.dataset.page === 'home';
  const tryIntro = () => {
    if (f.ready) {
      if (onHome && motionOn() && performance.now() < 4000 && scrollY < 40) f.playIntro();
    } else setTimeout(tryIntro, 30);
  };
  tryIntro();
}

// ------------------------------------------------------------------ smooth scroll (desktop, fine pointer only)
function setupLenis() {
  const want = finePointer() && motionOn();
  if (want && !lenis) {
    lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3), wheelMultiplier: 1, touchMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => { lenis?.raf(time); if (lenis) requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    (window as any).__lenis = lenis;
  } else if (!want && lenis) {
    lenis.destroy();
    lenis = null;
  }
}

// ------------------------------------------------------------------ page modules
async function initPage() {
  const anim = motionOn();
  const cl: Cleanup[] = [];
  cl.push(initHeader(), initLangLinks(field), initLangSuggest(), initMotionToggle(onMotion));
  cl.push(initFocusPhotos());
  if (anim) {
    cl.push(initKinetic(), initYears(), initChanges(), initDay(), initNames(), initLife(), initRoute(), initFinale(), initMagnetic(), initLens());
  } else {
    cl.push(initLife());
  }
  if (document.querySelector('[data-campus]')) {
    const { initCampus } = await import('./campus');
    cl.push(initCampus(anim));
  }
  pageCleanups = cl;
  field?.measure();
  ScrollTrigger.refresh();
  // re-measure once images and fonts have settled
  (document as any).fonts?.ready?.then(() => { field?.measure(); ScrollTrigger.refresh(); });
  addEventListener('load', () => { field?.measure(); ScrollTrigger.refresh(); }, { once: true });
}

function teardownPage() {
  pageCleanups.forEach((c) => { try { c(); } catch (e) { console.warn(e); } });
  pageCleanups = [];
  ScrollTrigger.getAll().forEach((s) => s.kill());
}

function onMotion(on: boolean) {
  field?.setStill(!on, true);
  setupLenis();
  teardownPage();
  initPage();
}

// ------------------------------------------------------------------ first-tap / first-scroll skips the intro
function skipIntroOnce() {
  const skip = () => {
    html.classList.add('intro-skip');
    field?.skipIntro();
    removeEventListener('wheel', skip);
    removeEventListener('touchstart', skip);
    removeEventListener('keydown', skip);
  };
  addEventListener('wheel', skip, { passive: true, once: true });
  addEventListener('touchstart', skip, { passive: true, once: true });
  addEventListener('keydown', skip, { once: true });
}

// ------------------------------------------------------------------ lifecycle
document.addEventListener('astro:page-load', () => {
  if (firstLoad) {
    firstLoad = false;
    skipIntroOnce();
    setupLenis();
    // the field is decorative: start it after the first paint so text (LCP) is never delayed
    const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 200));
    requestAnimationFrame(() => idle(startField, { timeout: 900 }));
    onSystemMotionChange(() => { applyMotionAttr(); onMotion(motionOn()); });
  }
  initPage();
});

document.addEventListener('astro:before-swap', () => teardownPage());

document.addEventListener('astro:after-swap', () => {
  // the router replaces <html> attributes: restore runtime state
  html.classList.add('js');
  if (field?.ready) html.classList.add('field-on');
  if (fieldFailed) html.classList.add('field-fallback');
  applyMotionAttr();
  lenis?.resize();
  if (!motionOn()) scrollTo(0, scrollY);
});

// a language switch delays the swap a little, so the text changes while the wave sweeps across
document.addEventListener('astro:before-preparation', (ev: any) => {
  const langOf = (u: URL) => {
    const rest = u.pathname.slice(import.meta.env.BASE_URL.length).split('/')[0];
    return ['ar', 'ru', 'en'].includes(rest) ? rest : 'he';
  };
  try {
    if (!motionOn() || langOf(new URL(ev.to)) === html.lang) return;
    const orig = ev.loader;
    ev.loader = async () => { await Promise.all([orig(), new Promise((r) => setTimeout(r, 360))]); };
  } catch { /* ignore */ }
});
