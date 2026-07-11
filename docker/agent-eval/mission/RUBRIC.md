# Scorecard rubric (harness-side)

Used by `scripts/dev/agent-eval/scorecard.mjs` — not injected into the agent.

| Check | Pass criteria |
|-------|----------------|
| Workspace | `/workspace/web` has kit markers (`packages/` or `pnpm-workspace.yaml` or `package.json`) |
| MCP | Any `mcp.json` under the web workspace |
| FEEDBACK.md | File exists and includes all required `##` headings |
| Transcript | `/logs/agent.stdout.log` non-empty (full mode) |
| Web health | HTTP 2xx/3xx on host port mapped to container `:3000` (best effort) |
| Extension | `/workspace/extension` exists with package.json, or FEEDBACK documents skip |
| Mobile | `/workspace/mobile` exists with package.json, or FEEDBACK documents skip |
| Live URL | FEEDBACK mentions `https://` URL that responds (optional badge) |

Scoring is informational. Product learning lives in FEEDBACK free text.
