# Platform wrapper: React patterns (agent-only)

**Agent-only.** Kit primitives and soft limits — the builder never hears "props" limits or "split the component."

## Kit primitives (required)

| Concern | Use | Never |
|---|---|---|
| Async UI state | `useAsync` from `@/hooks/use-async` | Hand-rolled `useState` + `useEffect` for fetch |
| User / session | `useUser` from `@/hooks/use-user` | Duplicate session logic in pages |
| Toasts | `useToast` from `@/hooks/use-toast` | `alert()` or ad-hoc snackbars |
| Forms | `FormField` + zod at submit boundary | Inline validation scattered in JSX |

Read `src/hooks/README.md` before adding hooks.

## Soft limits (agent + Biome warn)

| Rule | Target | Enforcement |
|---|---|---|
| Function body length | ~5 lines ideal; split if longer | Agent convention + Biome warn |
| Component props | ~5 max; use composition or a small options object | Agent convention |
| Folders | See `src/README.md` | Required |

## Forms

- Use `FormField` for labels, errors, and inputs.
- Validate with zod **once** at submit — not on every keystroke unless UX requires it.
- API routes validate again with zod at the boundary.

## Folders

```
app/                 routes + API (Next.js App Router)
src/components/ui/   kit primitives — do not duplicate
src/components/    app-specific composed UI
src/hooks/           shared React hooks (see README)
src/lib/             headless clients + utils (see README)
```

## Verify

- New screens use kit hooks · forms use `FormField` · no duplicate helpers in `src/lib/`
- `pnpm test` green after changes
