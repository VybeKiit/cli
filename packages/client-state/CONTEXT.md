# CONTEXT — Client state

Root vocabulary lives in `../../CONTEXT.md`. Package-local terms only.

## Glossary

| Term | Meaning |
|---|---|
| **Client state surface** | `web`, `mobile`, or `extension` — passed at bootstrap. |
| **Query cache** | TanStack Query layer for server/API data. |
| **UI store** | Zustand (web/extension) or MMKV hooks (mobile) for client-only prefs. |
| **Persist** | Optional offline query cache via `CLIENT_STATE_PERSIST`. |
