---
name: setup-payments
description: the extension can take money (via the backend checkout flow). Use when the builder says something like: add payments; take money; sell something; charge people.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: setup-payments

**Goal:** the extension can take money (via the backend checkout flow).

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.

> (Agent-only) Payments and keys stay on the backend. Extension opens hosted checkout in a tab.

## Steps

1. **Backend payments ready.** Run web `setup-payments` first if checkout isn't live.
   **Verify:** web checkout completes a test purchase.

2. **Wire extension checkout entry.** Replace `TODO(vybekiit): … — skill: setup-payments` — open
   backend checkout URL from the extension UI.
   **Verify:** test checkout opens and completes.

## Definition of done

Builder can start a purchase from the extension; money flows through the backend.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
