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

1. **Connect taking money (Live work first).** Prefer the shared Live work path (ADR-0039):
   - Run `vybekiit live-work payments --mode=buyer --cwd=.` (add `--vendor=<name>` only when the
     builder named a payment brand).
   - On success, read the JSON `buyerMessage` out loud. Pin keys are already written (`pinKeys` —
     never print values).
   - If missing credentials / ladder exhausted, run `vybekiit plan-setup payments` and collect keys
     via the matching platform wrapper, then re-run Live work payments.
   **Verify:** Live work JSON has `"ok": true` and `"verified": true`.

2. Wire `@vybekiit/payments` checkout routes (`resolvePaymentProvider()`).
3. **Verify:** practice checkout completes.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
