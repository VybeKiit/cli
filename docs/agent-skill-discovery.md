# Agent skill discovery (Cursor · Claude Code · Codex)

How buyer goal skills load after scaffold on a fresh machine, and how to verify them.

## Layout (what ships)

| Path | Role |
|---|---|
| `.vybekiit/skills/<goal>.md` | Authoring SSOT (Goal / Contract / Steps) |
| `.agents/skills/<goal>/SKILL.md` | **Primary discovery** — full stub + YAML `name` + `description` |
| `.claude/skills` → `../.agents/skills` | Claude Code project skills symlink |
| `.cursor/skills` → `../.agents/skills` | Cursor project skills symlink |
| `AGENTS.md` | Codex-native project instructions; points at `.agents/skills` + goal-index |
| `.vybekiit/agent/goal-index.md` | Explicit route when auto-discovery does not match |

Scaffold (`vybekiit new`) copies the template and runs `ensureAgentSkillSymlinks`.  
`vybekiit render-agent-layer` regenerates stubs from `.vybekiit/skills` and re-links.  
`vybekiit sync-agent-layer` refreshes the agent layer and re-links.

Codex also uses machine-global skills under `~/.agents/skills` when enabled (`vybekiit doctor` sets `skills = true` in `~/.codex/config.toml`). Project skills still live under the project's `.agents/skills`.

## L1 — automated gate

```bash
pnpm check:skill-discovery
# same script, also invoked from pnpm verify (before check:templates)
node scripts/dev/checks/validateAgentSkillDiscovery.mjs
```

Asserts for each of `web`, `mobile`, `extension`, `backend`:

1. `.vybekiit/skills` has buyer skills (not empty)
2. Every buyer stem has a marked stub under `.agents/skills/<stem>/SKILL.md` with valid frontmatter `name` + `description`
3. Sample stems exist (template-specific: e.g. web `onboarding`, `setup-payments`, `add-ai`)
4. `.claude/skills` and `.cursor/skills` are symlinks to `../.agents/skills` and resolve
5. `AGENTS.md` / `CLAUDE.md` mention project skill discovery (Codex / thin-pointer path)

## L2 — manual smoke (3 prompts per tool)

Open a freshly scaffolded buyer project (or `templates/web`) in each tool. Confirm the skill picker / agent can load the matching goal skill (or follows goal-index when asked).

| # | Prompt | Expected skill / behavior |
|---|---|---|
| 1 | `set up my app` / `let's start` | `onboarding` |
| 2 | `add payments` / `take money` | `setup-payments` (web/mobile/extension) or `wire-payments` (backend) |
| 3 | web: `add ai` · mobile: `publish app` · extension: `publish extension` · backend: `put it online` | `add-ai` / `publish-app` / `publish-extension` / `go-live` |

### Per tool notes

- **Cursor:** project skills under `.cursor/skills` (symlink). Skills UI should list buyer goals + pinned upstream skills.
- **Claude Code:** project skills under `.claude/skills` (symlink). Same listing.
- **Codex:** reads `AGENTS.md` first; project skills from `.agents/skills` when skills feature is on. If a skill does not auto-fire, the agent should open goal-index and follow the linked skill body.

Buyer-facing talk: say "your assistant" never "Cursor/Claude/Codex". This doc is maintainer + QA only.

## Fixing failures

| Symptom | Fix |
|---|---|
| 0 buyer stubs for a template | Restore/author `.vybekiit/skills/*.md`, then `vybekiit render-agent-layer <template>` |
| stub marker missing / drift | Re-run `render-agent-layer` (do not hand-edit stubs) |
| symlink missing or wrong target | `render-agent-layer` or re-scaffold; never replace links with real dirs |
| Codex never loads skills | Run `vybekiit doctor`; confirm `AGENTS.md` points at `.agents/skills` / goal-index |

## Related

- `CONTEXT.md` — two-layer skill model
- `packages/agentKit/src/render/buyerSkillStubs.ts` — stub + symlink plan pure logic
- `cli/src/lib/agentSkillSymlinks.ts` — filesystem ensure
- ADR-0007 — agent-layer sync allowlist
