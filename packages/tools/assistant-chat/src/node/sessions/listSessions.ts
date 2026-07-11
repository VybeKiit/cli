import { execFile } from 'node:child_process';
import { open, readFile, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';
import type { VybeAssistant } from '@vybekiit/report-mode';

const execFileAsync = promisify(execFile);

import { resolveAgentStoreRoots } from './agentHomes';
import {
  cleanTitle,
  decodeClaudeProjectPath,
  decodeEncodedProjectPath,
  extractTextContent,
  isNoiseMessage,
  listSubdirs,
  mtimeIso,
  readDirSafe,
  readFileSafe,
  sessionIdFromFile,
  valueText,
} from './fsUtils';
import type { ListSessionsResponse, NativeAgentSession } from './types';

/** Cap how much of a transcript we read when minting a title (keeps Resume snappy). */
const TITLE_SNIFF_BYTES = 48_000;
/**
 * Default Resume list size. High enough to surface chats from many project
 * folders (not just the monorepo currently open in the landing app).
 */
const DEFAULT_SESSION_LIMIT = 150;
/** Per-project cap so one busy folder cannot crowd out every other repo. */
const PER_PROJECT_SESSION_CAP = 24;

const sortAndLimit = (sessions: NativeAgentSession[], limit: number): NativeAgentSession[] => {
  sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return sessions.slice(0, limit);
};

/**
 * Prefer the newest files in a project dir, then cap so multi-folder lists stay fair.
 *
 * @param files - Absolute file paths.
 * @param cap - Max files to keep from this project.
 * @returns Newest-first absolute paths (capped).
 */
const newestFilesFirst = async (files: readonly string[], cap: number): Promise<string[]> => {
  const stamped = await Promise.all(
    files.map(async (fullPath) => {
      try {
        const info = await stat(fullPath);
        return { fullPath, mtimeMs: info.mtimeMs, isFile: info.isFile() };
      } catch {
        return null;
      }
    }),
  );
  return stamped
    .filter((row): row is { fullPath: string; mtimeMs: number; isFile: boolean } => row !== null)
    .filter((row) => row.isFile)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, cap)
    .map((row) => row.fullPath);
};

/**
 * Read only the leading bytes of a file (UTF-8), for cheap title sniffing.
 *
 * @param path - Absolute file path.
 * @param maxBytes - Max bytes to read from the start.
 * @returns Partial text, or null when missing.
 */
