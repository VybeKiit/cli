import type { VybeAssistant } from '@vybekiit/report-mode';

const STORAGE_KEY = 'vybe-assistant-conversations';
/** Cap stored chats so localStorage stays bounded while still allowing multi-page lists. */
const MAX_CONVERSATIONS = 100;
/** Rows shown per Resume page (and per infinite-scroll chunk). */
export const RESUME_PAGE_SIZE = 8;
/** localStorage key for Pages vs infinite-scroll preference on Resume. */
export const RESUME_LIST_MODE_KEY = 'vybe-assistant-resume-list-mode';
/** Combining marks after NFKD (é → e + mark). */
const DIACRITIC_MARKS = /[\u0300-\u036f]/g;
/** Split free-text search into whitespace tokens. */
const SEARCH_WHITESPACE = /\s+/;
/** Collapse whitespace inside a fuzzy character walk. */
const SEARCH_WHITESPACE_GLOBAL = /\s+/g;

/** One saved chat the vibe coder can open again from New / Resume dialogs. */
export type StoredConversation = {
  readonly id: string;
  readonly title: string;
  readonly assistant: VybeAssistant;
  readonly updatedAt: string;
  readonly preview: string;
  /** Optional CLI session id when the chat was opened in a real terminal. */
  readonly terminalSessionId?: string;
  /**
   * Project folder the CLI session ran in (absolute path). Present for native
   * sessions so Resume can show which repo each chat belongs to.
   */
  readonly cwd?: string;
  /**
   * Absolute path to the native transcript (jsonl/summary) when known.
   * Speeds up Resume hydrate; not required for send/resume flags.
   */
  readonly sourcePath?: string;
};

/**
 * One Resume-sheet row: either a panel-saved chat or a native CLI session
 * discovered on disk for the active agent.
 */
export type ResumeListItem = StoredConversation & {
  readonly source: 'saved' | 'cli';
};

/**
 * Shorten an absolute project path for Resume rows (`/Users/me/Code/app` → `~/Code/app`).
 *
 * @param cwd - Absolute working directory from a native session.
 * @returns Compact label, or empty when missing.
 * @example
 * formatFolderPathLabel('/Users/me/Desktop/Code/vybekiit'); // '~/Desktop/Code/vybekiit'
 */
export const formatFolderPathLabel = (cwd: string | undefined): string => {
  if (cwd === undefined || cwd.length === 0) {
    return '';
  }
  const home =
    typeof globalThis.process !== 'undefined' &&
    typeof globalThis.process.env?.HOME === 'string' &&
    globalThis.process.env.HOME.length > 0
      ? globalThis.process.env.HOME
      : '';
  // Browser has no process.env.HOME; collapse common macOS/Linux home prefixes.
  if (home.length > 0 && (cwd === home || cwd.startsWith(`${home}/`))) {
    return cwd === home ? '~' : `~${cwd.slice(home.length)}`;
  }
  // Client-side fallback: /Users/<name>/… or /home/<name>/…
  const userHomeMatch = cwd.match(/^\/(?:Users|home)\/[^/]+(\/.*)?$/);
  if (userHomeMatch) {
    const rest = userHomeMatch[1] ?? '';
    return rest.length > 0 ? `~${rest}` : '~';
  }
  return cwd;
};

/**
 * Map a localStorage chat into a Resume row.
 *
 * @param row - Saved conversation.
 * @returns Resume list item tagged as panel-saved.
 * @example
 * savedConversationToResumeItem(chat);
 */
export const savedConversationToResumeItem = (row: StoredConversation): ResumeListItem => ({
  ...row,
  source: 'saved',
});

/**
 * Map a native agent CLI session into a Resume row.
 * Stream agents (claude/codex/kimi/grok) continue in the panel via the daemon;
 * others open with the official resume flag in Terminal.
 *
 * @param session - Native session metadata from the list-sessions API.
 * @returns Resume list item tagged as CLI.
 * @example
 * nativeSessionToResumeItem({ sessionId: 'abc', title: 'Ship auth', assistant: 'claude', updatedAt: '…' });
 */
