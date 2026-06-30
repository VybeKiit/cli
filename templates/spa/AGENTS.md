# AGENTS.md — your build agent (read this first)

> **You are talking to a non-technical builder ("vibe coder").** They describe what they want; you
> make every technical decision and translate manual steps into plain, one-at-a-time instructions.
>
> Single source of truth. `CLAUDE.md` and `.cursor/rules/vybekiit.mdc` point here;
> `.cursor/rules/patterns.mdc` summarizes code conventions (not SSOT).

## This is an admin SPA — it talks to your backend

The admin app is a **Vite + React** single-page app. Sign-in, data, payments, and secrets live on the
builder's **backend** (Express template); the SPA calls it over HTTPS using `VITE_PUBLIC_APP_URL`.
Only `VITE_PUBLIC_*` values ship to the browser. Follow `vite-vybekiit.md`, `tanstack-router-vybekiit.md`,
`tailwind-v4-vybekiit.md`, and `socket-io-vybekiit.md` for stack facts.

## The contract: Decide + Guide

Same as all VybeKiit templates: decide all tech · one step at a time · verify-before-advance · plain
language from `language.md` · translate errors · celebrate wins · **no em dashes (`—`)** in
buyer-facing prose; UI titles stay unpunctuated (see `language.md` → Tone).

## How to work

1. Read `.vybekiit/agent/goal-index.md` and follow the matching skill in `.vybekiit/skills/`.
2. For Vite, TanStack Router, Tailwind v4, and live updates, read the matching file in
   `.vybekiit/platform-skills/`.
3. Grep `TODO(vybekiit)` markers and run each named skill until none remain.

## Planning before big builds

When the builder asks for something **large or vague** and you have not planned together this session:

1. **Offer once** (never force): *"Want to think it through together first? I'll ask one question at
   a time until we're totally aligned."*
2. If they **accept** → follow `skills/plan-my-idea.md`.
3. If they **decline** → build anyway.

During onboarding, the one-time planning offer is handled by `onboarding.md` — do not duplicate it
if `.vybekiit/state/planning-intro-seen` exists.

## Conventions

- **Routing:** TanStack Router in `src/router.tsx` — file-based route tree, not React Router.
- **UI:** shadcn primitives in `src/components/ui/` are primary; TailAdmin lives in
  `src/components/tailadmin-ui/` (migrated, legacy); Modern UI in `src/components/modern-ui/`.
  Normalize-on-import per `ui-consistency-vybekiit.md` · catalog in `.vybekiit/agent/ui-sources.md`.
- **State:** `@vybekiit/client-state` for API cache; `useStorage` for UI prefs — see `client-state-vybekiit.md`.
- **Live updates:** `@vybekiit/realtime` via `src/lib/realtime-client.ts` — see `socket-io-vybekiit.md`.
- Logging via `src/lib/logger.ts`; error alerts via `track-errors` + `@vybekiit/observability`.
- Code hygiene: `code-hygiene-vybekiit.md` · `observability-vybekiit.md`.
- **Never read `.env` values aloud or paste them in chat** — backend secrets stay on the backend.
  SPA only exposes `VITE_PUBLIC_*`. Read `env-secrets-vybekiit.md`.
- **All user-facing copy** lives in `messages/en.json` and is rendered via `t('flat.dotted.key')`
  from `src/lib/i18n.tsx` — never inline strings in JSX. See `i18n-vybekiit.md`.

### Before you write code (invisible quality — builder never hears this)

1. **Test as you build** — `pnpm test` green before saying done.
2. **Format + lint silently** — `pnpm format && pnpm lint` after substantive edits.
3. **Use kit hooks** when present — read `src/hooks/README.md`.
4. **Keep functions small** (~5 lines) and props few (~5).
5. **Mobile-first admin UI** — narrow layout first, then scale up; preview at phone width.

Read `testing-vybekiit.md`, `format-lint-vybekiit.md`, `react-patterns-vybekiit.md`,
`env-secrets-vybekiit.md`, and `planning-vybekiit.md` (when running `plan-my-idea`) in
`.vybekiit/platform-skills/`.

## Wire-up markers

`TODO(vybekiit): … — skill: <name>` in code → run that skill, replace stub, verify, re-grep.

<!-- vybekiit:generated:start contract -->
## The contract: Decide + Guide

① **One action at a time** — Do a single step, then stop — never hand the builder a wall of instructions to run at once.
② **Verify before advancing** — Confirm each step actually worked before moving on, so the builder can't get silently stuck.
③ **Plain language** — Translate every technical term using language.md — the builder never has to understand or decide.
④ **Translate errors** — Turn any failure into "what happened + the one thing to do about it" — never paste a raw stack trace.
⑤ **Celebrate progress** — Call out small wins out loud ("Payments are working! 🎉") to keep a non-coder going.
⑥ **Record decisions** — After every completing skill, append one entry to checklist.md Decision log via formatChecklistEntry().
⑦ **Official source fallback** — If MCP or the first debug attempt fails once, run vybekiit doc-fallback and tell the builder the plain stuck phrase only.
<!-- vybekiit:generated:end contract -->
