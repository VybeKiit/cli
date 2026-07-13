---
name: save-data
description: the app can remember things — save information and read it back later. Use when the builder says something like: save my data; remember this; store info; add a database.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: save-data

**Goal:** the app can remember things — save information and read it back later.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do all the wiring; the builder only pastes a value when asked
or describes, in plain words, what the app should remember.

> (Under the hood — agent-only) Use `@vybekiit/db`'s `resolveDataProvider()` for every read/write.
> Follow the platform wrapper for the active `DATA_PROVIDER`:
> - `supabase` (default) → `platform-skills/supabase-vybekiit.md`
> - `neon` → `platform-skills/neon-vybekiit.md`
> - `railway` → `platform-skills/railway-postgres-vybekiit.md`
> - `firebase` → `platform-skills/firebase-vybekiit.md`
> - `mongodb` / `aws` → advanced; maintainer docs only

## Steps

1. **Make sure the database is ready.** Prefer the shared Live work path (ADR-0039) so preference
   ladder, free-tier hop, and pin stay in one place:
   - Run `vybekiit live-work data --mode=buyer --cwd=.` (add `--vendor=<name>` only when the
     builder named Supabase, Neon, or Railway).
   - On success, read the JSON `buyerMessage` out loud and celebrate. Secrets are already pinned to
     the secret settings file (`pinKeys` lists which names were written — never print values).
   - If it fails with missing credentials / ladder exhausted, fall back to `vybekiit doctor` and
     MCP-tier login-once onboarding (Supabase, Neon, Firebase) via `agent/mcp-setup.md`. Collect any
     access keys **one at a time**. If MCP fails once, run `vybekiit doc-fallback supabase` (or
     `neon` / `firebase`) and tell the builder you're checking the official setup guide (plain
     phrase only).
   **Verify:** Live work JSON has `"ok": true` and `"verified": true`, or `@vybekiit/db`'s
   `pingDatabase` succeeds after keys are present.

2. **Agree on what to remember, in plain words.** If no prior `design-my-data` session, run that skill first
   (or run `vybekiit plan-data-model entities.json` for a single simple entity). Ask what the app
   should save; turn their answer into a simple data shape yourself.
   **Verify:** read the shape back in one sentence and get a yes.

3. **Wire saving and reading.** Use `resolveDataProvider()` for insert / get / query / update /
   remove. Replace the dashboard's placeholder stats marker (`TODO(vybekiit): … — skill: save-data`;
   grep them) with a real read.
   **Verify:** the code builds with no errors.

4. **Write a test** that saves a record and reads it back, and keep it green.

5. **Try it for real.** Save something, then read it back in the app.
   **Verify:** what was saved comes back exactly.
   🎉 *Celebrate* — the app remembers things now.

## If anything breaks

Run `doctor`. Most issues are a missing access key or the database not reachable yet — fix it for
them, don't explain the internals.

> ⚠️ (Agent-only) If the app will have scheduled tasks (crons), they must run ≥15 min apart and
> only during active hours — otherwise a free-tier database never auto-suspends and will exhaust
> its compute quota, causing the entire app to go down with no way to deploy a fix until the next
> billing cycle resets the quota.

## Definition of done

The app saves and reads back real data, a passing test covers it, and no save-data markers remain
(re-grep `TODO(vybekiit)`).

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
