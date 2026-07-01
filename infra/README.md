<p align="center">
  <img src="https://raw.githubusercontent.com/VybeKiit/vybekiit/main/assets/hero.webp" width="1000" height="1000" alt="VybeKiit">
</p>

# VybeKiit · Infra

Deploy and edge configuration for VybeKiit's default target stack: **Cloudflare**
(Pages/Workers) + **Supabase**. This is where the kit's infrastructure lives — the
config that runs *in front of* and *underneath* the app, not the app code itself.

## This directory is a mirror — edit here, never there

`infra/` is mirrored one-way to the public-ish **`VybeKiit/infra`** repo via
`git subtree split` (ADR-0005). The mirror is a **derived artifact**: it is force-pushed
on every sync and never hand-edited. If you change a file directly in the mirror, the
next sync overwrites it. **Make every change here, in the monorepo.** This `README.md` is
the source that the mirror's README is generated from.

## Layout

```
infra/
├── cloudflare/
│   ├── wrangler.toml          # Edge security Worker skeleton
│   └── security-worker.ts     # Edge security Worker — mirrors the app-layer policy
├── scripts/
│   ├── provision-domain.mjs   # CF zone + optional Namecheap NS + email sending
│   └── deploy-landing.mjs     # CF Pages deploy helper
├── supabase/
│   └── migrations/
└── README.md
```

Transactional email worker: **`packages/email/worker/`** (see that README).

## Domain + email setup

All secrets live in the **monorepo root `.env`** (copy from `.env.example`).

```bash
DOMAIN=yourdomain.com node infra/scripts/provisionDomain.mjs
cd packages/email/worker && npm i && npx wrangler secret put EMAIL_WORKER_SECRET && npm run deploy
pnpm email:test-send you@example.com
```

See `templates/web/.vybekiit/platform-skills/cloudflare-email-vybekiit.md` for the full buyer path.

## The security edge layer

VybeKiit is **secure by default**. Security is enforced at two complementary layers that
read the **same** toggles, so a rule can never mean one thing in the app and another at
the edge:

- **App layer** — `packages/security`, a per-instance in-memory guard the app calls on
  every request. It protects one running instance.
- **Edge layer** — `infra/cloudflare/security-worker.ts`, this directory. It runs at the
  Cloudflare edge in front of the app and caps **distributed** abuse (many IPs, or one IP
  fanned across instances) before it reaches origin.

Both resolve their rules from the single source of truth in
`packages/core/src/config.ts` (`securityConfigSchema`) — the same env keys:

| Key | Meaning | Default |
| --- | --- | --- |
| `SECURITY_RATE_LIMIT` | `on`/`off` master switch for the per-IP rate limit | `on` |
| `SECURITY_RATE_LIMIT_MAX` | max requests per window per client IP (default tier) | `60` |
| `SECURITY_RATE_LIMIT_AUTH_MAX` | stricter cap for login/auth routes | `10` |
| `SECURITY_RATE_LIMIT_PUBLIC_FORM_MAX` | lenient cap for contact/waitlist forms | `30` |
| `SECURITY_RATE_LIMIT_WINDOW_SECONDS` | window length in seconds | `60` |
| `SECURITY_ORIGIN_LOCK` | `on`/`off` — reject cross-site state-changing requests | `on` |
| `SECURITY_ALLOWED_ORIGINS` | CSV of extra allowed origins (blank = same-origin only) | blank |

Webhooks (`/api/webhook/*`) skip origin lock — they are verified by signature instead. Route tiers
(auth-strict, public-form, webhook) mirror `@vybekiit/security` classification in the app middleware.

The Worker applies the identical policy shape to the app guard: the origin lock runs
**only on state-changing methods** (POST/PUT/PATCH/DELETE), then a per-IP fixed-window
rate limit keyed on `CF-Connecting-IP`. `wrangler.toml` exposes those toggles as Worker
`vars` and documents where a heavier **Cloudflare Rate-Limiting Ruleset + WAF rule**
attach for a strict cross-edge cap, driven by the same numbers.

No secrets live in this directory. Deploy credentials (`CLOUDFLARE_ACCOUNT_ID`,
`CLOUDFLARE_API_TOKEN` from `cloudflareConfigSchema`) are supplied to `wrangler` via the
environment at deploy time and are never committed. The `[vars]` in `wrangler.toml` are
non-secret policy toggles only.

## Deploy tool

`wrangler` (installed by `vybekiit doctor`, ADR-0001). The kit's go-live skill
(`@vybekiit/deploy`, Cloudflare adapter) drives the deploy for the builder.

## Status

- **Shipping now:** the security edge config — `security-worker.ts` + `wrangler.toml`.
- **Shipping now:** email worker at `packages/email/worker/` + `scripts/provisionDomain.mjs`.
- **Lands with issue #7:** Supabase SQL migrations and full deploy helper automation.
