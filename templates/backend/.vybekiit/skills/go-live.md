# Skill: go-live

**Goal:** put the API server online.

## Steps

1. Run `vybekiit plan-setup deploy`.
2. Deploy to the builder's hosting provider (Cloudflare, Railway, etc.).
3. **Verify:** public `/health` responds.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

