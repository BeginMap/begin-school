// Pointer niceties for fine pointers: magnetic buttons and the focus lens.
import { gsap } from './motion';
import { finePointer, motionOn } from './prefs';

type Cleanup = () => void;

/** Buttons lean towards the pointer (fine pointers only). */
export function initMagnetic(): Cleanup {
  if (!finePointer() || !motionOn()) return () => {};
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'));
  const offs: Cleanup[] = [];
  for (const el of els) {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'expo.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'expo.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    offs.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.set(el, { x: 0, y: 0 }); });
  }
  return () => offs.forEach((f) => f());
}

/** A soft focus lens follows a fine pointer and opens up over links and buttons. The system cursor stays. */
let lens: HTMLElement | null = null;
export function initLens(): Cleanup {
  if (!finePointer() || !motionOn()) { lens?.remove(); lens = null; return () => {}; }
  if (!lens) {
    lens = document.createElement('div');
    lens.className = 'lens';
    lens.setAttribute('aria-hidden', 'true');
    document.body.append(lens);
  }
  const el = lens;
  const xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    el.classList.add('is-on');
    xTo(e.clientX);
    yTo(e.clientY);
    const hot = (e.target as HTMLElement).closest?.('a, button, summary, [data-focus], .spot');
    el.classList.toggle('is-hot', !!hot);
  };
  const out = () => el.classList.remove('is-on');
  addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerleave', out);
  return () => { removeEventListener('pointermove', move); document.removeEventListener('pointerleave', out); };
}

