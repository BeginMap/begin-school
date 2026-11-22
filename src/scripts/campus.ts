// "Campus in lines": the plan lifts into a 3D wireframe and the camera flies over it with the scroll.
// Photo hotspots follow the projection; a tap opens the photos of that place in a <dialog>.
import { gsap, ScrollTrigger } from './motion';
import { buildPaths, camAt, project, VB_W, VB_H, LABELS, LABEL_H, type Cam } from './campus-geo';

type Cleanup = () => void;

export function initCampus(animate: boolean): Cleanup {
  const pin = document.querySelector<HTMLElement>('[data-campus]');
  if (!pin) return () => {};
  const section = pin.closest('section')!;
  const svg = pin.querySelector<SVGSVGElement>('.campus__svg')!;
  const paths = {
    base: svg.querySelector<SVGPathElement>('.c-base')!,
    walls: svg.querySelector<SVGPathElement>('.c-walls')!,
    roofs: svg.querySelector<SVGPathElement>('.c-roofs')!,
    yard: svg.querySelector<SVGPathElement>('.c-yard')!,
  };
  const spots = Array.from(pin.querySelectorAll<HTMLButtonElement>('.spot'));
  const labels = Array.from(pin.querySelectorAll<HTMLElement>('[data-label]'));
  const cleanups: Cleanup[] = [];
  spots.forEach((s, i) => s.style.setProperty('--d', String((i % 5) * 0.37)));

  // ------------------------------------------------------------ dialog
  const dlg = section.querySelector<HTMLDialogElement>('[data-photo-dialog]')!;
  const body = dlg.querySelector<HTMLElement>('[data-body]')!;
  const title = dlg.querySelector<HTMLElement>('.pdlg__title')!;
  const count = dlg.querySelector<HTMLElement>('.pdlg__count')!;
  const fmtCount = count.dataset.countFmt || '{n} / {total}';
  let figs: HTMLElement[] = [];
  let idx = 0;
  let opener: HTMLElement | null = null;
  const show = (i: number) => {
    idx = (i + figs.length) % figs.length;
    body.replaceChildren(figs[idx]);
    count.textContent = fmtCount.replace('{n}', String(idx + 1)).replace('{total}', String(figs.length));
    dlg.querySelector<HTMLElement>('[data-prev]')!.hidden = figs.length < 2;
    dlg.querySelector<HTMLElement>('[data-next]')!.hidden = figs.length < 2;
  };
  const openSpot = (id: string, from: HTMLElement) => {
    const src = section.querySelector<HTMLElement>(`[data-place-photos="${id}"]`);
    if (!src) return;
    figs = Array.from(src.querySelectorAll<HTMLElement>('figure')).map((f) => {
      const c = f.cloneNode(true) as HTMLElement;
      c.querySelectorAll('img').forEach((im) => im.setAttribute('loading', 'eager'));
      return c;
    });
    if (!figs.length) return;
    title.textContent = (section.querySelector(`[data-place="${id}"] .place__name`)?.firstChild?.textContent ?? '').trim();
    opener = from;
    show(0);
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  };
  const onSpot = (e: Event) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.spot');
    if (b) openSpot(b.dataset.spot!, b);
  };
  const onDlg = (e: Event) => {
    const t = e.target as HTMLElement;
    if (t === dlg || t.closest('[data-close]')) dlg.close();
    else if (t.closest('[data-prev]')) show(idx - 1);
    else if (t.closest('[data-next]')) show(idx + 1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!dlg.open || figs.length < 2) return;
    const rtl = document.documentElement.dir === 'rtl';
    if (e.key === 'ArrowRight') show(idx + (rtl ? -1 : 1));
    if (e.key === 'ArrowLeft') show(idx + (rtl ? 1 : -1));
  };
  const onClose = () => opener?.focus();
  pin.addEventListener('click', onSpot);
  dlg.addEventListener('click', onDlg);
  dlg.addEventListener('keydown', onKey);
  dlg.addEventListener('close', onClose);
  cleanups.push(() => {
    pin.removeEventListener('click', onSpot);
    dlg.removeEventListener('click', onDlg);
    dlg.removeEventListener('keydown', onKey);
    dlg.removeEventListener('close', onClose);
    if (dlg.open) dlg.close();
  });

  if (!animate) return () => cleanups.forEach((c) => c());

  // ------------------------------------------------------------ camera flight
  const cam: Cam = camAt(0);
  const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
  const render = (p: number) => {
    camAt(p, cam);
    const g = buildPaths(cam);
    paths.base.setAttribute('d', g.base);
    paths.walls.setAttribute('d', g.walls || 'M0 0');
    paths.roofs.setAttribute('d', g.roofs || 'M0 0');
    paths.yard.setAttribute('d', g.yard);
    for (const s of spots) {
      const [x, y] = project(Number(s.dataset.x), Number(s.dataset.y), 0.3, cam);
      s.style.setProperty('--x', pct(x, VB_W));
      s.style.setProperty('--y', pct(y, VB_H));
      const off = x < 10 || x > VB_W - 10 || y < 10 || y > VB_H - 10;
      s.classList.toggle('is-off', off);
    }
    for (const l of labels) {
      const k = l.dataset.label!;
      const [lx, ly] = LABELS[k];
      const [x, y] = project(lx, ly, LABEL_H[k] ?? 0, cam);
      l.style.setProperty('--x', pct(x, VB_W));
      l.style.setProperty('--y', pct(y, VB_H));
      l.classList.toggle('is-off', x < 40 || x > VB_W - 40 || y < 30 || y > VB_H - 10);
    }
  };
  render(0);
  pin.classList.add('is-pinned');
  const draw = ScrollTrigger.create({ trigger: pin, start: 'top 75%', once: true, onEnter: () => svg.classList.add('is-drawn') });
  let target = 0, cur = 0, raf = 0;
  const loop = () => {
    raf = 0;
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    render(cur);
    if (cur !== target) raf = requestAnimationFrame(loop);
  };
  const st = ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${innerHeight * 2.2}`,
    pin: true,
    anticipatePin: 1,
    onUpdate: (s) => {
      target = s.progress;
      if (!raf) raf = requestAnimationFrame(loop);
    },
  });
  cleanups.push(() => {
    cancelAnimationFrame(raf);
    st.kill();
    draw.kill();
    pin.classList.remove('is-pinned');
    gsap.set(pin, { clearProps: 'all' });
  });
  return () => cleanups.forEach((c) => c());
}
