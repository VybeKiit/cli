# Skill: save-data

**Goal:** the app can remember things — save information and read it back later.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate. You do all the wiring; the builder only pastes a value when asked
or describes, in plain words, what the app should remember.

> (Under the hood — agent-only) Use `@vybekiit/db`'s `resolveDataProvider()` for every read/write.
> The default is Supabase (Postgres); `mongodb` (Atlas) and `aws` are opt-in via `DATA_PROVIDER`.
> The same skill wires whichever one is set — never name the service to the builder.

## Steps

1. **Make sure the database is ready.** Run the database tool via `vybekiit doctor`. For the default,
   you can create the project programmatically. Collect any access keys it needs **one at a time**
   and save them to the secret settings file.
   **Verify:** the database is reachable (`@vybekiit/db`'s `pingDatabase`).

2. **Agree on what to remember, in plain words.** Ask the builder what the app should save (e.g.
   "each customer's name and order"). Turn their answer into a simple data shape yourself — don't
   make them think about it.
   **Verify:** read the shape back to them in one sentence and get a yes.

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

## Definition of done

The app saves and reads back real data, a passing test covers it, and no save-data markers remain
(re-grep `TODO(vybekiit)`).
