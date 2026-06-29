# Platform wrapper: client state (agent-only)

**Templates use `@vybekiit/client-state` for all server-backed reads/writes on the client.**

## Surfaces

| Surface | API cache | UI-only prefs |
|---------|-----------|---------------|
| web | TanStack Query | Zustand via `createUiStore()` |
| mobile | TanStack Query + optional MMKV persist | MMKV via `useStorage` |
| extension | TanStack Query | Zustand / localStorage |

## Rules

- **Do:** `useQuery` / `useMutation` for API data; `useStorage` for wizard step, sidebar, drafts
- **Don't:** raw `fetch` + `useState` for server records; Zustand/MMKV for server data
- **Don't:** Redis or server-side cache for buyers — client cache handles UX

## Config (agent-only)

`CLIENT_STATE_PERSIST=on|off`, `CLIENT_STATE_QUERY_STALE_SECONDS` — read silently from `.env`.

## Bootstrap

Each template wraps root layout with `ClientStateProvider` from `src/lib/client-state.tsx`.
