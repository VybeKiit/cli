# Agent-eval dogfood (maintainer-only)

Isolated Docker environments for **Claude Code**, **Codex**, and **Grok**. Each agent is treated as a fresh vibe coder: setup → create app → autonomous build → structured feedback.

Prefer the orchestrator:

```bash
# From monorepo root
cp docker/agent-eval/secrets/env.agent-eval.example docker/agent-eval/secrets/env.agent-eval
# fill keys…

# Bootstrap only (no agent API spend)
pnpm agent-eval -- --mode bootstrap-only --kit-mode local-kit

# Full autonomous run (all three)
pnpm agent-eval -- --timeout-hours 6 --kit-mode published

# One agent, short debug
pnpm agent-eval -- --agents claude --timeout-hours 1 --kit-mode local-kit
```

## Layout

| Path | Role |
|------|------|
| `Dockerfile` | Shared base (Node 22, gh, pnpm, agent CLIs) |
| `docker-compose.yml` | `agent-claude` / `agent-codex` / `agent-grok` |
| `entrypoint.sh` | Auth → bootstrap → runner → FEEDBACK stub |
| `agents/*.sh` | Headless CLI launch per agent |
| `mission/SYSTEM.md` | Shared open-ended mission |
| `secrets/env.agent-eval` | Real keys (gitignored) |

## Kit modes

| Mode | Behavior |
|------|----------|
| `local-kit` | Mount monorepo at `/kit-source`, set `VYBEKIIT_KIT_DIR`, use built `cli/dist/bin.js` |
| `published` | `npx vybekiit@<pin>` + real `gh` clone of gated kit |

Build the CLI before local-kit runs: `pnpm --filter vybekiit build` (or monorepo build that emits `cli/dist/bin.js`).

## Ports (host)

| Agent | Web | Extra |
|-------|-----|-------|
| Claude | 4101 | 4111 |
| Codex | 4102 | 4112 |
| Grok | 4103 | 4113 |

## Artifacts

```text
runs/<run-id>/
  claude|codex|grok/
    workspace/     # buyer kit workspaces
    logs/          # setup + agent transcripts
    artifacts/     # FEEDBACK.md, bootstrap.env, identity
  scorecard.json
  gallery/index.html
  latest -> <run-id>  (symlink)
```

## Docs

- Full runbook: [docs/agent-eval-dogfood.md](../../docs/agent-eval-dogfood.md)
- Human counterpart: [docs/tracer-bullet-runbook.md](../../docs/tracer-bullet-runbook.md)
