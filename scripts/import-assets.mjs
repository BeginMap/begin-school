// Copies the assets this site uses from Begin Map (read-only) and derives campus geometry.
//   node scripts/import-assets.mjs [path-to-begin-nav]
// Source: a local checkout of beginmap/begin-nav (BEGIN_NAV env or argument), otherwise the
// public site https://beginmap.github.io/begin-nav/. Nothing in Begin Map is modified.
// Output: assets-src/** (committed) and src/data/campus.json (committed).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTOS } from '../src/data/photos.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCAL = process.argv[2] || process.env.BEGIN_NAV || 'C:/Users/דוד מסס/Desktop/begin-nav';
const REMOTE = 'https://beginmap.github.io/begin-nav/';
const useLocal = fs.existsSync(path.join(LOCAL, 'data', 'rooms.json'));
console.log(useLocal ? `source: ${LOCAL}` : `source: ${REMOTE}`);

async function read(rel) {
  if (useLocal) return fs.readFileSync(path.join(LOCAL, rel));
  const r = await fetch(REMOTE + rel);
  if (!r.ok) throw new Error(`${r.status} ${rel}`);
  return Buffer.from(await r.arrayBuffer());
}
const readJSON = async (rel) => JSON.parse((await read(rel)).toString('utf8'));
function write(rel, buf) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
}

// ------------------------------------------------------------------ files
for (const p of PHOTOS) write(path.join('assets-src', p.src), await read(path.join('public', p.src)));
write('assets-src/maps/plan.jpg', await read('public/maps/plan.jpg'));
write('assets-src/icons/icon-192.png', await read('icons/icon-192.png'));
console.log(`copied ${PHOTOS.length} photos + plan + icon`);

// ------------------------------------------------------------------ geometry
const buildings = (await readJSON('data/buildings3d.json')).buildings;
const rooms = await readJSON('data/rooms.json');
const scene = await readJSON('data/scene3d.json');
const walk = await readJSON('data/walk.json');
const evac = await readJSON('data/evacuation.json');
const config = await readJSON('data/config.json');

const r1 = (v) => Math.round(v * 10) / 10;

function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const d = (p, a, b) => {
    const [x, y] = p, [x1, y1] = a, [x2, y2] = b;
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1e-9) return Math.hypot(x - x1, y - y1);
    return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / L;
  };
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const v = d(pts[i], pts[0], pts[pts.length - 1]);
    if (v > max) { max = v; idx = i; }
  }
  if (max > eps) {
    const a = simplify(pts.slice(0, idx + 1), eps);
    const b = simplify(pts.slice(idx), eps);
    return a.slice(0, -1).concat(b);
  }
  return [pts[0], pts[pts.length - 1]];
}

const outBuildings = buildings.map((b) => ({
  kind: b.kind,
  name: b.name || undefined,
  h: b.h,
  ring: simplify([...b.ring, b.ring[0]], 1.2).slice(0, -1).map(([x, y]) => [r1(x), r1(y)]),
}));

// courtyard furniture: sails, grass, trees, tables, chess, lamps
const yard = {
  sails: scene.sails.map((s) => [s.x, s.y, s.s, s.rot || 0]),
  grass: scene.grass.map((g) => g.map(([x, y]) => [r1(x), r1(y)])),
  trees: scene.trees.map((t) => [t[0], t[1], t[2]]),
  tables: scene.tables.map((t) => [t[0], t[1], t[2] || 0]),
  chess: scene.chess.map((c) => [c.x, c.y]),
  lamps: scene.lamps,
};

