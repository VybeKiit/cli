# UI source catalog — mobile (agent-only)

ADR-0004: **plain StyleSheet + `@vybekiit/tokens` only.** Do not install NativeWind, Gluestack, Tamagui, or react-native-reusables.

## Implementation target

Always build with kit `src/components/ui/*` (`Button`, `Input`, `Card`, `Label`, `Alert`, `Badge`, `Separator`, `Skeleton`, `Avatar`, `Tabs`, `Dialog`, `Sheet`, `Select`, `DropdownMenu`) and `useTheme()`.

## Reference sources (visual inspiration — port, don't install)

| Source | How to use |
|---|---|
| Web shadcn blocks (Magic UI, 21st.dev, Kokonut, etc.) | Visual reference — reimplement with kit primitives |
| [Expo building-native-ui](https://docs.expo.dev) (pinned skill) | Layout, navigation, platform patterns |
| Gluestack / Reusables / Tamagui docs | Pattern inspiration only — never add as dependency |

See `../agent/ui-sources.md` for the full web registry when porting layouts.

## Port checklist

1. Web `<Button>` → mobile `<Button variant size title="…" />`
2. Tailwind spacing → `spacing.*` from `useTheme()`
3. `rounded-lg` → `radius` token
4. No new UI npm packages
5. Locked sizes only: `sm | default | lg | icon`

## Forbidden

`nativewind`, `react-native-paper`, `@gluestack-ui/`, `tamagui`, MUI — grep must be empty.
