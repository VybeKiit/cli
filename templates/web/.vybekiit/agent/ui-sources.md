# UI source catalog — web & extension (agent-only)

The builder never picks a UI library. You choose from this catalog, then **normalize** every block to kit primitives and `@vybekiit/tokens`.

See also: `ui-consistency-vybekiit.md` · `shadcn-vybekiit.md` · `../agent/ui-sources.mobile.md` (mobile port rules).

## Approved sources (shadcn-compatible)

| Source | Best for | Install | Notes |
|---|---|---|---|
| [shadcn/ui](https://ui.shadcn.com) | Core primitives, forms, dialogs | `npx shadcn@latest add <component>` | Default foundation — always prefer over duplicates |
| [Magic UI](https://magicui.design) | Animated marketing, marquees, beams, bento | `npx shadcn@latest add @magicui/<name>` | Normalize buttons/inputs to kit primitives |
| [Kokonut UI](https://kokonutui.com) | Interactive marketing, modern layouts | `npx shadcn@latest add @kokonutui/<name>` | shadcn + Motion; strip custom button sizes |
| [21st.dev](https://21st.dev) | Community blocks, agent templates | `npx shadcn add <registry-url>` | Curate quality; reject blocks that bypass primitives |
| [Origin UI](https://originui.com) | Extra shadcn-style primitives | Registry CLI | Merge into `src/components/ui/` once |
| [Aceternity UI](https://ui.aceternity.com) | High-motion landing sections | Copy-paste | Marketing only; normalize spacing |
| [Cult UI](https://cult-ui.com) | AI chat / agent UI patterns | Copy-paste / registry | Map to kit forms |
| [Tailark](https://tailark.com) | Marketing blocks, conversion layouts | Copy-paste / registry | Keep token colors |
| [Tremor](https://tremor.so) | Dashboards, KPI cards, charts | `npm @tremor/react` or blocks | Dashboard-only; wrap in kit `Card` |
| [shadcn/ui Charts](https://ui.shadcn.com/charts) | Charts (Recharts) | `npx shadcn@latest add chart` | Preferred over random chart libs |
| [shadcn.io blocks](https://shadcn.io/blocks) | Large block marketplace | Registry browse | Normalize before merge |
| [Shadcnblocks](https://shadcnblocks.com) | Figma-aligned blocks | Registry / copy | Free blocks OK |
| [ReUI / Skiper UI / MynaUI](https://reui.io) | Additional shadcn-style sets | Registry | Secondary sources |

## Forbidden

Never install or import: MUI, Ant Design, Chakra, daisyUI, HeroUI, Bootstrap React, Flowbite npm package, or a second design system alongside shadcn.

Grep check:

```bash
rg "@mui/|@chakra-ui/|antd|nativewind|react-native-paper" app/ src/
```

## Decision tree

- Standard control → `src/components/ui/` first
- Marketing flair → Magic UI / Kokonut / Tailark (**one** per page)
- Dashboard metrics → Tremor or shadcn Charts inside kit `Card`
- AI chat UI → Cult UI patterns, normalized to kit forms
