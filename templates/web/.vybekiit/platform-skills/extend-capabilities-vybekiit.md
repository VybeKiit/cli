# Platform wrapper: extend-capabilities (agent-only)

**Agent-only.** Invoked silently when no `goal-index.md` row and no platform wrapper covers the builder's request. The builder never hears "skill gap" or "extension."

## When to run

1. Read `.vybekiit/agent/goal-index.md` (and `.vybekiit/extensions/goal-index.md` if present).
2. If a row matches → follow that skill; **stop here**.
3. If the request is tech-specific → check `@vybekiit/*` `resolve*Provider()` adapters and `.vybekiit/platform-skills/*-vybekiit.md` plus `.vybekiit/extensions/platform-skills/`.
4. If an existing goal skill can absorb the tech (e.g. new database → `save-data`) → follow that goal skill; **stop here**.
5. Otherwise → run this workflow.

## Workflow

### 1. Classify the gap

| Kind | Signal | Output |
|---|---|---|
| **New builder goal** | Feature or outcome with no goal-index match | Layer A buyer skill |
| **New tech / provider** | Named framework, DB, language, or tool | Layer B wrapper (+ upstream pin when available) |

Pick a **goal stem** (kebab-case, goal-named for Layer A) or **tech stem** (kebab-case for Layer B).

### 2. Research (tech gaps only)

1. Search skills.sh: `npx skills search <query>`
2. When an official skill exists: `npx skills add <repo> --skill <name> -y` into project `.agents/skills/`
3. Note official docs URL for the wrapper header
4. Check `@vybekiit/*` for an existing provider interface to wire behind

### 3. Draft

Use these shapes (or `vybekiit` templates from `@vybekiit/agent-kit`):

**Layer A (buyer goal)** — mirror `skills/save-data.md`:

- `**Goal:**` one plain sentence
- `**Contract:**` five rules + `language.md`
- `## Steps` with `**Verify:**` on each step
- `## Definition of done`
- `## After completing this skill`

**Layer B (platform wrapper)** — mirror `platform-skills/mongodb-vybekiit.md`:

- Official docs links
- `## Kit wiring` (prefer `resolve*Provider()`)
- `## Verify-before-advance`
- `## Never say to builder`
- `## TODO(vybekiit)` when no npm adapter exists yet

**Machine-global** — Agent Skills `SKILL.md` with YAML frontmatter (`name`, `description`).

### 4. Lint (agent-only)

Before saving, run:

```bash
vybekiit lint-extension-skill <draft-path> --kind=buyer-goal
# or --kind=platform-wrapper
# or --kind=agent-skills-global
```

Fix all issues. Exit code must be `0`. Builder never sees this step.

### 5. Ask scope (plain language only)

Ask exactly once:

> "Should I save this guide just for this project, or for all your projects on this computer?"

| Answer | Persist to |
|---|---|
| **This project** | Layer A: `.vybekiit/extensions/skills/<goal>.md` · Layer B: `.vybekiit/extensions/platform-skills/<tech>-vybekiit.md` |
| **All my projects** | Tool-aware global path (detect active tool first) |

### Tool-aware global paths

| Active tool | Global skill path | skills.sh agent |
|---|---|---|
| **Cursor** | `~/.cursor/skills-cursor/<name>/SKILL.md` | `--agent cursor` |
| **Claude Code** | `~/.claude/skills/<name>/SKILL.md` | `--agent claude-code` |
| **Codex** | `~/.agents/skills/<name>/SKILL.md` | `--agent codex` |
| **Fallback** | `~/.agents/skills/<name>/SKILL.md` | omit `--agent` |

Detect tool: Cursor if `.cursor/rules/vybekiit.mdc` exists; else Claude if `CLAUDE.md` session; else Codex via `AGENTS.md`.

Global install via skills.sh when upstream exists:

```bash
npx skills add <repo> --skill <name> --global --agent <agent> -y
```

### 6. Persist

**Project-local:**

- Create directories if missing: `.vybekiit/extensions/skills/`, `.vybekiit/extensions/platform-skills/`
- Write the drafted file
- **Layer A only:** append a row to `.vybekiit/agent/goal-index.md`:

  `| "<builder phrase>" | \`extensions/skills/<goal>.md\` |`

  Optionally mirror the row in `.vybekiit/extensions/goal-index.md` for backup.

**Machine-global:**

- Write `SKILL.md` to the tool path above
- Do not edit project `goal-index.md` for global-only skills

### 7. Resume

Immediately follow the new skill as if it always existed. Never tell the builder you "created a skill."

## Verify-before-advance

- Lint passed (`vybekiit lint-extension-skill` exit 0)
- File exists at chosen path
- For Layer A: goal-index row present
- For tech: upstream pin in `.agents/skills/` when available

## Never say to builder

skill gap, extension, Layer A, Layer B, platform wrapper, goal-index, skills.sh, Agent Skills, YAML frontmatter

## Owned vs maintained

`.vybekiit/extensions/**` is **buyer-owned** — `sync-agent-layer` never overwrites it. Extension rows in `goal-index.md` are preserved on kit updates.
