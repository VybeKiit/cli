---
name: add-language
description: make the app speak another language when the builder asks in plain words. Use when the builder says something like: translate my app; add spanish; make it hebrew.
metadata:
  vybekiit-generated: buyer-skill-stub
---

<!-- vybekiit:generated:buyer-skill-stub -->

# Skill: add-language

**Goal:** make the app speak another language when the builder asks in plain words.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.
Follow `i18n-vybekiit.md` for technical steps.

## Steps

1. **Ask which language** — you pick the ISO code.
2. **Duplicate the catalog** — `messages/en.json` → `messages/{locale}.json`; translate values.
3. **Register** — call `registerLocale()` in `src/lib/i18n.ts`; update device locale resolution if needed.
4. **RTL** — for `ar`, `he`, `fa`, `ur`: verify mirrored layout after app reload.
5. **Verify** — `pnpm verify`; builder confirms a screen in the new language.
6. **Celebrate** 🎉

## Definition of done

New locale resolves on device (or when forced for testing); tests green; builder saw their language.

## After completing this skill

Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.

If MCP or first debug fails once, run `vybekiit doc-fallback <tech-id>` and tell the builder only: *"I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment."*
