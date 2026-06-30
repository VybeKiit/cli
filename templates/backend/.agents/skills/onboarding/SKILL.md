---
name: onboarding
description: the API server runs locally and the builder sees it working. Use when the builder says something like: set up my app; let's start; get me going; just bought.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: onboarding

**Goal:** the API server runs locally and the builder sees it working.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Run **`vybekiit setup`** (`vybekiit doctor` still works to re-check tools anytime), then `./install.sh`, then `pnpm dev`.
2. Open `http://localhost:4000/health` — **Verify:** `{ "ok": true }`.
3. Celebrate — the server is ready for their app to connect.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
