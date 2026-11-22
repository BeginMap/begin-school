// @ts-check
import { defineConfig } from 'astro/config';
import bidi from './scripts/bidi.mjs';

// Site lives at https://beginmap.github.io/begin-school/ (GitHub Pages project site).
// Override with SITE / BASE env vars for another host (e.g. a fork or a custom domain).
const site = process.env.SITE ?? 'https://beginmap.github.io';
const base = process.env.BASE ?? '/begin-school';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always', assets: '_a' },
  prefetch: false,
  integrations: [bidi()],
  devToolbar: { enabled: false },
  vite: {
    build: { target: 'es2020', assetsInlineLimit: 0 },
  },
});