export const nativeSessionToResumeItem = (session: {
  readonly sessionId: string;
  readonly title: string;
  readonly assistant: VybeAssistant;
  readonly updatedAt: string;
  readonly cwd?: string;
  readonly sourcePath?: string;
}): ResumeListItem => {
  const preview = 'CLI session · loads full history in chat';
  const cwd = session.cwd !== undefined && session.cwd.length > 0 ? session.cwd : undefined;
  const sourcePath =
    session.sourcePath !== undefined && session.sourcePath.length > 0
      ? session.sourcePath
      : undefined;
  return {
    id: `cli:${session.sessionId}`,
    title: session.title.length > 0 ? session.title : '(untitled)',
    assistant: session.assistant,
    updatedAt: session.updatedAt.length > 0 ? session.updatedAt : '1970-01-01T00:00:00.000Z',
    preview,
    terminalSessionId: session.sessionId,
    source: 'cli',
    ...(cwd === undefined ? {} : { cwd }),
    ...(sourcePath === undefined ? {} : { sourcePath }),
  };
};

/**
 * Merge panel-saved chats with native CLI sessions for one agent.
 * When a saved row already tracks the same terminalSessionId, keep the saved
 * row only (avoid double-listing the same CLI session).
 *
 * @param saved - Agent-scoped localStorage chats.
 * @param cli - Agent-scoped native CLI sessions (already mapped).
 * @returns Newest-first combined Resume list.
 * @example
 * mergeResumeItems(saved, cli);
 */
export const mergeResumeItems = (
  saved: readonly StoredConversation[],
  cli: readonly ResumeListItem[],
): readonly ResumeListItem[] => {
  const linkedCliIds = new Set(
    saved
      .map((row) => row.terminalSessionId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0),
  );
  const savedItems = saved.map(savedConversationToResumeItem);
  const uniqueCli = cli.filter((row) => {
    const sessionId = row.terminalSessionId;
    return sessionId === undefined || sessionId.length === 0 || !linkedCliIds.has(sessionId);
  });
  return [...savedItems, ...uniqueCli].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

/**
 * Read conversations from local storage (newest first).
 *
 * @returns Stored conversation list, or empty when unavailable/corrupt.
 * @example
 * const list = readConversations();
 */
export const readConversations = (): readonly StoredConversation[] => {
  if (typeof globalThis.localStorage === 'undefined') {
    return [];
  }
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(isStoredConversation)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
};

/**
 * Persist conversations (keeps the newest {@link MAX_CONVERSATIONS}).
 *
 * @param conversations - Full list to store.
 * @returns Nothing.
 * @example
 * writeConversations(next);
 */
export const writeConversations = (conversations: readonly StoredConversation[]): void => {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }
  try {
    const trimmed = conversations
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_CONVERSATIONS);
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota
  }
};

/**
 * Create a new conversation row and put it at the front of the list.
 *
 * @param input - Assistant and optional title/preview.
 * @returns The created conversation.
 * @example
 * const chat = createConversation({ assistant: 'claude' });
 */
export const createConversation = (input: {
  readonly assistant: VybeAssistant;
  readonly title?: string;
  readonly preview?: string;
  readonly terminalSessionId?: string;
  readonly cwd?: string;
  readonly sourcePath?: string;
}): StoredConversation => {
  const id =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `chat-${Date.now()}`;
  const row: StoredConversation = {
    id,
    title: input.title ?? 'New chat',
    assistant: input.assistant,
    updatedAt: new Date().toISOString(),
    preview: input.preview ?? 'Empty chat — send a message to get started.',
    ...(input.terminalSessionId === undefined
      ? {}
      : { terminalSessionId: input.terminalSessionId }),
    ...(input.cwd !== undefined && input.cwd.length > 0 ? { cwd: input.cwd } : {}),
    ...(input.sourcePath !== undefined && input.sourcePath.length > 0
      ? { sourcePath: input.sourcePath }
      : {}),
  };
  const next = [row, ...readConversations().filter((item) => item.id !== row.id)];
  writeConversations(next);
  return row;
};

/**
 * Touch a conversation's timestamp/title after a turn.
 *
 * @param id - Conversation id.
 * @param patch - Fields to update.
 * @returns Nothing.
 * @example
 * touchConversation(id, { preview: 'Hello' });
 */
