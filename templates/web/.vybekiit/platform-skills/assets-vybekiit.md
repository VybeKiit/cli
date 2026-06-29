# Platform wrapper: asset optimization + CDN (ADR-0010)

**Agent-only.** Used by `add-images`, `add-files`, build hooks, and `VybeImage`.

## Kit wiring

1. **Build-time:** `resolveAssetDelivery().optimizeForBuild({ sourceDir })` — sharp + SVGO
2. **Runtime URLs:** `resolveAssetDelivery().url(src, { width, format })` — CDN transforms
3. **Display:** `VybeImage` in `src/components/vybe-image.tsx`
4. **Storage:** `resolveStorageProvider()` for uploads; doctor provisions R2 on Cloudflare default

## Provider derivation (no new env knob)

| HOSTING | STORAGE | Delivery |
|---|---|---|
| cloudflare | r2 | CF Pages + R2 + Image Resizing |
| cloudflare | supabase | CF Pages + Supabase URL + CF resize |
| vercel | any | Vercel Image Optimization |
| aws | s3 | CloudFront + S3 URLs |

## Cloudflare R2

- Doctor: `vybekiit doctor` creates bucket + API token, writes `.env`
- Docs: https://developers.cloudflare.com/r2/
- Image Resizing: https://developers.cloudflare.com/images/image-resizing/

## Verify

- `node scripts/optimize-assets.mjs` succeeds
- Upload test file → `url()` returns CDN transform URL
- Images load fast in browser / on device
