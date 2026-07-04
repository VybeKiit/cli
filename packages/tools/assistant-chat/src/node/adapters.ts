import type { VybeAssistant } from '@vybekiit/report-mode';
import type { BridgeEvent } from '../protocol';

/**
 * An adapter spawns one agent CLI for a single user turn and yields protocol events.
 * Cursor has no headless streaming CLI, so it is deeplink-only (handled in the UI);
 * only claude and codex have live adapters here.
 */
export type LiveAssistant = Extract<VybeAssistant, 'claude' | 'codex'>;

export interface SpawnPlan {
  readonly command: string;
  readonly args: readonly string[];
}

export interface SpawnOptions {
  readonly model?: string;
}

/** Build the argv for a headless, streaming, non-interactive turn. */
export function buildSpawnPlan(
  assistant: LiveAssistant,
  prompt: string,
  options: SpawnOptions = {},
): SpawnPlan {
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
}

/**
 * Map one parsed JSON line from an agent CLI to a protocol event, or null to ignore.
 * Kept pure and adapter-keyed so it is unit-testable against captured fixtures without
 * spawning a real process.
 */
export function mapCliEvent(assistant: LiveAssistant, line: unknown): BridgeEvent | null {
  if (typeof line !== 'object' || line === null) {
    return null;
  }
  const record = line as Record<string, unknown>;
  return assistant === 'claude' ? mapClaude(record) : mapCodex(record);
}

function mapClaude(record: Record<string, unknown>): BridgeEvent | null {
  const type = record.type;
  if (type === 'assistant' || type === 'stream_event') {
    const text = extractClaudeText(record);
    return text ? { type: 'token', text } : null;
  }
  if (type === 'result') {
    return { type: 'done' };
  }
  return null;
}

function extractClaudeText(record: Record<string, unknown>): string {
  const message = record.message;
  if (typeof message === 'object' && message !== null) {
    const content = (message as Record<string, unknown>).content;
    if (Array.isArray(content)) {
      return content
        .map((block) =>
          typeof block === 'object' &&
          block !== null &&
          (block as Record<string, unknown>).type === 'text'
            ? String((block as Record<string, unknown>).text ?? '')
            : '',
        )
        .join('');
    }
  }
  const delta = record.delta;
  if (typeof delta === 'object' && delta !== null) {
    const text = (delta as Record<string, unknown>).text;
    return typeof text === 'string' ? text : '';
  }
  return '';
}

function mapCodex(record: Record<string, unknown>): BridgeEvent | null {
  const type = record.type ?? record.msg;
  if (type === 'agent_message_delta' || type === 'agent_message') {
    const text = record.delta ?? record.message ?? record.text;
    return typeof text === 'string' && text ? { type: 'token', text } : null;
  }
  if (type === 'task_complete' || type === 'turn_complete') {
    return { type: 'done' };
  }
  return null;
}
