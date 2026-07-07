import type { BridgeEvent } from '@vybekiit/assistant-chat/protocol';
import type { VybeAssistant } from '@vybekiit/report-mode';

/**
 * An adapter spawns one agent CLI for a single user turn and yields protocol events.
 * Cursor has no headless streaming CLI, so it is deeplink-only (handled in the UI);
 * only claude and codex have live adapters here.
 */
export type LiveAssistant = Extract<VybeAssistant, 'claude' | 'codex'>;

/** Command and argv for one live assistant CLI turn. */
export type SpawnPlan = {
  readonly command: string;
  readonly args: readonly string[];
};

/** Optional runtime overrides for a live assistant spawn. */
export type SpawnOptions = {
  readonly model?: string;
};

/**
 * Build the argv for a headless, streaming, non-interactive turn.
 *
 * @param assistant - Live assistant adapter to spawn.
 * @param prompt - Prompt text passed to the CLI.
 * @param options - Optional model override.
 * @returns The executable command and argv for the turn.
 * @example
 * const plan = buildSpawnPlan('codex', 'Summarize this file', { model: 'gpt-4.1' });
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
    return { command: 'claude', args };
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
  return assistant === 'claude' ? mapClaude(record) : mapCodex(record);
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
