# UI source catalog — web & extension (agent-only)

The builder never picks a UI library. You choose from this catalog, then **normalize** every block to kit primitives and `@vybekiit/tokens`.

**Local mirror:** `src/components/{bundui,magicui,kokonutui,aceternity,untitled,gluestack,ai-elements,kibo,blocks/21st,tailark,cult,coss,prompt-kit,supabase,blocks-so,evilcharts,shadcnblocks}/` — synced via `pnpm sync:ui` from [`scripts/data/ui-registry-manifest.json`](../../../../scripts/data/ui-registry-manifest.json).

**MCP:** Merge `.vybekiit/agent/mcp-agent.json`, `mcp-supabase.json`, `mcp-neon.json`, `mcp-firebase.json`, and (by provider) `mcp-stripe.json` or `mcp-paypal.json` into buyer MCP config — see `mcp-setup.md` for Cursor, Claude Desktop, and Codex paths. Use `suggest_ui_blend` for intent-based routing.

See also: `ui-routing-vybekiit.md` · `ui-consistency-vybekiit.md` · `shadcn-vybekiit.md` · `ui-sources.mobile.md` (mobile port rules).

## Approved sources (shadcn-compatible + mirrored)

| Source | Best for | Install / mirror | Namespace | GitHub |
|---|---|---|---|---|
| [shadcn/ui](https://ui.shadcn.com) | Core primitives, forms, dialogs | `npx shadcn@latest add <component>` | `src/components/ui/` | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) |
| [BundUI / Shadcn UI Kit](https://shadcnuikit.com/components) | 130+ free variants, blocks, admin | `npx shadcn@latest add @bundui/<name>` | `src/components/bundui/` | [bundui/components](https://github.com/bundui/components) |
| [Magic UI](https://magicui.design) | Animated marketing, marquees, beams, bento | `npx shadcn@latest add @magicui/<name>` | `src/components/magicui/` | [magicuidesign/magicui](https://github.com/magicuidesign/magicui) |
| [Kokonut UI](https://kokonutui.com) | Interactive marketing, modern layouts | `npx shadcn@latest add @kokonutui/<name>` | `src/components/kokonutui/` | [kokonut-labs/kokonutui](https://github.com/kokonut-labs/kokonutui) |
| [Aceternity UI](https://ui.aceternity.com) | High-motion landing sections | registry URL or local mirror | `src/components/aceternity/` | hosted registry only |
| [21st.dev](https://21st.dev) | Community blocks | `npx shadcn add https://21st.dev/r/...` (auth) | `src/components/blocks/21st/` | [serafimcloud/21st](https://github.com/serafimcloud/21st) |
| [Untitled UI React](https://www.untitledui.com/react) | Enterprise admin, dense app UI | `npx untitledui@latest add <name>` | `src/components/untitled/` | [untitleduico/react](https://github.com/untitleduico/react) |
| [Gluestack UI](https://gluestack.io/ui) | Cross-platform patterns (web mirror) | `npx gluestack-ui@latest add <name>` | `src/components/gluestack/` | [gluestack/gluestack-ui](https://github.com/gluestack/gluestack-ui) |
| [AI Elements](https://elements.ai-sdk.dev) | AI chat, agents, streaming, tool UI | `npx shadcn@latest add @aielements/<name>` | `src/components/ai-elements/` | [vercel/ai-elements](https://github.com/vercel/ai-elements) |
| [Kibo UI](https://www.kibo-ui.com) | Application UI: kanban, editor, gantt, data viz | `npx shadcn@latest add @kibo/<name>` | `src/components/kibo/` | [shadcnblocks/kibo](https://github.com/shadcnblocks/kibo) |
| [Tailark](https://tailark.com) | Marketing blocks (Dusk + Mist kits) | `npx shadcn@latest add @tailark/<name>` | `src/components/tailark/` | [tailark/blocks](https://github.com/tailark/blocks) |
| [Cult UI](https://www.cult-ui.com) | Motion + AI SDK agent patterns | `npx shadcn@latest add @cult-ui/<name>` | `src/components/cult/` | [nolly-studio/cult-ui](https://github.com/nolly-studio/cult-ui) |
| [COSS UI](https://coss.com/ui) | Advanced primitives + app blocks | `npx shadcn@latest add @coss/<name>` | `src/components/coss/` | hosted registry |
| [Prompt Kit](https://www.prompt-kit.com) | AI prompt + chat UI | `npx shadcn@latest add @prompt-kit/<name>` | `src/components/prompt-kit/` | [ibelick/prompt-kit](https://github.com/ibelick/prompt-kit) |
| [Supabase UI](https://supabase.com/ui) | Auth + Supabase-connected blocks | `npx shadcn@latest add @supabase/<name>` | `src/components/supabase/` | [supabase/supabase](https://github.com/supabase/supabase) |
| [Blocks.so](https://blocks.so) | Login, sidebar, dialog blocks | `npx shadcn@latest add @blocks-so/<name>` | `src/components/blocks-so/` | [ephraimduncan/blocks](https://github.com/ephraimduncan/blocks) |
| [EvilCharts](https://evilcharts.com) | Animated dashboard charts | `npx shadcn@latest add @evilcharts/<name>` | `src/components/evilcharts/` | [legions-developer/evilcharts](https://github.com/legions-developer/evilcharts) |
| [Shadcnblocks](https://shadcnblocks.com) | Figma-aligned marketing blocks (free) | `npx shadcn@latest add @shadcnblocks/<name>` | `src/components/shadcnblocks/` | [shadcnblocks/shadcn-ui-blocks](https://github.com/shadcnblocks/shadcn-ui-blocks) |
| [shadcn/ui Charts](https://ui.shadcn.com/charts) | Charts (Recharts) | `npx shadcn@latest add chart` | `src/components/ui/chart.tsx` | — |

## Registry URLs (components.json)

```json
{
  "registries": {
    "@bundui": "https://bundui.io/r/{name}.json",
    "@magicui": "https://magicui.design/r/{name}.json",
    "@kokonutui": "https://kokonutui.com/r/{name}.json",
    "@aielements": "https://elements.ai-sdk.dev/api/registry/{name}.json",
    "@kibo": "https://www.kibo-ui.com/r/{name}.json",
    "@tailark": "https://tailark.com/r/{name}.json",
    "@cult-ui": "https://www.cult-ui.com/r/{name}.json",
    "@coss": "https://coss.com/ui/r/{name}.json",
    "@prompt-kit": "https://www.prompt-kit.com/c/{name}.json",
    "@supabase": "https://supabase.com/ui/r/{name}.json",
    "@blocks-so": "https://blocks.so/r/{name}.json",
    "@evilcharts": "https://evilcharts.com/r/{name}.json",
    "@shadcnblocks": "https://shadcnblocks.com/r/{name}.json"
  }
}
```

## Forbidden

Never install or import as the **primary design system**: MUI, Ant Design, Chakra, daisyUI, **HeroUI** (`@heroui/`), Bootstrap React, Flowbite npm package.

Gluestack and Untitled UI are allowed **only** in their namespaced mirror folders — never replace `src/components/ui/` primitives.

Grep check (buyer-facing code in `app/`):

```bash
rg "@mui/|@chakra-ui/|antd|nativewind|@heroui/" app/ src/components/auth-shell.tsx src/components/dashboard-shell.tsx
```

## Decision tree

- Standard control → `src/components/ui/` first
- Search local mirror → VybeKiit UI catalog MCP (`suggest_ui_blend`)
- Marketing flair → Aceternity / Magic UI / Kokonut / Tailark (**one** effect library per page)
- Variants / admin density → BundUI, Untitled, or COSS namespace
- Dashboard metrics → EvilCharts or shadcn Charts inside kit `Card`
- AI chat UI → AI Elements, Prompt Kit, or Cult patterns; normalize to kit forms
- Supabase auth screens → Supabase UI namespace first
- Refresh mirrors → maintainer runs `pnpm sync:ui`

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
