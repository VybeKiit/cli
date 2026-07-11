import { describe, expect, it } from 'vitest';
import {
  filterConversationsByAssistant,
  filterConversationsByName,
  formatFolderPathLabel,
  mergeResumeItems,
  nativeSessionToResumeItem,
  normalizeConversationSearch,
  paginateConversations,
  RESUME_PAGE_SIZE,
  type StoredConversation,
  scoreConversationNameMatch,
  takeConversationWindow,
} from './conversationStore';

const row = (
  partial: Pick<StoredConversation, 'id' | 'title'> & Partial<StoredConversation>,
): StoredConversation => ({
  id: partial.id,
  title: partial.title,
  assistant: partial.assistant ?? 'claude',
  updatedAt: partial.updatedAt ?? '2026-07-11T12:00:00.000Z',
  preview: partial.preview ?? 'Empty chat',
  ...(partial.terminalSessionId === undefined
    ? {}
    : { terminalSessionId: partial.terminalSessionId }),
  ...(partial.cwd === undefined ? {} : { cwd: partial.cwd }),
});

describe('normalizeConversationSearch', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeConversationSearch("What's my Sub")).toBe("what's my sub");
    expect(normalizeConversationSearch('Café')).toBe('cafe');
  });
});

describe('scoreConversationNameMatch', () => {
  const chat = row({
    id: '1',
    title: 'whats my sub i have',
    preview: 'Claude Code · subscription check',
  });

  it('scores empty query as a pass-through match', () => {
    expect(scoreConversationNameMatch(chat, '', 'Claude Code')).toBe(1);
  });

  it('prefers exact and prefix title matches', () => {
    expect(scoreConversationNameMatch(chat, 'whats my sub i have', 'Claude Code')).toBe(100);
    expect(scoreConversationNameMatch(chat, 'whats my', 'Claude Code')).toBe(80);
  });

  it('matches token queries across title and agent label', () => {
    expect(scoreConversationNameMatch(chat, 'sub claude', 'Claude Code')).toBeGreaterThan(0);
    expect(scoreConversationNameMatch(chat, 'zzz no match', 'Claude Code')).toBe(0);
  });

  it('matches by project folder path so multi-repo chats are searchable', () => {
    const otherRepo = row({
      id: '2',
      title: 'Finish worker MVC',
      cwd: '/Users/me/Desktop/Code/genshot',
    });
    expect(scoreConversationNameMatch(otherRepo, 'genshot', 'Claude Code')).toBe(55);
  });
});

describe('filterConversationsByAssistant', () => {
  const list = [
    row({ id: 'a', title: 'claude billing', assistant: 'claude' }),
    row({ id: 'b', title: 'cursor deploy', assistant: 'cursor' }),
    row({ id: 'c', title: 'claude sub', assistant: 'claude' }),
    row({ id: 'd', title: 'grok ship', assistant: 'grok' }),
  ] as const;

  it('returns only chats for the active agent', () => {
    expect(filterConversationsByAssistant(list, 'claude').map((item) => item.id)).toEqual([
      'a',
      'c',
    ]);
    expect(filterConversationsByAssistant(list, 'cursor').map((item) => item.id)).toEqual(['b']);
    expect(filterConversationsByAssistant(list, 'codex')).toEqual([]);
  });

  it('scopes resume search to the active agent before fuzzy rank', () => {
    const forClaude = filterConversationsByAssistant(list, 'claude');
    const matches = filterConversationsByName(forClaude, 'sub', () => 'Claude Code');
    expect(matches.map((item) => item.id)).toEqual(['c']);
    // Cursor chat with "deploy" must never leak into Claude resume.
    expect(matches.some((item) => item.assistant !== 'claude')).toBe(false);
  });
});

