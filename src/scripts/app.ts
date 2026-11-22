// Entry point. Runs once per full page load; Astro's client router swaps pages around the
// persistent <canvas id="field">, so the living background survives section and language changes.
// Kept small on purpose: the scroll story (GSAP, Lenis, sections) is a lazy chunk (story.ts).
import { Field } from './field/field';
import { applyMotionAttr, motionOn, onSystemMotionChange } from './prefs';
import { initHeader, initLangLinks, initLangSuggest, initMotionToggle, initProgress } from './ui';

type Cleanup = () => void;
type Story = typeof import('./story');
const html = document.documentElement;

let field: Field | null = null;
let fieldFailed = false;
let story: Story | null = null;
let storyLoading: Promise<Story> | null = null;
let pageCleanups: Cleanup[] = [];
let firstLoad = true;
let generation = 0;

const idle = (cb: () => void, timeout = 900) => {
  const ric = (window as any).requestIdleCallback as ((cb: () => void, o: { timeout: number }) => void) | undefined;
  if (ric) ric(cb, { timeout }); else setTimeout(cb, 120);
};

function loadStory(): Promise<Story> {
  if (story) return Promise.resolve(story);
  storyLoading ??= import('./story').then((m) => { story = m; m.setupLenis(); return m; });
  return storyLoading;
}

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

// ------------------------------------------------------------------ page modules
async function initPage() {
  const gen = ++generation;
  const anim = motionOn();
  const cl: Cleanup[] = [initHeader(), initLangLinks(field), initLangSuggest(), initMotionToggle(onMotion), initProgress()];
  pageCleanups = cl;
  field?.measure();
  const s = await loadStory();
  if (gen !== generation) return; // a newer page replaced this one while the chunk loaded
  const more = await s.init(anim);
  if (gen !== generation) { more.forEach((c) => c()); return; }
  cl.push(...more);
  field?.measure();
  (document as any).fonts?.ready?.then(() => { if (gen === generation) { field?.measure(); s.refresh(); } });
}

function teardownPage() {
  generation++;
  pageCleanups.forEach((c) => { try { c(); } catch (e) { console.warn(e); } });
  pageCleanups = [];
  story?.killAll();
}

function onMotion(on: boolean) {
  field?.setStill(!on, true);
  story?.setupLenis();
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
    onSystemMotionChange(() => { applyMotionAttr(); onMotion(motionOn()); });
    // decorative work starts after the first paint, so text (LCP) never waits for it
    requestAnimationFrame(() => idle(() => { startField(); initPage(); }));
    addEventListener('load', () => { field?.measure(); story?.refresh(); }, { once: true });
    return;
  }
  initPage();
});

document.addEventListener('astro:before-swap', () => teardownPage());

document.addEventListener('astro:after-swap', () => {
  // the router replaces <html> attributes: restore runtime state
  html.classList.add('js');
  if (story) html.classList.add('story');
  if (field?.ready) html.classList.add('field-on');
  if (fieldFailed) html.classList.add('field-fallback');
  applyMotionAttr();
  story?.afterSwap();
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
