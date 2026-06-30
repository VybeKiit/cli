# UI source catalog — SPA admin app (agent-only)

The builder never picks a UI library. You choose from this catalog, then **normalize** every block to kit primitives and `@vybekiit/tokens`.

## Primary design system

| Layer | Location | When to use |
|---|---|---|
| **shadcn/ui (primary)** | `src/components/ui/` | All new controls, forms, dialogs, toasts — default first |
| **Modern UI** | `src/components/modern-ui/` | Marketing flair, rich text, animated accents — normalize buttons/inputs to `ui/` |
| **TailAdmin (migrated)** | `src/components/tailadmin-ui/` | Legacy dashboard blocks already in the template — prefer shadcn for new screens |

## Approved third-party sources (normalize-on-import)

| Source | Best for | Install | Namespace |
|---|---|---|---|
| [shadcn/ui](https://ui.shadcn.com) | Core primitives, forms, dialogs | `npx shadcn@latest add <component>` | `src/components/ui/` |
| [BundUI / Shadcn UI Kit](https://shadcnuikit.com/components) | Admin density, blocks | `npx shadcn@latest add @bundui/<name>` | `src/components/bundui/` |
| [Magic UI](https://magicui.design) | Animated accents | `npx shadcn@latest add @magicui/<name>` | `src/components/magicui/` |
| [Tremor](https://tremor.so) | Dashboard KPIs, charts | `@tremor/react` or shadcn chart | dashboard-only; wrap in kit `Card` |
| [shadcn/ui Charts](https://ui.shadcn.com/charts) | Charts (Recharts) | `npx shadcn@latest add chart` | `src/components/ui/chart.tsx` |

See `ui-consistency-vybekiit.md` for normalize-on-import workflow.

## Forbidden

Never install as the **primary design system**: MUI, Ant Design, Chakra, daisyUI, HeroUI, Bootstrap React.

Do not add new TailAdmin components — migrate new UI to shadcn in `src/components/ui/`.

## Decision tree

- Standard control → `src/components/ui/` first
- Existing dashboard page → reuse TailAdmin layout; swap controls to shadcn when touching the file
- Marketing / editor flair → `modern-ui/` namespace, normalize interactive controls to `ui/`
- Dashboard metrics → Tremor or shadcn Charts inside kit `Card`
- Live data tables → TanStack Query + kit table patterns; realtime via `socket-io-vybekiit.md`

<!-- vybekiit:generated:start web-ui-sources -->
# Approved UI block sources

| Source | Best for | Install | Notes |
|---|---|---|---|
| [shadcn/ui](https://ui.shadcn.com) | Core primitives, forms, dialogs | npx shadcn@latest add <component> | Default foundation — always prefer over duplicates |
| [BundUI / Shadcn UI Kit](https://shadcnuikit.com/components) | 503+ free shadcn variants, blocks, admin patterns | npx shadcn@latest add @bundui/<name> | Mirror in components/bundui/; normalize controls to kit primitives |
| [Magic UI](https://magicui.design) | Animated marketing, marquees, beams, bento | npx shadcn@latest add @magicui/<name> | Mirror in components/magicui/; normalize buttons/inputs to kit primitives |
| [Kokonut UI](https://kokonutui.com) | Interactive marketing, modern layouts | npx shadcn@latest add @kokonutui/<name> | Mirror in components/kokonutui/; shadcn + Motion; strip custom button sizes |
| [21st.dev](https://21st.dev) | Community blocks, agent templates | npx shadcn add <registry-url> | Mirror curated blocks in components/blocks/21st/; reject blocks that bypass primitives |
| [Origin UI](https://originui.com) | Extra shadcn-style primitives | Registry CLI | Merge into src/components/ui/ once |
| [Aceternity UI](https://ui.aceternity.com) | High-motion landing sections | npx shadcn@latest add https://ui.aceternity.com/registry/<name>.json | Mirror in components/aceternity/; free tier only; no OSS GitHub |
| [Untitled UI React](https://www.untitledui.com/react) | Enterprise admin, dense application UI | npx untitledui@latest add <name> | Mirror in components/untitled/; React Aria — never merge into ui/ |
| [Gluestack UI](https://gluestack.io/ui) | Cross-platform patterns (web mirror only in VybeKiit) | npx gluestack-ui@latest add <name> | Mirror web subset in components/gluestack/; mobile ports via kit StyleSheet only |
| [Cult UI](https://cult-ui.com) | AI chat / agent UI patterns | Copy-paste / registry | Map to kit forms |
| [Tailark](https://tailark.com) | Marketing blocks, conversion layouts | Copy-paste / registry | Keep token colors |
| [Tremor](https://tremor.so) | Dashboards, KPI cards, charts | npm @tremor/react or blocks | Dashboard-only; wrap in kit Card |
| [shadcn/ui Charts](https://ui.shadcn.com/charts) | Charts (Recharts) | npx shadcn@latest add chart | Preferred over random chart libs |
| [shadcn.io blocks](https://shadcn.io/blocks) | Large block marketplace | Registry browse | Normalize before merge |
| [Shadcnblocks](https://shadcnblocks.com) | Figma-aligned blocks | Registry / copy | Free blocks OK; paid agent-only |
| [ReUI / Skiper UI / MynaUI](https://reui.io) | Additional shadcn-style sets | Registry | Secondary when official shadcn lacks a pattern |
<!-- vybekiit:generated:end web-ui-sources -->
