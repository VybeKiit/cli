# ADR-0032: CLI-first provider token automation (browser as fallback)

## Status

Accepted

## Context

Onboarding a buyer's project needs API credentials from many providers (Cloudflare, Supabase, Railway, Vercel, Neon, Upstash, OpenAI, Anthropic, Resend, Sentry, GitHub). Two earlier ADRs shaped this space:

- [ADR-0015](./0015-unified-browser-automation.md) built `@vybekiit/browser-automation` for dashboards that only reveal a key once in the browser (CWS, Lemon Squeezy).
- [ADR-0001](./0001-agentic-cli-toolchain.md) established `vybekiit doctor` as the toolchain gate: it installs every provider CLI per-OS and keeps auth in each tool's **native store**, never `.env`.

The `domains/infra/` and `domains/dbs/` READMEs explicitly forbade DOM automation ("skill-driven", "MCP-first"). But most providers now expose a **headless CLI/API path** to read or mint the credential (`wrangler whoami`, `supabase projects api-keys`, `neonctl connection-string`, `gh auth token`, `railway/vercel whoami`). Driving a browser for those is slower, more fragile, and unnecessary. Browser automation should be the exception, not the default.

We also don't want a second preflight layer: `doctor` already installs-if-missing and probes auth.

## Decision

1. **CLI-first, browser-fallback.** Each provider `setup` first ensures its official CLI, mints/reads the credential headlessly where a CLI/API path exists, and only falls back to browser automation when none does (confirmed cases: Cloudflare scoped-token mint; console-only keys like OpenAI/Anthropic/Resend/Sentry/Upstash).
2. **Reuse `doctor`, don't fork it.** A single-tool mode — `vybekiit doctor --ensure <tool> [--json]` — runs the existing `planInstall`/install/auth-probe for one CLI. `neonctl` is added to the toolchain for Neon.
3. **No layer inversion.** `@vybekiit/browser-automation` (a library) does not import the `vybekiit` CLI (the app). It shells out to `npx vybekiit doctor --ensure <tool> --json` via `core/ensureCli.ts`.
4. **Agent never sees the value.** `core/writeEnvBlock.ts` upserts the secret into `.env`; `--json` output returns only `{ ok, keysWritten, verified }` — never the raw key.
5. **Live self-verification.** Every `setup` verifies the credential against the provider's whoami/verify endpoint before reporting success.
6. **Domains.** `infra` = Cloudflare, Railway, Vercel; `dbs` = Supabase, Neon, Upstash; `ai` = OpenAI, Anthropic; `misc` = GitHub, Resend, Sentry. Browser fallbacks use a dedicated Chrome profile and lead with role/text selectors (DOM anchors are the fallback) so a class rename doesn't break the flow; `dev/recorder/probeProviderDom.ts` captures real selectors for any provider that falls through.

## Consequences

- This amends the v1 "no DOM automation" scope in `domains/infra/README.md` and `domains/dbs/README.md`; both now document the CLI-first ladder with browser as the last rung.
- Skills can invoke `vybekiit-automate <domain> setup --json` uniformly across providers and read `keysWritten` without ever handling the secret.
- Adding a provider is a fixed recipe: ensure CLI (or accept a pasted key) → verify live → `writeEnvBlock` → register in `cli/index.ts`.
