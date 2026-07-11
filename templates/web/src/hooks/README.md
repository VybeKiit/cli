# `src/hooks/` — hook registry (agent-only)

Read this **before** adding a hook. Extend an existing hook when it already covers ≥80% of the need.

| Hook | Owns |
|---|---|
| `use-async.ts` | Async UI state — loading, error, data from any promise. Use for one-off promises not backed by TanStack Query. |
| `use-user.ts` | Current signed-in user via TanStack Query. **Required** for auth-gated UI. |
| `use-toast.ts` | Success/error toasts. **Required** for user feedback after actions. |
| `use-storage.ts` | Client-only prefs in localStorage (`useSyncExternalStore`). Not for server records. |
| `use-theme.ts` | Applies `@vybekiit/tokens` CSS variables from OS color scheme. |
| `useDebouncedValue.ts` | Debounce any rapidly changing value. **Required** for every search input that filters a list or fires a query (`SEARCH_DEBOUNCE_MS` = 250). |

**Rules:** server data via `@vybekiit/client-state` / TanStack Query · never duplicate async/auth/toast logic · validate forms with zod at submit · every search-filter input must use `useDebouncedValue` · read `client-state-vybekiit.md` and `react-patterns-vybekiit.md`.
