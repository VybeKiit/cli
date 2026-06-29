# Wave B — live spine checklist

Manual steps when maintainer secrets are available. Code + mocked tests ship in Wave A.

## 1. Lemon Squeezy store (#4)

- Create LS store + product variant for the kit bundle
- Set `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `STORE_PRODUCT_ID`
- Point webhook to `https://<landing-domain>/api/webhook`
- Set `LEMONSQUEEZY_WEBHOOK_SECRET`

## 2. GitHub gate (#4)

- Create `GITHUB_GATE_TOKEN` with repo + invite scope on `VybeKiit` org
- Confirm `GITHUB_GATE_REPOS=web,mobile,extension`
- Test invite: call webhook with test payload or manual API call

## 3. Cloudflare deploy (#7)

- Deploy `apps/landing` to CF Pages
- Set `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- Custom domain + `APP_URL`

## 4. npm publish (#17)

```bash
export NPM_TOKEN=...
pnpm publish:packages:dry-run   # verify
pnpm publish:packages
```

Packages: core, payments, auth, db, deploy, email, tokens, observability, security, assets,
agent-kit, extension-publish, i18n, seo, compliance, kv, analytics, jobs, notifications, search,
realtime, tenancy, ai, cms — plus `cli` separately.

## 5. End-to-end dry-run (#8)

1. Stranger pays $1 on landing
2. GitHub invited to web + mobile + extension mirrors
3. `npx vybekiit web` clones template
4. `onboarding` skill → live app with payments

Record friction as follow-up issues.
