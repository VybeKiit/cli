# Skill: add-realtime

**Goal:** the builder's app can push live updates to signed-in users.

**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·
translate every error · celebrate.

> (Agent-only) Read `REALTIME_PROVIDER` and follow `platform-skills/db-presets-vybekiit.md` +
> `platform-skills/supabase-vybekiit.md` when on the default stack.

## Steps

1. **Explain in one line.** *"I'll turn on live updates so your app refreshes when data changes."*

2. **Apply the realtime preset.**
   - Run `vybekiit apply-preset realtime_publications` (dry-run first if DATABASE_URL is new).
   - **Verify:** `vybekiit verify-presets realtime_publications` passes.

3. **Wire `@vybekiit/realtime`.** Use `resolveRealtimeProvider()` in server routes or client hooks
   as your template README describes.

4. **Smoke test.** Open two browser tabs on a signed-in page; change data in one tab.
   **Verify:** the other tab updates without a full refresh.

## Definition of done

Live channel works for at least one table the builder cares about, with preset verified.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.
