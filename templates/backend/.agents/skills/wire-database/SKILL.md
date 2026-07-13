---
name: wire-database
description: the server remembers things persistently. Use when the builder says something like: save my data; remember this; store info; add a database; wire database.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: wire-database

**Goal:** the server remembers things persistently.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Make sure storage is ready: `vybekiit live-work data --mode=buyer --cwd=.`
   (add `--vendor=…` only if the builder named Supabase, Neon, or Railway).
   Read the JSON `buyerMessage` out loud. Secrets are pinned already (`pinKeys` = names only).
2. Run `vybekiit plan-setup database` for the checklist when more platform steps remain.
3. Run `vybekiit plan-data-model entities.json` (not eval from node_modules).
4. Wire `@vybekiit/db` via `resolveDataProvider()`.
5. **Verify:** save and read back a record.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
