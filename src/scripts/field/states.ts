// Field "states": every story section owns one. The director blends between them by scroll.
// freq   — lines per viewport height
// angle  — stripe direction, radians
// warp   — how much the fog bends the stripes (0 straight … 1 very wavy)
// contour— 0 parallel stripes … 1 topographic contour lines of the fog
// grid   — 0 … 1 second, perpendicular family (schedule grid / floor plan)
// width  — line width, render pixels
// fog    — blur + cloud strength
// contrast — line intensity
// light  — 0 dark ground … 1 paper ground
// color  — 0 monochrome … 1 the red of the courtyard sails appears
// grain  — extra film grain
// drift  — parallax drift with scroll

export interface FieldState {
  freq: number;
  angle: number;
  warp: number;
  contour: number;
  grid: number;
  width: number;
  fog: number;
  contrast: number;
  light: number;
  color: number;
  grain: number;
  drift: number;
}

export const KEYS: (keyof FieldState)[] = [
  'freq', 'angle', 'warp', 'contour', 'grid', 'width', 'fog', 'contrast', 'light', 'color', 'grain', 'drift',
];

const base: FieldState = {
  freq: 18, angle: 0, warp: 0.3, contour: 0, grid: 0, width: 1.1, fog: 0.4, contrast: 0.6,
  light: 0, color: 0, grain: 0.3, drift: 1,
};

const s = (o: Partial<FieldState>): FieldState => ({ ...base, ...o });

export const STATES: Record<string, FieldState> = {
  // 1 Hero — fog over the Eilat mountains: soft contour lines
  hero: s({ freq: 15, contour: 1, warp: 0.45, fog: 1, contrast: 0.6, width: 1.2, grain: 0.6 }),
  // 2 Six years — six calm parallel lines
  years: s({ freq: 13, angle: 0, warp: 0.08, contour: 0, fog: 0.45, contrast: 0.6, width: 1.1 }),
  // 3 What changes — chaos settles into a grid (start → end)
  chaos: s({ freq: 16, angle: 0.5, warp: 0.95, contour: 0.25, fog: 0.5, contrast: 0.55, light: 1 }),
  grid: s({ freq: 12, angle: 0, warp: 0.04, grid: 1, fog: 0.18, contrast: 0.5, light: 1, width: 1 }),
  // 4 One day — the schedule grid, dark
  day: s({ freq: 9, angle: 0, warp: 0.06, grid: 1, fog: 0.25, contrast: 0.42, width: 1 }),
  // 5 Campus in lines — the plan takes the stage, field steps back
  campus: s({ freq: 22, angle: 0.95, warp: 0.25, fog: 0.3, contrast: 0.13, width: 0.9, grain: 0.2 }),
  // 6 Names — Red Sea waves, paper
  names: s({ freq: 20, angle: 0, warp: 0.55, fog: 0.22, contrast: 0.48, light: 1 }),
  // 7 Life — contours again, livelier
  life: s({ freq: 17, contour: 0.7, warp: 0.5, fog: 0.35, contrast: 0.5 }),
  // 8 You won't get lost — lines become a route
  map: s({ freq: 11, angle: 0.62, warp: 0.18, fog: 0.15, contrast: 0.5, width: 1.3 }),
  // 9 Safe — calm paper
  safe: s({ freq: 8, angle: 0, warp: 0.1, fog: 0.15, contrast: 0.4, light: 1, width: 1.2 }),
  // 10 Getting here — the street, diagonal
  route: s({ freq: 15, angle: -0.42, warp: 0.1, fog: 0.2, contrast: 0.5 }),
  // 11 FAQ — quiet paper
  faq: s({ freq: 12, angle: 0, warp: 0.08, grid: 0.35, fog: 0.15, contrast: 0.33, light: 1 }),
  // 12 Finale — everything sharp, first colour
  finale: s({ freq: 14, contour: 1, warp: 0.6, fog: 0, contrast: 0.95, width: 1.3, color: 1, grain: 0.15 }),
  // Reading pages (parents / privacy / 404)
  page: s({ freq: 12, angle: 0, warp: 0.25, contour: 0.4, fog: 0.5, contrast: 0.4 }),
  lost: s({ freq: 15, contour: 1, warp: 0.9, fog: 1, contrast: 0.5, grain: 0.8 }),
};

export function lerpState(a: FieldState, b: FieldState, t: number, out: FieldState): FieldState {
  for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}
