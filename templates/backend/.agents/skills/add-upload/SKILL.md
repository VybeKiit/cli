---
name: add-upload
description: let clients upload files safely. Use when the builder says something like: upload; store files; attachments; file upload endpoint.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-upload

**Goal:** let clients upload files safely.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Run `vybekiit backend add-upload`.
2. **Verify:** POST `/api/upload` with a small image succeeds; oversized files are rejected.
3. Wire storage to `@vybekiit/db` storage provider when going live.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
