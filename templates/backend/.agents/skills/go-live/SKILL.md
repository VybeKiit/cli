---
name: go-live
description: put the API server online. Use when the builder says something like: put it online; publish; make it live; ship it; deploy.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: go-live

**Goal:** put the API server online.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Run `vybekiit plan-setup deploy`.
2. Deploy via `@vybekiit/deploy`'s `resolveHosting()` — follow `.vybekiit/platform-skills/deploy-railway-vybekiit.md` when `HOSTING_PROVIDER=railway`, or the matching wrapper for other hosts.
3. **Verify:** public `/health` responds.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
