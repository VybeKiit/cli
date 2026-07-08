# Infrastructure providers

Credential onboarding here is **CLI-first, browser-fallback** (see [ADR-0032](../../../../../docs/adr/0032-cli-first-provider-token-automation.md), which amends the earlier "skill-driven, no DOM automation" scope).

| Provider | CLI | `setup` path |
|----------|-----|--------------|
| Cloudflare (`cf`) | `wrangler` | CLI reads account id + verifies; **browser fallback** mints the scoped API token (`cfat_…`) because wrangler can't mint arbitrary scoped tokens. Writes `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`. |
| Railway (`railway`) | `railway` | CLI-native: ensure + `railway whoami`. Auth lives in the CLI store (ADR-0001) — no `.env` token, no browser. |
| Vercel (`vercel`) | `vercel` | CLI-native: ensure + `vercel whoami`. Auth lives in the CLI store — no browser. |

Each `setup` ensures its CLI via `vybekiit doctor --ensure <tool>` first (`core/ensureCli.ts`), verifies live, and — where a value belongs in `.env` — writes it via `core/writeEnvBlock.ts` so the agent only ever sees `keysWritten`, never the secret.

Deploy/runtime still use the `doctor`, `deploy`, and `wrangler` platform skills. Only add new DOM automation when the provider has no headless CLI/API path (record it against ADR-0032).

> **Cloudflare token minting must use the account-scoped editor** —
> `dash.cloudflare.com/{accountId}/api-tokens/create`, **never** the user-scoped
> `/profile/api-tokens/create`. The user-scoped route forces an "Account Resources"
> React-Select that stalls headless automation; the account-scoped route fixes the account,
> so no picker. `createApiToken.ts` resolves the account id (from wrangler, the dashboard URL,
> or a dashboard visit) and always opens the account-scoped editor. As of the 2026-07 Cloudflare
> UI the editor uses an unlabeled name field, a permission-group **search + Read/Edit toggle**
> (not the old `li [role="checkbox"]` list), and a **"Review token"** button. See issue #66.
