import type { BridgeEvent } from '@vybekiit/assistant-chat/protocol';
import type { VybeAssistant } from '@vybekiit/report-mode';

/**
 * An adapter spawns one agent CLI for a single user turn and yields protocol events.
 * Cursor has no headless streaming CLI, so it is deeplink-only (handled in the UI).
 * Live stream adapters: claude, codex, kimi, grok (official stream-json / --json surfaces).
 */
export type LiveAssistant = Extract<VybeAssistant, 'claude' | 'codex' | 'kimi' | 'grok'>;

/** Command and argv for one live assistant CLI turn. */
export type SpawnPlan = {
  readonly command: string;
  readonly args: readonly string[];
};

/** Optional runtime overrides for a live assistant spawn. */
export type SpawnOptions = {
  readonly model?: string;
  /**
   * Native CLI conversation id for official resume flags (`claude --resume`,
   * `codex exec resume`, `kimi --session`). When set, the turn continues that
   * on-disk session instead of starting a fresh one.
   */
  readonly agentSessionId?: string;
};

/**
 * Build the argv for a headless, streaming, non-interactive turn.
 *
 * @param assistant - Live assistant adapter to spawn.
 * @param prompt - Prompt text passed to the CLI.
 * @param options - Optional model and/or native session resume overrides.
 * @returns The executable command and argv for the turn.
 * @example
 * const plan = buildSpawnPlan('codex', 'Summarize this file', { model: 'gpt-4.1' });
 * const resumed = buildSpawnPlan('claude', 'continue', { agentSessionId: 'abc' });
 */
export const buildSpawnPlan = (
  assistant: LiveAssistant,
  prompt: string,
  options: SpawnOptions = {},
): SpawnPlan => {
  if (assistant === 'claude') {
    const args = [
      '-p',
      prompt,
      '--output-format',
      'stream-json',
      '--include-partial-messages',
      '--verbose',
    ];
    if (options.model) {
      args.push('--model', options.model);
    }
    // Official: -r/--resume works with -p print mode to continue an existing conversation.
    if (options.agentSessionId) {
      args.push('--resume', options.agentSessionId);
    }
    return { command: 'claude', args };
  }

  if (assistant === 'kimi') {
    // Official: kimi -p <prompt> --output-format stream-json [-m model] [-S session]
    // --yolo auto-approves tools so non-interactive stream turns do not hang.
    const args = ['-p', prompt, '--output-format', 'stream-json', '--yolo'];
    if (options.model) {
      args.push('-m', options.model);
    }
    if (options.agentSessionId) {
      args.push('--session', options.agentSessionId);
    }
    return { command: 'kimi', args };
  }

  if (assistant === 'grok') {
    // Official headless: grok -p … --output-format streaming-json [-r session] [--always-approve]
    // https://docs.x.ai/build/cli/headless-scripting
    const args = [
      '-p',
      prompt,
      '--output-format',
      'streaming-json',
      '--always-approve',
      '--no-auto-update',
    ];
    if (options.model) {
      args.push('-m', options.model);
    }
    if (options.agentSessionId) {
      args.push('-r', options.agentSessionId);
    }
    return { command: 'grok', args };
  }

  // Codex: `exec --json` for new turns; `exec resume <id> --json` for official resume.
  if (options.agentSessionId) {
    const args = ['exec', 'resume', options.agentSessionId, '--json'];
    if (options.model) {
      args.push('-m', options.model);
    }
    args.push(prompt);
    return { command: 'codex', args };
  }

  const args = ['exec', '--json'];
  if (options.model) {
    args.push('-m', options.model);
  }
  args.push(prompt);
  return { command: 'codex', args };
};

/**
 * Map one parsed JSON line from an agent CLI to a protocol event, or null to ignore.
 * Kept pure and adapter-keyed so it is unit-testable against captured fixtures without
 * spawning a real process.
 *
 * @param assistant - Live assistant whose CLI emitted the line.
 * @param line - Parsed JSON line from stdout.
 * @returns A bridge event, or null when the line is not user-visible stream output.
 * @example
 * const event = mapCliEvent('codex', { type: 'agent_message_delta', delta: 'hi' });
 */
export const mapCliEvent = (assistant: LiveAssistant, line: unknown): BridgeEvent | null => {
  if (typeof line !== 'object' || line === null) {
    return null;
  }
  const record = line as Record<string, unknown>;
  if (assistant === 'claude') {
    return mapClaude(record);
  }
  if (assistant === 'kimi') {
    return mapKimi(record);
  }
  if (assistant === 'grok') {
    return mapGrok(record);
  }
  return mapCodex(record);
};

const mapClaude = (record: Record<string, unknown>): BridgeEvent | null => {
  const { type } = record;
  if (type === 'assistant' || type === 'stream_event') {
    const text = extractClaudeText(record);
    return text ? { type: 'token', text } : null;
  }
  if (type === 'result') {
    return { type: 'done' };
  }
  return null;
};

