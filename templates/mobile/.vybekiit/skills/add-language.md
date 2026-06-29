# Skill: add-language

**Goal:** make the app speak another language when the builder asks in plain words.

**Contract:** one action at a time · verify-before-advance · plain language · celebrate.
Follow `i18n-vybekiit.md` for technical steps.

## Steps

1. **Ask which language** — you pick the ISO code.
2. **Duplicate the catalog** — `messages/en.json` → `messages/{locale}.json`; translate values.
3. **Register** — call `registerLocale()` in `src/lib/i18n.ts`; update device locale resolution if needed.
4. **RTL** — for `ar`, `he`, `fa`, `ur`: verify mirrored layout after app reload.
5. **Verify** — `pnpm quality`; builder confirms a screen in the new language.
6. **Celebrate** 🎉

## Definition of done

New locale resolves on device (or when forced for testing); tests green; builder saw their language.
