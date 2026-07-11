# Multi-agent dogfood (Claude / Codex / Grok)

Maintainer harness that runs **Claude Code**, **Codex**, and **Grok** as **fresh vibe coders** in isolated Docker environments. Each agent invents a product, uses the real buyer journey, and leaves **FEEDBACK.md** + a runnable workspace so you can compare what worked and what was broken.

Human counterpart: [tracer-bullet-runbook.md](./tracer-bullet-runbook.md).

## Quick start

```bash
# 1. Secrets
cp docker/agent-eval/secrets/env.agent-eval.example \
   docker/agent-eval/secrets/env.agent-eval
# fill ANTHROPIC_API_KEY / OPENAI_API_KEY / XAI_API_KEY / GH_TOKEN* / vendor tokens

# 2. Bootstrap only (no agent model spend) — proves create-app + MCP ship
pnpm agent-eval:bootstrap -- --agents claude

# 3. Full autonomous run (default 6h each, all three agents)
pnpm agent-eval -- --timeout-hours 6 --kit-mode local-kit

# 4. Review
open runs/latest/gallery/index.html
```

## Modes

| Flag | Meaning |
|------|---------|
| `--mode full` | Bootstrap + autonomous agent (default) |
| `--mode bootstrap-only` | `setup` + `create app --web` only |
| `--mode harvest-only` | Re-score an existing `runs/<id>` |
| `--kit-mode local-kit` | Mount monorepo; `VYBEKIIT_KIT_DIR` + local CLI (default) |
| `--kit-mode published` | `npx vybekiit@…` + real gated kit clone via `gh` |
| `--agents claude,codex,grok` | Subset of agents |
| `--timeout-hours N` | Wall clock budget per agent |

## Layout

```text
docker/agent-eval/          # image, compose, entrypoint, mission, agent runners
scripts/dev/agent-eval/     # run.mjs orchestrator + scorecard + gallery
runs/<run-id>/<agent>/      # workspace, logs, artifacts (gitignored)
runs/<run-id>/gallery/      # side-by-side review UI
```

## Mission

Open-ended product idea (each agent invents its own). Shared rubric:

- Web required; extension + mobile strongly expected when the product fits
- Prefer skills + MCP + `vybekiit` CLI
- Production-like dogfood when secrets are present
- Required `FEEDBACK.md` sections (see `docker/agent-eval/mission/SYSTEM.md`)

## Ports

| Agent | localhost web |
|-------|----------------|
| Claude | http://127.0.0.1:4101 |
| Codex | http://127.0.0.1:4102 |
| Grok | http://127.0.0.1:4103 |

## Prerequisites

- Docker Desktop / Engine with enough RAM (~8GB per concurrent agent)
- For `local-kit`: built CLI (`cli/dist/bin.js` — orchestrator builds `vybekiit` if missing)
- For `published`: `GH_TOKEN` with access to gated kit mirror + published `vybekiit` on npm
- Provider API keys for the agents you enable

## Tests

```bash
pnpm exec vitest run --root scripts scripts/dev/agent-eval/run.test.mjs
```

## Safety

- Never commit `docker/agent-eval/secrets/env.agent-eval` or `runs/`
- Harvest does not copy `.env` into the gallery
- OAuth may still need a human; agents should record blockers in FEEDBACK and continue
