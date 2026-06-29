# ADR-0014: Client state and no-Redis policy

## Status

Accepted

## Context

VybeKiit apps need client-side caching for API data and ephemeral UI preferences across web, mobile, and extension surfaces. Buyers should not configure Redis or server-side cache layers.

## Decision

1. **Single `@vybekiit/client-state` package** merges TanStack Query (server/API cache) and Zustand/MMKV (UI-only prefs) behind `resolveClientState(surface)`.
2. **TanStack Query v5.101.x** on all React surfaces for fetched data.
3. **No Redis for buyers** — rate limits stay in-memory + edge (`@vybekiit/security`); `@vybekiit/kv` remains agent-only for harden.
4. **`design-my-data` skill** is separate from `save-data` — shape agreement before provisioning.

## Consequences

- Templates wrap root layouts with `ClientStateProvider`.
- Hooks README and `react-patterns-vybekiit.md` ban raw fetch + useState for server records.
- Server cache is not exposed in buyer onboarding.
