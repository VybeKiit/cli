# Skill: add-route

**Goal:** add a new API endpoint without hand-writing boilerplate.

## Steps

1. Ask the builder what the endpoint should do (plain words).
2. Run `vybekiit backend add-route <name>`.
3. Edit the generated controller logic for their use case.
4. **Verify:** the new route responds on `/api/<name>`.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

