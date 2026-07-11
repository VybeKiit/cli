/**
 * Canonical agent registry for the local development console.
 * Launch/resume commands open the real CLI in the user's terminal.
 */

export type AgentId =
  | 'kiro'
  | 'claude-code'
  | 'cursor'
  | 'gemini'
  | 'codex'
  | 'kimi'
  | 'grok'
  | 'devin';

export type AgentDefinition = {
  readonly id: AgentId;
  readonly name: string;
  readonly color: string;
  readonly brandSrc: string;
  /** Primary binary name on PATH (also used for install detection). */
  readonly command: string;
  /** Extra PATH candidates (e.g. app-bundled Cursor CLI). */
  readonly commandCandidates: readonly string[];
  readonly mcpSupported: boolean;
  /** Whether AgentLogo from @vybekiit/ui knows this slug. */
  readonly hasSvgLogo: boolean;
};

export const AGENT_IDS = [
  'kiro',
  'claude-code',
  'cursor',
  'gemini',
  'codex',
  'kimi',
  'grok',
  'devin',
] as const satisfies readonly AgentId[];

const CURSOR_APP_BIN = '/Applications/Cursor.app/Contents/Resources/app/bin/cursor';

export const AGENTS: Record<AgentId, AgentDefinition> = {
  kiro: {
    id: 'kiro',
    name: 'Kiro',
    color: '#FF6B00',
    brandSrc: '/brand-marks/kiro.webp',
    command: 'kiro-cli',
    commandCandidates: ['kiro-cli'],
    mcpSupported: true,
    hasSvgLogo: true,
  },
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    color: '#D97757',
    brandSrc: '/brand-marks/claude.webp',
    command: 'claude',
    commandCandidates: ['claude'],
    mcpSupported: true,
    hasSvgLogo: true,
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    color: '#00D4AA',
    brandSrc: '/brand-marks/cursor.webp',
    command: 'cursor',
    commandCandidates: ['cursor', CURSOR_APP_BIN, 'agent'],
    mcpSupported: true,
    hasSvgLogo: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini CLI',
    color: '#4285F4',
    brandSrc: '/brand-marks/googlegemini.webp',
    command: 'gemini',
    commandCandidates: ['gemini'],
    mcpSupported: false,
    hasSvgLogo: true,
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    color: '#10A37F',
    brandSrc: '/brand-marks/openai.webp',
    command: 'codex',
    commandCandidates: ['codex'],
    mcpSupported: false,
    hasSvgLogo: true,
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    color: '#1A1A1A',
    brandSrc: '/brand-marks/kimi.webp',
    command: 'kimi',
    commandCandidates: ['kimi'],
    mcpSupported: true,
    hasSvgLogo: false,
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    color: '#000000',
    brandSrc: '/brand-marks/grok.webp',
    command: 'grok',
    commandCandidates: ['grok', 'agent'],
    mcpSupported: true,
    hasSvgLogo: false,
  },
  devin: {
    id: 'devin',
    name: 'Devin',
    color: '#5B5BD6',
    brandSrc: '/brand-marks/devin.webp',
    command: 'devin',
    commandCandidates: ['devin'],
    mcpSupported: true,
    hasSvgLogo: false,
  },
};

/**
 * Build a shell command that starts a new agent session.
 *
 * @param agentId - Target agent.
 * @param titleOrPrompt - Optional first prompt / session title.
 * @returns Shell command string (no `cd`).
 * @example
 * buildNewSessionCommand('claude-code', 'ship auth');
 */
export const buildNewSessionCommand = (agentId: AgentId, titleOrPrompt?: string): string => {
  const prompt = titleOrPrompt?.trim() ?? '';
  const quoted = prompt.length > 0 ? shellQuote(prompt) : '';

  switch (agentId) {
    case 'kiro':
      return prompt.length > 0 ? `kiro-cli chat ${quoted}` : 'kiro-cli chat';
    case 'claude-code':
      return prompt.length > 0 ? `claude ${quoted}` : 'claude';
    case 'cursor':
      // Prefer `cursor agent` when Cursor.app CLI is available; PATH may only have `cursor`.
      return prompt.length > 0 ? `cursor agent ${quoted}` : 'cursor agent';
    case 'gemini':
      return prompt.length > 0 ? `gemini ${quoted}` : 'gemini';
    case 'codex':
      return prompt.length > 0 ? `codex ${quoted}` : 'codex';
    case 'kimi':
      // Interactive TUI only — `--prompt` is non-interactive print mode.
      return 'kimi';
    case 'grok':
      return prompt.length > 0 ? `grok ${quoted}` : 'grok';
    case 'devin':
      return prompt.length > 0 ? `devin -- ${quoted}` : 'devin';
  }
};

/**
 * Build a shell command that resumes an existing agent session.
 *
 * @param agentId - Target agent.
 * @param sessionId - Session id known to that agent.
 * @returns Shell command string (no `cd`).
 * @example
 * buildResumeCommand('claude-code', 'abc-123');
 */
export const buildResumeCommand = (agentId: AgentId, sessionId: string): string => {
  const id = shellQuote(sessionId);

  switch (agentId) {
    case 'kiro':
      return `kiro-cli chat --resume-id ${id}`;
    case 'claude-code':
      return `claude --resume ${id}`;
    case 'cursor':
      return `cursor agent --resume ${id}`;
    case 'gemini':
      return `gemini --resume ${id}`;
    case 'codex':
      return `codex resume ${id}`;
    case 'kimi':
      return `kimi --session ${id}`;
    case 'grok':
      return `grok --resume ${id}`;
    case 'devin':
      return `devin --resume ${id}`;
  }
};

/**
 * Whether a string is a known AgentId.
 *
 * @param value - Candidate id.
 * @returns True when value is a registered agent id.
 * @example
 * isAgentId('claude-code'); // true
 */
export const isAgentId = (value: string): value is AgentId =>
  (AGENT_IDS as readonly string[]).includes(value);

/**
 * Quote a string for POSIX shell single-quote safety.
 *
 * @param value - Raw string.
 * @returns Single-quoted shell fragment.
 * @example
 * shellQuote(`it's`); // `'it'\\''s'`
 */
export const shellQuote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;
