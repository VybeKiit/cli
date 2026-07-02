# Skill: check-safety

**Goal:** confirm the app and its backend connection are ready before store publish — security on the
backend, clean code on the phone, consistent UI. Plain pass/fail summary for the builder.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate when green.

## Steps

1. **Backend safety.** Confirm the builder's web backend has `check-safety` green (rate limits, database
   safety, API taxonomy). Mobile cannot enforce abuse protection alone — it lives on the backend.
   **Verify:** backend `SECURITY_*` on; mobile `EXPO_PUBLIC_APP_URL` points at that backend.

2. **No secrets on device.** Grep for API keys, webhook secrets, or service role keys in `app/`,
   `src/` — must be empty (only `EXPO_PUBLIC_*` allowed in `.env`).
   **Verify:** only public client ids in the app bundle.

3. **Code readiness.** Grep for `console.log` / `console.debug` in `app/` and `src/` (exclude tests).
   Scan `src/lib/` for duplicate function names. Use `@/lib/logger` for logging.
   **Verify:** *"Your app is quiet and uses one place for each kind of logic."*

4. **UI consistency.** All screens use kit `Button` / `Input` / `Card` with locked sizes
   (`sm | default | lg | icon`). Grep for `nativewind`, `react-native-paper` — must be empty.
   **Verify:** *"Your app looks like one professional product."*

5. **Toolchain.** Run `vybekiit doctor` — Expo skills, launch CLI when publishing.

6. **Error alerts (optional).** If `track-errors` ran: confirm `SENTRY_DSN` when `OBSERVABILITY_PROVIDER=sentry`.

7. **Quality smoke (soft).** Run `pnpm verify`. Fix obvious failures; warn-only Biome issues need not block ship.
   **Verify:** *"Your app is tested and tidy."*

## Definition of done

Backend protected, no secrets on phone, code clean, UI consistent, quality smoke green, doctor green. 🎉

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

