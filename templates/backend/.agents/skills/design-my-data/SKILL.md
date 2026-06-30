---
name: design-my-data
description: plan what the server should remember. Use when the builder says something like: design my database; what data do i need; what should my app remember.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: design-my-data

**Goal:** plan what the server should remember.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Ask the builder what to remember in plain words.
2. Run `vybekiit plan-data-model entities.json supabase` with a JSON file `{ "entities": [...] }`.
3. Continue with `wire-database`.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
