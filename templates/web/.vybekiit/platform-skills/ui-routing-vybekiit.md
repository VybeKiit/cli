# Platform wrapper: UI routing (agent-only)

**Agent-only.** Maps builder intent → mirrored UI source + normalize workflow.

## Tools

1. **VybeKiit UI catalog MCP** — `suggest_ui_blend`, `search_ui_components`, `get_ui_component`, `list_ui_sources`
2. **shadcn MCP** — official primitive lookup
3. **Local index** — `.vybekiit/agent/ui-catalog-index.json` (640+ mirrored components)

## Intent routing

| Builder says… | Primary source | Namespace | Fallback |
|---|---|---|---|
| hero / landing / wow effects | Aceternity or Magic UI | `aceternity/`, `magicui/` | `bundui/` hero blocks |
| bento / features section | Magic UI or Kokonut | `magicui/`, `kokonutui/` | `bundui/` |
| pricing / testimonials / FAQ | BundUI | `bundui/` | 21st blocks (when authed) |
| dashboard / KPI / charts | shadcn Charts + Tremor | `ui/chart` | `bundui/`, `untitled/` tables |
| forms / settings / admin | kit primitives | `ui/` | `bundui/` form variants |
| AI chat / agent / streaming messages | AI Elements | `ai-elements/` | `kokonutui/` ai-prompt |
| reasoning / tool calls / citations | AI Elements | `ai-elements/` | normalize to kit forms |
| kanban / gantt / editor / data viz | Kibo UI | `kibo/` | `bundui/`, `untitled/` |
| AI chat interface (legacy) | Kokonut / Cult patterns | `kokonutui/` | `ai-elements/` |
| enterprise / dense admin | Untitled UI | `untitled/` | `bundui/` admin blocks |
| cross-platform pattern ref | Gluestack (web mirror) | `gluestack/` | mobile StyleSheet port |
| mobile version of X | Port from web block | mobile kit `ui/` | `building-native-ui` skill |

## Workflow

1. Call `suggest_ui_blend` with the builder's words
2. Import from the returned namespace path — do not re-fetch upstream unless mirror is stale
3. Compose in `app/` or feature components — **normalize-on-import** (see `ui-consistency-vybekiit.md`)
4. One animated/marketing library flavor per page max
5. Mobile: check `ui-catalog-index.mobile.json` `portable` flag before promising motion parity

## Cross-refs

- `ui-sources.md` — full catalog + registry URLs
- `ui-consistency-vybekiit.md` — normalize contract
- `shadcn-vybekiit.md` — kit primitives
- mobile: `ui-port-from-web-vybekiit.md`
