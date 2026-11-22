// The living background. One persistent <canvas>, WebGL2, one draw call per frame.
// Inputs: scroll position (section states), scroll velocity (spring), pointer trail, taps (ripples),
// hover/focus on interactive elements, language switch wave, intro.
// Budget: average frame time is checked every 2 s; above ~20 ms quality steps down:
// render scale → no pointer trail → a single static frame.

import { FRAG, VERT, MAX_PTS, MAX_RIPS } from './shader';
import { STATES, KEYS, lerpState, type FieldState } from './states';

type Level = { scale: number; trail: boolean; still: boolean };
const LEVELS: Level[] = [
  { scale: 0.75, trail: true, still: false },
  { scale: 0.6, trail: true, still: false },
  { scale: 0.5, trail: true, still: false },
  { scale: 0.4, trail: true, still: false },
  { scale: 0.4, trail: false, still: false },
  { scale: 0.5, trail: false, still: true },
];

interface Anchor { y: number; state: FieldState }

const damp = (x: number, target: number, k: number, dt: number) => x + (target - x) * (1 - Math.exp(-k * dt));

export class Field {
  canvas: HTMLCanvasElement;
  gl!: WebGL2RenderingContext;
  prog!: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null> = {};
  ready = false;

  level = 1;
  still = false; // reduced motion / user switched motion off / budget
  userStill = false;
  running = false;
  raf = 0;
  t0 = performance.now();
  last = 0;
  frame = 0;
  time = 0;

  cur: FieldState = { ...STATES.hero };
  tgt: FieldState = { ...STATES.hero };
  anchors: Anchor[] = [];

  // scroll
  scrollY = 0;
  lastScrollY = 0;
  lastScrollT = 0;
  rawVel = 0;
  vel = 0;
  velV = 0;
  lastScrollEvent = 0;

  // pointer
  pts = new Float32Array(MAX_PTS * 4);
  ptsT = new Float64Array(MAX_PTS);
  ptI = 0;
  lastPt = { x: 0, y: 0, t: 0 };
  rips = new Float32Array(MAX_RIPS * 4);
  ripT = new Float64Array(MAX_RIPS).fill(-1e9);
  ripI = 0;

  focusEl: Element | null = null;
  focusAmt = 0;
  focusRect = new Float32Array(4);

  langStart = -1e9;
  langDir = 1;
  introStart = -1e9;
  introDone = true;

  rect = { w: 1, h: 1 };
  // budget monitor
  winStart = 0;
  winFrames = 0;
  winTime = 0;
  skipWindows = 2;

  onLevelChange?: (level: number, still: boolean) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(): boolean {
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = this.canvas.getContext('webgl2', {
        alpha: false, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'default',
      });
    } catch { gl = null; }
    if (!gl) return false;
    this.gl = gl;
    const ext = gl.getExtension('KHR_parallel_shader_compile');
    const vs = this.shader(gl.VERTEX_SHADER, VERT);
    const fs = this.shader(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    this.prog = prog;

    const finish = () => {
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn('[field] link failed', gl.getProgramInfoLog(prog), gl.getShaderInfoLog(fs));
        this.fail();
        return;
      }
      gl.useProgram(prog);
      const names = ['uRes', 'uTime', 'uFrame', 'uS0', 'uS1', 'uS2', 'uVel', 'uScroll', 'uPts', 'uRip', 'uFocus', 'uFocusAmt', 'uLang', 'uIntro'];
      for (const n of names) this.u[n] = gl.getUniformLocation(prog, n);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      this.ready = true;
      this.resize();
      this.canvas.classList.add('is-on');
      document.documentElement.classList.add('field-on');
      this.measure();
      this.start();
    };

    // Compile without blocking the main thread where the driver allows it.
    if (ext) {
      const poll = () => {
        if (gl.getProgramParameter(prog, (ext as any).COMPLETION_STATUS_KHR)) finish();
        else setTimeout(poll, 16);
      };
      poll();
    } else finish();

