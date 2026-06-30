---
name: design-my-data
description: figure out what the app should remember before wiring storage. Use when the builder says something like: design my database; what data do i need; what should my app remember.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: design-my-data

**Goal:** figure out what the app should remember before wiring storage.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do all the planning; the builder describes features in plain words.

> (Agent-only) Run `vybekiit plan-data-model entities.json [provider]` — do not eval TypeScript from node_modules. Entities inferred from the
> conversation. Never say primary key, foreign key, migration, schema, or normalization to the builder.
> Follow `platform-skills/data-model-vybekiit.md`.

## Steps

1. **Learn what users do.** From the product description, ask what must be saved (not a schema interview).
   **Verify:** you can list 1–3 things the app remembers.

2. **Plan the shape (agent-only).** Run `vybekiit plan-data-model entities.json` with entities from step 1.
   **Verify:** plan has collections and a `buyerSummary` sentence.

3. **Read back in one sentence.** Use `renderDataModelSummary(plan)` — plain words only.
   **Verify:** builder says yes.

4. **Route to save-data.** Hand off to `save-data.md` to provision the database, wire CRUD, and test.
   **Verify:** `save-data` definition of done.

## When to skip

Single trivial entity (e.g. one list of notes) — you may run `vybekiit plan-data-model` inside `save-data` step 2
instead of running this skill separately.

## Definition of done

Builder agreed on what the app remembers and `save-data` is running with a clear target shape.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
