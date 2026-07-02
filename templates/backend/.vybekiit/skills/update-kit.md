# Skill: update-kit

**Goal:** get the latest VybeKiit instructions and packages.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Run `vybekiit plan-setup` is not needed — run three channels:
   - `npm update @vybekiit/*` (or `planKitUpdate` via package.json compare)
   - `vybekiit sync-agent-layer backend` (preserves `.vybekiit/extensions/**` and extension goal-index rows)
   - `npx skills update -y` when `skills-lock.json` exists
2. **Verify:** `pnpm verify` passes.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

