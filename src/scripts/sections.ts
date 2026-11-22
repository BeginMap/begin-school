// Scroll choreography for the story sections. Every init returns a cleanup.
// With motion off (reduced motion or the header switch) nothing here pins or animates:
// the sections fall back to their static CSS layout.
import { gsap, ScrollTrigger, EASE, isRTL } from './motion';

type Cleanup = () => void;

/** Photos enter blurred & monochrome and snap into focus. */
export function initFocusPhotos(): Cleanup {
  const els = document.querySelectorAll<HTMLElement>('.ph[data-focus-in]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-sharp')); return () => {}; }
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) {
        const img = e.target.querySelector('img');
        const go = () => e.target.classList.add('is-sharp');
        if (img && !img.complete) img.addEventListener('load', go, { once: true }); else go();
        io.unobserve(e.target);
      }
    }),
    { rootMargin: '0px 0px -18% 0px', threshold: 0.2 },
  );
  els.forEach((e) => io.observe(e));
  return () => io.disconnect();
}

/** Six years: lines draw in, the red "you are here" marker travels from ו׳ to ז׳. */
export function initYears(): Cleanup {
  const root = document.querySelector<HTMLElement>('[data-years]');
  if (!root) return () => {};
  const marker = root.querySelector<HTMLElement>('[data-years-marker]')!;
  const rows = root.querySelectorAll<HTMLElement>('.yr');
  const rowY = (i: number) => {
    const r = rows[i];
    return r.offsetTop + r.offsetHeight / 2 - marker.offsetHeight / 2;
  };
  const place = (p: number) => {
    const y = rowY(0) + (rowY(1) - rowY(0)) * p;
    marker.style.setProperty('--my', `${y}px`);
    root.classList.toggle('is-moved', p > 0.5);
  };
  place(0);
  const st1 = ScrollTrigger.create({ trigger: root, start: 'top 80%', once: true, onEnter: () => root.classList.add('is-drawn') });
  const st2 = ScrollTrigger.create({
    trigger: root,
    start: 'top 55%',
    end: 'top 15%',
    scrub: 0.6,
    onUpdate: (s) => place(gsap.parseEase(EASE.move)(s.progress)),
    onRefresh: (s) => place(s.progress),
  });
  return () => { st1.kill(); st2.kill(); };
}

/** What changes: each row "comes into focus" as it reaches the middle of the screen. */
export function initChanges(): Cleanup {
  const rows = document.querySelectorAll<HTMLElement>('[data-cmp]');
  const sts = Array.from(rows).map((r) =>
    ScrollTrigger.create({ trigger: r, start: 'top 78%', once: true, onEnter: () => r.classList.add('is-now') }),
  );
  return () => sts.forEach((s) => s.kill());
}

