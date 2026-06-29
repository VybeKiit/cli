# Skill: design-my-data

**Goal:** figure out what the app should remember before wiring storage.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do all the planning; the builder describes features in plain words.

> (Agent-only) Call `planDataModel()` from `@vybekiit/agent-kit` with entities inferred from the
> conversation. Never say primary key, foreign key, migration, schema, or normalization to the builder.
> Follow `platform-skills/data-model-vybekiit.md`.

## Steps

1. **Learn what users do.** From the product description, ask what must be saved (not a schema interview).
   **Verify:** you can list 1–3 things the app remembers.

2. **Plan the shape (agent-only).** Run `planDataModel()` with entities and fields inferred from step 1.
   **Verify:** plan has collections and a `buyerSummary` sentence.

3. **Read back in one sentence.** Use `renderDataModelSummary(plan)` — plain words only.
   **Verify:** builder says yes.

4. **Route to save-data.** Hand off to `save-data.md` to provision the database, wire CRUD, and test.
   **Verify:** `save-data` definition of done.

## When to skip

Single trivial entity (e.g. one list of notes) — you may inline `planDataModel()` inside `save-data` step 2
instead of running this skill separately.

## Definition of done

Builder agreed on what the app remembers and `save-data` is running with a clear target shape.
