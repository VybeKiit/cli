# ADR-0010 — Hybrid asset optimization and CDN delivery

- **Status:** Accepted
- **Date:** 2026-06-29
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

VybeKiit buyers add logos, heroes, icons, and user-uploaded photos without understanding
compression, formats, or CDN configuration. The kit had raw `StorageProvider` uploads and implicit
hosting CDN for built JS/CSS, but no image pipeline, no R2 implementation (despite docs), and no
scaffold for project assets.

## Decision

1. **New `@vybekiit/assets` package** with `AssetDeliveryProvider`: `optimizeForBuild()` (sharp +
   SVGO at perceptual defaults) and `url()` (provider-native CDN transforms).
2. **Hybrid timing:** build-time optimization for repo assets; on-demand CDN URLs for uploads and
   remote references.
3. **No new CDN env knob** — `resolveAssetDelivery()` derives from `HOSTING_PROVIDER` +
   `STORAGE_PROVIDER`.
4. **Implement R2 `StorageProvider`** in `@vybekiit/db`; doctor auto-provisions bucket + API token
   on the default Cloudflare stack.
5. **Agent surface:** `add-images` (project assets) + enhanced `add-files` (upload CDN URLs);
   optimization also runs automatically in build/start hooks.
6. **Platform exceptions:** extension bundled assets are build-time only (`chrome-extension://`);
   mobile bundles optimized assets; remote URLs use `expo-image` + `url()`.

## Consequences

- Buyers get fast images without choosing formats or CDNs.
- AWS CloudFront on-the-fly resize is minimal in v1 (correct URLs + cache; resize via query params
  documented as best-effort).
- Doctor requires Cloudflare API token permissions for R2 token creation.
- Sharp runs on the builder's machine during prebuild (same class of requirement as `next build`).
- Buyer journey contract: [ADR-0038](./0038-cli-buyer-journey-and-create-app.md) §8.1 requires
  `create app` / `doctor` to **validate** that template `public/` (and surface asset dirs) stay on
  this optimize + CDN + cache + WebP path for web, mobile, and extension — not optional polish.

## Alternatives rejected

- **CDN-only (no build pass):** leaves mobile/extension bundles bloated; offline assets unoptimized.
- **Build-only (no CDN transforms):** user uploads stay raw; poor latency for dynamic images.
- **Extend StorageProvider with transforms:** blurs storage vs delivery; couples db to hosting.
- **Explicit `CDN_PROVIDER` env:** violates Decide + Guide (ADR-0002).
