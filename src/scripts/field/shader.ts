// Fragment + vertex shader for the living background field.
// One full-screen triangle, one draw call per frame.
// Layers: domain-warped fbm "fog" → bent stripe field (parallel / contour / grid) with fwidth AA →
// pointer trail, tap ripples, scroll bend, language wave → film grain → vignette.

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const MAX_PTS = 12;
export const MAX_RIPS = 4;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uFrame;
uniform vec4  uS0;      // freq, angle, warp, contour
uniform vec4  uS1;      // grid, width(px), fog, contrast
uniform vec4  uS2;      // light, color, grain, drift
uniform vec2  uVel;     // scroll velocity, viewport heights / s (spring-smoothed)
uniform float uScroll;  // scroll offset in viewport heights
uniform vec4  uPts[${MAX_PTS}];  // pointer trail: x, y (field space), age s, strength
uniform vec4  uRip[${MAX_RIPS}]; // ripples: x, y, age s, amplitude
uniform vec4  uFocus;   // hovered element rect in field space (x0, y0, x1, y1)
uniform float uFocusAmt;
uniform vec3  uLang;    // progress 0..1, direction (+1 = LTR sweep, -1 = RTL sweep), active
uniform float uIntro;   // 0..1, intro "lines gather and part"

out vec4 outColor;

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float gnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = dot(hash22(i), f);
  float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { s += a * gnoise(p); p = m * p; a *= 0.5; }
  return s;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0);
  float t = uTime;

  float freq = uS0.x, ang = uS0.y, warp = uS0.z, contour = uS0.w;
  float grid = uS1.x, width = uS1.y, fog = uS1.z, contrast = uS1.w;
  float light = uS2.x, colorAmt = uS2.y, grainAmt = uS2.z, drift = uS2.w;

  float vy = clamp(uVel.y, -4.0, 4.0);
  float speed = min(abs(vy), 4.0);
  float vmin = min(asp, 1.0);

  // ---------- interaction: displacement + local focus
  vec2 disp = vec2(0.0);
  float sharp = 0.0;

  for (int i = 0; i < ${MAX_PTS}; i++) {
    vec4 P = uPts[i];
    if (P.w <= 0.0) continue;
    vec2 d = p - P.xy;
    float r = length(d);
    float R = 0.18 * vmin;
    float fall = exp(-(r * r) / (R * R)) * P.w * exp(-P.z * 2.4);
    disp += (d / (r + 0.02)) * fall * 0.055 * vmin;
    sharp += fall * 0.9;
  }
  for (int i = 0; i < ${MAX_RIPS}; i++) {
    vec4 Q = uRip[i];
    if (Q.w <= 0.0) continue;
    vec2 d = p - Q.xy;
    float r = length(d);
    float front = Q.z * 0.6 * vmin + 0.01;
    float ring = exp(-pow((r - front) / (0.07 * vmin), 2.0));
    float env = exp(-Q.z * 1.7) * Q.w;
    disp += (d / (r + 0.001)) * ring * env * 0.03 * vmin * sin((r - front) * 70.0 / vmin);
    sharp += ring * env * 0.6;
  }
  if (uFocusAmt > 0.001) {
    vec2 c = clamp(p, uFocus.xy, uFocus.zw);
    float d = length(p - c);
    sharp += (1.0 - smoothstep(0.0, 0.09 * vmin, d)) * uFocusAmt;
  }
  if (uLang.z > 0.5) {
    float front = mix(-asp * 0.5 - 0.35, asp * 0.5 + 0.35, uLang.x);
    float band = exp(-pow((p.x * uLang.y - front) / 0.16, 2.0));
    disp.x += band * 0.06 * uLang.y;
    disp.y += band * 0.02 * sin(p.y * 40.0 + t * 3.0);
    sharp += band;
  }
  sharp = clamp(sharp, 0.0, 1.0);

  // scroll: lines bend in the scroll direction and stretch
  disp.y += vy * 0.03 * (0.55 + 0.45 * sin(p.x * 2.1 + t * 0.35));
  vec2 q = p + disp;
  q.y /= (1.0 + speed * 0.1);

  // intro: lines gather to the title band, then part
  float ie = 1.0 - pow(1.0 - clamp(uIntro, 0.0, 1.0), 3.0);
  q.y *= mix(3.2, 1.0, ie);

  // slow parallax drift with scroll
  q.y += uScroll * 0.1 * drift;

  // ---------- layer 1: domain-warped fbm fog
  vec2 w1 = vec2(fbm(q * 1.25 + vec2(0.0, t * 0.03)),
                 fbm(q * 1.25 + vec2(5.2, 1.3) - t * 0.025));
  float h = fbm(q * 0.9 + 1.25 * w1 + vec2(t * 0.012, 0.0));
  float breath = 0.5 + 0.5 * sin(t * 0.33);

  // ---------- layer 2: stripe field
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  float cp = dot(q, nrm) * freq + warp * h * 4.0;
  float cc = (h + 0.05 * breath) * freq * 1.9 + t * 0.02;
  float coord = mix(cp, cc, contour);
  float c2 = dot(q, dir) * freq * 0.5 + warp * h * 2.0;

  float blurPx = 0.6 + fog * 5.5 + speed * 1.6;
  blurPx *= 1.0 - 0.8 * sharp;
  float hw = width * 0.5;

  float fw = max(fwidth(coord), 1e-4);
  float dA = abs(fract(coord + 0.5) - 0.5) / fw;
  float lineA = 1.0 - smoothstep(hw - 0.5, hw + blurPx, dA);
  lineA *= 1.0 - smoothstep(0.22, 0.48, fw);

  float fw2 = max(fwidth(c2), 1e-4);
  float dB = abs(fract(c2 + 0.5) - 0.5) / fw2;
  float lineB = (1.0 - smoothstep(hw - 0.5, hw + blurPx, dB)) * (1.0 - smoothstep(0.22, 0.48, fw2));

  float line = max(lineA, lineB * grid);
  line *= mix(1.0, 0.6, clamp(blurPx / 6.0, 0.0, 1.0));

  // ---------- colour
  vec3 dark = vec3(0.047, 0.046, 0.044);
  vec3 paper = vec3(0.925, 0.922, 0.906);
  vec3 bg = mix(dark, paper, light);
  float cl = smoothstep(-0.35, 0.55, h * 1.2 + 0.3 * w1.x);
  bg += mix(1.0, -1.0, light) * cl * (0.03 + 0.06 * fog);

  vec3 lineCol = mix(vec3(0.33, 0.33, 0.325), vec3(0.47, 0.465, 0.455), light);
  float idx = floor(coord + 0.5);
  float isRed = step(fract(idx / 6.0 + 0.04), 0.1);
  vec3 sail = vec3(0.788, 0.212, 0.184);
  lineCol = mix(lineCol, sail, colorAmt * isRed * 0.95);
  bg = mix(bg, bg * vec3(1.035, 1.0, 0.965), colorAmt);

  float inten = contrast * (0.85 + 0.15 * breath) * (1.0 + 0.35 * sharp);
  inten *= mix(1.0, 1.6, (1.0 - ie));
  vec3 col = mix(bg, lineCol, clamp(line * inten, 0.0, 1.0));

  // ---------- grain
  float g = hash12(gl_FragCoord.xy + fract(uFrame * 0.6180339) * 917.0) - 0.5;
  col += g * (0.03 + grainAmt * 0.05 + speed * 0.025);

  // ---------- vignette
  float v = smoothstep(0.35, 1.05, length(p / vec2(max(asp, 1.0) * 0.62, 0.62)));
  col *= 1.0 - v * mix(0.32, 0.1, light);

  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
