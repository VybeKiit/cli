# apps/component-library — VybeKiit UI browser

Public component gallery at [ui.vybekiit.com](https://ui.vybekiit.com). Imports mirrored blocks from `templates/web/src/components/` via webpack alias — single SSOT, no duplicate copies.

## Dev

```bash
pnpm dev:ui-library
# or
pnpm --filter vybekiit-component-library dev
```

Regenerate catalog after `pnpm sync:ui`:

```bash
node scripts/build-component-library-index.mjs
```

## Deploy

Cloudflare Pages via `.github/workflows/deploy-ui-library.yml` — set repo variable `CF_UI_PAGES_PROJECT` and point `ui.vybekiit.com` DNS to the Pages project.
