# Begin, Eilat — meet the school

A welcome site for kids who start 7th grade (ז׳) at the Begin school in Eilat, and for their parents.
Four languages: Hebrew (default, `/`), Arabic (`/ar/`), Russian (`/ru/`), English (`/en/`).

Live: https://beginmap.github.io/begin-school/

Built with Astro (static), a hand-written WebGL2 background, GSAP ScrollTrigger and Lenis.
Photos and school data come from [Begin Map](https://beginmap.github.io/begin-nav/) (read-only).

## Run it

Needs Node 22.23+.

```sh
npm ci
npm run dev        # http://127.0.0.1:4321/begin-school/  (images are generated first)
npm run build      # → dist/  (fails if a translation key is missing)
npm run preview    # serve dist/ locally
```

## Edit the texts

All texts live in **`src/i18n/he.json`, `ar.json`, `ru.json`, `en.json`** — one file per language, same keys in all four.

- Change a sentence: edit the same key in each language file.
- Add a new text: add the key to **all four** files. `npm run build` stops with a list of missing/extra keys, empty strings or mismatched `{placeholders}` (`npm run check:i18n` runs only this check).
- Photo captions / alt texts are under `photos.<id>`.
- Keep `{phone}`, `{name}`, `{n}`, `{total}` as they are.
- Hebrew grade letters and abbreviations use ׳ and ״ (not `'` and `"`).
- Mixed Hebrew/Latin text needs no markup: the build isolates it with `<bdi>` automatically (`scripts/bidi.mjs`).

Arabic and Hebrew still need a final read by a native speaker (see QA-NOTES.md).

## Switch on a confirmed fact

Facts that the school has not confirmed are in **`src/data/facts.ts`** with `verified: false` and a display mode (`hide`, `attributed`, `neutral`). The full list of open questions is in **CONTENT-CHECKLIST.md**.

1. Set `verified: true` (and `value`) for the fact.
2. If the wording should become definite (e.g. "the school will announce the bell times" → the actual times), edit the texts in the four language files.
3. `npm run build`, commit, push.

Flags in the same file:

- `PUBLIC_FB_PHOTOS=0` (environment / GitHub repository variable) hides all Facebook event photos at once.
- `FLAGS.testimonials` shows real pupil quotes from `src/data/testimonials.ts` (empty on purpose).

## Add or change photos

1. Put the photo in Begin Map, or anywhere under `assets-src/`.
2. Add an entry to **`src/data/photos.ts`**: `id`, `src` (path under `assets-src/`), optional `crop` `[x, y, w, h]` as fractions, `fb: true` if it comes from Facebook, `color: true` if a colour version is needed.
3. Add the caption / alt text under `photos.<id>` in all four language files.
4. Use it: `<Photo id="…" lang={lang} />`.
5. `npm run images` (also runs automatically before `dev` and `build`) makes black-and-white AVIF/WebP at 480/960/1600 px and a tiny blurred placeholder.

Before publishing a photo with people: no recognisable pupil's face in close-up — crop or skip (see CREDITS.md).

To refresh data from Begin Map (building outlines, rooms, route, photos): `npm run assets` (reads a local checkout from `BEGIN_NAV`, otherwise the public Begin Map site).

## Deploy

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) builds and publishes to GitHub Pages.
Another host or path: set `SITE` and `BASE` environment variables at build time (see `astro.config.mjs`).

`npm run stills` (with the preview server running) re-renders the still frame of the background and the Open Graph images.

## Quality checks

With `npm run preview` running:

```sh
npm run qa:shots -- --langs he,ar --widths 390,1440 --mode normal   # screenshots (also: reduced, nojs)
npm run qa:overflow     # horizontal overflow at 320 / 390 px
npm run qa:axe          # axe-core on every page and language
npm run qa:fps          # frame times during programmatic scroll, CPU ×4
npm run qa:links        # internal and external links
```

## Where things are

| Path | What |
|---|---|
| `src/scripts/field/` | The living background (WebGL2 shader, inputs, budget) |
| `src/scripts/campus-geo.ts`, `campus.ts` | "The whole school, in lines" |
| `src/scripts/kinetic.ts` | Kinetic headings (Arabic only by words) |
| `src/scripts/sections.ts` | Scroll choreography of the story sections |
| `src/components/` | One component per section |
| `src/data/` | Facts, photos, campus geometry |
| `scripts/` | Asset import, images, i18n check, bidi, stills |
| `qa/` | Playwright checks |

Docs: DECISIONS.md · QA-NOTES.md · CREDITS.md · CONTENT-CHECKLIST.md
