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

1. **Make sure the database is ready.** Run the database tool via `vybekiit doctor`. For MCP-tier providers
   (Supabase, Neon, Firebase), merge the matching `agent/mcp-*.json` via `agent/mcp-setup.md` and use
   login-once onboarding. If MCP fails once, run `vybekiit doc-fallback supabase` (or `neon` /
   `firebase`) and tell the builder you're checking the official setup guide (plain phrase only).
   Collect any access keys **one at a time** and save them to the secret settings file.
   **Verify:** the database is reachable (`@vybekiit/db`'s `pingDatabase`).

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

