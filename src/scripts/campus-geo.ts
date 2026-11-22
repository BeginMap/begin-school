// Campus geometry: Begin Map building outlines (plan pixels + height in metres) → lightweight
// isometric wireframe. Pure functions, used at build time (static SVG, no-JS fallback) and in the browser.
import campus from '../data/campus.json';

export interface Cam {
  cx: number;    // look-at point on the plan (px)
  cy: number;
  yaw: number;   // radians, rotation around the vertical axis
  pitch: number; // radians from horizontal: PI/2 = top-down plan
  ext: number;   // 0 = flat plan … 1 = real building heights
  zoom: number;
}

export const VB_W = 1000;
export const VB_H = 900;
const MPP = campus.mpp;
const K = 3.9; // viewBox units per metre at zoom 1 (whole campus fits)

// Camera keys along the scroll: flat plan → fly in over the gate and the courtyard → pull back in 3D.
const KEYS: [number, Cam][] = [
  [0.0, { cx: 1000, cy: 1000, yaw: 0, pitch: Math.PI / 2 - 0.0005, ext: 0, zoom: 1 }],
  [0.3, { cx: 1010, cy: 1330, yaw: -0.14, pitch: 0.98, ext: 0.75, zoom: 1.55 }],
  [0.62, { cx: 860, cy: 860, yaw: -0.32, pitch: 0.72, ext: 1, zoom: 1.85 }],
  [1.0, { cx: 1000, cy: 1040, yaw: -0.42, pitch: 0.62, ext: 1, zoom: 1.28 }],
];
const smooth = (t: number) => t * t * (3 - 2 * t);

export function camAt(p: number, out?: Cam): Cam {
  const t = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const [t0, a] = KEYS[i];
  const [t1, b] = KEYS[i + 1];
  const u = smooth((t - t0) / (t1 - t0));
  const c = out ?? ({} as Cam);
  c.cx = a.cx + (b.cx - a.cx) * u;
  c.cy = a.cy + (b.cy - a.cy) * u;
  c.yaw = a.yaw + (b.yaw - a.yaw) * u;
  c.pitch = a.pitch + (b.pitch - a.pitch) * u;
  c.ext = a.ext + (b.ext - a.ext) * u;
  c.zoom = a.zoom + (b.zoom - a.zoom) * u;
  return c;
}

export function project(x: number, y: number, h: number, c: Cam): [number, number] {
  const X = (x - c.cx) * MPP;
  const Z = (y - c.cy) * MPP;
  const Y = h * c.ext;
  const co = Math.cos(c.yaw), si = Math.sin(c.yaw);
  const xr = X * co - Z * si;
  const zr = X * si + Z * co;
  const k = K * c.zoom;
  return [VB_W / 2 + xr * k, VB_H / 2 + (zr * Math.sin(c.pitch) - Y * Math.cos(c.pitch)) * k];
}

const f = (n: number) => Math.round(n * 10) / 10;

export interface Paths { base: string; walls: string; roofs: string; yard: string }

export function buildPaths(c: Cam): Paths {
  let base = '', walls = '', roofs = '', yard = '';
  for (const b of campus.buildings) {
    const ring = b.ring as number[][];
    const h = b.h;
    ring.forEach(([x, y], i) => {
      const [bx, by] = project(x, y, 0, c);
      base += (i ? 'L' : 'M') + f(bx) + ' ' + f(by);
      if (c.ext > 0.02) {
        const [tx, ty] = project(x, y, h, c);
        roofs += (i ? 'L' : 'M') + f(tx) + ' ' + f(ty);
        walls += 'M' + f(bx) + ' ' + f(by) + 'L' + f(tx) + ' ' + f(ty);
      }
    });
    base += 'Z';
    if (c.ext > 0.02) roofs += 'Z';
  }
  for (const g of campus.yard.grass as number[][][]) {
    g.forEach(([x, y], i) => {
      const [px, py] = project(x, y, 0, c);
      yard += (i ? 'L' : 'M') + f(px) + ' ' + f(py);
    });
    yard += 'Z';
  }
  // the three shade sails, at canopy height
  for (const [x, y, s] of campus.yard.sails as number[][]) {
    const r = s / 2;
    [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]].forEach(([px0, py0], i) => {
      const [px, py] = project(px0, py0, 3.6, c);
      yard += (i ? 'L' : 'M') + f(px) + ' ' + f(py);
    });
    yard += 'Z';
  }
  return { base, walls, roofs, yard };
}

export interface Spot { id: string; at: [number, number]; photos: string[] }
export const SPOTS: Spot[] = [
  { id: 'gate', at: [1040, 1860], photos: ['gate-2', 'gate-1', 'gate-5', 'gate-8', 'gate-9', 'gate-10'] },
  { id: 'street', at: [1376, 1816], photos: ['street-1', 'street-4', 'street-7'] },
  { id: 'yard', at: [826, 1078], photos: ['yard-14', 'yard-3', 'yard-5', 'yard-13', 'yard-15', 'yard-9'] },
  { id: 'courtyard', at: [869, 905], photos: ['courtyard-north', 'yard-1'] },
  { id: 'courtyardEast', at: [1227, 992], photos: ['courtyard-east'] },
  { id: 'party', at: [985, 1150], photos: ['ev-1', 'ev-8', 'ev-6'] },
  { id: 'htbHall', at: [886, 615], photos: ['htb-2', 'htb-1', 'htb-3'] },
  { id: 'court', at: [1130, 260], photos: ['court-3', 'court-2'] },
  { id: 'pis', at: [120, 175], photos: ['pis-1', 'pis-2', 'hall-2', 'hall-3', 'hall-4'] },
  { id: 'eshkol', at: [1835, 800], photos: ['eshkol-4', 'eshkol-3', 'eshkol-1', 'eshkol-2'] },
];

export const LABELS = campus.labels as Record<string, number[]>;
export const LABEL_H: Record<string, number> = { htb: 4.5, hta: 7, library: 4.5, yard: 0.5, eshkol: 10, gym: 9, court: 0.5, gate: 0.5, stop: 0.5 };
