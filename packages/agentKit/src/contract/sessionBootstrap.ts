/**
 * Agent-only read order — rendered into `.vybekiit/agent/session-bootstrap.md`.
 *
 * @returns The rendered render agent session bootstrap text.
 * @example
 * const result = renderAgentSessionBootstrap();
 */
export const renderAgentSessionBootstrap = (): string =>
  [
    'Read this at the start of every task before writing code.',
    '',
    '## Read order (every session)',
    '',
    '1. `AGENTS.md` (contract)',
    '2. `.vybekiit/agent/session-bootstrap.md` (this file)',
    '3. `.vybekiit/agent/goal-index.md` → pick the matching skill (merge rows from `.vybekiit/extensions/goal-index.md` when present)',
    '4. If no row matches and no platform wrapper covers the request → `platform-skills/extend-capabilities-vybekiit.md`',
    '5. Follow the skill exactly; use `language.md` for voice',
    // biome-ignore lint/security/noSecrets: Generated instruction text mentions a helper name, not a secret.
    '6. On skill complete: append one entry to `checklist.md` Decision log via `formatChecklistEntry()`',
    '7. Stuck on an integration after one MCP or debug attempt: `vybekiit doc-fallback <tech-id>` and tell the builder the plain stuck phrase only',
    '',
    '## Project skill discovery',
    '',
    '- Auto-discovered Agent Skills: `.agents/skills/<goal>/SKILL.md` (Cursor + Claude via `.cursor/skills` / `.claude/skills` symlinks; Codex when project skills are enabled).',
    '- Authoring fallback: `.vybekiit/skills/<goal>.md` (same body; used when a goal-index row is opened explicitly).',
    '- First-party MCP catalog (agent-only): `.agents/skills/use-kit-mcp/SKILL.md` and `.vybekiit/platform-skills/mcp-tools-vybekiit.md` — also via MCP `get_skill` / `list_platform_skills` / `search_skills` ("mcp tools").',
    '- Do not invent skills outside those folders or the buyer-owned `.vybekiit/extensions/` tree.',
    '',
    'Buyer-owned files you may append to (never delete): `checklist.md` Decision log, `CONTEXT.md` app glossary, `.vybekiit/extensions/**` (extension skills).',
    'Machine-global skills live in tool-specific paths (see `extend-capabilities-vybekiit.md`); tools auto-discover them.',
  ].join('\n');

/**
 * Full file seed when session-bootstrap.md does not exist yet.
 *
 * @returns The rendered render session bootstrap file text.
 * @example
 * const result = renderSessionBootstrapFile();
 */
export const renderSessionBootstrapFile = (): string => {
  const inner = renderAgentSessionBootstrap();
  return [
    '# Session bootstrap (agent-only)',
    '',
    '<!-- vybekiit:generated:start session-bootstrap -->',
    inner,
    '<!-- vybekiit:generated:end session-bootstrap -->',
    '',
  ].join('\n');
};
