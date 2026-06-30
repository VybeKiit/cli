# Skill: harden

**Goal:** lock down the API server.

## Steps

1. Confirm helmet, rate limits, and CORS are configured in `src/app.ts`.
2. Set `SESSION_SECRET` and `NODE_ENV=production` in production.
3. **Verify:** rate limit triggers on repeated requests.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

