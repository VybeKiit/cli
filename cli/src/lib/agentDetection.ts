/**
 * Detect which AI agent / IDE the vibe coder is running in.
 *
 * Detection order:
 * 1. env vars injected by known agent CLIs
 * 2. terminal / shell hints
 * 3. default to claude-code
 */

type AgentId = 'claude-code' | 'cursor' | 'gemini' | 'codex';

interface DetectedAgent {
  readonly id: AgentId;
  readonly name: string;
  readonly icon: string;
  readonly command: string;
  readonly mcpSupported: boolean;
}

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
};

/** Detect the active agent from environment signals. */
function detectAgent(): DetectedAgent {
  const {
    CLAUDE_CODE,
    ANTHROPIC_CLI,
    CURSOR_AGENT,
    CURSOR,
    GEMINI_CLI,
    GOOGLE_CLI,
    CODEX_CLI,
    OPENAI_CODEX,
    TERM_PROGRAM,
    SHELL,
  } = process.env;

  if (CLAUDE_CODE === '1' || ANTHROPIC_CLI === '1') {
    return AGENTS['claude-code'];
  }
  if (CURSOR_AGENT === '1' || CURSOR === '1') {
    return AGENTS.cursor;
  }
  if (GEMINI_CLI === '1' || GOOGLE_CLI === '1') {
    return AGENTS.gemini;
  }
  if (CODEX_CLI === '1' || OPENAI_CODEX === '1') {
    return AGENTS.codex;
  }

  const term = TERM_PROGRAM?.toLowerCase() ?? '';
  if (term.includes('claude')) {
    return AGENTS['claude-code'];
  }
  if (term.includes('cursor')) {
    return AGENTS.cursor;
  }

  const shell = SHELL?.toLowerCase() ?? '';
  if (shell.includes('claude')) {
    return AGENTS['claude-code'];
  }

  return AGENTS['claude-code'];
}

function getAgentById(id: AgentId): DetectedAgent {
  return AGENTS[id];
}

function listAgents(): DetectedAgent[] {
  return Object.values(AGENTS);
}

export type { AgentId, DetectedAgent };
export { detectAgent, getAgentById, listAgents };
