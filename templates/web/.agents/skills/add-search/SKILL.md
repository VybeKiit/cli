---
name: add-search
description: users can search the builder's data in plain language. Use when the builder says something like: let users search; find things; search my data.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-search

**Goal:** users can search the builder's data in plain language.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

> (Under the hood — agent-only) `@vybekiit/search` → `resolveSearchProvider()` via `src/lib/search-client.ts`.

## Steps

1. Explain: *"I'll add search so people can find things quickly."*
2. Wire index on create/update and a search UI calling `getSearch().search(query)`.
3. **Verify:** index + search test green.

## Definition of done

User can search and see matching results.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