// ------------------------------------------------------------------ route: main entrance → class דולפין (A* on the walk grid)
const W = walk.w, H = walk.h, C = walk.cell;
const grid = new Uint8Array(W * H);
{
  let i = 0;
  for (let k = 0; k < walk.rle.length; k += 2) { grid.fill(walk.rle[k], i, i + walk.rle[k + 1]); i += walk.rle[k + 1]; }
}
const passable = (x, y) => x >= 0 && y >= 0 && x < W && y < H && grid[y * W + x] !== 0;
function nearestPassable(px, py) {
  const cx = Math.floor(px / C), cy = Math.floor(py / C);
  for (let r = 0; r < 30; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (passable(cx + dx, cy + dy)) return [cx + dx, cy + dy];
  throw new Error('no passable cell near ' + px + ',' + py);
}
function astar(a, b) {
  const N = W * H;
  const g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const h = (i) => Math.hypot((i % W) - b[0], Math.floor(i / W) - b[1]);
  const start = a[1] * W + a[0], goal = b[1] * W + b[0];
  g[start] = 0;
  const open = [[h(start), start]];
  // wall clearance: prefer cells away from walls (keeps the line in the middle of corridors)
  const near = (x, y) => { let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!passable(x + dx, y + dy)) n++; return n; };
  while (open.length) {
    open.sort((p, q) => p[0] - q[0]);
    const [, cur] = open.shift();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const cx = cur % W, cy = Math.floor(cur / W);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (!passable(nx, ny)) continue;
      if (dx && dy && (!passable(cx + dx, cy) || !passable(cx, cy + dy))) continue;
      const ni = ny * W + nx;
      const cost = g[cur] + Math.hypot(dx, dy) * (1 + near(nx, ny) * 0.15);
      if (cost < g[ni]) { g[ni] = cost; from[ni] = cur; open.push([cost + h(ni), ni]); }
    }
  }
  const path = [];
  for (let i = goal; i !== -1; i = from[i]) path.push([(i % W) * C + C / 2, Math.floor(i / W) * C + C / 2]);
  return path.reverse();
}
const dolphin = rooms.find((r) => r.id === 'dolphin');
const routeRaw = astar(nearestPassable(walk.entrance.x, walk.entrance.y), nearestPassable(dolphin.ax, dolphin.ay));
const route = simplify(routeRaw, 2.5).map(([x, y]) => [r1(x), r1(y)]);
console.log(`route: ${routeRaw.length} cells → ${route.length} points`);

// ------------------------------------------------------------------ places, labels, shelters
const shelters = rooms.filter((r) => r.category === 'shelter').map((r) => ({ id: r.id, x: r.x, y: r.y }));
const evacuation = {
  zones: evac.zones.map((z) => z.points.map(([x, y]) => [r1(x), r1(y)])),
  arrows: evac.arrows.map((a) => a.points.map(([x, y]) => [r1(x), r1(y)])),
};

// Room names, grouped by theme. Only themes we are sure about (see DECISIONS.md → "Room names").
const official = Object.fromEntries(rooms.map((r) => [r.official, r]));
const pick = (list) => list.filter((n) => official[n]).map((n) => ({ he: n, ru: official[n].names.ru, en: official[n].names.en, id: official[n].id }));
const names = {
  birds: pick(['דרור', 'צופית', 'אנפה', 'עפרוני', 'שחף', 'עגור']),
  flowers: pick(['כלנית', 'אירוס', 'נורית', 'ורד', 'נרקיס', 'חצב', 'צבעוני', 'מרגנית', 'לילך', 'רקפת', 'סחלב', 'יסמין', 'כרכום']),
  sea: pick(['דולפין', 'תוכינון', 'זהרון', 'חלילן', 'סולית', 'שונית']),
  trees: pick(['רותם', 'אשל', 'שיטה', 'דקל', 'תמר', 'הדס', 'אלה']),
  desert: pick(['ערבה', 'צין', 'פארן', 'נטפים', 'רמון', 'שחורת', 'רודד']),
  tanakh: pick(['דבורה', 'ברק', 'אהוד', 'יפתח', 'יותם']),
  sky: pick(['כפיר', 'לביא', 'אדיר', 'יסעור']),
};
const classroomsTotal = rooms.filter((r) => r.category === 'classroom').length;

const campus = {
  _source: 'Derived by scripts/import-assets.mjs from Begin Map data (buildings3d, scene3d, rooms, walk, evacuation). Plan pixels, 2000×1500; metres per pixel in mpp.',
  mpp: config.metersPerPixel ?? 0.108,
  origin: [826, 1078],
  buildings: outBuildings,
  yard,
  route,
  routeFrom: [walk.entrance.x, walk.entrance.y],
  routeTo: [dolphin.ax, dolphin.ay],
  shelters,
  evacuation,
  labels: {
    htb: [790, 660],
    hta: [1080, 1300],
    library: [786, 497],
    yard: [960, 985],
    eshkol: [1840, 800],
    gym: [175, 140],
    court: [1135, 300],
  },
  names,
  classroomsTotal,
};
write('src/data/campus.json', JSON.stringify(campus));
console.log('campus.json written', (fs.statSync(path.join(ROOT, 'src/data/campus.json')).size / 1024).toFixed(1), 'KB');
