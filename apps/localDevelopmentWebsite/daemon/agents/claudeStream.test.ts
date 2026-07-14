import { describe, expect, it } from 'vitest';
import { type ClaudeStreamEvent, createStreamParser, mapClaudeStreamEvent } from './claudeStream';

/** Build one stream-json line (object + trailing newline). */
const line = (obj: unknown): string => `${JSON.stringify(obj)}\n`;

const textDelta = (text: string) => ({
  type: 'stream_event',
  event: { type: 'content_block_delta', delta: { type: 'text_delta', text } },
});

const toolStart = (name: string) => ({
  type: 'stream_event',
  event: { type: 'content_block_start', content_block: { type: 'tool_use', name } },
});

describe('mapClaudeStreamEvent', () => {
  it('maps the init system message to a session event', () => {
    expect(mapClaudeStreamEvent({ type: 'system', subtype: 'init', session_id: 'abc' })).toEqual({
      kind: 'session',
      sessionId: 'abc',
    });
  });

  it('maps a text_delta stream event to a text event', () => {
    expect(mapClaudeStreamEvent(textDelta('hello'))).toEqual({ kind: 'text', text: 'hello' });
  });

  it('maps a tool_use content_block_start to a tool event', () => {
    expect(mapClaudeStreamEvent(toolStart('Read'))).toEqual({ kind: 'tool', name: 'Read' });
  });

  it('maps a success result to a non-error end event with session + text', () => {
    expect(
      mapClaudeStreamEvent({
        type: 'result',
        subtype: 'success',
        session_id: 'abc',
        result: 'final text',
      }),
    ).toEqual({ kind: 'end', isError: false, sessionId: 'abc', text: 'final text' });
  });

  it('flags an error result via subtype or is_error', () => {
    expect(mapClaudeStreamEvent({ type: 'result', subtype: 'error' })).toEqual({
      kind: 'end',
      isError: true,
    });
    expect(mapClaudeStreamEvent({ type: 'result', subtype: 'success', is_error: true })).toEqual({
      kind: 'end',
      isError: true,
    });
  });

  it('ignores the aggregated assistant message so text never double-renders', () => {
    expect(
      mapClaudeStreamEvent({
        type: 'assistant',
        message: { content: [{ type: 'text', text: 'x' }] },
      }),
    ).toBeNull();
  });

  it('ignores unknown types, malformed shapes, and non-objects', () => {
    expect(mapClaudeStreamEvent({ type: 'system', subtype: 'init' })).toBeNull(); // no session_id
    expect(mapClaudeStreamEvent({ type: 'stream_event', event: { type: 'ping' } })).toBeNull();
    expect(mapClaudeStreamEvent({ type: 'whatever' })).toBeNull();
    expect(mapClaudeStreamEvent('not an object')).toBeNull();
    expect(mapClaudeStreamEvent(null)).toBeNull();
  });
});

describe('createStreamParser', () => {
  it('parses whole newline-delimited lines into events', () => {
    const parser = createStreamParser();
    const events = parser.push(
      line({ type: 'system', subtype: 'init', session_id: 's1' }) +
        line(textDelta('foo')) +
        line(textDelta('bar')),
    );
    expect(events).toEqual<ClaudeStreamEvent[]>([
      { kind: 'session', sessionId: 's1' },
      { kind: 'text', text: 'foo' },
      { kind: 'text', text: 'bar' },
    ]);
  });

  it('reassembles a line split across two chunks', () => {
    const parser = createStreamParser();
    const full = line(textDelta('hello there'));
    const cut = Math.floor(full.length / 2);

    expect(parser.push(full.slice(0, cut))).toEqual([]); // no newline yet
    expect(parser.push(full.slice(cut))).toEqual([{ kind: 'text', text: 'hello there' }]);
  });

  it('skips blank lines and non-JSON noise without throwing', () => {
    const parser = createStreamParser();
    const events = parser.push(`\n   \nnot json\n${line({ type: 'result', subtype: 'success' })}`);
    expect(events).toEqual([{ kind: 'end', isError: false }]);
  });

  it('holds an incomplete trailing line until its newline arrives', () => {
    const parser = createStreamParser();
    expect(parser.push('{"type":"result","subtype":"succ')).toEqual([]);
    expect(parser.push('ess"}\n')).toEqual([{ kind: 'end', isError: false }]);
  });
});
