/**
 * Official agent-runtime documentation URLs fetched in CI before skill lint runs.
 * Each entry includes phrases that must appear in the live doc (drift detection).
 */
export interface AgentRuntimeDocSource {
  readonly id: string;
  readonly url: string;
  readonly mustInclude: readonly string[];
}

export const AGENT_RUNTIME_DOC_SOURCES: readonly AgentRuntimeDocSource[] = [
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
] as const;
