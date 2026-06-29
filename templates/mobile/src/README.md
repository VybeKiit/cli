# `src/` — folder map (agent-only)

Read this before adding files. Put each concern in its home — don't scatter helpers.

| Path | Owns |
|---|---|
| `app/` (repo root) | Screens and navigation (Expo Router) |
| `src/components/ui/` | Kit primitives — **do not duplicate** |
| `src/components/` | App-specific composed UI (shells, forms, toaster) |
| `src/hooks/` | Shared React hooks — see `hooks/README.md` |
| `src/lib/` | Backend clients + config — see `lib/README.md` |
| `src/data/` | Static screen copy (no secrets) |
| `src/theme/` | Design tokens via `useTheme()` |

**Rules:** one home per concern · backend URL in `config.ts` only · use kit hooks and `FormField` · keep functions small (~5 lines) and props few (~5).
