# QA notes

Honest self-review. Each cycle: screenshots (4 languages × 390 / 768 / 1440, normal, reduced motion, no JS) → critique → fixes → automated checks.

## Cycle 1 — first full build

Screenshots: he 1440; ar + ru 390.

What was wrong:

- **The living field was invisible.** `body` had an opaque background, so the `z-index:-1` canvas painted under it. Fixed: transparent body, ground colour on `<html>`.
- **All three language offers showed at once**, covering the page bottom. `display:flex` beat the `hidden` attribute. Fixed globally: `[hidden]{display:none!important}`.
- **Arabic on phones was shifted** (text cut on the right): off-screen campus hotspots and labels widened the layout viewport to 429 px. `scrollWidth` looked fine because mobile emulation widened `innerWidth` too — the overflow script was lying. Fixed with `overflow-x: clip` per section; `qa/overflow.mjs` now checks against the real device width.
- **Field state lagged behind pinned sections** (light grid still showing in the dark "day" section): anchors sat at section midpoints and pin spacers made sections huge. Now two anchors per section, ⅓ screen inside each edge.
- **Hero contour lines were sparse blobs**, not a topographic map. Contour frequency ×3, less domain warp. Checked all 15 states in a lab sheet (`qa/field-lab.mjs`).
- **"Life" gallery too dark**: non-centre items at 35 % opacity on a dark B/W photo. Raised to 55–70 %.
- **Campus pull-back ended too small** on desktop (whole campus in the middle third). Final zoom 0.95 → 1.28.
- **Bidi**: Latin inside Hebrew/Arabic and Hebrew inside Russian/English were left to the default algorithm. Now isolated with `<bdi>` at build time.
- Hebrew title "שש שנים, בית / ספר אחד" broke between "בית" and "ספר" → non-breaking space.

axe (first run): 31 violations — contrast of rows that re-blurred on scroll back, accessible names not matching visible text (language button, home mark), a campus hotspot covered by the hint text. All fixed → **0 violations** on 4 languages × 4 pages × (390 px motion on, 1440 px reduced motion).

Proofreading (4 sub-agents, one per language): ≈190 suggestions; most applied. Notable: "own timetable" was an unconfirmed claim (levels/room changes unknown) → "a timetable with many subjects" in all languages; "the school will send a list" → "we're still checking"; advice to use the phone in school removed (phone rules unknown) → "look up your classroom before school"; Russian gendered «сам» removed; Hebrew "תראו" (see/show ambiguity) rephrased; Arabic hamza «اقرؤوا», «مادة» for school subject, «مقصف» for the kiosk.

## Cycle 2 — full matrix + art direction

Screenshots: 4 languages × 390 / 768 / 1440 (204 frames, 0 console errors, 0 overflow), reduced motion (he/ar 390, ru 1440), no JS (he 390, en 1440). Then an independent art-director pass (taste-critic sub-agent) on he/en desktop and ar phone: **7/10**.

Strongest (kept): the Names section (running Hebrew names, bold italic against light upright), a distinct line language per section in the field, disciplined red.

Self-critique, then fixes:

