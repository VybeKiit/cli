# ADR-0015: Unified browser automation

## Status

Accepted

## Context

Chrome Web Store publish lived in `@vybekiit/extension-publish`. Lemon Squeezy has no MCP and needs blind DOM provisioning. Agents and humans both need a CLI.

## Decision

1. **Rename/consolidate** into `@vybekiit/browser-automation` with targets `cws` and `ls` (fresh-squeezy).
2. **Unified bin** `vybekiit-automate` with agent mode (`--json`, `--yes`) and wizard mode (`@clack/prompts`).
3. **`@vybekiit/extension-publish`** becomes a one-major-version re-export shim.
4. **Blind navigation only** — selector registries, no screenshots to agents.

## Consequences

- `@vybekiit/payments` stays runtime-only.
- Skills reference `vybekiit-automate ls|cws`.
- LS selector registry stubbed; follow-up pass fills DOM maps.
