// User preferences that survive navigation: motion on/off and chosen language.
// localStorage is always wrapped: private mode or blocked storage must never break the page.

export const store = {
  get(k: string): string | null {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); } catch { /* ignore */ }
  },
};

const rm = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function motionWanted(): boolean {
  const m = store.get('motion');
  if (m === 'off') return false;
  if (m === 'on') return true;
  return !(rm && rm.matches);
}

export function applyMotionAttr() {
  document.documentElement.dataset.motion = motionWanted() ? 'on' : 'off';
}

export const motionOn = () => document.documentElement.dataset.motion === 'on';

export function onSystemMotionChange(cb: () => void) {
  rm?.addEventListener?.('change', () => { if (!store.get('motion')) cb(); });
}

export const finePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