const readFileHead = async (path: string, maxBytes: number): Promise<string | null> => {
  try {
    const handle = await open(path, 'r');
    try {
      const buffer = Buffer.alloc(maxBytes);
      const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
      return buffer.subarray(0, bytesRead).toString('utf-8');
    } finally {
      await handle.close();
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * Kiro: `$KIRO_HOME/sessions/cli/*.json` (default `~/.kiro`, skip subagents).
 */
const readKiroSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  const dir = resolveAgentStoreRoots().kiroSessionsCli;
  const files = (await readDirSafe(dir)).filter((file) => file.endsWith('.json')).slice(0, 100);

  const parsed = await Promise.all(
    files.map(async (file) => {
      try {
        const raw = await readFile(join(dir, file), 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data.session_created_reason === 'subagent') {
          return null;
        }
        const session: NativeAgentSession = {
          sessionId: valueText(data, 'session_id', sessionIdFromFile(file)),
          title: cleanTitle(valueText(data, 'title', '(untitled)')),
          cwd: valueText(data, 'cwd', ''),
          createdAt: valueText(data, 'created_at', ''),
          updatedAt: valueText(data, 'updated_at', ''),
          assistant: 'kiro',
          sourcePath: join(dir, file),
        };
        return session;
      } catch {
        return null;
      }
    }),
  );

  return sortAndLimit(
    parsed.filter((session): session is NativeAgentSession => session !== null),
    limit,
  );
};

/**
 * Claude Code stores transcripts under
 * `$CLAUDE_CONFIG_DIR/projects/<encoded-cwd>/*.jsonl` (default `~/.claude`,
 * Windows `%USERPROFILE%\.claude`). Walks every project folder (all repos),
 * not just the monorepo currently open — cwd prefers the real path in the transcript.
 */
const readClaudeSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  const projectsRoot = resolveAgentStoreRoots().claudeProjects;
  const projectDirs = await listSubdirs(projectsRoot);
  const sessions: NativeAgentSession[] = [];

  for (const projectDir of projectDirs) {
    const projectName = basename(projectDir);
    const fallbackCwd = decodeClaudeProjectPath(projectName);
    const fileNames = (await readDirSafe(projectDir)).filter(
      (file) => file.endsWith('.jsonl') && !file.includes('subagent'),
    );
    const fullPaths = await newestFilesFirst(
      fileNames.map((file) => join(projectDir, file)),
      PER_PROJECT_SESSION_CAP,
    );

    for (const fullPath of fullPaths) {
      try {
        const info = await stat(fullPath);
        const raw = await readFileHead(fullPath, TITLE_SNIFF_BYTES);
        if (raw === null) {
          continue;
        }
        const lines = raw.split('\n').filter((line) => line.trim().length > 0);
        let title = '(untitled)';
        let sessionId = sessionIdFromFile(basename(fullPath));
        let createdAt = info.birthtime.toISOString();
        let transcriptCwd = '';

        for (const line of lines.slice(0, 80)) {
          try {
            const row = JSON.parse(line) as Record<string, unknown>;
            if (typeof row.sessionId === 'string') {
              sessionId = row.sessionId;
            }
            if (typeof row.cwd === 'string' && row.cwd.length > 0 && transcriptCwd.length === 0) {
              transcriptCwd = row.cwd;
            }
            if (typeof row.timestamp === 'string' && createdAt === info.birthtime.toISOString()) {
              createdAt = row.timestamp;
            }
            if (row.type === 'user' && row.message && typeof row.message === 'object') {
              const content = extractTextContent((row.message as { content?: unknown }).content);
              if (content.length > 0 && !isNoiseMessage(content)) {
                title = cleanTitle(content);
                // Keep scanning a bit for cwd if we still need it, but title is set.
                if (transcriptCwd.length > 0) {
                  break;
                }
              }
            }
          } catch {
            // skip bad lines (incl. truncated last line from head sniff)
          }
        }

        sessions.push({
          sessionId,
          title,
          cwd: transcriptCwd.length > 0 ? transcriptCwd : fallbackCwd,
          createdAt,
          updatedAt: info.mtime.toISOString(),
          assistant: 'claude',
          sourcePath: fullPath,
        });
      } catch {
        // skip unreadable
      }
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * Cursor: `~/.cursor/projects/{project}/agent-transcripts/{id}/{id}.jsonl`
 * (Windows: `%USERPROFILE%\.cursor\…`; WSL: Linux home). Project segment is
 * often an encoded path (`Users-…`, `home-…`, or Windows `C--Users-…`).
 */
const readCursorSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  const projectsRoot = resolveAgentStoreRoots().cursorProjects;
  const projectDirs = await listSubdirs(projectsRoot);
  const sessions: NativeAgentSession[] = [];

  for (const projectDir of projectDirs) {
    const projectName = basename(projectDir);
    const projectCwd = decodeEncodedProjectPath(projectName);
    const transcriptsRoot = join(projectDir, 'agent-transcripts');
    const transcriptDirs = await listSubdirs(transcriptsRoot);
    const candidates = transcriptDirs
      .filter((dir) => basename(dir) !== 'subagents')
      .map((dir) => {
        const id = basename(dir);
        return { id, fullPath: join(dir, `${id}.jsonl`) };
      });
    const newest = await newestFilesFirst(
      candidates.map((row) => row.fullPath),
      PER_PROJECT_SESSION_CAP,
    );
    const byPath = new Map(candidates.map((row) => [row.fullPath, row.id]));

    for (const fullPath of newest) {
      const id = byPath.get(fullPath);
      if (id === undefined) {
        continue;
      }
      const raw = await readFileHead(fullPath, TITLE_SNIFF_BYTES);
      if (raw === null) {
        continue;
      }

      const lines = raw.split('\n').filter((line) => line.trim().length > 0);
      let title = '(untitled)';
      const createdAt = await mtimeIso(fullPath);

      for (const line of lines.slice(0, 30)) {
        try {
          const row = JSON.parse(line) as Record<string, unknown>;
          if (row.role === 'user' && row.message && typeof row.message === 'object') {
            const content = extractTextContent((row.message as { content?: unknown }).content);
            const withoutTs = content.replace(/^<timestamp>[\s\S]*?<\/timestamp>\s*/i, '');
            const withoutQuery = withoutTs.replace(/<\/?user_query>/gi, '').trim();
            if (withoutQuery.length > 0 && !isNoiseMessage(withoutQuery)) {
              title = cleanTitle(withoutQuery);
              break;
            }
          }
        } catch {
          // skip
        }
      }

      const updated = await mtimeIso(fullPath);
      sessions.push({
        sessionId: id,
        title,
        // Prefer decoded project path; fall back to empty (UI hides empty cwd).
        cwd: projectCwd,
        createdAt,
        updatedAt: updated,
        assistant: 'cursor',
        sourcePath: fullPath,
      });
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * Codex: prefer `$CODEX_HOME/session_index.jsonl`, fall back to sessions tree
 * (default `~/.codex`, Windows `%USERPROFILE%\.codex`).
 */
const readCodexSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  const roots = resolveAgentStoreRoots();
  const indexPath = roots.codexSessionIndex;
  const indexRaw = await readFileSafe(indexPath);
  const sessions: NativeAgentSession[] = [];

  if (indexRaw !== null) {
    for (const line of indexRaw.split('\n').filter((entry) => entry.trim().length > 0)) {
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        const id = valueText(row, 'id', '');
        if (id.length === 0) {
          continue;
        }
        const title = cleanTitle(
          valueText(row, 'thread_name', valueText(row, 'title', '(untitled)')),
        );
        const clean = title.replaceAll(/<\/?command-[^>]+>/g, '').trim() || '(untitled)';
        sessions.push({
          sessionId: id,
          title: cleanTitle(clean),
          cwd: valueText(row, 'cwd', ''),
          createdAt: valueText(row, 'updated_at', ''),
          updatedAt: valueText(row, 'updated_at', ''),
          assistant: 'codex',
        });
      } catch {
        // skip
      }
    }
    return sortAndLimit(sessions, limit);
  }

  const walk = async (dir: string, depth: number): Promise<void> => {
    if (depth > 5 || sessions.length >= limit * 2) {
      return;
    }
    const entries = await readDirSafe(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const info = await stat(full);
        if (info.isDirectory()) {
          await walk(full, depth + 1);
          continue;
        }
        if (!entry.endsWith('.jsonl')) {
          continue;
        }
        const match = entry.match(
          /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
        );
        const id = match?.[1] ?? sessionIdFromFile(entry);
        sessions.push({
          sessionId: id,
          title: cleanTitle(entry),
          cwd: '',
          createdAt: info.birthtime.toISOString(),
          updatedAt: info.mtime.toISOString(),
          assistant: 'codex',
          sourcePath: full,
        });
      } catch {
        // skip
      }
    }
  };

  await walk(roots.codexSessions, 0);
  return sortAndLimit(sessions, limit);
};

/**
 * Kimi Code: `$KIMI_CODE_HOME/session_index.jsonl` + state.json titles
 * (default `~/.kimi-code`).
 */
const readKimiSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  const indexPath = resolveAgentStoreRoots().kimiSessionIndex;
  const indexRaw = await readFileSafe(indexPath);
  const sessions: NativeAgentSession[] = [];

  if (indexRaw === null) {
    return [];
  }

  for (const line of indexRaw.split('\n').filter((entry) => entry.trim().length > 0)) {
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const sessionId = valueText(row, 'sessionId', '');
      const sessionDir = valueText(row, 'sessionDir', '');
      const workDir = valueText(row, 'workDir', '');
      if (sessionId.length === 0) {
        continue;
      }

      let title = '(untitled)';
      let createdAt = '';
      let updatedAt = '';
      if (sessionDir.length > 0) {
        const stateRaw = await readFileSafe(join(sessionDir, 'state.json'));
        if (stateRaw !== null) {
          const state = JSON.parse(stateRaw) as Record<string, unknown>;
          title = cleanTitle(valueText(state, 'title', '(untitled)'));
          createdAt = valueText(state, 'createdAt', '');
          updatedAt = valueText(state, 'updatedAt', '');
        }
      }

      sessions.push({
        sessionId,
        title,
        cwd: workDir,
        createdAt,
        updatedAt: updatedAt || createdAt,
        assistant: 'kimi',
        sourcePath: sessionDir.length > 0 ? join(sessionDir, 'state.json') : undefined,
      });
    } catch {
      // skip
    }
  }
  return sortAndLimit(sessions, limit);
};

/**
 * Decode a Grok project folder name (`%2FUsers%2Fme%2FCode%2Fapp` → absolute path).
 * Falls back to empty when the segment is not a URI-encoded path.
 *
 * @param encoded - Folder name under Grok sessions root.
 * @returns Absolute cwd, or empty string.
 */
const decodeGrokProjectFolder = (encoded: string): string => {
  if (encoded.length === 0 || encoded.includes('subagent-')) {
    return '';
  }
  try {
    const decoded = decodeURIComponent(encoded);
    // Unix absolute, Windows drive (C:\… or C:/…), or UNC.
    if (decoded.startsWith('/') || /^[A-Za-z]:[\\/]/.test(decoded) || decoded.startsWith('\\\\')) {
      return decoded;
    }
  } catch {
    // not a valid URI encoding
  }
  return '';
};

/**
 * Grok stores one folder per project under `~/.grok/sessions` (Windows:
 * `%USERPROFILE%\.grok\sessions`):
 *   `<url-encoded-cwd>/<session-id>/summary.json`
 * Walk every project folder (all repos), skip subagent / subagent_resume sessions,
 * and keep a per-project cap so one busy repo cannot hide the rest.
 */
const readGrokSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  const root = resolveAgentStoreRoots().grokSessions;
  const projectDirs = await listSubdirs(root);
  const sessions: NativeAgentSession[] = [];

  for (const projectDir of projectDirs) {
    const projectName = basename(projectDir);
    // Skip worktree-only subagent project roots (name embeds subagent-…).
    if (projectName.includes('subagent-')) {
      continue;
    }
    const folderCwd = decodeGrokProjectFolder(projectName);
    const sessionDirs = await listSubdirs(projectDir);
    const summaryPaths = sessionDirs.map((sessionDir) => join(sessionDir, 'summary.json'));
    const newest = await newestFilesFirst(summaryPaths, PER_PROJECT_SESSION_CAP);

    for (const full of newest) {
      try {
        const raw = await readFile(full, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        const kind = typeof data.session_kind === 'string' ? data.session_kind : '';
        // Subagent / resume-of-subagent are not first-class chats for Resume.
        if (kind === 'subagent' || kind === 'subagent_resume') {
          continue;
        }
        const infoObj =
          data.info && typeof data.info === 'object' ? (data.info as Record<string, unknown>) : {};
        const id = valueText(infoObj, 'id', basename(dirname(full)));
        const title = cleanTitle(
          valueText(data, 'session_summary', valueText(data, 'generated_title', '(untitled)')),
        );
        const transcriptCwd = valueText(infoObj, 'cwd', '');
        const updatedAt = valueText(
          data,
          'last_active_at',
          valueText(data, 'updated_at', await mtimeIso(full)),
        );
        sessions.push({
          sessionId: id,
          title,
          cwd: transcriptCwd.length > 0 ? transcriptCwd : folderCwd,
          createdAt: valueText(data, 'created_at', updatedAt),
          updatedAt,
          assistant: 'grok',
          sourcePath: full,
        });
      } catch {
        // skip unreadable / partial summaries
      }
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * Convert Devin's unix-second activity timestamps to ISO strings.
 *
 * @param seconds - `created_at` / `last_activity_at` from sessions.db.
 * @returns ISO timestamp, or empty when invalid.
 */
const unixSecondsToIso = (seconds: unknown): string => {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return '';
  }
  return new Date(seconds * 1000).toISOString();
};

/**
 * Candidate absolute paths for Devin's local sessions SQLite DB.
 * Official: macOS/Linux `~/.local/share/devin/cli/sessions.db`,
 * Windows `%APPDATA%\devin\cli\sessions.db`, plus `XDG_DATA_HOME` when set.
 */
const devinSessionsDbPaths = (): string[] => [...resolveAgentStoreRoots().devinSessionsDbs];

/**
 * Query Devin's sessions.db in a fresh Node process.
 * Bundlers (Next/webpack/tsup) rewrite or strip `node:sqlite`; a child process
 * always sees the real builtin and returns multi-folder rows as JSON.
 *
 * @param dbPath - Absolute path to sessions.db.
 * @param limit - Max rows (clamped).
 * @returns Parsed session rows, or null when the query fails.
 */
const queryDevinSessionsDb = async (
  dbPath: string,
  limit: number,
): Promise<readonly Record<string, unknown>[] | null> => {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));
  // SQL is built only from a clamped integer + a JSON-stringified path.
  const script = `
const { DatabaseSync } = await import("node:sqlite");
const dbPath = ${JSON.stringify(dbPath)};
const db = new DatabaseSync(dbPath, { readOnly: true });
try {
  const rows = db.prepare(
    "SELECT id, working_directory, title, created_at, last_activity_at FROM sessions WHERE COALESCE(hidden, 0) = 0 ORDER BY last_activity_at DESC LIMIT ${String(safeLimit)}"
  ).all();
  process.stdout.write(JSON.stringify(rows));
} finally {
  db.close();
}
`;
  try {
    const { stdout } = await execFileAsync(
      process.execPath,
      ['--input-type=module', '-e', script],
      {
        timeout: 10_000,
        maxBuffer: 4 * 1024 * 1024,
        env: process.env,
      },
    );
    const parsed: unknown = JSON.parse(stdout);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed as readonly Record<string, unknown>[];
  } catch {
    return null;
  }
};

/**
 * Devin CLI: all workspaces live in one SQLite DB (not cwd-scoped JSON dumps).
 * `devin list --format json` only returns the current directory; Resume needs every
 * folder, so we read the DB the CLI itself uses.
 */
const readDevinSessions = async (limit: number): Promise<NativeAgentSession[]> => {
  for (const dbPath of devinSessionsDbPaths()) {
    const rows = await queryDevinSessionsDb(dbPath, limit);
    if (rows === null || rows.length === 0) {
      continue;
    }

    const sessions: NativeAgentSession[] = [];
    for (const row of rows) {
      const id = typeof row.id === 'string' ? row.id : '';
      if (id.length === 0) {
        continue;
      }
      const updatedAt = unixSecondsToIso(row.last_activity_at);
      const createdAt = unixSecondsToIso(row.created_at) || updatedAt;
      const titleRaw =
        typeof row.title === 'string' && row.title.trim().length > 0 ? row.title : id;
      sessions.push({
        sessionId: id,
        title: cleanTitle(titleRaw),
        cwd: typeof row.working_directory === 'string' ? row.working_directory : '',
        createdAt,
        updatedAt,
        assistant: 'devin',
        sourcePath: dbPath,
      });
    }
    if (sessions.length > 0) {
      return sortAndLimit(sessions, limit);
    }
  }

  return readDevinTranscriptFallback(limit);
};

/**
 * Fallback when sessions.db is missing: export JSON under Devin transcript
 * dirs (Unix XDG / Windows APPDATA — see `resolveDevinTranscriptDirs`).
 */
const readDevinTranscriptFallback = async (limit: number): Promise<NativeAgentSession[]> => {
  const dirs = resolveAgentStoreRoots().devinTranscriptDirs;
  const sessions: NativeAgentSession[] = [];

  for (const dir of dirs) {
    const files = (await readDirSafe(dir)).filter((file) => file.endsWith('.json'));
    for (const file of files) {
      const full = join(dir, file);
      try {
        const raw = await readFile(full, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        const sessionId = valueText(data, 'session_id', sessionIdFromFile(file));
        // Title: first user step message when present.
        let title = sessionId;
        if (Array.isArray(data.steps)) {
          for (const step of data.steps) {
            if (step === null || typeof step !== 'object') {
              continue;
            }
            const row = step as Record<string, unknown>;
            if (row.source === 'user' && typeof row.message === 'string') {
              const text = row.message.trim();
              if (text.length > 0 && !isNoiseMessage(text)) {
                title = cleanTitle(text);
                break;
              }
            }
          }
        }
        const updated = await mtimeIso(full);
        sessions.push({
          sessionId,
          title: cleanTitle(title),
          cwd: '',
          createdAt: updated,
          updatedAt: updated,
          assistant: 'devin',
          sourcePath: full,
        });
      } catch {
        // skip
      }
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * List native CLI sessions for one assistant from its local filesystem store.
 * Paths match each agent's official on-disk layout (same approach as the local
 * dev console). Newest first.
 *
 * @param assistant - Agent whose sessions to list.
 * @param limit - Max rows (default 150 — multi-folder Resume).
 * @returns Session metadata rows.
 * @example
 * const sessions = await listNativeSessions('claude', 20);
 */
export const listNativeSessions = async (
  assistant: VybeAssistant,
  limit = DEFAULT_SESSION_LIMIT,
): Promise<NativeAgentSession[]> => {
  switch (assistant) {
    case 'kiro':
      return readKiroSessions(limit);
    case 'claude':
      return readClaudeSessions(limit);
    case 'cursor':
      return readCursorSessions(limit);
    case 'codex':
      return readCodexSessions(limit);
    case 'kimi':
      return readKimiSessions(limit);
    case 'grok':
      return readGrokSessions(limit);
    case 'devin':
      return readDevinSessions(limit);
  }
};

/**
 * Build the list-sessions API payload for one assistant.
 *
 * @param assistant - Agent id.
 * @param limit - Max sessions.
 * @returns Response body for the browser Resume sheet.
 * @example
 * const body = await buildListSessionsResponse('kimi');
 */
export const buildListSessionsResponse = async (
  assistant: VybeAssistant,
  limit = DEFAULT_SESSION_LIMIT,
): Promise<ListSessionsResponse> => ({
  assistant,
  sessions: await listNativeSessions(assistant, limit),
  fetchedAt: new Date().toISOString(),
});
