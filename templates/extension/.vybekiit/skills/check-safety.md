# Skill: check-safety

**Goal:** confirm the extension and its backend connection are ready before store publish.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate when green.

## Steps

1. **Backend safety.** Confirm the builder's web backend passes web `check-safety` (rate limits, database, API taxonomy).
2. **No secrets in extension bundle.** Grep for API keys and webhook secrets in extension source — empty except `WXT_PUBLIC_*`.
3. **Code readiness.** No debug `console.log` in extension source (exclude tests). Use kit logger when scaffold ships.
4. **UI consistency.** When UI exists: kit shadcn primitives, no forbidden design-system deps — see `ui-consistency-vybekiit.md`.
5. **Toolchain.** Run `vybekiit doctor`.

## Definition of done

Backend protected, extension bundle clean, doctor green. 🎉

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

