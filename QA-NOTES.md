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

## Cycle 2

(see below — filled after the second full run)
