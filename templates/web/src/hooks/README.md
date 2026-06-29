# `src/hooks/` — hook registry (agent-only)

Read this **before** adding a hook. Extend an existing hook when it already covers ≥80% of the need.

| Hook | Owns |
|---|---|
| `use-async.ts` | Async UI state — loading, error, data from any promise. **Required** for API calls in components. Never hand-roll `useState` + `useEffect` for fetch. |
| `use-user.ts` | Current signed-in user + session refresh. **Required** for auth-gated UI. |
| `use-toast.ts` | Success/error toasts. **Required** for user feedback after actions. |

**Rules:** never duplicate async/auth/toast logic in a screen · validate forms with zod at submit, not inside hooks · read `.vybekiit/platform-skills/react-patterns-vybekiit.md` for forms and component limits.
