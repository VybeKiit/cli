# Platform wrapper: Next.js (web template)

**Agent-only.** Invoked by generic coding and layout work — not a buyer goal skill.

## Official upstream (prefer over training data)

- Pinned: `.agents/skills/vercel-react-best-practices`, `vercel-composition-patterns`
- Docs: https://nextjs.org/docs (App Router, Server Components, Route Handlers)

## Kit conventions

- App Router under `app/`; API routes under `app/api/`
- Use logical spacing (`ms-`, `me-`, `ps-`, `pe-`) for RTL — see `language.md`
- UI primitives live in `src/components` (shadcn) — use `shadcn-vybekiit.md`
- Business logic stays in `@vybekiit/*` packages, not reinvented in routes

## Verify-before-advance

After structural changes: `pnpm test` + `pnpm build` green before telling the builder it works.
