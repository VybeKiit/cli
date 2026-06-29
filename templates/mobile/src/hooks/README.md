# `src/hooks/` — hook registry (agent-only)

Read this **before** adding a hook. Extend an existing hook when it already covers ≥80% of the need.

| Hook | Owns |
|---|---|
| `use-async.ts` | Async UI state — loading, error, data from any promise. Use for one-off promises not backed by TanStack Query. |
| `use-user.ts` | Current signed-in user via TanStack Query. **Required** for auth-gated UI. |
| `use-toast.ts` | Success/error toasts. **Required** for user feedback after actions. |
| `use-storage.ts` | Client-only prefs in MMKV. Not for server records — use TanStack Query for API data. |

**Rules:** server data via `@vybekiit/client-state` / TanStack Query · never duplicate async/auth/toast logic · validate forms with zod at submit · read `client-state-vybekiit.md` and `react-patterns-vybekiit.md`.
