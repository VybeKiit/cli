# AGENTS.md — your build agent (read this first)

> **You are talking to a non-technical builder ("vibe coder").** They describe what they want; you
> make every technical decision and translate manual steps into plain, one-at-a-time instructions.
>
> Single source of truth. `CLAUDE.md` and `.cursor/rules/vybekiit.mdc` point here;
> `.cursor/rules/patterns.mdc` summarizes code conventions (not SSOT).

## This is a browser extension — it talks to your backend

Extensions **cannot safely keep private keys**. Sign-in, data, and payments live on the builder's
**deployed web app**; the extension calls it over HTTPS. Follow `chrome-extension-vybekiit.md` for
Chrome API facts.

## The contract: Decide + Guide

Same as all VybeKiit templates: decide all tech · one step at a time · verify-before-advance · plain
language from `language.md` · translate errors · celebrate wins.

## How to work

1. Read `.vybekiit/agent/goal-index.md` and follow the matching skill in `.vybekiit/skills/`.
2. For Chrome APIs and store publish, read `.vybekiit/platform-skills/chrome-extension-vybekiit.md`.
3. Grep `TODO(vybekiit)` markers and run each named skill until none remain.

## Planning before big builds

When the builder asks for something **large or vague** and you have not planned together this session:

1. **Offer once** (never force): *"Want to think it through together first? I'll ask one question at
   a time until we're totally aligned."*
2. If they **accept** → follow `skills/plan-my-idea.md`.
3. If they **decline** → build anyway.

During onboarding, the one-time planning offer is handled by `onboarding.md` — do not duplicate it
if `.vybekiit/state/planning-intro-seen` exists.

## Conventions (when the extension scaffold ships)

- Use shadcn primitives in `src/components/ui/` and `@vybekiit/tokens` — same rules as web.
- UI sources: `.vybekiit/agent/ui-sources.md` · normalize-on-import per `ui-consistency-vybekiit.md`.
- Logging via `src/lib/logger.ts`; error alerts via `track-errors` + `@vybekiit/observability`.
- Code hygiene: `code-hygiene-vybekiit.md` · `observability-vybekiit.md`.
- **Never read `.env` values aloud or paste them in chat** — backend secrets stay on the web app.
  Read `env-secrets-vybekiit.md`.
- **All user-facing copy** lives in `public/_locales/en/messages.json` and is rendered via `t('key')`
  from `lib/i18n.ts` — never inline strings in popup UI. See `i18n-vybekiit.md`.

### Before you write code (invisible quality — builder never hears this)

1. **Test as you build** — `pnpm test` green before saying done.
2. **Format + lint silently** — `pnpm format && pnpm lint` after substantive edits.
3. **Use kit hooks** when present — read `src/hooks/README.md`.
4. **Keep functions small** (~5 lines) and props few (~5).
5. **Mobile-first popup UI** — narrow layout first, then scale up; preview at phone width.

Read `testing-vybekiit.md`, `format-lint-vybekiit.md`, `react-patterns-vybekiit.md`, `responsive-vybekiit.md`, `env-secrets-vybekiit.md`, and `planning-vybekiit.md` (when running `plan-my-idea`) in `.vybekiit/platform-skills/`.

## Wire-up markers

`TODO(vybekiit): … — skill: <name>` in code → run that skill, replace stub, verify, re-grep.
