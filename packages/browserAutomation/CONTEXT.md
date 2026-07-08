# @vybekiit/browser-automation

Unified Playwright dashboard automation for VybeKiit agents. **Sole SSOT** for CWS and Lemon Squeezy dashboard flows.

## Domains

| Domain | Profile | Purpose |
|--------|---------|---------|
| `domains/extension/` | `$HOME/.cws-chrome-profile` | Chrome Web Store verbs + CLI |
| `domains/payments/ls/` | `$HOME/.ls-chrome-profile` | Lemon Squeezy onboarding |
| `domains/registrars/namecheap/` | `$HOME/.nc-chrome-profile` | Namecheap API key setup (`nc`) |
| `domains/registrars/godaddy/` | `$HOME/.gd-chrome-profile` | GoDaddy API key setup (`gd`) |
| `domains/google/` | `$HOME/.google-chrome-profile` | Google OAuth consent screen + Web client (`google`) |
| `domains/payments/stripe|paypal/` | — | MCP setup docs (no Playwright) |
| `domains/dbs/`, `domains/infra/` | — | MCP/doctor scaffolds |

## Buyer store SSOT

```
.vybekiit/store/extension/cws.json
.vybekiit/store/extension/cws-listing.ts
```

## CLI (registry)

```bash
vybekiit-automate extension import --json
vybekiit-automate extension update --json
vybekiit-automate cws publish --json          # alias
vybekiit-automate ls standby --json
vybekiit-automate payments ls setup --json
vybekiit-automate nc setup --json
vybekiit-automate gd setup --json
vybekiit-automate google standby --json
vybekiit-automate google oauth --project=<id> --app-name=<name> --support-email=<email> \
    --app-url=https://example.com --redirect=https://example.com/api/auth/callback/google \
    [--privacy=url] [--terms=url] [--logo=/path/to/120x120.png] \
    [--scope=openid --scope=email --scope=profile] [--publish] [--reset-secret] --json
```

**Google console specifics (redesigned Auth Platform, 2026):** the OAuth setup is a single-page
stepper at `/auth/overview/create` (App Information → Audience → Contact → Finish), with forms built
on Angular Material `cfc-*` controls. Two gotchas the verbs handle: (1) a floating `cfc-page-overlay-cover`
intercepts real pointer clicks, so every click goes through `pacedDispatchClick` (a dispatched DOM
event) while text/file inputs use fill/`setInputFiles`; (2) client secrets are **view-once** — the
console no longer shows or downloads an existing secret, so `--reset-secret` (reuse) opens the client's
"Information and summary" panel and clicks **Add secret** to mint a fresh readable `GOCSPX-` value.
`--support-email` must be the signed-in Google account or a group it owns (a forwarded/aliased address
is not selectable). `--logo` uploads a square PNG/JPG/BMP ≤1MB on the branding page. The verb also
fills the **App domain** links (home page = `--app-url`; privacy/terms default to `${app-url}/privacy`
and `/terms`, overridable via `--privacy`/`--terms`), registers the **scopes** on the Data Access page
(`--scope` repeatable; defaults to `openid email profile`), and — with `--publish` — moves the app
from **Testing to Production** on the Audience page. Because the default scopes are non-sensitive,
Production is instant with **no verification review**; the one thing that can trigger Google's review
is brand verification of an uploaded `--logo` once the app is in Production.

**Sign-in UX:** `setup` waits for sign-in and continues on redirect. If the profile is already signed in (no login controls in DOM), logs `session active — continuing automation` and proceeds immediately. Profile paths are never deleted.

**Profiles:** `--profile=<path>` override, `--profile=last` (from `~/.vybekiit/automate-profiles.json`), or env `AUTOMATE_PROFILE_NC|GD|LS|CWS`. Defaults unchanged (`~/.nc-chrome-profile`, etc.).

## Maintainer tooling (not published)

| Term | Meaning |
|------|---------|
| **Product** | A Lemon Squeezy sellable item configured in the browser product editor (`/products/:id`). |
| **Pricing type** | One of four LS pricing models: single payment, subscription, lead magnet, or pay what you want. Each exposes different panel fields after its card is selected. |
| **Probe product** | Temporary LS product named `vybekiit-probe-*`, created only by `recorder:ls probe-e2e` to discover selectors; safe to delete via cleanup. |
| **Orphan probe product** | A `vybekiit-probe-*` product left in the LS dashboard after a failed or interrupted probe run; delete manually or via `probe-e2e cleanup`. |
| **Selector registry** | Verified Playwright entries in `registry.generated.ts`, keyed by nested field names (`product.pricing.priceInput`). |
| **Registry staleness** | A registry entry whose `verifiedAt` is older than 90 days — runtime falls back to text hints, not a hard failure. |
| **Probe pause** | Maintainer `probe-e2e` deferred when LS blocks product creation; production `ls setup` uses frozen registry + fallbacks. |
| **Payment MCP tier** | Stripe and PayPal onboarding via hosted MCP; Lemon Squeezy via browser-automation CLI. |
| **Data MCP tier** | Supabase, Neon, and Firebase onboarding via hosted/login-once MCP configs. |
| **MCP merge snippet** | Provider JSON under buyer `.vybekiit/agent/mcp-*.json` merged into the buyer's AI client config. |
| **Tax category** | Lemon Squeezy tax classification chosen from a fixed dropdown when configuring product pricing. |
| **Product actions menu** | The three-dot menu on a product editor page (edit, share, delete, etc.) after save or publish. |
| **Text hint fallback** | Runtime label/text/role/css hint used when the registry entry is missing or not visible on the current page. |
| **Maintainer recorder** | Manual Playwright Inspector flow — `recorder:ls open` → paste locators into draft → `recorder:ls apply` |
| **Selector probe** | Passive href crawl + DOM classification — `recorder:ls probe` merges into `registry.generated.ts` without creating products |
| **E2E probe** | Four pricing-type probe products; single-payment run scrolls the full editor — maintainer-only, gated by `PROBE_E2E_ALLOW=1` |
| **LS API (fresh-squeezy setup)** | API key + webhook via Lemon Squeezy REST API after browser product create — see `src/domains/payments/ls/api/provision.ts` |

```bash
pnpm --filter @vybekiit/browser-automation recorder:ls probe-e2e cleanup   # delete-only, no gate
# probe-e2e create requires PROBE_E2E_ALLOW=1 (maintainer-only)
```

**LS setup split:** Browser automation owns **product production** (name, description, pricing, image/files upload, variants, publish). **API key + webhook** are provisioned via LS REST API (`api/provision.ts`). Registry is DOM-seeded (~40 nested keys) with fallbacks; probe refresh is optional maintainer tooling.

Drafts (gitignored): `.cws-selectors.draft.txt`, `.ls-selectors.draft.txt`  
Fixtures: `dev/recorder/fixtures/cws/`, `dev/recorder/fixtures/ls/` (probe media + zip)
