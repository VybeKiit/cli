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

1. Put the API online via shared Live work host (ADR-0039): `vybekiit live-work host --mode=buyer --cwd=.`
   (add `--vendor=…` only if the builder named Cloudflare, Render, Railway, or Vercel).
   Read the JSON `buyerMessage` out loud and share `url` when present. Pin keys are written already
   (`pinKeys` = names only).
2. If Live work fails with missing credentials / ladder exhausted, run `vybekiit plan-setup deploy`
   and deploy via `@vybekiit/deploy`'s `resolveHosting()` — follow
   `.vybekiit/platform-skills/deploy-railway-vybekiit.md` when `HOSTING_PROVIDER=railway`, or the
   matching wrapper for other hosts. Never reimplement the preference ladder in this skill.
3. **Verify:** public `/health` responds (or Live work JSON has `"ok": true` and `"verified": true`
   and the live URL loads).

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