/** One day: a pinned horizontal ride. Mirrored in RTL. */
export function initDay(): Cleanup {
  const pin = document.querySelector<HTMLElement>('[data-day]');
  if (!pin) return () => {};
  const track = pin.querySelector<HTMLElement>('[data-day-track]')!;
  const fill = pin.querySelector<HTMLElement>('[data-day-fill]');
  const you = pin.querySelector<HTMLElement>('[data-day-you]');
  pin.classList.add('is-ride');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const sign = isRTL() ? 1 : -1;
  const tw = gsap.to(track, {
    x: () => sign * dist(),
    ease: 'none',
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: () => `+=${dist() * 1.05}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      onUpdate: (s) => {
        if (fill) fill.style.transform = `scaleX(${s.progress})`;
        if (you) {
          const bar = you.parentElement!.querySelector<HTMLElement>('.day__bar-line')!;
          const w = bar.offsetWidth;
          you.style.setProperty('--yx', `${(isRTL() ? -1 : 1) * s.progress * w}px`);
        }
      },
    },
  });
  // keyboard: if something inside the track gets focus, scroll the page to show it
  const onFocus = (e: FocusEvent) => {
    const st = tw.scrollTrigger!;
    const step = (e.target as HTMLElement).closest('.day__step') as HTMLElement | null;
    if (!step) return;
    const steps = Array.from(track.children);
    const p = steps.indexOf(step) / Math.max(1, steps.length - 1);
    scrollTo({ top: st.start + (st.end - st.start) * p, behavior: 'auto' });
  };
  track.addEventListener('focusin', onFocus);
  return () => {
    track.removeEventListener('focusin', onFocus);
    tw.scrollTrigger?.kill();
    tw.kill();
    gsap.set(track, { clearProps: 'transform' });
    pin.classList.remove('is-ride');
  };
}

/** Names: rows slide in opposite directions with the scroll; a tap opens a small card. */
export function initNames(): Cleanup {
  const root = document.querySelector<HTMLElement>('[data-names]');
  if (!root) return () => {};
  const section = root.closest('section')!;
  root.classList.add('is-moving');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-nrow]'));
  const sgn = isRTL() ? 1 : -1;
  const tweens = rows.map((row, i) => {
    const list = row.querySelector<HTMLElement>('.nrow__list')!;
    const over = () => sgn * Math.max(0, list.scrollWidth - innerWidth + 32);
    const st = { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true };
    return i % 2
      ? gsap.fromTo(list, { x: over }, { x: 0, ease: 'none', scrollTrigger: st })
      : gsap.fromTo(list, { x: 0 }, { x: over, ease: 'none', scrollTrigger: st });
  });

  // popover card
  const pop = section.querySelector<HTMLElement>('[data-nm-pop]')!;
  const pName = pop.querySelector<HTMLElement>('.nm-pop__name')!;
  const pTr = pop.querySelector<HTMLElement>('.nm-pop__tr')!;
  const pMean = pop.querySelector<HTMLElement>('.nm-pop__mean')!;
  const pMap = pop.querySelector<HTMLAnchorElement>('.nm-pop__map')!;
  let opener: HTMLElement | null = null;
  const close = (focusBack = true) => {
    pop.hidden = true;
    opener?.setAttribute('aria-expanded', 'false');
    if (focusBack) opener?.focus();
    opener = null;
  };
  const open = (sum: HTMLElement) => {
    const det = sum.parentElement as HTMLDetailsElement;
    const info = det.querySelector('.nm__info')!;
    pName.textContent = sum.textContent;
    pTr.textContent = info.querySelector('.nm__tr')?.textContent ?? '';
    pMean.textContent = info.querySelector('.nm__mean')?.textContent ?? '';
    pMap.href = (info.querySelector('.nm__map') as HTMLAnchorElement).href;
    pop.hidden = false;
    const s = section.getBoundingClientRect();
    const r = sum.getBoundingClientRect();
    const w = pop.offsetWidth;
    let x = (isRTL() ? r.right - w : r.left) - s.left;
    x = Math.max(16, Math.min(x, s.width - w - 16));
    pop.style.left = `${x}px`;
    pop.style.top = `${r.bottom - s.top + 8}px`;
    opener = sum;
    sum.setAttribute('aria-expanded', 'true');
    pop.querySelector<HTMLElement>('[data-nm-close]')!.focus({ preventScroll: true });
  };
  const onClick = (e: Event) => {
    const sum = (e.target as HTMLElement).closest('.nm__name') as HTMLElement | null;
    if (!sum) return;
    e.preventDefault();
    if (opener === sum) close(); else open(sum);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pop.hidden) close(); };
  const onDoc = (e: Event) => {
    if (pop.hidden) return;
    const t = e.target as HTMLElement;
    if (!pop.contains(t) && !t.closest('.nm__name')) close(false);
  };
  // keep a focused name visible inside its moving row
  const onFocus = (e: FocusEvent) => {
    const sum = (e.target as HTMLElement).closest?.('.nm__name') as HTMLElement | null;
    if (!sum) return;
    const r = sum.getBoundingClientRect();
    if (r.left < 0 || r.right > innerWidth) {
      const list = sum.closest('.nrow__list') as HTMLElement;
      const cur = Number(gsap.getProperty(list, 'x')) || 0;
      const shift = r.left < 0 ? -r.left + 24 : innerWidth - r.right - 24;
      gsap.to(list, { x: cur + shift, duration: 0.4, ease: EASE.focus });
    }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('focusin', onFocus);
  pop.querySelector('[data-nm-close]')!.addEventListener('click', () => close());
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', onDoc);
  root.querySelectorAll('.nm__name').forEach((s) => s.setAttribute('aria-expanded', 'false'));
  return () => {
    tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
    root.removeEventListener('click', onClick);
    root.removeEventListener('focusin', onFocus);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onDoc);
    root.classList.remove('is-moving');
    rows.forEach((r) => gsap.set(r.querySelector('.nrow__list'), { clearProps: 'transform' }));
    pop.hidden = true;
  };
}

/** Life: horizontal strip; the item nearest the centre is in focus, the rest soften. */
export function initLife(): Cleanup {
  const strip = document.querySelector<HTMLElement>('[data-life]');
  if (!strip) return () => {};
  const items = Array.from(strip.querySelectorAll<HTMLElement>('[data-life-item]'));
  strip.classList.add('is-live');
  let raf = 0;
  const update = () => {
    raf = 0;
    const r = strip.getBoundingClientRect();
    const mid = r.left + r.width / 2;
    let best: HTMLElement | null = null;
    let bd = Infinity;
    for (const it of items) {
      const b = it.getBoundingClientRect();
      const dd = Math.abs(b.left + b.width / 2 - mid);
      if (dd < bd) { bd = dd; best = it; }
    }
    items.forEach((it) => it.classList.toggle('is-center', it === best));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  strip.addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
  const step = (dir: number) => {
    const cur = items.findIndex((i) => i.classList.contains('is-center'));
    const next = items[Math.max(0, Math.min(items.length - 1, cur + dir))];
    next?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  };
  const prev = document.querySelector<HTMLElement>('[data-life-prev]');
  const next = document.querySelector<HTMLElement>('[data-life-next]');
  // "previous" always means "towards the start of the list", in RTL too
  const p2 = () => step(-1), n2 = () => step(1);
  prev?.addEventListener('click', p2);
  next?.addEventListener('click', n2);
  // drag to scroll with a mouse
  let down = false, sx = 0, sl = 0, moved = false;
  const pd = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = strip.scrollLeft; strip.style.scrollSnapType = 'none'; };
  const pm = (e: PointerEvent) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; strip.scrollLeft = sl - dx; };
  const pu = () => { if (!down) return; down = false; strip.style.scrollSnapType = ''; };
  const pc = (e: Event) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
  strip.addEventListener('pointerdown', pd);
  addEventListener('pointermove', pm);
  addEventListener('pointerup', pu);
  strip.addEventListener('click', pc, true);
  return () => {
    cancelAnimationFrame(raf);
    strip.removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    prev?.removeEventListener('click', p2);
    next?.removeEventListener('click', n2);
    strip.removeEventListener('pointerdown', pd);
    removeEventListener('pointermove', pm);
    removeEventListener('pointerup', pu);
    strip.removeEventListener('click', pc, true);
    strip.classList.remove('is-live');
  };
}

/** Begin Map: the real route draws itself, a red dot walks it. */
export function initRoute(): Cleanup {
  const path = document.querySelector<SVGPathElement>('[data-route]');
  const you = document.querySelector<SVGCircleElement>('[data-route-you]');
  const phone = document.querySelector<HTMLElement>('[data-bm-phone]');
  if (!path || !you || !phone) return () => {};
  const len = path.getTotalLength();
  const set = (p: number) => {
    path.style.setProperty('--draw', String(1 - p));
    const pt = path.getPointAtLength(len * p);
    you.setAttribute('cx', String(pt.x));
    you.setAttribute('cy', String(pt.y));
  };
  set(0);
  const st = ScrollTrigger.create({
    trigger: phone,
    start: 'top 75%',
    end: 'bottom 45%',
    scrub: 0.7,
    onUpdate: (s) => set(gsap.parseEase('power2.inOut')(s.progress)),
  });
  return () => st.kill();
}

/** Finale: blurred monochrome → sharp → colour. */
export function initFinale(): Cleanup {
  const fig = document.querySelector<HTMLElement>('[data-finale]');
  if (!fig) return () => {};
  const st = ScrollTrigger.create({
    trigger: fig.parentElement!,
    start: 'top 85%',
    end: 'top 5%',
    scrub: 0.6,
    onUpdate: (s) => {
      const p = s.progress;
      fig.style.setProperty('--b', `${(1 - Math.min(1, p * 1.6)) * 10}px`);
      fig.style.setProperty('--c', String(Math.max(0, (p - 0.45) / 0.55)));
    },
  });
  return () => { st.kill(); fig.style.removeProperty('--b'); fig.style.removeProperty('--c'); };
}
