# templates/mobile — Expo (React Native)

The mobile template: a working Expo app at parity with `templates/web` (same screens, copy, flow,
and `TODO(vybekiit)` markers), built with **plain React Native `StyleSheet`** primitives that read the
shared `@vybekiit/tokens` palette — no NativeWind, no UI library (ADR-0004).

## Stack

- **Expo SDK 56** (`expo ~56.0.12`, React Native `0.85`, React `19.2`), new architecture on.
- **expo-router** (file-based routing under `app/`, mirroring web's `app/` structure).
- **@vybekiit/{auth,core,payments,tokens}** — the same headless packages the web template uses.
- **launch-store** — the deploy config (`launch.config.ts`), defaulting to EAS cloud builds.

## Layout

```
app/                 expo-router screens (mirror web's app/)
  _layout.tsx        root Stack + SafeAreaProvider + <Toaster />
  index.tsx          home / marketing (hero + features + CTAs)
  login / signup / verify / pricing / dashboard
src/
  theme/             useTheme() + the HSL→RN color converter (the tokens bridge)
  components/ui/      StyleSheet primitives: button, input, label, card, alert
  components/         form-field, auth-shell, toaster
  hooks/             use-async, use-toast, use-user (ported from web)
  lib/               auth-client, billing-client, plans, fetch-json, config (stubs + data)
  data/              marketing (FEATURES), dashboard (stats + getting-started)
```

## Scripts

- `pnpm start` / `pnpm ios` / `pnpm android` — run the app in Expo.
- `pnpm typecheck` — `tsc --noEmit` (max-strict, matches the repo).
- `pnpm test` — `vitest run` over the **pure** modules only (the HSL converter and the auth/billing
  `Result` stubs). RN component tests need the `jest-expo` preset — a follow-up, not wired here.

There is intentionally **no `build` script**: Expo builds run remotely (EAS / `launch`), not in the
shared turbo gate, so there is no local build artifact to produce. `turbo run build` simply runs no
build task for this package; its deps (`@vybekiit/*`) are built via `^build`.

## Theming

`useTheme()` is the single styling source. It reads the OS color scheme (`useColorScheme()`), picks
the light/dark palette from `@vybekiit/tokens`, and converts each channel-only token (`'0 0% 100%'`)
into an RN color string via `toRnHsl` (RN's parser needs the comma form `hsl(h, s%, l%)`). RTL is
handled at the layout level by React Native's `I18nManager`; screens use logical flex layout.

## Deploy

`launch.config.ts` uses `launch-store`'s real schema: `appRoots: ['.']`, local credentials/storage,
and `buildEngine: 'eas'` (Expo cloud — no Mac required). App facts (bundle id, version) come from
`app.json`. Fill the `TODO(vybekiit)` markers in `app.json` and `launch.config.ts`, then run `launch`.
