# ADR-0011 — Buyer planning skill (grill behavior, plain language)

- **Status:** Accepted
- **Date:** 2026-06-29
- **Deciders:** Yosef (owner), via buyer planning skill plan

## Context

Maintainer workflows use `/grill-me` and `/grill-with-docs` slash skills to stress-test plans and
sharpen domain language before implementation. Vibe coders benefit from the same rigor — one
question at a time, recommended answers, glossary capture — but they will never type slash commands
or read ADRs.

VybeKiit already routes buyers through **Layer A goal skills** (`.vybekiit/skills/`) and
**AGENTS.md** as SSOT across Cursor, Claude Code, and Codex. No per-assistant `npx skills add` step
is required for buyer-facing behavior.

## Decision

1. **New Layer A skill: `plan-my-idea.md`** (web, mobile, extension). Ports grill-me +
   grill-with-docs behavior into plain-language buyer skill format. One question at a time; wait for
   answer; recommend each time; explore codebase when possible; never say "grill", "skill", "ADR", or
   slash commands.

2. **Layer B reference: `planning-vybekiit.md`** (agent-only). CONTEXT.md format rules, fuzzy-term
   sharpening, code cross-check, concrete scenarios. **No ADRs** for buyers.

3. **Starter `CONTEXT.md`** ships in each template root. Buyer-owned glossary — **not** in
   `AGENT_LAYER_PATHS`; `update-kit` must not overwrite buyer entries.

4. **Routing:** `goal-index.md` maps planning phrases and vague big features to `plan-my-idea`.
   `AGENTS.md` offers planning once for large/ambiguous requests (never force).

5. **Onboarding:** one-time offer after "what do you want to build?" — opt-in planning or jump
   straight to building. Track via `.vybekiit/state/planning-intro-seen` (gitignored).

6. **No buyer slash skills.** Maintainer monorepo keeps personal `/grill-me` and `/grill-with-docs`;
   buyers never receive or are taught those commands.

## Consequences

- Planning power ships with the template and refreshes via `update-kit` channel 2 (agent layer).
- `CONTEXT.md` grows with the buyer's app; agents reference it during later feature work.
- Impatient builders can skip planning at any time; soft-suggest on later big requests only.

## References

- ADR-0007 — agent layer sync (`.vybekiit/` allowlist)
- `templates/*/ .vybekiit/skills/plan-my-idea.md`
- `templates/*/.vybekiit/platform-skills/planning-vybekiit.md`
