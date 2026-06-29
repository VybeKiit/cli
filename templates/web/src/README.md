# `src/` — folder map (agent-only)

Read this before adding files. Put each concern in its home — don't scatter helpers.

| Path | Owns |
|---|---|
| `app/` (repo root) | Routes + API handlers (Next.js App Router) |
| `src/components/ui/` | Kit primitives — **do not duplicate**; extend here only when adding a new primitive |
| `src/components/` | App-specific composed UI (shells, marketing blocks, forms) |
| `src/hooks/` | Shared React hooks — see `hooks/README.md` |
| `src/lib/` | Headless clients + utils — see `lib/README.md` |
| `src/data/` | Static marketing/dashboard copy (no secrets) |

**Rules:** one home per concern · use kit hooks and `FormField` · keep functions small (~5 lines) and props few (~5).
