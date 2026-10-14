/**
 * Detect which AI agent / IDE the vibe coder is running in.
 *
 * Detection order:
 * 1. env vars injected by known agent CLIs
 * 2. terminal / shell hints
 * 3. default to claude-code
 */

/** Agent runtime ids supported by the local development sidecar. */
export type AgentId =
  | 'claude-code'
  | 'cursor'
  | 'gemini'
  | 'codex'
  | 'kiro'
  | 'kimi'
  | 'grok'
  | 'devin';

/** Agent metadata shown by the local development sidecar. */
export type DetectedAgent = {
  readonly id: AgentId;
  readonly name: string;
  readonly icon: string;
  readonly command: string;
  readonly mcpSupported: boolean;
};

const AGENTS: Record<AgentId, DetectedAgent> = {
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    icon: '💜',
    command: 'claude',
    mcpSupported: true,
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    icon: '✨',
    command: 'cursor',
    mcpSupported: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini CLI',
    icon: '🔷',
    command: 'gemini',
    mcpSupported: false,
  },
  codex: {
    id: 'codex',
    name: 'OpenAI Codex',
    icon: '🟢',
    command: 'codex',
    mcpSupported: false,
  },
  kiro: {
    id: 'kiro',
    name: 'Kiro',
    icon: '🧡',
    command: 'kiro-cli',
    mcpSupported: true,
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    icon: '🌙',
    command: 'kimi',
    mcpSupported: true,
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    icon: '⚡',
    command: 'grok',
    mcpSupported: true,
  },
  devin: {
    id: 'devin',
    name: 'Devin',
    icon: '🟣',
    command: 'devin',
    mcpSupported: true,
  },
};

/**
 * Return metadata for a known agent id.
 *
 * @param id - Agent id to look up.
 * @returns Metadata for the known agent id.
 * @example
 * const codex = getAgentById('codex');
 */
export const getAgentById = (id: AgentId): DetectedAgent => AGENTS[id];

/**
 * List all known agent metadata entries.
 *
 * @returns Known agent metadata in registry order.
 * @example
 * const agents = listAgents();
 */
export const listAgents = (): DetectedAgent[] => Object.values(AGENTS);
