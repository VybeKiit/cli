# Skill: add-upload

**Goal:** let clients upload files safely.

## Steps

1. Run `vybekiit backend add-upload`.
2. **Verify:** POST `/api/upload` with a small image succeeds; oversized files are rejected.
3. Wire storage to `@vybekiit/db` storage provider when going live.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

