# UI source catalog — mobile (agent-only)

ADR-0004: **plain StyleSheet + `@vybekiit/tokens` only.** Do not install NativeWind, Gluestack, Tamagui, or react-native-reusables.

## Implementation target

Always build with kit `src/components/ui/*` and `useTheme()`.

## Web mirror reference

The web template mirrors 474+ components under namespaced folders. Use `.vybekiit/agent/ui-catalog-index.mobile.json` (from web sync) for `portable: true` entries.

See `ui-port-from-web-vybekiit.md` for category → mobile primitive mapping.

## Reference sources (visual inspiration — port, don't install)

| Source | How to use |
|---|---|
| Web mirror (`magicui/`, `bundui/`, etc.) | Visual reference — reimplement with kit primitives |
| [Expo building-native-ui](https://docs.expo.dev) (pinned skill) | Layout, navigation, platform patterns |
| React Native Paper / NativeWind / Reusables / Tamagui / Gluestack docs | Pattern inspiration only — **never add as dependency** |

See web `ui-sources.md` for the full registry catalog when porting layouts.

## Port checklist

1. Web `<Button>` → mobile `<Button variant size title="…" />`
2. Tailwind spacing → `spacing.*` from `useTheme()`
3. `rounded-lg` → `radius` token
4. No new UI npm packages
5. Locked sizes only: `sm | default | lg | icon`
6. Skip Framer Motion / DOM-only effects — static or simplified animation only

## Forbidden

`nativewind`, `react-native-paper`, `@gluestack-ui/`, `tamagui`, `@heroui/`, MUI — grep must be empty.
