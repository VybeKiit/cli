# Third-party UI licenses

VybeKiit ships mirrored UI blocks from seventeen upstream libraries inside `templates/web/src/components/`. This document summarizes **free/OSS tier** licensing for the paid starter kit. It is engineering guidance, not legal advice — consult counsel before changing product positioning or redistribution terms.

## VybeKiit layer

- Kit code is governed by [EULA.md](../EULA.md) (buyer-owned after purchase).
- Buyers must **not remove upstream copyright or license notices** embedded in mirrored source files.
- VybeKiit syncs **free registry tiers only** — pro/paid upstream registries are filtered at sync time (`scripts/data/ui-registry-manifest.json`, BundUI `isPro` skip, Shadcnblocks curated `itemsFile`, etc.).

## Per-source summary

| Source | Free-tier license | Commercial use in paid kit | Notes |
|--------|-------------------|----------------------------|-------|
| **Magic UI** | MIT ([magicui.design](https://magicui.design), [GitHub](https://github.com/magicuidesign/magicui)) | Allowed with copyright notice | Never sync Magic UI Pro registry |
| **BundUI** | MIT ([GitHub](https://github.com/bundui/bundui)) | Allowed with attribution | `isPro` items excluded at sync |
| **Aceternity** | MIT (free registry / npm) | MIT permits commercial use | **Aceternity Pro EULA** restricts template marketplaces — free registry only; legal review recommended for kit positioning |
| **Kokonut UI** | MIT (file headers in mirrored source) | Allowed with attribution | [kokonutui.com](https://kokonutui.com) |
| **Untitled UI** | MIT (OSS components repo) | OSS components OK with notice | Untitled PRO license forbids exposing raw PRO source as a product — OSS registry only |
| **AI Elements** (Vercel) | MIT ([GitHub](https://github.com/vercel/ai-elements)) | Allowed with attribution | Vercel OSS registry |
| **Kibo UI** | MIT ([GitHub](https://github.com/haydenbleasel/kibo)) | Allowed with attribution | Community registry |
| **Gluestack** | MIT ([GitHub](https://github.com/gluestack/gluestack-ui)) | Allowed with attribution | v3 registry tree sync |
| **Tailark** | MIT ([GitHub](https://github.com/tailark/blocks)) | Allowed with attribution | Marketing blocks registry |
| **Cult UI** | MIT ([GitHub](https://github.com/nolly-studio/cult-ui)) | Allowed with attribution | Skip Cult Pro / paid templates |
| **COSS UI** | MIT ([coss.com/ui](https://coss.com/ui)) | Allowed with attribution | Origin UI successor; primitives + blocks |
| **Prompt Kit** | MIT ([GitHub](https://github.com/ibelick/prompt-kit)) | Allowed with attribution | AI chat primitives |
| **Supabase UI** | MIT ([supabase.com/ui](https://supabase.com/ui)) | Allowed with attribution | Stack-aligned auth/data blocks |
| **Blocks.so** | MIT ([GitHub](https://github.com/ephraimduncan/blocks)) | Allowed with attribution | App shell / auth blocks |
| **EvilCharts** | MIT ([GitHub](https://github.com/legions-developer/evilcharts)) | Allowed with attribution | Animated chart components |
| **Shadcnblocks** | MIT (free tier only) | Allowed with attribution | Curated `scripts/data/shadcnblocks-free-items.json`; build via `scripts/dev/sync/buildShadcnblocksFreeItems.mjs` |

## Excluded (not mirrored)

| Source | Reason |
|--------|--------|
| **ReUI** | Registry requires paid license key (`Authorization: Bearer`) — not free-tier |
| **Animate UI** | MIT + Commons Clause — prohibits redistributing components in a bundle |
| **React Bits** | MIT + Commons Clause — same redistribution restriction |
| **Skiper UI** | Site ToS forbids republish/redistribute |

## Engineering safeguards

1. **Sync-time headers** — `scripts/dev/sync/syncUiRegistries.mjs` preserves upstream `@license` / copyright comments when mirroring.
2. **Pro firewall** — manifest denylist + BundUI `isPro` filter + Shadcnblocks curated items file; no paid-registry URLs in `templates/web`.
3. **Attribution in kit** — mirrored files retain upstream headers; buyers see notices in copied source.
4. **Component library** — live previews use the same mirrored SSOT; non-previewable entries show honest reasons (`deps`, `env`, `native`, `nodemo`).

## Open questions for counsel

- **Aceternity Pro** “no competing template / marketplace” language vs selling VybeKiit as a starter kit that includes free-registry MIT components.
- Whether aggregated **THIRD_PARTY_NOTICES** at kit root is required beyond per-file MIT headers (recommended regardless).

## Verification commands

```bash
# Rebuild catalog + previews after sync
pnpm sync:ui
node scripts/dev/sync/buildComponentLibraryIndex.mjs

# Component library e2e (production build)
cd apps/componentLibrary && pnpm build && PLAYWRIGHT_ENABLED=true pnpm test:e2e
```

## References

- Sync manifest: [scripts/data/ui-registry-manifest.json](../scripts/data/ui-registry-manifest.json)
- Index builder: [scripts/dev/sync/buildComponentLibraryIndex.mjs](../scripts/dev/sync/buildComponentLibraryIndex.mjs)
- Buyer EULA: [EULA.md](../EULA.md)
