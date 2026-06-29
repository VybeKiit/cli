# Platform wrapper: port UI from web mirror (mobile)

**Agent-only.** ADR-0004: StyleSheet + `@vybekiit/tokens` — never install web UI libraries on mobile.

## Portable flag

Web sync emits `ui-catalog-index.mobile.json` with `portable: true|false` per component. Only promise motion/effect parity when `portable: true` (no `motion`, `framer-motion`, tsparticles, three.js deps).

## Category → mobile approach

| Web category / namespace | Mobile approach |
|---|---|
| `ui/` primitives | Use mobile kit `src/components/ui/*` directly |
| `bundui/` forms, cards | Port layout with kit `Card`, `Button`, `Input` |
| `magicui/`, `aceternity/` backgrounds | Static gradient/image fallback; no particle/canvas ports |
| `magicui/` marquee, text effects | Simplified `Animated` or static text |
| `kokonutui/` AI chat | Kit `Input`, `Card`, `Button` + scroll layout |
| `untitled/` dense admin | Kit tables as `FlatList` + `Card` rows |
| `gluestack/` | Pattern reference only — implement with kit primitives |

## Expo Android reference (not installed)

These libraries are documented for pattern awareness only:

| Library | Notes |
|---|---|
| React Native Paper | Material look — conflicts with shadcn web aesthetic |
| NativeWind | Rejected in ADR-0004 (buggy) |
| React Native Reusables | Depends on NativeWind — not used |
| Tamagui / Gluestack npm | Not installed — web mirror is reference only |
| `@expo/ui` | Pinned skill for native SwiftUI/Compose inputs when needed |

## Workflow

1. Find web component via catalog index or builder description
2. Check `portable` in mobile index
3. Reimplement screen section with kit primitives + tokens
4. Match spacing/radius/colors to web via shared `@vybekiit/tokens`

## Cross-refs

- `ui-sources.mobile.md` — mobile catalog rules
- `ui-consistency-vybekiit.md` — locked sizes
- web `ui-routing-vybekiit.md` — which web source inspired the port
