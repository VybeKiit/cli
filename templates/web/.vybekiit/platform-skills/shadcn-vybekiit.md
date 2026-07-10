# Platform wrapper: shadcn/ui (web template)

**Agent-only.** Invoked when building or editing UI — not a buyer goal skill.

## Official upstream

- Docs: https://ui.shadcn.com
- MCP: shadcn/ui component search at edit time when available
- **VybeKiit catalog MCP:** `.vybekiit/agent/mcp-ui-catalog.json` — search 474+ mirrored blocks across BundUI, Magic UI, Kokonut, Aceternity, Untitled, Gluestack
- Block catalog: `.vybekiit/agent/ui-sources.md`
- Intent routing: `ui-routing-vybekiit.md`

## Kit conventions

- Full shadcn base primitive set is pre-installed in `src/components/ui/` (including sidebar, table, form, etc.)
- Signed-in dashboard chrome uses shadcn `Sidebar` via `src/components/app-sidebar.tsx` and `dashboard-shell.tsx`
- Use existing primitives and shared shells — do not add a second design system
- Read colors/spacing from CSS variables backed by `@vybekiit/tokens`
- Forms: reuse `FormField` and shared error patterns from the template
- Third-party blocks: **normalize on import** — see `ui-consistency-vybekiit.md`
- Mirrored namespaces are read-only upstream copies — refresh with maintainer `pnpm sync:ui`

## Verify-before-advance

Visual change → confirm in dev preview; run component tests if present; grep for raw `<button` outside composed screens.