- **Photos looked broken while loading**: the 24-px placeholder was upscaled into pixel blocks. Now it is a blurred fog (`filter: blur(18px)` on a pseudo-element) — the "from blur to focus" concept even before the image arrives.
- **"Life" faded photos to 55 % opacity**, so the contour lines showed through the pictures. Now darkened with an overlay only on narrow screens.
- **RTL bugs hidden in scoped styles**: `[dir='rtl'] …` inside Astro components never matched (the html element has no scope attribute). Arrows in "What changes" pointed back to "before", origins and paddings were wrong. All wrapped in `:global([dir])`.
- **Heading wraps**: the kinetic splitter turned non-breaking spaces into normal ones ("בית / ספר"); fixed. Dashes are bound to the previous word in all languages.
- **Section heads looked randomly placed** (centred max-width boxes). Now all aligned to the inline start.
- **Day ride**: cards slid under the header; the last card was cut on phones (end padding 30vw); two red dots at once. Fixed padding from card width, progress dot is now light, red stays for "you are here".
- **Campus**: two lonely dots in the south (gate, bus stop) had no labels → labelled; the entrance dot is red ("this is where you come in"); background stripes calmed so they don't echo the building edges; stage kept clear of the header.
- **The big one — ScrollTrigger order**: triggers below the campus were created before the campus pin, so their positions ignored its 2 000-px spacer. Headings below the campus revealed late and the finale turned colour while the FAQ was still on screen. `ScrollTrigger.sort()` before every refresh.
- Buttons with a Latin name inside Hebrew/Arabic got a visible gap (the `<bdi>` became a separate flex item) → one label span per button.
- Finale on phones was a soft upscaled panorama → portrait crop for portrait phones.
- Kids' small print raised to 15 px and lighter grey; Arabic display a bit larger.
- QR code hidden on phones (you can't scan your own screen).
- Progress rail (new): ticks were closer than 24 px on long pages (axe target-size) → evenly spaced; hidden over the hero and without JS.

## Final numbers (23.11.2026)

**Lighthouse, mobile preset (simulated 4G + CPU ×4), live site https://beginmap.github.io/begin-school/**

| page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| he `/` | 100 | 100 | 100 | 100 | 1.3 s | 0 | 60 ms |
| ar `/ar/` | 98 | 100 | 100 | 100 | 1.1 s | 0 | 160 ms |
| ru `/ru/` | 98 | 100 | 100 | 100 | 1.1 s | 0 | 150 ms |
| en `/en/` | 100 | 100 | 100 | 100 | 1.4 s | 0 | 10 ms |
| he `/parents/` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 80 ms |
| ru `/ru/parents/` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 30 ms |

**JS:** first load ≈ 14 KB gzip (field + header + router); story chunk 53 KB and campus chunk 7 KB load after first paint. HTML of the home page ≈ 50 KB gzip (inline CSS, inline campus SVG).

**axe-core (WCAG 2.2 A/AA):** 0 violations — 4 languages × home/parents/privacy (+404), 390 px with motion and 1440 px with reduced motion.

**Links:** 354 unique internal and external links/images, 0 broken. Live smoke test: all language pages load with no console errors, Rubik normal/italic loaded, no broken images.

**Frame times** (`qa/fps.mjs`: programmatic scroll through the whole home page at 1 400 px/s, then 2 s idle; headless Chromium has no vsync, so "fps" can exceed 60 — p95 frame time is the honest number):

| setup | he | ar | ru | en |
|---|---|---|---|---|
| 390 px, real GPU, CPU ×4 | p95 16.7 ms, 0.4 % frames > 33 ms | p95 12.5 ms, 0 % | p95 16.7 ms, 0.1 % | p95 16.7 ms, 0 % |
| 1440 px, real GPU, CPU ×4 | p95 20.8 ms, 0.4 % | — | — | — |
| 390 px, **software GPU (SwiftShader)**, CPU ×4, DPR 2.6 | p95 37 ms, 5.9 % | p95 29 ms, 3 % | p95 33 ms, 3.9 % | p95 34 ms, 5.3 % |

The software-GPU row is a pessimistic stand-in for a weak phone: the budget system stepped the field down to 0.5–0.4 resolution by itself. With the field switched off the numbers did **not** improve — the cost there is rasterising the page in software at DPR 2.6, not the shader. On a real phone GPU this path does not apply; still, the honest reading is "≈30 fps with occasional drops on the weakest devices". Not measured on a physical Android phone.

**Living background (video `qa/out/video/field.webm`, not committed):** intro (title out of blur, lines gather and part), pointer trail bends lines, taps send ripples, scroll bursts stretch and bend the lines and they settle in ~0.6 s, hover focuses the field under a button, language switch sweeps a wave in the new reading direction while the text swaps; the canvas survives every switch (`qa/lang-switch.mjs`: same element, same WebGL context, he → ru → ar → en → he → back → parents, no errors).

## What is still weaker than the best motion sites

- No WebGL distortion on photos (only focus + zoom + light parallax); photos are DOM `<img>` on purpose.
- The "Begin Map" block is the most conventional layout on the page (phone mock-up + list + button).
- FAQ is a classic accordion.
- Not tested on a real low-end Android phone or a real iPhone. WebKit smoke test (`qa/webkit-check.mjs`, Playwright WebKit for Windows): he/ar/ru load with no errors, WebGL2 field on, RTL correct — but headings render in a light weight because the Windows WebKit build (WinCairo) ignores variable-font axes. Safari on iOS/macOS supports variable fonts; this needs one look on a real iPhone.
- Arabic and Hebrew texts were proofread by language models, not by native speakers — they need a native read before launch.