describe('filterConversationsByName', () => {
  const list = [
    row({
      id: 'a',
      title: 'billing question',
      updatedAt: '2026-07-11T10:00:00.000Z',
    }),
    row({
      id: 'b',
      title: 'whats my sub i have',
      updatedAt: '2026-07-11T11:00:00.000Z',
    }),
    row({
      id: 'c',
      title: 'deploy checklist',
      assistant: 'cursor',
      updatedAt: '2026-07-11T09:00:00.000Z',
    }),
  ] as const;

  it('returns all rows in order when the query is empty', () => {
    const filtered = filterConversationsByName(list, '', () => 'Agent');
    expect(filtered.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('ranks name matches first for vibe-coder search', () => {
    const filtered = filterConversationsByName(list, 'sub', () => 'Claude Code');
    expect(filtered.map((item) => item.id)).toEqual(['b']);
  });

  it('finds chats by partial fuzzy title characters', () => {
    const filtered = filterConversationsByName(list, 'whts sub', () => 'Claude Code');
    expect(filtered.some((item) => item.id === 'b')).toBe(true);
  });

  it('search ranks the full list before any pagination slice', () => {
    const many = Array.from({ length: 20 }, (_, index) =>
      row({
        id: `chat-${index}`,
        title: index === 17 ? 'billing refund status' : `misc chat ${index}`,
        updatedAt: `2026-07-11T${String(10 + (index % 10)).padStart(2, '0')}:00:00.000Z`,
      }),
    );
    const matches = filterConversationsByName(many, 'refund', () => 'Claude Code');
    expect(matches.map((item) => item.id)).toEqual(['chat-17']);
    // Pager only windows matches — it never re-filters a single page of storage.
    const page = paginateConversations(matches, 1, RESUME_PAGE_SIZE);
    expect(page.items.map((item) => item.id)).toEqual(['chat-17']);
    expect(page.total).toBe(1);
  });
});

describe('paginateConversations', () => {
  const many = Array.from({ length: 20 }, (_, index) =>
    row({ id: `id-${index}`, title: `Chat ${index}` }),
  );

  it('returns an empty page when there are no rows', () => {
    expect(paginateConversations([], 1, 8)).toEqual({
      items: [],
      page: 1,
      pageSize: 8,
      total: 0,
      totalPages: 0,
    });
  });

  it('slices a 1-based page and clamps out-of-range pages', () => {
    const first = paginateConversations(many, 1, 8);
    expect(first.items.map((item) => item.id)).toEqual(
      Array.from({ length: 8 }, (_, index) => `id-${index}`),
    );
    expect(first.totalPages).toBe(3);
    expect(first.total).toBe(20);

    const last = paginateConversations(many, 3, 8);
    expect(last.items.map((item) => item.id)).toEqual(['id-16', 'id-17', 'id-18', 'id-19']);
    expect(last.page).toBe(3);

    const clamped = paginateConversations(many, 99, 8);
    expect(clamped.page).toBe(3);
    expect(clamped.items).toEqual(last.items);
  });
});

describe('takeConversationWindow', () => {
  const many = Array.from({ length: 12 }, (_, index) =>
    row({ id: `w-${index}`, title: `Window ${index}` }),
  );

  it('returns a growing prefix for infinite scroll', () => {
    expect(takeConversationWindow(many, 0)).toEqual([]);
    expect(takeConversationWindow(many, 5).map((item) => item.id)).toEqual([
      'w-0',
      'w-1',
      'w-2',
      'w-3',
      'w-4',
    ]);
    expect(takeConversationWindow(many, 100).map((item) => item.id)).toHaveLength(12);
  });
});

describe('formatFolderPathLabel', () => {
  it('shortens user home paths to ~', () => {
    expect(formatFolderPathLabel('/Users/me/Desktop/Code/genshot')).toBe('~/Desktop/Code/genshot');
    expect(formatFolderPathLabel('/home/dev/apps/web')).toBe('~/apps/web');
    expect(formatFolderPathLabel(undefined)).toBe('');
    expect(formatFolderPathLabel('')).toBe('');
  });
});

describe('nativeSessionToResumeItem', () => {
  it('keeps cwd as a dedicated field (not mashed into preview)', () => {
    const item = nativeSessionToResumeItem({
      sessionId: 's1',
      title: 'Ship auth',
      assistant: 'claude',
      updatedAt: '2026-07-11T10:00:00.000Z',
      cwd: '/Users/me/Desktop/Code/email-sender',
    });
    expect(item.cwd).toBe('/Users/me/Desktop/Code/email-sender');
    expect(item.preview).toBe('CLI session · loads full history in chat');
    expect(item.preview).not.toContain('email-sender');
  });
});

describe('mergeResumeItems', () => {
  it('combines saved + CLI and drops CLI rows already linked by terminalSessionId', () => {
    const saved = [
      row({
        id: 'local-1',
        title: 'Local billing',
        terminalSessionId: 'cli-abc',
        updatedAt: '2026-07-11T12:00:00.000Z',
      }),
      row({
        id: 'local-2',
        title: 'Panel only',
        updatedAt: '2026-07-11T11:00:00.000Z',
      }),
    ];
    const cli = [
      nativeSessionToResumeItem({
        sessionId: 'cli-abc',
        title: 'Same CLI session',
        assistant: 'claude',
        updatedAt: '2026-07-11T13:00:00.000Z',
      }),
      nativeSessionToResumeItem({
        sessionId: 'cli-xyz',
        title: 'Other CLI session',
        assistant: 'claude',
        updatedAt: '2026-07-11T10:00:00.000Z',
        cwd: '/tmp/app',
      }),
    ];
    const merged = mergeResumeItems(saved, cli);
    expect(merged.map((item) => item.id)).toEqual(['local-1', 'local-2', 'cli:cli-xyz']);
    expect(merged.find((item) => item.id === 'cli:cli-xyz')?.source).toBe('cli');
    expect(merged.find((item) => item.id === 'cli:cli-xyz')?.cwd).toBe('/tmp/app');
    expect(merged.find((item) => item.id === 'local-1')?.source).toBe('saved');
  });

  it('keeps only the active agent when callers already scoped inputs', () => {
    const saved = [row({ id: 'a', title: 'claude', assistant: 'claude' })];
    const cli = [
      nativeSessionToResumeItem({
        sessionId: 'k1',
        title: 'kimi only',
        assistant: 'kimi',
        updatedAt: '2026-07-11T09:00:00.000Z',
      }),
    ];
    // Callers must filter by assistant first — merge does not re-scope.
    const merged = mergeResumeItems(saved, cli);
    expect(merged).toHaveLength(2);
  });
});
