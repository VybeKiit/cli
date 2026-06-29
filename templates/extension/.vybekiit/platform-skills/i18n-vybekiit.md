# Platform wrapper: i18n (extension template)

**Agent-only.** Invoked by generic coding and the `add-language` buyer skill.

## Official upstream

- Chrome i18n API: https://developer.chrome.com/docs/extensions/reference/i18n/
- WXT types: `.wxt/types/i18n.d.ts` (regenerated on build)

## Shared conventions

- **Never hardcode user-facing strings** — use `t('key')` from `@/lib/i18n`.
- **Flat-dotted keys** in Chrome `messages.json` format (`message` + optional `placeholders`).
- **Manifest strings:** `__MSG_ext.name__`, `__MSG_ext.description__` in `wxt.config.ts`.
- **RTL:** `dir={localeToDirection(getActiveLocale())}` on popup root; logical Tailwind spacing.

## Extension stack

| Piece | Location |
|---|---|
| Catalog | `public/_locales/{locale}/messages.json` |
| Helper | `lib/i18n.ts` — `t()`, `getActiveLocale()`, `localeToDirection()` |
| Manifest | `wxt.config.ts` — `default_locale: 'en'` |

## Adding a locale

1. Copy `public/_locales/en/messages.json` → `public/_locales/{locale}/messages.json`.
2. Translate `message` fields; keep keys identical.
3. Rebuild — `pnpm build` bundles `_locales/` into output.
4. RTL: set `dir` on popup `<main>`; test with Chrome locale override.
5. Run `pnpm test` — `lib/__tests__/i18n.test.ts` green.

## Key namespace

Extension-specific: `ext.*` (manifest), `popup.*` (UI). No web/mobile parity required for popup copy.

## Verify-before-advance

`pnpm quality` green; reload extension in Chrome; confirm popup + manifest name in new language.
