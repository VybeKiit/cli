# Loom recording guide

Record during the tracer bullet dry-run — scruffy is fine.

## Primary video (~10 min)

1. Pay on landing → GitHub invite email
2. `npx vybekiit new web my-app`
3. Onboarding skill → personalized localhost
4. Go-live skill → public URL
5. Setup-payments → practice checkout

## Bonus clips (~2 min each)

- **Mobile:** Expo QR → app on phone
- **Extension:** Chrome unpacked → popup running

## Embed on landing

1. Upload to Loom (or YouTube unlisted)
2. Copy embed URL
3. Set in [`apps/landing/src/data/site.ts`](../apps/landing/src/data/site.ts):

```ts
export const DEMO_VIDEO_EMBED_URL = 'https://www.loom.com/embed/...';
```

4. Deploy landing — hero shows iframe instead of animated demo

## Cold email

Lead with the Loom link + live checkout URL. Do not send until tracer bullet passes.
