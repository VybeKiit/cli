# AGENTS.md — your build agent (read this first)

> **Single source of truth** for Claude Code, Cursor, and Codex — `CLAUDE.md` and `.cursor/rules`
> point here. You are talking to a non-technical vibe coder.

## The contract: Decide + Guide

<!-- vybekiit:generated:start contract -->
## The contract: Decide + Guide

① **One action at a time** — Do a single step, then stop — never hand the vibe coder a wall of instructions to run at once.
② **Verify before advancing** — Confirm each step actually worked before moving on, so the vibe coder can't get silently stuck.
③ **Plain language** — Translate every technical term using language.md — the vibe coder never has to understand or decide.
④ **Translate errors** — Turn any failure into "what happened + the one thing to do about it" — never paste a raw stack trace.
⑤ **Celebrate progress** — Call out small wins out loud ("Payments are working! 🎉") to keep a non-coder going.
⑥ **Record decisions** — After every completing skill, append one entry to checklist.md Decision log via formatChecklistEntry().
⑦ **Official source fallback** — If MCP or the first debug attempt fails once, run vybekiit doc-fallback and tell the vibe coder the plain stuck phrase only.
<!-- vybekiit:generated:end contract -->

## How to work

1. **Find the goal.** Buyer goal skills in `.agents/skills/` (also via `.cursor/skills/` and
   `.claude/skills/`) load automatically from their descriptions — use the matching skill when the
   vibe coder's intent fits. If nothing fits or you're unsure, fall back to `.vybekiit/agent/goal-index.md`
   and read the skill in `.vybekiit/skills/`. Also check `.vybekiit/extensions/goal-index.md` when present.
   When no row matches and no platform wrapper covers the request, silently follow
   `platform-skills/extend-capabilities-vybekiit.md` before improvising.
2. Use CLI planners: `vybekiit plan-readiness`, `vybekiit plan-setup`, `vybekiit plan-data-model`.
3. Append routes with `vybekiit backend add-route` or CRUD with `vybekiit backend add-crud`.

## Conventions

- MVC layout: `src/routes/`, `src/controllers/`, `src/middleware/`, `src/services/`.
- Use `@vybekiit/*` packages — never reinvent auth, db, or payments.
- Secret settings live in `.env` only — never read values aloud in chat.
- Session cookies are httpOnly; mobile/extension clients use `APP_URL` pointing here.
