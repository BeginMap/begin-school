// The scroll story: GSAP + ScrollTrigger + Lenis and every section's choreography.
// Loaded lazily after the first paint (see app.ts), so text appears and the page is usable
// before ~100 KB of animation code is parsed.
import Lenis from 'lenis';
import { ScrollTrigger } from './motion';
import { motionOn, finePointer } from './prefs';
import { initKinetic } from './kinetic';
import { initFocusPhotos, initYears, initChanges, initDay, initNames, initLife, initRoute, initFinale, initParallax } from './sections';
import { initMagnetic, initLens } from './fx';

type Cleanup = () => void;
let lenis: Lenis | null = null;

/** Smooth scroll only for a fine pointer with motion on; touch keeps native scrolling. */
export function setupLenis() {
  const want = finePointer() && motionOn();
  if (want && !lenis) {
    lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3) });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => { lenis?.raf(time); if (lenis) requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    (window as any).__lenis = lenis;
  } else if (!want && lenis) {
    lenis.destroy();
    lenis = null;
  }
}

export function afterSwap() { lenis?.resize(); }

export async function init(anim: boolean): Promise<Cleanup[]> {
  // CSS start states (hidden lines, blurred rows, monochrome finale…) apply only once this code runs
  document.documentElement.classList.add('story');
  const cl: Cleanup[] = [initFocusPhotos()];
  if (anim) {
    cl.push(initKinetic(), initYears(), initChanges(), initDay(), initNames(), initLife(), initRoute(), initFinale(), initParallax(), initMagnetic(), initLens());
  } else {
    cl.push(initLife());
  }
  if (document.querySelector('[data-campus]')) {
    const { initCampus } = await import('./campus');
    cl.push(initCampus(anim));
  }
  ScrollTrigger.refresh();
  return cl;
}

export function refresh() { ScrollTrigger.refresh(); }

export function killAll() { ScrollTrigger.getAll().forEach((s) => s.kill()); }
