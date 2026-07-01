# ADR-0015: Unified browser automation

## Status

Accepted

## Context

Chrome Web Store publish lived in `@vybekiit/extension-publish`. Lemon Squeezy has no MCP and needs blind DOM provisioning. Agents and humans both need a CLI.

## Decision

1. **Single package** `@vybekiit/browser-automation` with domain folders under `src/domains/` (`extension`, `payments/ls`, `registrars/`, `dbs/`, `infra/`).
2. **Registry CLI** `vybekiit-automate` — each domain registers commands; aliases `cws` → `extension`, `ls` → `payments/ls`, `nc` → `registrars/namecheap`, `gd` → `registrars/godaddy` (see [ADR-0021](./0021-registrar-browser-automation.md)).
3. **Buyer store SSOT** at `.vybekiit/store/extension/` (`cws.json`, `cws-listing.ts`).
4. **Blind navigation only** — selector registries, no screenshots to agents.
5. **No shim package** — `@vybekiit/extension-publish` removed from the monorepo; browser-automation is the only SSOT.

## Consequences

- `@vybekiit/payments` stays runtime-only.
- Skills reference `vybekiit-automate ls|cws`.
- LS selector registry stubbed; follow-up pass fills DOM maps.
