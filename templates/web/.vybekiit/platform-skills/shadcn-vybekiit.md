# Platform wrapper: shadcn/ui (web template)

**Agent-only.** Invoked when building or editing UI — not a buyer goal skill.

## Official upstream

- Docs: https://ui.shadcn.com
- MCP: shadcn/ui component search at edit time when available

## Kit conventions

- Use existing primitives in `src/components/ui/` and shared shells — do not add a second design system
- Read colors/spacing from CSS variables backed by `@vybekiit/tokens`
- Forms: reuse `FormField` and shared error patterns from the template

## Verify-before-advance

Visual change → confirm in dev preview; run component tests if present.
