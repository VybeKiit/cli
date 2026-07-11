import { describe, expect, it } from 'vitest';

import {
  parseClaudeTranscriptJsonl,
  parseCodexRolloutJsonl,
  parseCursorTranscriptJsonl,
  parseDevinTranscriptJson,
  parseGrokChatHistoryJsonl,
  parseKimiWireJsonl,
  parseKiroSessionJsonl,
} from './loadSessionTranscript';

describe('parseClaudeTranscriptJsonl', () => {
  it('extracts user and assistant text and merges consecutive assistant lines', () => {
    const raw = [
      JSON.stringify({ type: 'queue-operation', operation: 'x' }),
      JSON.stringify({
        type: 'user',
        timestamp: '2026-07-11T10:00:00.000Z',
        message: { role: 'user', content: 'Ship auth please' },
      }),
      JSON.stringify({
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: 'Plan:' }] },
      }),
      JSON.stringify({
        type: 'assistant',
        message: { role: 'assistant', content: [{ type: 'text', text: '1. Add route' }] },
      }),
      JSON.stringify({
        type: 'user',
        message: { role: 'user', content: 'go' },
      }),
      JSON.stringify({
        type: 'assistant',
        message: { role: 'assistant', content: 'Done.' },
      }),
    ].join('\n');

    const messages = parseClaudeTranscriptJsonl(raw);
    expect(messages).toEqual([
      {
        role: 'user',
        text: 'Ship auth please',
        timestamp: '2026-07-11T10:00:00.000Z',
      },
      {
        role: 'assistant',
        text: 'Plan:\n\n1. Add route',
      },
      { role: 'user', text: 'go' },
      { role: 'assistant', text: 'Done.' },
    ]);
  });

  it('skips empty assistant tool-only lines', () => {
    const raw = [
      JSON.stringify({
        type: 'user',
        message: { content: 'hi' },
      }),
      JSON.stringify({
        type: 'assistant',
        message: { content: [{ type: 'tool_use', name: 'Bash' }] },
      }),
      JSON.stringify({
        type: 'assistant',
        message: { content: 'Hello!' },
      }),
    ].join('\n');

    expect(parseClaudeTranscriptJsonl(raw)).toEqual([
      { role: 'user', text: 'hi' },
      { role: 'assistant', text: 'Hello!' },
    ]);
  });
});

describe('parseGrokChatHistoryJsonl', () => {
  it('keeps user/assistant and strips system-reminder blocks', () => {
    const raw = [
      JSON.stringify({ type: 'system', content: 'You are Grok' }),
      JSON.stringify({
        type: 'user',
        content: [
          {
            type: 'text',
            text: '<system-reminder>\nskills…\n</system-reminder>\nFix the bug',
          },
        ],
      }),
      JSON.stringify({ type: 'reasoning', content: 'thinking' }),
      JSON.stringify({ type: 'assistant', content: 'Here is the fix.' }),
    ].join('\n');

    expect(parseGrokChatHistoryJsonl(raw)).toEqual([
      { role: 'user', text: 'Fix the bug' },
      { role: 'assistant', text: 'Here is the fix.' },
    ]);
  });
});

describe('parseCodexRolloutJsonl', () => {
  it('reads event_msg user_message and agent_message', () => {
    const raw = [
      JSON.stringify({
        type: 'event_msg',
        payload: { type: 'user_message', message: 'Fix signing' },
      }),
      JSON.stringify({
        type: 'event_msg',
        payload: { type: 'agent_message', message: 'Checking identities…' },
      }),
      JSON.stringify({
        type: 'event_msg',
        payload: { type: 'token_count', input: 1 },
      }),
    ].join('\n');
    expect(parseCodexRolloutJsonl(raw)).toEqual([
      { role: 'user', text: 'Fix signing' },
      { role: 'assistant', text: 'Checking identities…' },
    ]);
  });
});

describe('parseCursorTranscriptJsonl', () => {
  it('reads role + message.content', () => {
    const raw = [
      JSON.stringify({
        role: 'user',
        message: { content: '<user_query>Ship auth</user_query>' },
      }),
      JSON.stringify({
        role: 'assistant',
        message: { content: [{ type: 'text', text: 'On it.' }] },
      }),
    ].join('\n');
    expect(parseCursorTranscriptJsonl(raw)).toEqual([
      { role: 'user', text: 'Ship auth' },
      { role: 'assistant', text: 'On it.' },
    ]);
  });
});

describe('parseKimiWireJsonl', () => {
  it('uses turn.prompt and content.part text', () => {
    const raw = [
      JSON.stringify({
        type: 'turn.prompt',
        input: [{ type: 'text', text: 'commit please' }],
      }),
      JSON.stringify({
        type: 'context.append_loop_event',
        event: {
          type: 'content.part',
          part: { type: 'text', text: 'Checking git status.' },
        },
      }),
      JSON.stringify({
        type: 'context.append_loop_event',
        event: {
          type: 'content.part',
          part: { type: 'think', think: 'internal' },
        },
      }),
    ].join('\n');
    expect(parseKimiWireJsonl(raw)).toEqual([
      { role: 'user', text: 'commit please' },
      { role: 'assistant', text: 'Checking git status.' },
    ]);
  });
});

describe('parseKiroSessionJsonl', () => {
  it('reads Prompt and AssistantMessage kinds', () => {
    const raw = [
      JSON.stringify({
        kind: 'Prompt',
        data: { content: [{ kind: 'text', data: 'launch landing' }] },
      }),
      JSON.stringify({
        kind: 'AssistantMessage',
        data: { content: [{ kind: 'text', data: 'Starting Next…' }] },
      }),
      JSON.stringify({
        kind: 'ToolResults',
        data: { content: [] },
      }),
    ].join('\n');
    expect(parseKiroSessionJsonl(raw)).toEqual([
      { role: 'user', text: 'launch landing' },
      { role: 'assistant', text: 'Starting Next…' },
    ]);
  });
});

describe('parseDevinTranscriptJson', () => {
  it('reads user/agent steps and skips system', () => {
    const raw = JSON.stringify({
      steps: [
        { source: 'system', message: 'You are Devin…' },
        { source: 'user', message: 'commit and push' },
        { source: 'agent', message: 'On it.' },
      ],
    });
    expect(parseDevinTranscriptJson(raw)).toEqual([
      { role: 'user', text: 'commit and push' },
      { role: 'assistant', text: 'On it.' },
    ]);
  });
});
