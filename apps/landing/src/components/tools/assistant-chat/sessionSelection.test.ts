import { describe, expect, it } from 'vitest';
import type { ResumeListItem, StoredConversation } from './conversationStore';
import { planSessionSelection } from './sessionSelection';

const savedConversation = (partial = {}): StoredConversation => ({
  id: 'panel-1',
  title: 'Saved chat',
  assistant: 'claude',
  updatedAt: '2026-07-14T00:00:00.000Z',
  preview: 'Saved preview',
  ...partial,
});

const cliConversation = (partial = {}): ResumeListItem => ({
  ...savedConversation({ id: 'cli:terminal-1' }),
  source: 'cli',
  terminalSessionId: 'terminal-1',
  cwd: '/Users/me/project',
  sourcePath: '/Users/me/transcript.jsonl',
  ...partial,
});

describe('planSessionSelection for CLI sessions', () => {
  it('rejects a CLI row without a session id', () => {
    const selection = planSessionSelection(
      cliConversation({ terminalSessionId: undefined }),
      [],
      true,
    );
    expect(selection).toEqual({
      ok: false,
      message: 'This CLI session is missing an id — open a new chat instead.',
    });
  });

  it('reuses the panel conversation already linked to the CLI session', () => {
    const existingConversation = savedConversation({ terminalSessionId: 'terminal-1' });
    const selection = planSessionSelection(cliConversation(), [existingConversation], true);
    expect(selection).toMatchObject({
      ok: true,
      conversation: { kind: 'existing', row: existingConversation },
      refreshConversations: true,
      transcript: {
        terminalSessionId: 'terminal-1',
        ensureBridge: true,
      },
    });
  });

  it('describes the conversation to create for a new CLI session', () => {
    const selection = planSessionSelection(cliConversation(), [], false);
    expect(selection).toMatchObject({
      ok: true,
      conversation: {
        kind: 'create',
        input: {
          assistant: 'claude',
          title: 'Saved chat',
          preview: 'Saved preview',
          terminalSessionId: 'terminal-1',
          cwd: '/Users/me/project',
          sourcePath: '/Users/me/transcript.jsonl',
        },
      },
      transcript: {
        terminalSessionId: 'terminal-1',
        ensureBridge: false,
      },
    });
  });
});

describe('planSessionSelection for saved sessions', () => {
  it('opens an unlinked saved conversation without loading a transcript', () => {
    const row = savedConversation();
    const selection = planSessionSelection(row, [row], true);
    expect(selection).toEqual({
      ok: true,
      assistant: 'claude',
      conversation: { kind: 'existing', row },
      refreshConversations: false,
    });
  });

  it('reloads a linked saved conversation only for a streaming assistant', () => {
    const row = savedConversation({
      terminalSessionId: 'terminal-1',
      cwd: '/Users/me/project',
      sourcePath: '/Users/me/transcript.jsonl',
    });
    const selection = planSessionSelection(row, [row], true);
    expect(selection).toMatchObject({
      ok: true,
      transcript: {
        terminalSessionId: 'terminal-1',
        ensureBridge: false,
        cwd: '/Users/me/project',
        sourcePath: '/Users/me/transcript.jsonl',
      },
    });
  });
});
