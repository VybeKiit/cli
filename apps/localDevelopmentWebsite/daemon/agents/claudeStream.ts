/**
 * Pure parser for Claude Code's `--output-format stream-json` NDJSON stream.
 *
 * Kept free of process/IO so the risky mapping logic is unit-testable against
 * fixture lines (no real `claude` process). Defensive by design: unknown event
 * types, missing fields, blank lines, and non-JSON noise are ignored rather
 * than thrown.
 */

/** A distilled, transport-ready event derived from one stream-json object. */
export type ClaudeStreamEvent =
  | { readonly kind: 'session'; readonly sessionId: string }
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'tool'; readonly name: string }
  | {
      readonly kind: 'end';
      readonly isError: boolean;
      readonly sessionId?: string;
      readonly text?: string;
    };

/**
 * Narrow an unknown value to a plain object.
 *
 * @param value - Candidate value.
 * @returns True when value is a non-null object.
 * @example
 * isRecord({ a: 1 }); // true
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Read a string field, or undefined when it is missing/non-string.
 *
 * @param value - Candidate value.
 * @returns The string, or undefined.
 * @example
 * asString('x'); // 'x'
 */
const asString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

/**
 * Map a nested `stream_event.event` payload to a distilled event.
 *
 * @param event - The `event` object from a `stream_event` message.
 * @returns Distilled text/tool event, or null to ignore.
 * @example
 * mapStreamEvent({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'hi' } });
 */
const mapStreamEvent = (event: unknown): ClaudeStreamEvent | null => {
  if (!isRecord(event)) {
    return null;
  }
  if (event.type === 'content_block_delta' && isRecord(event.delta)) {
    if (event.delta.type === 'text_delta') {
      const text = asString(event.delta.text);
      return text === undefined ? null : { kind: 'text', text };
    }
    return null;
  }
  if (event.type === 'content_block_start' && isRecord(event.content_block)) {
    if (event.content_block.type === 'tool_use') {
      const name = asString(event.content_block.name);
      return name === undefined ? null : { kind: 'tool', name };
    }
    return null;
  }
  return null;
};

/**
 * Map one parsed stream-json object to a distilled event.
 *
 * Renders only token-level `text_delta` deltas (from
 * `--include-partial-messages`) so the aggregated `assistant` message never
 * double-renders. The `result` message carries the final text as a fallback
 * for turns that produced no deltas.
 *
 * @param value - A single parsed JSON object from the stream.
 * @returns The distilled event, or null to skip.
 * @example
 * mapClaudeStreamEvent({ type: 'result', subtype: 'success', session_id: 'x' });
 */
export const mapClaudeStreamEvent = (value: unknown): ClaudeStreamEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (value.type === 'system' && value.subtype === 'init') {
    const sessionId = asString(value.session_id);
    return sessionId === undefined ? null : { kind: 'session', sessionId };
  }

  if (value.type === 'stream_event') {
    return mapStreamEvent(value.event);
  }

  if (value.type === 'result') {
    const sessionId = asString(value.session_id);
    const text = asString(value.result);
    return {
      kind: 'end',
      isError: value.subtype === 'error' || value.is_error === true,
      ...(sessionId === undefined ? {} : { sessionId }),
      ...(text === undefined ? {} : { text }),
    };
  }

  return null;
};

/** Incremental NDJSON → events parser holding a buffer across chunk boundaries. */
export type StreamParser = {
  /** Feed one raw stdout chunk; returns any complete events it unlocked. */
  readonly push: (chunk: string) => readonly ClaudeStreamEvent[];
};

/**
 * Parse one already-split line into a distilled event.
 *
 * @param line - A single non-empty NDJSON line.
 * @returns The distilled event, or null when the line is not usable JSON.
 * @example
 * parseLine('{"type":"result","subtype":"success"}');
 */
const parseLine = (line: string): ClaudeStreamEvent | null => {
  try {
    return mapClaudeStreamEvent(JSON.parse(line));
  } catch {
    return null;
  }
};

/**
 * Create a stateful parser that turns raw stdout chunks into distilled events.
 *
 * Tolerates lines split across chunks, blank lines, and non-JSON noise.
 *
 * @returns A parser with a `push` method.
 * @example
 * const parser = createStreamParser();
 * parser.push('{"type":"result","subtype":"success"}\n');
 */
export const createStreamParser = (): StreamParser => {
  let buffer = '';

  const push = (chunk: string): readonly ClaudeStreamEvent[] => {
    buffer += chunk;
    const events: ClaudeStreamEvent[] = [];
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line.length > 0) {
        const event = parseLine(line);
        if (event !== null) {
          events.push(event);
        }
      }
      newlineIndex = buffer.indexOf('\n');
    }
    return events;
  };

  return { push };
};
