# Wave B — live spine checklist

Manual steps when maintainer secrets are available. Code + mocked tests ship in Wave A.

## 0. Prerequisites (Phase 0)

- [ ] CI green on all repos (`VybeKiit/vybekiit`, `web`, `mobile`, `extension`, `cli`)
- [ ] `publish.yml` + `release.yml` merged; `GH_MIRROR_TOKEN` secret set on monorepo
- [ ] npm Trusted Publishers configured (see §4 below)

## 1. Lemon Squeezy store (#4)

- Create LS store + **$29 early-bird** product variant
- Set `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `STORE_PRODUCT_ID`
- Point webhook to `https://<landing-domain>/api/webhook`
- Set `LEMONSQUEEZY_WEBHOOK_SECRET`
- Plan $49 variant for post-launch-week (swap `STORE_PRODUCT_ID` or create new variant)

## 2. GitHub gate (#4)

- Create `GITHUB_GATE_TOKEN` with repo + invite scope on `VybeKiit` org
- Confirm `GITHUB_GATE_REPOS=web,mobile,extension`
- Test invite: call webhook with test payload or manual API call

## 3. Cloudflare deploy (#7)

- Deploy `apps/landing` to CF Pages (see `.github/workflows/deploy-landing.yml` or manual wrangler)
- Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` as GitHub secrets
- Custom domain + `APP_URL`

## 4. npm publish (#17) — OIDC Trusted Publishing

**First publish (creates packages on npm):**

```bash
cd vybekiit
pnpm install && pnpm build
pnpm publish:packages:dry-run
pnpm publish:packages
cd cli && pnpm publish --access public --no-git-checks
```

**Register Trusted Publisher** on npmjs.com for each package (`@vybekiit/*` + `vybekiit`):

- Provider: GitHub Actions
- Owner: `VybeKiit`, Repository: `vybekiit`, Workflow: `publish.yml`

Workflow filename **must stay `publish.yml`**.

**Future releases:** merge PR → `Release` workflow → `publish.yml` via OIDC (no `NPM_TOKEN`).

## 5. End-to-end dry-run (#8)

See [tracer-bullet-runbook.md](./tracer-bullet-runbook.md).

1. Stranger pays $1 on landing
2. GitHub invited to web + mobile + extension mirrors
3. `npx vybekiit web` clones template
4. `onboarding` skill → live app with payments

Record friction as follow-up issues.
