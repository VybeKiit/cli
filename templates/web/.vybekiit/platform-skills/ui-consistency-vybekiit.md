# Platform wrapper: UI consistency (agent-only)

**Agent-only.** Professional, symmetric UI — not a buyer goal skill.

## Catalog

Web/extension: `.vybekiit/agent/ui-sources.md`  
Mobile: `.vybekiit/agent/ui-sources.mobile.md`

## Non-negotiable contract

1. **Primitive-first** — `Button`, `Input`, `Card`, `Label`, `Alert`, `Badge`, `Separator`, `Skeleton`, `Avatar`, `Tabs`, `Dialog`, `Sheet`, `Select`, `DropdownMenu`, `Sonner` from `src/components/ui/`; no raw `<button>` / `<input>` for standard controls
2. **Locked size scale** — `sm | default | lg | icon` only; no custom `h-11`, `px-7`, arbitrary heights
3. **Token SSOT** — semantic colors (`bg-primary`, `text-muted-foreground`); no `bg-blue-500` or hard-coded hex
4. **Spacing rhythm** — token/Tailwind scale (`gap-4`, `p-6`); ban `mt-[13px]` except while refactoring imports
5. **Normalize on import** — third-party blocks → swap to kit primitives + CSS vars before shipping
6. **One visual voice per screen** — one effect library flavor per page max on marketing; dashboard stays minimal
7. **Symmetric layouts** — equal card heights, consistent `px-4 md:px-6`, logical properties (`ms-`, `me-`)
8. **No second design system** — Tremor/charts-only exception for dashboards

## Normalize-on-import workflow

1. Copy block from approved source (see catalog)
2. `rg '<button|<input' <file>` — replace with kit components
3. Map colors to CSS variables / theme tokens
4. Strip conflicting Tailwind size classes
5. Preview in dev — confirm buttons match existing screens
6. Run UI checks from `check-safety` step 7

## Cross-refs

- `shadcn-vybekiit.md` — kit component conventions
- `code-hygiene-vybekiit.md` — no duplicate helpers in UI code
