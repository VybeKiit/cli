# Skill: add-crud

**Goal:** scaffold create/read/update/delete routes for a resource.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Agree on the resource name in plain words (e.g. "posts", "orders").
2. Run `vybekiit backend add-crud <resource>`.
3. Swap in-memory store for `@vybekiit/db` when ready.
4. **Verify:** list, create, read, update, delete all work.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

