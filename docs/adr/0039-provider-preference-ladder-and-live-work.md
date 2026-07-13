# ADR-0039: Provider preference ladder and Live work

## Status

Accepted — product contract from `/grill-with-docs` (2026-07-12).

Extends [ADR-0018](./0018-provider-dispatch-ssot.md) (one active adapter via `*_PROVIDER` +
registry dispatch) and [ADR-0002](./0002-multi-provider-adapters.md). Does **not** reintroduce
silent `adapters[key] ?? default` map fallbacks. Amends the empty-env-only local adapter rule of
[ADR-0008](./0008-local-dev-adapter.md) only by adding an explicit, classified **free-tier hop**
after a backend is already in play. Auth coupling still follows
[ADR-0003](./0003-better-auth-provider.md) / [ADR-0024](./0024-supabase-auth-default.md).

## Context

Local-dev console “Live work” and Playwright e2e prove the journey rail with **fixture** tool
streams (no real Neon/Supabase/CF/…). Buyer skills and package adapters can do real work when
keys exist, but there is no shared policy for:

1. Trying the next free/available vendor when a free tier is exhausted
2. Pinning the winner so the next run and the agent layer agree
3. One SSOT used by **both** the local-dev console and buyer skills
4. Who executes provision/verify (package runner vs CLI vs MCP vs agent)

Without a written ladder, any auto-hop would look like a banned silent fallback and would surprise
a builder mid-project.

## Decision

### 1. Surfaces share one SSOT

**Preference ladder**, hop classification, pin, and real runners live in **MAINTAINED** packages.
Local-dev Live work UI and buyer goal skills are thin clients of that policy — not separate hop
logic.

### 2. Preference ladders (unnamed vendor only)

| Concern | Order |
|---|---|
| Data | `supabase` → `neon` → `railway` |
| Hosting | `cloudflare` → `render` → `railway` → `vercel` → `netlify` → `github-pages` |
| Payments | `lemon-squeezy` → `stripe` → `paypal` |
| Auth | **No ladder** — auth follows the chosen data store |

### 3. Free-tier hop rules

- Hop **only** on:
  - plan / quota / free-tier exhaustion, or
  - **onboarding-blocked** free path (e.g. Lemon Squeezy store/papers not ready) —
    same hop class as free-tier for ladder purposes
- Do **not** hop on wrong credentials or generic network errors.
- **Named vendor stick**: if the builder or prompt names a vendor, try only that adapter; on
  quota/onboarding-block, stop and guide — never hop away.
- After a successful hop: **pin** the winner into the matching `*_PROVIDER` (and related env as
  required) **and** append a checklist Decision log entry. Live work UI shows the **winner** brand.
- **Partial success then hop**: finish on the ladder winner; **best-effort orphan cleanup** on the
  partial provider; do not leave two “primary” backends. Log both outcomes.
- **Combo Live work**: hop **per concern independently** (mixed brands OK). One concern’s hop does
  not restart others.
- **Buyer voice on hop**: what happened + what we did + what’s next (plain language; no env/API
  jargon).
- **Missing credentials mid-ladder**: skip that entry (same as onboarding-blocked); if the ladder
  is exhausted → stop + doctor / connect keys.
- **After pin**: later unnamed runs start at the **pinned** adapter; remaining ladder entries are
  fallbacks only if the pin fails hop-class. Do not restart at default #1.
- **Pin races**: last successful pin wins; surface a short conflict note if the pin changed.
- **Hop signal allowlist**: hop only on adapter-known plan/quota/onboarding signals. Unknown
  403/500 → stop + doctor (never hop on vague errors).
- **Neon path**: claimable (`neon.new`) first for demo/dogfood Live work; buyer production uses
  account API / existing `DATABASE_URL`.
- **Existing healthy connection wins**: if the concern already has a working primary
  (`DATABASE_URL`, host project, etc.), use it — do not re-provision or hop.
- **Storage companion**: if `STORAGE_PROVIDER` was only the data-default companion, re-resolve the
  companion for the new data pin; explicit storage choice sticks.
- **Celebrate only after verify**: ready-check / verify must pass on the **winner** before “done”.
- **Pin writes full runtime env** for the vibe coder: root `.env` gets provider ids **and**
  provisioned secrets (`DATABASE_URL`, tokens) via the same secure write path as doctor — never
  printed in UI/logs. Root **`.env.example` is one full matrix** of keys for all supported
  adapters (not a per-provider fragment set).
- **Dogfood deploy hosts**: `DOGFOOD_APEX` selects the active apex from an allowed pool
  (`yosefhayimsabag.dev`, `askally.io`, `ohadbaher.net`). Only **subdomains** under that apex
  (`live-<run>.…`). Cloudflare **Workers and Pages** are both valid first-step host targets;
  free-tier hop remains cloudflare → render → railway → vercel → netlify → github-pages.
  Custom domain half-attach does
  not auto-migrate DNS across hosts — orphan project cleanup best-effort; DNS steps stop and guide.

### 4. Execution cascade

When more than one path can perform the same Live work step, try in order:

1. MAINTAINED Effect runner (SDK/CLI behind package)
2. `vybekiit` CLI verb
3. Official MCP
4. Agent freeform

All paths normalize to the same journey tool events the rail already understands.

### 5. Mode-scoped teardown

- **Demo / dogfood / console Live work demos**: create → verify → may auto-delete (or
  claimable/TTL resources).
- **Buyer production skills**: configure / verify only; never auto-delete unless the builder
  asks to remove.

### 6. Console product posture and CI

- Product direction: **Live work** is the real path; fixture animation is not the long-term
  product demo mode.
- **PR CI** does not require secret-backed Live work UI matrix.
- **Nightly (or maintainer) live CI with secrets** is the gate that create/delete actually
  happened on real platforms (`dogfood:vibe` extended). Fixture e2e may shrink as live coverage
  lands; do not block PRs on missing vendor secrets.

### 7. First vertical slice

Database: ladder `supabase → neon → railway`, claimable Neon create/verify/delete, pin env,
auth follows data. Console + dogfood both call the same MAINTAINED path.

## Consequences

- ADR-0018 remains: at any moment **one** active adapter per concern after pin; the ladder is
  **try-order before pin**, not multi-active providers.
- Buyer skills must not reimplement hop/pin; they import or CLI-invoke the package policy.
- Payments keep LS first (MoR story) but may hop to Stripe when LS free/onboarding is blocked —
  money rails still pin loudly.
- Dropping secret-free Playwright Live matrix is an accepted feedback trade-off until nightly
  live is green and reliable.

## References

- Glossary terms in [LANGUAGE.md](../../LANGUAGE.md): **Preference ladder**, **Free-tier hop**,
  **Named vendor stick**, **Live work**, **Execution cascade**, **Mode-scoped teardown**
- Grill session 2026-07-12 (console + buyer skills SSOT; quota-only hop; pin; ladders; cascade;
  mode-scoped teardown; live-first + nightly secrets CI; first slice = database)