const extractClaudeTextFromBlock = (block: unknown): string => {
  if (typeof block !== 'object' || block === null) {
    return '';
  }

  const record = block as Record<string, unknown>;
  const { text, type } = record;

  if (type !== 'text') {
    return '';
  }

  if (typeof text !== 'string') {
    return '';
  }

  return text;
};

const extractClaudeText = (record: Record<string, unknown>): string => {
  const { delta, message } = record;
  if (typeof message === 'object' && message !== null) {
    const { content } = message as Record<string, unknown>;
    if (Array.isArray(content)) {
      return content.map((block) => extractClaudeTextFromBlock(block)).join('');
    }
  }
  if (typeof delta === 'object' && delta !== null) {
    const { text } = delta as Record<string, unknown>;
    return typeof text === 'string' ? text : '';
  }
  return '';
};

const resolveCodexEventType = (record: Record<string, unknown>): unknown => {
  if (record.type !== undefined) {
    return record.type;
  }

  return record.msg;
};

const resolveCodexText = (record: Record<string, unknown>): unknown => {
  if (record.delta !== undefined) {
    return record.delta;
  }

  if (record.message !== undefined) {
    return record.message;
  }

  return record.text;
};

const mapCodex = (record: Record<string, unknown>): BridgeEvent | null => {
  const type = resolveCodexEventType(record);
  if (type === 'agent_message_delta' || type === 'agent_message') {
    const text = resolveCodexText(record);
    return typeof text === 'string' && text ? { type: 'token', text } : null;
  }
  if (type === 'task_complete' || type === 'turn_complete') {
    return { type: 'done' };
  }
  return null;
};

/**
 * Grok headless streaming-json (xAI CLI):
 *   {"type":"thought","data":"…"}   — skip (internal reasoning)
 *   {"type":"text","data":"Hello"}  — visible token
 *   {"type":"end","stopReason":"EndTurn",…} — turn complete
 */
const mapGrok = (record: Record<string, unknown>): BridgeEvent | null => {
  const type = record.type;
  if (type === 'text') {
    const data = record.data;
    return typeof data === 'string' && data.length > 0 ? { type: 'token', text: data } : null;
  }
  if (type === 'end' || type === 'done' || type === 'result') {
    return { type: 'done' };
  }
  if (type === 'tool_call' || type === 'tool') {
    let name = 'tool';
    if (typeof record.name === 'string') {
      name = record.name;
    } else if (typeof record.tool === 'string') {
      name = record.tool;
    }
    let detail: string | undefined;
    if (typeof record.data === 'string') {
      detail = record.data.slice(0, 500);
    } else if (typeof record.detail === 'string') {
      detail = record.detail.slice(0, 500);
    }
    return { type: 'tool_call', name, ...(detail === undefined ? {} : { detail }) };
  }
  // thought / status / meta — not user-visible stream tokens
  return null;
};

/**
 * Kimi stream-json lines (official docs):
 *   {"role":"assistant","content":"…"}
 *   {"role":"assistant","tool_calls":[…]}
 *   {"role":"tool",…}
 *   {"role":"meta","type":"session.resume_hint",…}
 * Thinking is not written to JSONL; process exit emits done.
 */
const mapKimi = (record: Record<string, unknown>): BridgeEvent | null => {
  const role = record.role;
  if (role === 'assistant') {
    const content = record.content;
    if (typeof content === 'string' && content.length > 0) {
      return { type: 'token', text: content };
    }
    if (Array.isArray(record.tool_calls) && record.tool_calls.length > 0) {
      const names = record.tool_calls
        .map((call) => {
          if (typeof call === 'object' && call !== null && 'function' in call) {
            const fn = (call as { function?: { name?: unknown } }).function;
            return typeof fn?.name === 'string' ? fn.name : null;
          }
          if (typeof call === 'object' && call !== null && 'name' in call) {
            const name = (call as { name?: unknown }).name;
            return typeof name === 'string' ? name : null;
          }
          return null;
        })
        .filter((name): name is string => name !== null);
      return {
        type: 'tool_call',
        name: names[0] ?? 'tool',
        detail: names.length > 1 ? names.join(', ') : undefined,
      };
    }
    return null;
  }
  if (role === 'tool') {
    let name = 'tool';
    if (typeof record.name === 'string') {
      name = record.name;
    } else if (typeof record.tool_call_id === 'string') {
      name = record.tool_call_id;
    }
    const detail = typeof record.content === 'string' ? record.content.slice(0, 500) : undefined;
    return { type: 'tool_call', name, ...(detail === undefined ? {} : { detail }) };
  }
  // meta resume hints etc. are not user-visible stream tokens
  return null;
};
