# ADR-0004 — Mobile UI: plain StyleSheet + shared design tokens (no NativeWind)

- **Status:** Accepted
- **Date:** 2026-06-27
- **Deciders:** Yosef (owner), via `/grill-with-docs`

## Context

The blueprint specced the mobile template's UI as **NativeWind + react-native-reusables** to get
shadcn-parity on native. With the mobile template pulled forward to full web parity in this push
(it was deferred to v2), that styling choice had to be committed. NativeWind has proven too buggy in
practice, and react-native-reusables depends on it — so the parity plan rested on a shaky base.

The web template already styles with shadcn over a Tailwind theme/token set. We want mobile to look
consistent with web without coupling it to a fragile native-Tailwind layer.

## Decision

1. **Drop NativeWind** (judged too buggy) and **react-native-reusables** (depends on NativeWind).
2. **Build a small primitive set in plain React Native `StyleSheet`** — Button, Input, Card, Label,
   Alert — matching the web template's primitives one-for-one.
3. **Introduce a shared `@vybekiit/tokens` package** (colors, spacing, radius, type) that **both**
   platforms consume: web as CSS variables, mobile as `StyleSheet` values. One source of truth for
   the look across web + mobile.
4. **Dark mode via `useColorScheme`; RTL via `I18nManager`** — the native equivalents of the web
   template's logical-property RTL and theme handling.

## Consequences

- **No NativeWind dependency or bug surface** on the mobile path.
- **DRY design tokens across web + mobile.** Web and mobile look consistent because they read the
  *same* token map; a palette or spacing change ships once.
- **Hand-built primitives are more code to maintain** than pulling a component library — accepted for
  full control over behavior, accessibility, and RTL, and to stay off NativeWind.
- The token package is a new MAINTAINED `@vybekiit/*` workspace (consumed by both templates),
  consistent with the owned-vs-maintained split.

## Alternatives rejected

- **React Native Paper:** mature and batteries-included, but its Material look clashes with the web
  template's shadcn/neutral aesthetic — the two platforms would read as different products.
- **Pure StyleSheet per screen, no primitives:** drops the dependency but duplicates styling across
  every screen and violates DRY; the shared primitives + token map exist precisely to avoid that.
