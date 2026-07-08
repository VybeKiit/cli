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
