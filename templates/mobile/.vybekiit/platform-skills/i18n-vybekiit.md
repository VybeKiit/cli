# Platform wrapper: i18n (mobile template)

**Agent-only.** Invoked by generic coding and the `add-language` buyer skill.

## Official upstream

- expo-localization: https://docs.expo.dev/versions/latest/sdk/localization/
- i18n-js: https://github.com/fnando/i18n-js

## Shared conventions

- **Never hardcode user-facing strings** — use `t('flat.dotted.key')` via `useTranslations()` or `@/lib/i18n`.
- **Flat-dotted keys** in `messages/en.json` (converted to nested scopes for i18n-js internally).
- **Default locale:** `en`; device locale detected via `expo-localization`, fallback `en`.
- **RTL:** `applyRtlForLocale()` in `src/lib/direction.ts` (I18nManager, per ADR-0004).

## Mobile stack

| Piece | Location |
|---|---|
| Catalog | `messages/{locale}.json` |
| Init + `t()` | `src/lib/i18n.ts` — call `initI18n()` from `app/_layout.tsx` |
| Hook | `src/hooks/use-translations.ts` |
| RTL | `src/lib/direction.ts` |

## Adding a locale

1. Copy `messages/en.json` → `messages/{locale}.json`; translate values.
2. Register in `src/lib/i18n.ts` via `registerLocale(locale, messages)`.
3. Add to `flatCatalogs` / device resolution if needed.
4. RTL locales: confirm layout mirrors after reload.
5. Run `pnpm test` — `src/lib/__tests__/i18n.test.ts` green.

## Cross-platform keys

Mirror web keys where surfaces match: `home.hero.*`, `auth.*`, `pricing.*`, `dashboard.*`.
Mobile-only: `navigation.screen.*`, `common.close`.

## Verify-before-advance

`pnpm verify` green; reload app and confirm stack titles + one screen in the new language.
