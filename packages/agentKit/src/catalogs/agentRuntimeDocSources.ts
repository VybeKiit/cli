/**
 * Official agent-runtime documentation URLs fetched in CI before skill lint runs.
 * Each entry includes phrases that must appear in the live doc (drift detection).
 */
export type AgentRuntimeDocSource = {
  readonly id: string;
  readonly url: string;
  readonly mustInclude: readonly string[];
};

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
  {
    id: 'copilot-instructions',
    url: 'https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions',
    mustInclude: ['copilot-instructions.md', '.github'],
  },
  {
    id: 'kiro-steering',
    url: 'https://kiro.dev/docs/cli/steering/',
    mustInclude: ['.kiro/steering', 'markdown'],
  },
  {
    id: 'windsurf-rules',
    url: 'https://docs.devin.ai/windsurf/plugins/cascade/memories',
    mustInclude: ['.windsurf/rules'],
  },
  {
    id: 'cline-rules',
    url: 'https://docs.cline.bot/customization/cline-rules',
    mustInclude: ['.clinerules'],
  },
  {
    id: 'amazonq-rules',
    url: 'https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/context-project-rules.html',
    mustInclude: ['.amazonq/rules'],
  },
  {
    id: 'continue-rules',
    url: 'https://docs.continue.dev/customize/deep-dives/rules',
    mustInclude: ['.continue/rules'],
  },
  {
    id: 'junie-agents',
    url: 'https://junie.jetbrains.com/docs/guidelines-and-memory.html',
    mustInclude: ['AGENTS.md', '.junie'],
  },
  {
    id: 'gemini-styleguide',
    url: 'https://developers.google.com/gemini-code-assist/docs/customize-gemini-behavior-github',
    mustInclude: ['.gemini', 'styleguide'],
  },
  {
    id: 'augment-rules',
    url: 'https://docs.augmentcode.com/setup-augment/guidelines',
    mustInclude: ['.augment/rules', 'guidelines'],
  },
  {
    id: 'roo-rules',
    url: 'https://docs.roocode.com/features/custom-instructions',
    mustInclude: ['.roo/rules'],
  },
  {
    id: 'gemini-cli-md',
    url: 'https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html',
    mustInclude: ['GEMINI.md'],
  },
  {
    id: 'trae-rules',
    url: 'https://www.aibase.com/news/17375',
    mustInclude: ['.trae', 'rules'],
  },
  {
    id: 'antigravity-rules',
    url: 'https://antigravity.codes/blog/user-rules',
    mustInclude: ['.agent/rules'],
  },
  {
    id: 'replit-md',
    url: 'https://replit.com/blog/custom-skills',
    mustInclude: ['replit.md'],
  },
  {
    id: 'devin-rules',
    url: 'https://docs.devin.ai/cli/extensibility/rules',
    mustInclude: ['AGENTS.md'],
  },
  {
    id: 'opencode-rules',
    url: 'https://dev.opencode.ai/docs/rules',
    mustInclude: ['AGENTS.md'],
  },
  {
    id: 'zed-instructions',
    url: 'https://zed.dev/docs/ai/instructions',
    mustInclude: ['AGENTS.md', 'instructions'],
  },
] as const;
