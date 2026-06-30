# Skill: onboarding

**Goal:** the API server runs locally and the builder sees it working.

## Steps

1. Run `pnpm install` then `pnpm dev`.
2. Open `http://localhost:4000/health` — **Verify:** `{ "ok": true }`.
3. Celebrate — the server is ready for their app to connect.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

