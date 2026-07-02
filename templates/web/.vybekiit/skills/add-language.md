# Skill: add-language

**Goal:** make the app speak another language — the builder asks in plain words ("make it Hebrew",
"add Spanish"), you wire a full locale in one session.

**Contract:** one action at a time · verify-before-advance · plain language · translate errors ·
celebrate. Follow `i18n-vybekiit.md` for all technical steps.

## Steps

1. **Ask which language** — plain words only. You pick the ISO code (e.g. Hebrew → `he`, Spanish → `es`).
2. **Duplicate the catalog** — copy `messages/en.json` → `messages/{locale}.json`; translate every value.
3. **Register the locale** — update `src/i18n/routing.ts` and `middleware.ts` (keep both in sync).
4. **Wire RTL if needed** — for `ar`, `he`, `fa`, `ur`: confirm `<html dir="rtl">` on a page in the new locale.
5. **Verify** — run `pnpm verify`. Open `/{locale}` in dev (e.g. `/he`) and confirm copy + layout.
6. **Celebrate** — show the builder one screen in their language; offer the next goal from `goal-index.md`.

## Definition of done

The new locale loads at `/{locale}/…`, all keys resolve, tests green, builder confirmed they see their language.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*

