# Platform wrapper: kit MCP tools

**Agent-only.** Catalog of every first-party MCP tool VybeKiit ships. Read this file locally or load via MCP `get_skill` / `list_platform_skills` (`mcp-tools-vybekiit` / `use-kit-mcp`).

Never name MCP, tool ids, or package paths to the builder. Prefer **search → get** (slim pages, then detail).

## Servers

| Server key | Package | Bin | Purpose |
|------------|---------|-----|---------|
| `vybekiit` | `@vybekiit/agent-mcp` | `vybekiit-agent-mcp` | Skills, CLI catalog, doctor tools, doc-fallback, browser automations |
| `vybekiit-ui-catalog` | `@vybekiit/ui-catalog-mcp` | `vybekiit-ui-catalog-mcp` | Mirrored UI component search / blend |

Snippets: `.vybekiit/agent/mcp-agent.json`, `mcp-ui-catalog.json`. Setup: `.vybekiit/agent/mcp-setup.md`.
Auto-discovered skill: `.agents/skills/use-kit-mcp/SKILL.md`.

## Env

| Variable | Meaning |
|----------|---------|
| `VYBEKIIT_PROJECT_ROOT` | Project root for skill reads + automation cwd (default cwd) |
| `VYBEKIIT_UI_CATALOG_PATH` | Path to `ui-catalog-index.json` |
| `VYBEKIIT_AUTOMATE_BIN` | Optional absolute path to `vybekiit-automate` |

## Context controls (both servers)

- Cursor pagination: `limit` / `cursor` / response `nextCursor` + `hasMore` + `total`
- Prefer slim rows; request full detail only when needed (`fields=slim|full` on UI tools)
- Automations: `run_automation({ dryRun: true })` before a real browser session

## Server: `vybekiit`

| Tool | Description | Required | Optional | When to use |
|------|-------------|----------|----------|-------------|
| `search_skills` | Fuzzy-search buyer goals/skills (goal-index SSOT). Paginated slim rows. | query | template, limit, cursor | Before opening skill files; empty query lists all goals for the template. |
| `get_skill` | Load one skill by goal id or stem (excerpt by default). | id | template, excerptLines | After search_skills picks a row; also loads use-kit-mcp / platform wrappers. |
| `list_platform_skills` | List/search `.vybekiit/platform-skills/*` wrappers (paginated). | — | query, limit, cursor | Find provider wrappers (stripe, railway, mcp-tools-vybekiit, …). |
| `search_commands` | Fuzzy-search vybekiit CLI verbs. Returns usage — run via shell, not MCP. | query | limit, cursor | Discover CLI verbs (doctor, create app, automate, …). |
| `get_command` | Get one CLI command by exact name from the catalog. | name | — | After search_commands when you know the exact verb name. |
| `search_doctor_tools` | List doctor toolchain entries (`vybekiit doctor --ensure <name>`). Does not run doctor. | query | limit, cursor | Before ensuring CLIs (gh, wrangler, supabase, …). |
| `search_tech_ids` | Fuzzy-search known tech ids before doc_fallback. | query | limit, cursor | Pick a tech id for official docs after one failed MCP/debug attempt. |
| `doc_fallback` | Official docs + env key hints. Never name MCP to the builder — use builderMessage. | techId | — | MCP or first debug failed once; same as `vybekiit doc-fallback <tech-id>`. |
| `search_automations` | Fuzzy-search vybekiit-automate browser verbs (ls, cws, nc, …). Paginated. | query | limit, cursor | Before run_automation; empty query lists the catalog. |
| `get_automation` | Get one automation by domain (+ command) or id (`ls:setup`). | domain | command | Inspect usage string for a known domain/verb. |
| `run_automation` | Run vybekiit-automate from any project root (resolves bin). Always --json. Prefer dryRun first. | domain, command | args, dryRun, yes, cdp, profile, timeoutMs | Execute browser automations anywhere; dryRun=true to preview argv only. |

## Server: `vybekiit-ui-catalog`

| Tool | Description | Required | Optional | When to use |
|------|-------------|----------|----------|-------------|
| `search_ui_components` | Fuzzy-search mirrored UI components. Page envelope; default fields=slim. | query | source, limit, cursor, fields | Find blocks by intent/name; slim first, then get_ui_component. |
| `get_ui_component` | Get one mirrored component by source namespace + slug. | source, name | — | Full detail after search_ui_components. |
| `suggest_ui_blend` | Ranked multi-source component suggestions for a natural-language UI intent. | intent | limit | Builder wants a composed look (hero + pricing + marquee, …). |
| `list_ui_sources` | List mirrored UI source namespaces and component counts. | — | — | See which registries are in the local catalog index. |

## Browser automations (from any folder)

```
search_automations({ query: "lemon squeezy" })
run_automation({ domain: "ls", command: "setup", dryRun: true })
run_automation({ domain: "ls", command: "standby" })
```

Shell equivalent:

```
vybekiit-automate catalog --json
vybekiit-automate ls standby --json --yes
```

## Wire-up (agents)

1. After `pnpm build` (or package dist present), merge `mcp-agent.json` + `mcp-ui-catalog.json` into the client config (see `mcp-setup.md`).
2. `create app` and kit workspaces always ship `@vybekiit/agent-mcp`, `@vybekiit/ui-catalog-mcp`, and `@vybekiit/browser-automation` under `packages/`.
3. Project `.cursor/mcp.json` is written on scaffold (surface layout). Kit root also gets a kit-root layout config.
4. Doctor may merge core third-party MCPs; first-party entries are preserved when already present.

## Provider / third-party MCP snippets

Not first-party tools — merge only when the builder uses that provider (see `mcp-setup.md`):
`mcp-supabase`, `mcp-stripe`, `mcp-paypal`, `mcp-neon`, `mcp-firebase`, `mcp-mongodb`, `mcp-railway-*`, `mcp-twilio-*`, `mcp-sentry`, `mcp-posthog`.

If any MCP fails once → `doc_fallback` / `vybekiit doc-fallback <tech-id>`; tell the builder only the plain stuck phrase.
