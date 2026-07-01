# ADR-0021: Registrar browser-automation (credential onboarding)

## Status

Accepted

## Context

Namecheap and GoDaddy domain APIs require API keys minted in their dashboards. Neither offers OAuth for third-party programmatic access. Manual key paste is the main friction in the `buy-domain` skill.

[ADR-0015](./0015-unified-browser-automation.md) established `@vybekiit/browser-automation` for CWS and Lemon Squeezy. The `domains/infra/` README excludes Wrangler/Cloudflare DOM automation; registrars are a separate concern.

## Decision

1. Add `src/domains/registrars/` with **credential onboarding only** (no domain purchase automation in v1).
2. CLI targets: `registrars/namecheap` (alias **`nc`**) and `registrars/godaddy` (alias **`gd`**).
3. Chrome profiles: `~/.nc-chrome-profile`, `~/.gd-chrome-profile`.
4. Split mirrors Lemon Squeezy: browser mints keys; `@vybekiit/deploy` REST validates and handles nameserver delegation.
5. Commands: `standby` (wait for sign-in) and `setup --json` (enable access, scrape keys, API verify, emit env block).

## Consequences

- Skills reference `vybekiit-automate nc|gd` alongside `ls|cws`.
- `@vybekiit/browser-automation` depends on `@vybekiit/deploy` for post-setup API verification.
- Full registrar API clients stay in `@vybekiit/deploy`; no OSS SDK repos.
