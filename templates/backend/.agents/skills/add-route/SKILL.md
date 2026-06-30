---
name: add-route
description: add a new API endpoint without hand-writing boilerplate. Use when the builder says something like: add an endpoint; add api; new route.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-route

**Goal:** add a new API endpoint without hand-writing boilerplate.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Ask the builder what the endpoint should do (plain words).
2. Run `vybekiit backend add-route <name>`.
3. Edit the generated controller logic for their use case.
4. **Verify:** the new route responds on `/api/<name>`.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
