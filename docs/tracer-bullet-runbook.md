# Tracer bullet runbook (#8)

Run as a **stranger** — fresh GitHub account, clean machine. Record friction as GitHub issues.

**Automated multi-agent dogfood:** for Claude Code / Codex / Grok in isolated Docker environments (open-ended product, FEEDBACK.md + gallery), see [agent-eval-dogfood.md](./agent-eval-dogfood.md) (`pnpm agent-eval`).

## Prerequisites

- [ ] Wave B complete ([wave-b-live-spine.md](./wave-b-live-spine.md))
- [ ] npm packages published; `npx vybekiit` works
- [ ] Landing live with working checkout
- [ ] Loom demo recorded and `DEMO_VIDEO_EMBED_URL` set in `apps/landing/src/data/site.ts`

## Web (primary — includes go-live + payments)

1. Pay $29 on landing with test GitHub username + email
2. Confirm auto-invite to `VybeKiit/web` (+ mobile + extension)
3. `npx vybekiit new web my-tracer-app` (or `npx vybekiit web`)
4. Run **onboarding** skill → localhost personalized
5. Run **go-live** skill → public URL live
6. Run **setup-payments** → `/checkout/practice` works

## Mobile

1. Same purchase grants `VybeKiit/mobile` access
2. `npx vybekiit new mobile my-tracer-mobile`
3. **onboarding** → Expo QR → app on phone, personalized
4. Auth stubs in `auth-client.ts` are expected post-onboarding — do not block on `connect-account`

## Extension

1. `npx vybekiit new extension my-tracer-ext`
2. **onboarding** → load unpacked in Chrome → popup works, personalized

## Exit criteria

All three onboarding "definitions of done" met per each template's `.vybekiit/skills/onboarding.md`.

## Record demo

Primary Loom (~10 min): steps 1–6 under Web.
Bonus clips (~2 min each): mobile QR + extension popup.
Set `DEMO_VIDEO_EMBED_URL` in `apps/landing/src/data/site.ts`.
