import { describe, expect, it } from 'vitest';
import {
  STATUSLINE_APPEND_SNIPPET,
  STATUSLINE_BADGE,
  STATUSLINE_BADGE_COMMAND,
  statusLineCommandHasBadge,
  upsertMemoryBlock,
  vybekiitMemoryBlock,
  withStatusLineBadge,
} from '../../src/global/awareness';

describe('upsertMemoryBlock', () => {
  const block = vybekiitMemoryBlock();

  it('inserts the block into empty content', () => {
    expect(upsertMemoryBlock('', block)).toBe(block);
  });

  it('appends after existing user content', () => {
    const result = upsertMemoryBlock('# My notes\n', block);
    expect(result.startsWith('# My notes')).toBe(true);
    expect(result).toContain('BEGIN VYBEKIIT');
  });

  it('is idempotent — replaces its own block, never duplicates', () => {
    const once = upsertMemoryBlock('# My notes\n', block);
    const twice = upsertMemoryBlock(once, block);
    expect(twice).toBe(once);
    expect(twice.match(/BEGIN VYBEKIIT/g)?.length).toBe(1);
  });

  it('preserves user content on both sides of the block', () => {
    const result = upsertMemoryBlock(`before\n\n${block}\nafter`, block);
    expect(result).toContain('before');
    expect(result).toContain('after');
  });
});

describe('statusLineCommandHasBadge', () => {
  it('detects the diamond badge token', () => {
    expect(statusLineCommandHasBadge(STATUSLINE_BADGE_COMMAND)).toBe(true);
    expect(
      statusLineCommandHasBadge(`bash ~/.claude/statusline.sh; ${STATUSLINE_APPEND_SNIPPET}`),
    ).toBe(true);
  });

  it('is false for an unrelated command', () => {
    expect(statusLineCommandHasBadge('bash ~/.claude/statusline-command.sh')).toBe(false);
  });
});

describe('withStatusLineBadge', () => {
  it('sets a badge-only command when none is configured', () => {
    const next = withStatusLineBadge('{}');
    expect(next).not.toBeNull();
    const parsed = JSON.parse(next ?? '') as {
      statusLine: { type: string; command: string };
    };
    expect(parsed.statusLine.type).toBe('command');
    expect(parsed.statusLine.command).toBe(STATUSLINE_BADGE_COMMAND);
    expect(parsed.statusLine.command).toContain(STATUSLINE_BADGE);
  });

  it('sets a badge when settings file is empty', () => {
    const next = withStatusLineBadge('');
    expect(next).not.toBeNull();
    expect(JSON.parse(next ?? '').statusLine.command).toBe(STATUSLINE_BADGE_COMMAND);
  });

  it('appends the badge to an existing status line command', () => {
    const raw = JSON.stringify({
      statusLine: {
        type: 'command',
        command: 'bash /Users/me/.claude/statusline-command.sh',
      },
    });
    const next = withStatusLineBadge(raw);
    expect(next).not.toBeNull();
    const command = (JSON.parse(next ?? '') as { statusLine: { command: string } }).statusLine
      .command;
    expect(command.startsWith('bash /Users/me/.claude/statusline-command.sh')).toBe(true);
    expect(command).toContain(STATUSLINE_APPEND_SNIPPET);
    expect(command).toContain(STATUSLINE_BADGE);
  });

  it('is idempotent — does not double-append when badge already present', () => {
    const once = withStatusLineBadge(
      JSON.stringify({
        statusLine: {
          type: 'command',
          command: 'bash /Users/me/.claude/statusline-command.sh',
        },
      }),
    );
    expect(once).not.toBeNull();
    expect(withStatusLineBadge(once ?? '')).toBeNull();
  });

  it('leaves a bare badge-only status line alone on re-run', () => {
    const raw = JSON.stringify({
      statusLine: { type: 'command', command: STATUSLINE_BADGE_COMMAND },
    });
    expect(withStatusLineBadge(raw)).toBeNull();
  });

  it('preserves unrelated settings keys when appending', () => {
    const raw = JSON.stringify({
      theme: 'dark',
      statusLine: { type: 'command', command: 'echo folder' },
    });
    const next = withStatusLineBadge(raw);
    const parsed = JSON.parse(next ?? '') as {
      theme: string;
      statusLine: { command: string };
    };
    expect(parsed.theme).toBe('dark');
    expect(parsed.statusLine.command).toContain('echo folder');
    expect(parsed.statusLine.command).toContain(STATUSLINE_BADGE);
  });

  it('never overwrites malformed settings', () => {
    expect(withStatusLineBadge('{ not json')).toBeNull();
  });

  it('does not touch an unknown statusLine shape', () => {
    expect(withStatusLineBadge(JSON.stringify({ statusLine: { type: 'command' } }))).toBeNull();
    expect(withStatusLineBadge(JSON.stringify({ statusLine: 'weird' }))).toBeNull();
  });
});
