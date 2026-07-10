# Platform wrapper: responsive layout (agent-only)

**Agent-only.** Mobile-first web layout — the builder hears "looks good on phone and desktop," not breakpoints.

## Mobile-first

- Base styles = phone (narrow). Scale up with `sm:` / `md:` / `lg:`.
- Default page padding: `px-4 md:px-6`
- Max content width: `max-w-lg mx-auto` (forms/auth) or `max-w-6xl` (marketing/dashboard)
- Touch targets: kit `Button` sizes `default` or `lg` — never tiny custom tap areas

## RTL

Complements logical properties in `AGENTS.md` — use `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`, not `left`/`right`.

## Before calling a page done

Preview at **375px** width in dev tools. Fix overflow, cramped buttons, and unreadable text before showing the builder.

## Also read

- `ui-consistency-vybekiit.md` — primitives and spacing tokens
- `shadcn-vybekiit.md` — layout blocks from the UI catalog

## Verify

Page usable at 375px and desktop without horizontal scroll on main content.
