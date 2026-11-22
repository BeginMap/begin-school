# Decisions

Short log of taste and technical decisions taken without asking, with the reason for each.

## Project

- **Separate repository `BeginMap/begin-school`, local folder `C:\begin-school`.** Begin Map (`beginmap/begin-nav`) is only read: assets and data are copied by `scripts/import-assets.mjs`; its code, deploy, service worker and repos are untouched. An ASCII path avoids tools breaking on the Hebrew-and-space home path.
- **URL:** `https://beginmap.github.io/begin-school/`. The logged-in GitHub account is BeginMap, so the site sits next to Begin Map without touching it. Hebrew at the root, `/ar/`, `/ru/`, `/en/`.
- **Astro 7 + TypeScript, static output.** One pre-rendered page per language; client JS only where something moves.
- **GSAP 3.15 + ScrollTrigger** (now free under the GSAP "Standard no-charge" licence, checked in `node_modules/gsap/package.json`). **SplitText is not used**: an own 3 KB splitter (`src/scripts/kinetic.ts`) does exactly what the brief asks — graphemes via `Intl.Segmenter`, Arabic only by words, mixed-direction runs kept whole so bidi never breaks.
- **Lenis 1.3** only with a fine pointer and motion on. Touch devices keep native scroll.
- **No Three.js.** The background is raw WebGL2; the "campus in lines" is SVG (see below). The optional 3D library insert was skipped: the line campus already carries the 3D moment, and `library.glb` (1.2 MB) would cost more than it gives.
- **No analytics at all** (not even Umami): nothing to collect from children. A privacy page exists anyway, in four languages.
- **Lazy story chunk.** First load ships ~14 KB gzip of JS (field + header + router). GSAP, ScrollTrigger, Lenis and all section choreography (~53 KB gzip) load after the first paint; the campus code (~7 KB) is its own chunk. CSS "start states" (undrawn lines, blurred rows, monochrome finale) apply only once that code runs (`html.story`), so a failed chunk never hides content.
- **ScrollTrigger.sort() before every refresh**: triggers are created out of page order (the campus pin is created last), and without sorting everything below it was measured ~2 600 px too early.
- **Exact versions** in `package.json` (`npm i -E`) plus `package-lock.json`.
- **Playwright** runs against the Chromium already on this machine (`qa/browser.mjs`); the brief said not to reinstall.

## Concept and art direction

