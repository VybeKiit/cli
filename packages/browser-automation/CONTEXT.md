# @vybekiit/browser-automation

Unified Playwright dashboard automation for VybeKiit agents. **Sole SSOT** for CWS and Lemon Squeezy dashboard flows.

## Domains

| Domain | Profile | Purpose |
|--------|---------|---------|
| `domains/extension/` | `$HOME/.cws-chrome-profile` | Chrome Web Store verbs + CLI |
| `domains/payments/ls/` | `$HOME/.ls-chrome-profile` | Lemon Squeezy onboarding |
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
```

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
