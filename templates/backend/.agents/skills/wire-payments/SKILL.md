---
name: wire-payments
description: the API can process payments for mobile/extension clients. Use when the builder says something like: add payments; take money; sell something; charge people; wire payments.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: wire-payments

**Goal:** the API can process payments for mobile/extension clients.


**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) · translate every error · celebrate. Decide all technical choices yourself.

## Steps

1. Run `vybekiit plan-setup payments`.
2. Wire `@vybekiit/payments` checkout routes.
3. **Verify:** practice checkout completes.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