- **"From blur to focus"** is literal everywhere: the hero title arrives out of a blur (pure CSS, so LCP is not delayed); photos enter as a blurred monochrome placeholder and snap sharp; the field's fog/blur falls section by section; colour appears only in the finale (the courtyard photo turns from blurred B/W to colour, the contour lines pick up the sails' red).
- **Palette:** granite night `#0c0c0b`, eight greys, concrete paper `#ecebe7` (deliberately greyer than the usual "cream"), one red `#c9362f` — the sunlit sails, sampled from yard photos (median of red pixels in `yard-14`, `yard-5`). Red is used only for: the "you are here" dot (years, day progress, current language), the Begin Map call to action, the route in the phone, and the finale.
- **Lines have three real meanings:** contour lines (Eilat mountains: hero, life, finale), sea waves (names), the plan (campus walls, schedule grid in "day", route in "Begin Map").
- **Type: Rubik variable, self-hosted (Fontsource), unicode-range subsets.** Rubik now ships Arabic, Hebrew, Cyrillic and Latin with the same 300–900 axis, so one family carries all four languages with equal weight. Display: 860 italic for he/ru/en (continuity with Begin Map's bold italic); Arabic display is upright 800 — Arabic is never slanted — with taller line height.
- **No numbered "01/02" markers** except where content is a sequence (the day's seven stops). No all-caps labels, no `·`-joined meta strings, no `→` glued to link text.
- Light sections (changes, names, safe, FAQ) are paper plates over the light field: text never sits on raw texture. Dark sections put text on a radial scrim.

## Motion core (living background)

- One fixed `<canvas>`, WebGL2, a single full-screen triangle, **one draw call**. Layers in the fragment shader: domain-warped fbm fog → stripe field (`parallel / contour / grid` mixed by uniforms, anti-aliased with `fwidth`) → film grain → vignette.
- Rendered at **0.6 of CSS pixels** (234 × 506 on a 390-px phone), DPR ignored. Budget check every 2 s: above 20 ms average → 0.5 → 0.4 → trail off → still frame.
- **Pointer trail = buffer of the last 12 points in uniforms**, not a ping-pong FBO: same look, no extra pass, cheaper on phones.
- **Scroll velocity → damped spring** (k = 70, ζ ≈ 0.62, settles in ~0.6 s) drives bend, stretch, blur and grain. All smoothing is frame-rate independent (`1 − e^(−k·dt)`).
- **Section states are anchors**, two per section (top + ⅓ screen, bottom − ⅓ screen), so the field morphs while a section boundary crosses the middle of the screen — this also works with pinned sections whose height includes the pin spacer.
- Shader compiles with `KHR_parallel_shader_compile` and the field starts after first paint (`requestIdleCallback`), so text (LCP) never waits for WebGL.
- **Language switch keeps the canvas:** Astro's `ClientRouter` with `transition:persist` swaps pages around it; a click on another language starts a wave in the new reading direction and the swap is delayed ~360 ms so the text changes while the wave crosses.
- Fallbacks: no WebGL2 → a pre-rendered still of the field (`src/assets/field-dark.webp`, 11 KB) with a slow CSS drift; no JS → the same still as page background; reduced motion / motion switch off → one still frame of the current section's state, no pin, no parallax, no Lenis.
- **Counters** were not added: the only confirmed numbers (4 shelters, 9 computer rooms, 6 years) read better as words than as animated figures; unconfirmed numbers (pupils, classes) stay hidden.
- Tilt control was **not** added (optional in the brief): an extra permission prompt on iOS for a decorative effect is not worth it for 11-year-olds.

## Structure

- 12 blocks in the brief's order. **Campus (5) stays before Names (6):** the plan first shows where everything is, then the names zoom into single doors — the story goes from big to small.
- **"For parents"** is a separate page per language (`/parents/`), plus a parents column in the FAQ. "Privacy" and a four-language 404 exist.
- **Campus in lines = SVG, not WebGL lines.** 33 Begin Map building rings (≈420 points) are projected on the CPU each frame of the camera flight (plan → fly over gate and courtyard → 3D pull-back). Cost ≈ 0.3 ms per frame; crisp at any DPR; the same function renders a static SVG at build time for no-JS. Photo hotspots are real `<button>`s; a "places" list under the plan is the accessible alternative and the no-JS fallback (native `<details>`).
- **Day ride** is a pinned horizontal track, mirrored in RTL. Without motion it is a vertical stack. No bell times anywhere.
- **Side progress line** (desktop/tablet ≥ 900 px): one tick per section, the red "you are here" dot travels down it, hovering a tick shows the section title. It doubles as an anchor navigation (`<nav>` with real links) for a 12-section page.
- **Route in the phone** is computed, not drawn: A* over Begin Map's walk grid (`data/walk.json`) from the main entrance to the door of דולפין.

## Facts and content

- Unverified facts live in `src/data/facts.ts` with `verified: false` and a display mode: `hide` (founding year, numbers of pupils/classes, י״ג, פלדה כחולה programme, bell times, levels, uniform…), `attributed` (phone and the arts majors are shown *with their source*), `neutral` (ulpan: "there is a room called אולפן — ask the school").
- **Phone 08-6336792 is shown attributed** ("by the municipality's list of schools") because the municipality's official page lists it; the house number is hidden (sources say 2 and 28), the street is shown.
- **Registration:** no Eilat page for ז׳ exists; the FAQ explains the general rule (MoE circular 0386: the local authority assigns and notifies parents) and links to the municipality's registration page.
- Old official site `begin.edu1.org.il` does not resolve — not linked.
- **Room names:** grouped only where the theme is certain from the words themselves (birds, flowers, sea, trees, Negev places, judges, aircraft). Words whose meaning was uncertain (טווסון, פיקסון, פזית, אלמוגית, יולית, ציחור, מישר, שגיא, ארגמן, גרניט…) are left out rather than guessed. The "sky" group is framed as a fact about the words ("Kfir — lion cub; also an Israeli jet"), not as a claim about the school's intent.
- **Testimonials:** hidden slot (`src/data/testimonials.ts` is empty, `FLAGS.testimonials = false`).
- Footer states the site is made by the Begin Map team and is **not the school's official site**.

## Photos

- Black-and-white is baked at build time with sharp (grayscale + gentle curve), AVIF + WebP at 480/960/1600 px plus a 24-px blurred placeholder inlined as a data URI. Cheaper than CSS `grayscale()`/`blur()` on a phone and ~30 % smaller files.
- Colour variants only for the finale/OG photo.
- **Facebook photos (20) are on by default and hidden at once with `PUBLIC_FB_PHOTOS=0`** (GitHub variable). Begin Map already publishes them with faces blurred; rights still need confirming (see CONTENT-CHECKLIST). Only 13 of them are used, cropped to avoid close-ups (see CREDITS.md).

## Accessibility and i18n

- Logical CSS properties throughout; arrows and horizontal motion mirror in RTL.
- **Bidi isolation is automatic:** `scripts/bidi.mjs` (Astro integration) wraps Latin runs in he/ar pages and Hebrew runs in ru/en pages in `<bdi>` after the build.
- The build fails on any missing or extra translation key, empty string, placeholder text or mismatched `{placeholder}` (`scripts/check-i18n.mjs`).
- Language offer on first visit (browser language ar/ru/en ≠ page) is a dismissible card; never a redirect. The chosen language is remembered in localStorage.
