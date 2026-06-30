# ADR-0019 — Structured i18n as default template scaffold

- **Status:** Accepted
- **Date:** 2026-06-29
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

VybeKiit originally described in-product localization as "auto-localized for free (agents are
multilingual)" — meaning agents wrote copy directly in the builder's language with no translation
files. The web template shipped partial RTL infrastructure (`direction.ts`, logical Tailwind
properties) but no message catalogs or i18n libraries.

Vibe coders who later want Hebrew, Spanish, or other languages need a one-shot agent path: duplicate
a catalog, fill translations, wire the locale. That path only works if every string already lives in
a catalog from commit 1 — retrofitting a full template sweep after launch is brutal.

## Decision

1. **Structured message catalogs from day one** — all user-facing strings in locale JSON files, even
   when only `en` ships. Components call `t('flat.dotted.key')`; never hardcode copy in JSX.
2. **Platform-native i18n stacks** — web: **next-intl** with `[locale]` URL routing; mobile:
   **expo-localization + i18n-js** with device-locale detection; extension: **Chrome `_locales/`**
   + `browser.i18n.getMessage()`.
3. **Flat-dotted key convention** shared across platforms where surfaces mirror (e.g.
   `home.hero.title`).
4. **Locale-driven RTL** — `dir`/`lang` derived from the active i18n locale, not standalone
   `Accept-Language` parsing.
5. **Two-layer skills** — buyer `add-language.md` + agent-only `i18n-vybekiit.md` per template.
6. **Full template string sweep** at scaffold time — every page, component, and data file with
   user-facing copy migrated before shipping.

## Consequences

- Adding a second language becomes a repeatable agent workflow (copy catalog → translate → register
  locale → smoke test) instead of a JSX archaeology project.
- Web App Router restructures under `app/[locale]/` — largest diff, but next-intl's documented
  default and SEO-friendly.
- Three different APIs (next-intl, i18n-js, Chrome i18n) — accepted; each follows platform best
  practices. Shared key naming in the skill keeps agents oriented.
- Single-locale apps pay a small overhead (import `t`, maintain JSON) — accepted for scale-ready
  scaffolding.

## Alternatives rejected

- **Agent-inline copy (status quo):** fast for one language, impossible to scale locales reliably.
- **Unified react-i18next everywhere:** simpler mental model, but next-intl is the App Router
  standard and Chrome extension manifest strings require `_locales/` anyway.
- **Shared `@vybekiit/i18n` package:** premature; conventions in platform skills suffice for now.
- **Starter-shell-only sweep:** leaves hundreds of strings to retrofit; full sweep chosen per grill
  session.
