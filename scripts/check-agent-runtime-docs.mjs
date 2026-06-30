#!/usr/bin/env node
/**
 * Fetch official agent-runtime docs (Cursor, Claude Code, Codex, skills.sh) for CI.
 * Writes JSON to stdout: { "cursor-rules": "<body>", ... }
 */
const AGENT_RUNTIME_DOC_SOURCES = [
  {
    id: 'cursor-rules',
    url: 'https://cursor.com/docs/context/rules',
    mustInclude: ['.mdc', 'alwaysApply', 'AGENTS.md'],
  },
  {
    id: 'claude-code-index',
    url: 'https://code.claude.com/docs/llms.txt',
    mustInclude: ['CLAUDE.md'],
  },
  {
    id: 'codex-agents-md',
    url: 'https://developers.openai.com/codex/guides/agents-md',
    mustInclude: ['AGENTS.md', 'Codex'],
  },
  {
    id: 'skills-sh',
    url: 'https://skills.sh/docs',
    mustInclude: ['skills', 'npx skills add'],
  },
];

const bodies = {};

for (const source of AGENT_RUNTIME_DOC_SOURCES) {
  const response = await fetch(source.url, {
    headers: { 'User-Agent': 'vybekiit-check-agent-runtime-docs' },
  });
  if (!response.ok) {
    console.error(`Failed to fetch ${source.url}: HTTP ${response.status}`);
    process.exit(1);
  }
  bodies[source.id] = await response.text();
}

process.stdout.write(`${JSON.stringify(bodies)}\n`);
