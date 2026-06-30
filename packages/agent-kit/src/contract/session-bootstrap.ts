/** Agent-only read order — rendered into `.vybekiit/agent/session-bootstrap.md`. */
export function renderAgentSessionBootstrap(): string {
  return [
    'Read this at the start of every task before writing code.',
    '',
    '## Read order (every session)',
    '',
    '1. `AGENTS.md` (contract)',
    '2. `.vybekiit/agent/session-bootstrap.md` (this file)',
    '3. `.vybekiit/agent/goal-index.md` → pick the matching skill',
    '4. Follow the skill exactly; use `language.md` for voice',
    '5. On skill complete: append one entry to `checklist.md` Decision log via `formatChecklistEntry()`',
    '6. Stuck on an integration after one MCP or debug attempt: `vybekiit doc-fallback <tech-id>` and tell the builder the plain stuck phrase only',
    '',
    'Buyer-owned files you may append to (never delete): `checklist.md` Decision log, `CONTEXT.md` app glossary.',
  ].join('\n');
}

/** Full file seed when session-bootstrap.md does not exist yet. */
export function renderSessionBootstrapFile(): string {
  const inner = renderAgentSessionBootstrap();
  return [
    '# Session bootstrap (agent-only)',
    '',
    `<!-- vybekiit:generated:start session-bootstrap -->`,
    inner,
    `<!-- vybekiit:generated:end session-bootstrap -->`,
    '',
  ].join('\n');
}