    this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.fail(); });
    this.bind();
    return true;
  }

  private shader(type: number, src: string) {
    const gl = this.gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return sh;
  }

  private fail() {
    this.ready = false;
    this.stop();
    this.canvas.classList.remove('is-on');
    document.documentElement.classList.remove('field-on');
    document.documentElement.classList.add('field-fallback');
  }

  // ---------------------------------------------------------------- inputs
  private bind() {
    const ro = new ResizeObserver(() => { this.resize(); this.measure(); });
    ro.observe(this.canvas);
    ro.observe(document.body);
    addEventListener('scroll', () => this.onScroll(), { passive: true });
    addEventListener('pointermove', (e) => this.onMove(e), { passive: true });
    addEventListener('pointerdown', (e) => this.onDown(e), { passive: true });
    document.addEventListener('pointerover', (e) => this.onOver(e), { passive: true });
    document.addEventListener('focusin', (e) => this.onOver(e));
    document.addEventListener('focusout', () => { this.focusEl = null; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
    this.scrollY = this.lastScrollY = scrollY;
  }

  toField(x: number, y: number): [number, number] {
    const asp = this.rect.w / this.rect.h;
    return [(x / this.rect.w - 0.5) * asp, (1 - y / this.rect.h - 0.5)];
  }

  private onScroll() {
    const now = performance.now();
    const y = scrollY;
    const dt = Math.max(8, now - this.lastScrollT) / 1000;
    const v = (y - this.lastScrollY) / Math.max(1, innerHeight) / dt;
    // a light low-pass on the raw signal; the spring does the rest
    this.rawVel = this.rawVel * 0.4 + v * 0.6;
    this.lastScrollY = y;
    this.lastScrollT = now;
    this.lastScrollEvent = now;
    this.scrollY = y;
    if (this.still) this.renderStill();
    if (!this.introDone && now - this.introStart > 120) this.introStart = Math.min(this.introStart, now - 1100);
  }

  private onMove(e: PointerEvent) {
    if (!LEVELS[this.level].trail || this.still) return;
    const now = performance.now();
    if (now - this.lastPt.t < 16) return;
    const [x, y] = this.toField(e.clientX, e.clientY);
    const dt = Math.max(0.008, (now - this.lastPt.t) / 1000);
    const sp = Math.hypot(x - this.lastPt.x, y - this.lastPt.y) / dt;
    this.lastPt = { x, y, t: now };
    const i = this.ptI;
    this.pts[i * 4] = x;
    this.pts[i * 4 + 1] = y;
    this.pts[i * 4 + 3] = 0.25 + 0.75 * Math.min(1, sp / 2.2);
    this.ptsT[i] = now;
    this.ptI = (i + 1) % MAX_PTS;
  }

  private onDown(e: PointerEvent) {
    const now = performance.now();
    if (!this.introDone) this.skipIntro();
    if (this.still) return;
    const [x, y] = this.toField(e.clientX, e.clientY);
    const i = this.ripI;
    this.rips[i * 4] = x;
    this.rips[i * 4 + 1] = y;
    this.rips[i * 4 + 3] = 1;
    this.ripT[i] = now;
    this.ripI = (i + 1) % MAX_RIPS;
  }

  private onOver(e: Event) {
    const el = (e.target as Element | null)?.closest?.('a, button, summary, [data-focus]') ?? null;
    if (el && el.closest('.no-focus-field')) return;
    this.focusEl = el;
  }

  // ---------------------------------------------------------------- public API
  /** Re-read section anchors ([data-field], optional [data-field-end]). Call after DOM swaps. */
  measure() {
    const list: Anchor[] = [];
    const sy = scrollY;
    const vh = innerHeight;
    document.querySelectorAll<HTMLElement>('[data-field]').forEach((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top + sy;
      const h = r.height;
      const pad = Math.min(vh * 0.32, h * 0.3); // the blend happens across a section boundary, ±~1/3 screen
      const a = STATES[el.dataset.field!] ?? STATES.page;
      const b = (el.dataset.fieldEnd && STATES[el.dataset.fieldEnd]) || a;
      list.push({ y: top + pad, state: a });
      list.push({ y: top + h - pad, state: b });
    });
    list.sort((p, q) => p.y - q.y);
    this.anchors = list;
    this.computeTarget();
    if (this.still) this.renderStill();
  }

  setStill(on: boolean, user = false) {
    if (user) this.userStill = on;
    const still = on || LEVELS[this.level].still;
    this.still = still;
    if (still) {
      this.stop();
      this.renderStill();
    } else this.start();
  }

  playIntro() {
    if (this.still) return;
    this.introStart = performance.now();
    this.introDone = false;
  }

  skipIntro() {
    this.introStart = performance.now() - 1100;
  }

  langWave(toDir: 'rtl' | 'ltr') {
    if (this.still) return;
    this.langDir = toDir === 'rtl' ? -1 : 1;
    this.langStart = performance.now();
  }

  // ---------------------------------------------------------------- loop
  resize() {
    if (!this.ready) return;
    const r = this.canvas.getBoundingClientRect();
    this.rect = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    const s = LEVELS[this.level].scale; // DPR is deliberately ignored (≤ 1)
    const w = Math.max(2, Math.round(r.width * s));
    const h = Math.max(2, Math.round(r.height * s));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    if (this.still) this.renderStill();
  }

  start() {
    if (!this.ready || this.running || this.still || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    this.winStart = this.last;
    this.winFrames = 0;
    this.winTime = 0;
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private computeTarget() {
    const a = this.anchors;
    if (!a.length) return;
    const probe = this.scrollY + innerHeight * 0.5;
    if (probe <= a[0].y) { Object.assign(this.tgt, a[0].state); return; }
    if (probe >= a[a.length - 1].y) { Object.assign(this.tgt, a[a.length - 1].state); return; }
    for (let i = 0; i < a.length - 1; i++) {
      if (probe >= a[i].y && probe < a[i + 1].y) {
        let t = (probe - a[i].y) / Math.max(1, a[i + 1].y - a[i].y);
        t = t * t * (3 - 2 * t);
        lerpState(a[i].state, a[i + 1].state, t, this.tgt);
        return;
      }
    }
  }

  private tick(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.frame++;

    // scroll velocity → damped spring (settles in ~0.6 s, slight overshoot)
    if (now - this.lastScrollEvent > 60) this.rawVel = damp(this.rawVel, 0, 14, dt);
    const k = 70, c = 2 * Math.sqrt(k) * 0.62;
    const acc = -k * (this.vel - this.rawVel) - c * this.velV;
    this.velV += acc * dt;
    this.vel += this.velV * dt;

    this.computeTarget();
    for (const key of KEYS) this.cur[key] = damp(this.cur[key], this.tgt[key], key === 'light' ? 5 : 2.6, dt);

    // focus rect follows the element while hovered
    const el = this.focusEl;
    if (el && el.isConnected) {
      const r = el.getBoundingClientRect();
      const [x0, y1] = this.toField(r.left, r.top);
      const [x1, y0] = this.toField(r.right, r.bottom);
      this.focusRect[0] = x0; this.focusRect[1] = y0; this.focusRect[2] = x1; this.focusRect[3] = y1;
    }
    this.focusAmt = damp(this.focusAmt, el && el.isConnected ? 1 : 0, 9, dt);

    this.draw(now);
    this.budget(now, dt);
  }

  private draw(now: number) {
    const gl = this.gl, u = this.u, s = this.cur;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uFrame, this.frame);
    gl.uniform4f(u.uS0, s.freq, s.angle, s.warp, s.contour);
    gl.uniform4f(u.uS1, s.grid, s.width, s.fog, s.contrast);
    gl.uniform4f(u.uS2, s.light, s.color, s.grain, s.drift);
    gl.uniform2f(u.uVel, 0, this.still ? 0 : this.vel);
    gl.uniform1f(u.uScroll, this.scrollY / Math.max(1, innerHeight));

    const trail = LEVELS[this.level].trail && !this.still;
    for (let i = 0; i < MAX_PTS; i++) {
      const age = (now - this.ptsT[i]) / 1000;
      this.pts[i * 4 + 2] = age;
      if (!trail || age > 1.6) this.pts[i * 4 + 3] = 0;
    }
    for (let i = 0; i < MAX_RIPS; i++) {
      const age = (now - this.ripT[i]) / 1000;
      this.rips[i * 4 + 2] = age;
      if (age > 2.6 || this.still) this.rips[i * 4 + 3] = 0;
    }
    gl.uniform4fv(u.uPts, this.pts);
    gl.uniform4fv(u.uRip, this.rips);
    gl.uniform4fv(u.uFocus, this.focusRect);
    gl.uniform1f(u.uFocusAmt, this.still ? 0 : this.focusAmt);

    const lp = (now - this.langStart) / 1150;
    gl.uniform3f(u.uLang, Math.min(1, Math.max(0, lp)), this.langDir, lp >= 0 && lp <= 1 ? 1 : 0);

    let ip = (now - this.introStart) / 1200;
    if (ip >= 1) { ip = 1; this.introDone = true; }
    gl.uniform1f(u.uIntro, this.still ? 1 : ip);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** One beautiful still frame (reduced motion, motion off, or budget exhausted). */
  renderStill() {
    if (!this.ready) return;
    this.computeTarget();
    Object.assign(this.cur, this.tgt);
    this.vel = this.velV = 0;
    this.time = 14.0; // a fixed, pleasant moment of the fog
    this.focusAmt = 0;
    this.draw(performance.now() + 1e7);
  }

  private budget(now: number, dt: number) {
    this.winFrames++;
    this.winTime += dt;
    if (now - this.winStart < 2000) return;
    const avg = (this.winTime / this.winFrames) * 1000;
    this.winStart = now;
    this.winFrames = 0;
    this.winTime = 0;
    if (this.skipWindows > 0) { this.skipWindows--; return; }
    if (avg > 20 && this.level < LEVELS.length - 1) {
      this.level++;
      this.skipWindows = 1;
      this.resize();
      const L = LEVELS[this.level];
      if (L.still) this.setStill(true);
      this.onLevelChange?.(this.level, L.still);
    }
  }

  /** QA / tuning: pin the field to one named state (null = follow the scroll again). */
  force(name: string | null) {
    if (name && STATES[name]) { this.anchors = [{ y: 0, state: STATES[name] }]; Object.assign(this.cur, STATES[name]); }
    else this.measure();
  }

  stats() {
    return { level: this.level, scale: LEVELS[this.level].scale, still: this.still, w: this.canvas.width, h: this.canvas.height };
  }
}