export const touchConversation = (
  id: string,
  patch: Partial<Pick<StoredConversation, 'title' | 'preview' | 'assistant' | 'terminalSessionId'>>,
): void => {
  const list = readConversations();
  const next = list.map((row) => {
    if (row.id !== id) {
      return row;
    }
    return {
      ...row,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  });
  writeConversations(next);
};

/**
 * Remove one conversation from storage.
 *
 * @param id - Conversation id.
 * @returns Nothing.
 * @example
 * deleteConversation(id);
 */
export const deleteConversation = (id: string): void => {
  writeConversations(readConversations().filter((row) => row.id !== id));
};

/**
 * Format a short relative time for conversation lists.
 *
 * @param iso - ISO timestamp.
 * @returns Human-readable relative label.
 * @example
 * const label = formatConversationTime('2026-01-01T00:00:00.000Z');
 */
export const formatConversationTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) {
    return 'just now';
  }
  if (diff < 3_600_000) {
    return `${Math.floor(diff / 60_000)}m ago`;
  }
  if (diff < 86_400_000) {
    return `${Math.floor(diff / 3_600_000)}h ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Normalize free text for case/diacritic-insensitive conversation search.
 *
 * @param value - Raw title, preview, or query fragment.
 * @returns Lowercased, accent-stripped text.
 * @example
 * normalizeConversationSearch('What's my Sub') // "whats my sub"
 */
export const normalizeConversationSearch = (value: string): string =>
  value.normalize('NFKD').replace(DIACRITIC_MARKS, '').toLowerCase().trim();

/**
 * Score how well a conversation matches a vibe-coder name query (higher is better).
 * Empty query scores every row equally so callers can keep the saved order.
 *
 * @param row - Stored chat to rank.
 * @param query - Free-text search (chat name / snippet).
 * @param agentLabel - Human agent label for this row (e.g. "Claude Code").
 * @returns Match score; `0` means no match when the query is non-empty.
 * @example
 * scoreConversationNameMatch(row, 'whats sub', 'Claude Code');
 */
export const scoreConversationNameMatch = (
  row: StoredConversation,
  query: string,
  agentLabel: string,
): number => {
  const q = normalizeConversationSearch(query);
  if (q.length === 0) {
    return 1;
  }

  const title = normalizeConversationSearch(row.title);
  const folder = normalizeConversationSearch(formatFolderPathLabel(row.cwd) || (row.cwd ?? ''));
  const haystack = normalizeConversationSearch(
    `${row.title} ${row.preview} ${agentLabel} ${row.cwd ?? ''} ${folder}`,
  );

  if (title === q) {
    return 100;
  }
  if (title.startsWith(q)) {
    return 80;
  }
  if (title.includes(q)) {
    return 60;
  }
  // Folder / path match (e.g. search "genshot" or "wedding").
  if (
    folder.length > 0 &&
    (folder.includes(q) || normalizeConversationSearch(row.cwd ?? '').includes(q))
  ) {
    return 55;
  }

  const tokens = q.split(SEARCH_WHITESPACE).filter((token) => token.length > 0);
  if (tokens.length > 0 && tokens.every((token) => haystack.includes(token))) {
    if (tokens.every((token) => title.includes(token))) {
      return 50;
    }
    return 30;
  }

  // Lightweight fuzzy: query characters appear in order inside the title.
  const compact = q.replace(SEARCH_WHITESPACE_GLOBAL, '');
  let cursor = 0;
  for (const char of compact) {
    const found = title.indexOf(char, cursor);
    if (found === -1) {
      return 0;
    }
    cursor = found + 1;
  }
  return compact.length > 0 ? 10 : 0;
};

/**
 * Keep only chats belonging to one agent (Resume is agent-scoped).
 *
 * @param conversations - Full saved list (any order).
 * @param assistant - Active agent id in the panel.
 * @returns Rows for that agent only, preserving caller order.
 * @example
 * filterConversationsByAssistant(list, 'claude');
 */
export const filterConversationsByAssistant = (
  conversations: readonly StoredConversation[],
  assistant: VybeAssistant,
): readonly StoredConversation[] => conversations.filter((row) => row.assistant === assistant);

/**
 * Filter and rank conversations by a fuzzy name/snippet query.
 *
 * @param conversations - Full saved list (any order).
 * @param query - Free-text search typed by the vibe coder.
 * @param agentLabelFor - Resolve a display label per assistant id.
 * @returns Matching rows, best name match first (then recency for ties).
 * @example
 * filterConversationsByName(list, 'whats sub', assistantLabel);
 */
export const filterConversationsByName = <T extends StoredConversation>(
  conversations: readonly T[],
  query: string,
  agentLabelFor: (assistant: VybeAssistant) => string,
): readonly T[] => {
  const scored = conversations
    .map((row) => ({
      row,
      score: scoreConversationNameMatch(row, query, agentLabelFor(row.assistant)),
    }))
    .filter((entry) => entry.score > 0);

  const q = normalizeConversationSearch(query);
  if (q.length === 0) {
    // Keep caller order (typically newest-first).
    return scored.map((entry) => entry.row);
  }

  return scored
    .slice()
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.row.updatedAt.localeCompare(a.row.updatedAt);
    })
    .map((entry) => entry.row);
};

/** How the Resume sheet reveals long chat lists. */
export type ResumeListMode = 'pages' | 'infinite';

/**
 * One page of filtered Resume candidates (1-based page index).
 */
export type ConversationPage<T extends StoredConversation = StoredConversation> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
};

/**
 * Slice a filtered conversation list into a 1-based page window.
 * Call after {@link filterConversationsByName} so search always covers the full set.
 *
 * @param conversations - Already-filtered + ranked list (not the raw storage dump).
 * @param page - Requested 1-based page (clamped into range).
 * @param pageSize - Rows per page (defaults to {@link RESUME_PAGE_SIZE}).
 * @returns Page window plus totals for pager chrome.
 * @example
 * paginateConversations(matches, 2, 8);
 */
export const paginateConversations = <T extends StoredConversation>(
  conversations: readonly T[],
  page: number,
  pageSize: number = RESUME_PAGE_SIZE,
): ConversationPage<T> => {
  const total = conversations.length;
  if (total === 0 || pageSize <= 0) {
    return { items: [], page: 1, pageSize: Math.max(1, pageSize), total: 0, totalPages: 0 };
  }
  const totalPages = Math.ceil(total / pageSize);
  const safePage = Math.min(Math.max(1, Math.trunc(page)), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: conversations.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
};

/**
 * First N rows for infinite-scroll Resume mode (prefix of the filtered list).
 *
 * @param conversations - Already-filtered + ranked list.
 * @param count - How many rows to show from the top.
 * @returns Prefix slice; empty when count is non-positive.
 * @example
 * takeConversationWindow(matches, 16);
 */
export const takeConversationWindow = <T extends StoredConversation>(
  conversations: readonly T[],
  count: number,
): readonly T[] => {
  if (count <= 0) {
    return [];
  }
  return conversations.slice(0, count);
};

/**
 * Read the vibe coder's last Resume list mode (pages vs infinite scroll).
 *
 * @returns Stored mode, or `pages` when unset/corrupt.
 * @example
 * const mode = readResumeListMode();
 */
export const readResumeListMode = (): ResumeListMode => {
  if (typeof globalThis.localStorage === 'undefined') {
    return 'pages';
  }
  try {
    const raw = globalThis.localStorage.getItem(RESUME_LIST_MODE_KEY);
    return raw === 'infinite' ? 'infinite' : 'pages';
  } catch {
    return 'pages';
  }
};

/**
 * Persist Resume list mode so the next open remembers Pages vs infinite scroll.
 *
 * @param mode - Chosen reveal mode.
 * @returns Nothing.
 * @example
 * writeResumeListMode('infinite');
 */
export const writeResumeListMode = (mode: ResumeListMode): void => {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }
  try {
    globalThis.localStorage.setItem(RESUME_LIST_MODE_KEY, mode);
  } catch {
    // ignore quota
  }
};

const isStoredConversation = (value: unknown): value is StoredConversation => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const row = value as Partial<StoredConversation>;
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    typeof row.assistant === 'string' &&
    typeof row.updatedAt === 'string' &&
    typeof row.preview === 'string'
  );
};
