import { readdir, readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import {
  cleanTitle,
  decodeClaudeProjectPath,
  extractTextContent,
  isNoiseMessage,
  listSubdirs,
  mtimeIso,
  readDirSafe,
  readFileSafe,
  sessionIdFromFile,
  valueText,
} from './fsUtils';
import type { AgentId } from './registry';
import type { AgentSession } from './sessionTypes';

const sortAndLimit = (sessions: AgentSession[], limit: number): AgentSession[] => {
  sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return sessions.slice(0, limit);
};

/**
 * Kiro: ~/.kiro/sessions/cli/*.json (skip subagents).
 */
const readKiroSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const dir = join(homedir(), '.kiro', 'sessions', 'cli');
  const files = (await readDirSafe(dir)).filter((f) => f.endsWith('.json')).slice(0, 100);

  const parsed = await Promise.all(
    files.map(async (file) => {
      try {
        const raw = await readFile(join(dir, file), 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data.session_created_reason === 'subagent') {
          return null;
        }
        if (cwd !== null && data.cwd !== cwd) {
          return null;
        }
        const session: AgentSession = {
          session_id: valueText(data, 'session_id', sessionIdFromFile(file)),
          title: cleanTitle(valueText(data, 'title', '(untitled)')),
          cwd: valueText(data, 'cwd', ''),
          created_at: valueText(data, 'created_at', ''),
          updated_at: valueText(data, 'updated_at', ''),
          source_path: join(dir, file),
        };
        return session;
      } catch {
        return null;
      }
    }),
  );

  return sortAndLimit(
    parsed.filter((s): s is AgentSession => s !== null),
    limit,
  );
};

/**
 * Claude Code stores transcripts under ~/.claude/projects/<encoded-cwd>/*.jsonl
 * (not ~/.claude/sessions, which is often empty).
 */
const readClaudeSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const projectsRoot = join(homedir(), '.claude', 'projects');
  const projectDirs = await listSubdirs(projectsRoot);
  const sessions: AgentSession[] = [];

  for (const projectDir of projectDirs) {
    const projectName = basename(projectDir);
    const projectCwd = decodeClaudeProjectPath(projectName);
    if (cwd !== null && !projectCwd.includes(basename(cwd)) && projectCwd !== cwd) {
      continue;
    }

    const files = (await readDirSafe(projectDir)).filter(
      (f) => f.endsWith('.jsonl') && !f.includes('subagent'),
    );

    for (const file of files.slice(0, 40)) {
      const fullPath = join(projectDir, file);
      try {
        const info = await stat(fullPath);
        if (!info.isFile()) {
          continue;
        }
        const raw = await readFile(fullPath, 'utf-8');
        const lines = raw.split('\n').filter((line) => line.trim().length > 0);
        let title = '(untitled)';
        let sessionId = sessionIdFromFile(file);
        let createdAt = info.birthtime.toISOString();

        for (const line of lines.slice(0, 80)) {
          try {
            const row = JSON.parse(line) as Record<string, unknown>;
            if (typeof row.sessionId === 'string') {
              sessionId = row.sessionId;
            }
            if (typeof row.timestamp === 'string' && createdAt === info.birthtime.toISOString()) {
              createdAt = row.timestamp;
            }
            if (row.type === 'user' && row.message && typeof row.message === 'object') {
              const content = extractTextContent((row.message as { content?: unknown }).content);
              if (content.length > 0 && !isNoiseMessage(content)) {
                title = cleanTitle(content);
                break;
              }
            }
          } catch {
            // skip bad lines
          }
        }

        sessions.push({
          session_id: sessionId,
          title,
          cwd: projectCwd,
          created_at: createdAt,
          updated_at: info.mtime.toISOString(),
          source_path: fullPath,
        });
      } catch {
        // skip unreadable
      }
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * Cursor: ~/.cursor/projects/{project}/agent-transcripts/{id}/{id}.jsonl
 */
const readCursorSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const projectsRoot = join(homedir(), '.cursor', 'projects');
  const projectDirs = await listSubdirs(projectsRoot);
  const sessions: AgentSession[] = [];

  for (const projectDir of projectDirs) {
    if (cwd !== null && !basename(projectDir).includes(basename(cwd).replaceAll('/', '-'))) {
      // Soft filter — Cursor encodes paths differently; still include when unclear
    }

    const transcriptsRoot = join(projectDir, 'agent-transcripts');
    const transcriptDirs = await listSubdirs(transcriptsRoot);

    for (const transcriptDir of transcriptDirs.slice(0, 40)) {
      if (basename(transcriptDir) === 'subagents') {
        continue;
      }
      const id = basename(transcriptDir);
      const fullPath = join(transcriptDir, `${id}.jsonl`);
      const raw = await readFileSafe(fullPath);
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
            // Strip timestamp prefix Cursor injects
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
        session_id: id,
        title,
        cwd: projectDir,
        created_at: createdAt,
        updated_at: updated,
        source_path: fullPath,
      });
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * Codex: prefer ~/.codex/session_index.jsonl, fall back to sessions tree.
 */
const readCodexSessions = async (_cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const indexPath = join(homedir(), '.codex', 'session_index.jsonl');
  const indexRaw = await readFileSafe(indexPath);
  const sessions: AgentSession[] = [];

  if (indexRaw !== null) {
    for (const line of indexRaw.split('\n').filter((l) => l.trim().length > 0)) {
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        const id = valueText(row, 'id', '');
        if (id.length === 0) {
          continue;
        }
        const title = cleanTitle(
          valueText(row, 'thread_name', valueText(row, 'title', '(untitled)')),
        );
        // Strip accidental XML-ish command wrappers from old codex titles
        const clean = title.replaceAll(/<\/?command-[^>]+>/g, '').trim() || '(untitled)';
        sessions.push({
          session_id: id,
          title: cleanTitle(clean),
          cwd: valueText(row, 'cwd', ''),
          created_at: valueText(row, 'updated_at', ''),
          updated_at: valueText(row, 'updated_at', ''),
        });
      } catch {
        // skip
      }
    }
    return sortAndLimit(sessions, limit);
  }

  // Fallback: walk ~/.codex/sessions/**/*.jsonl
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
        // rollout-...-UUID.jsonl
        const match = entry.match(
          /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
        );
        const id = match?.[1] ?? sessionIdFromFile(entry);
        sessions.push({
          session_id: id,
          title: cleanTitle(entry),
          cwd: '',
          created_at: info.birthtime.toISOString(),
          updated_at: info.mtime.toISOString(),
          source_path: full,
        });
      } catch {
        // skip
      }
    }
  };

  await walk(join(homedir(), '.codex', 'sessions'), 0);
  return sortAndLimit(sessions, limit);
};

/**
 * Kimi Code: ~/.kimi-code/session_index.jsonl + state.json titles.
 */
const readKimiSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const indexPath = join(homedir(), '.kimi-code', 'session_index.jsonl');
  const indexRaw = await readFileSafe(indexPath);
  const sessions: AgentSession[] = [];

  if (indexRaw !== null) {
    for (const line of indexRaw.split('\n').filter((l) => l.trim().length > 0)) {
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        const sessionId = valueText(row, 'sessionId', '');
        const sessionDir = valueText(row, 'sessionDir', '');
        const workDir = valueText(row, 'workDir', '');
        if (sessionId.length === 0) {
          continue;
        }
        if (cwd !== null && workDir.length > 0 && workDir !== cwd && !workDir.includes(cwd)) {
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
          session_id: sessionId,
          title,
          cwd: workDir,
          created_at: createdAt,
          updated_at: updatedAt || createdAt,
          source_path: sessionDir.length > 0 ? join(sessionDir, 'state.json') : undefined,
        });
      } catch {
        // skip
      }
    }
    return sortAndLimit(sessions, limit);
  }

  return [];
};

/**
 * Grok: walk ~/.grok/sessions for summary.json files (skip subagent sessions).
 */
const readGrokSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const root = join(homedir(), '.grok', 'sessions');
  const sessions: AgentSession[] = [];

  const walk = async (dir: string, depth: number): Promise<void> => {
    if (depth > 6 || sessions.length >= limit * 3) {
      return;
    }
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const info = await stat(full);
        if (info.isDirectory()) {
          await walk(full, depth + 1);
          continue;
        }
        if (entry !== 'summary.json') {
          continue;
        }
        const raw = await readFile(full, 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data.session_kind === 'subagent') {
          continue;
        }
        const infoObj =
          data.info && typeof data.info === 'object' ? (data.info as Record<string, unknown>) : {};
        const sessionCwd = valueText(infoObj, 'cwd', '');
        if (cwd !== null && sessionCwd.length > 0 && sessionCwd !== cwd) {
          // keep sessions for other dirs — user may still want them
        }
        const id = valueText(infoObj, 'id', basename(dir));
        sessions.push({
          session_id: id,
          title: cleanTitle(valueText(data, 'session_summary', '(untitled)')),
          cwd: sessionCwd,
          created_at: valueText(data, 'created_at', ''),
          updated_at: valueText(data, 'updated_at', ''),
          source_path: full,
        });
      } catch {
        // skip
      }
    }
  };

  await walk(root, 0);
  return sortAndLimit(sessions, limit);
};

/**
 * Gemini / generic ~/.{name}/sessions fallback.
 */
const readGenericSessions = async (
  agentName: string,
  _cwd: string | null,
  limit: number,
): Promise<AgentSession[]> => {
  const dir = join(homedir(), `.${agentName}`, 'sessions');
  const files = (await readDirSafe(dir)).filter((f) => f.endsWith('.json') || f.endsWith('.jsonl'));
  const sessions: AgentSession[] = [];

  for (const file of files.slice(0, limit * 2)) {
    try {
      const full = join(dir, file);
      const raw = await readFile(full, 'utf-8');
      const firstLine = raw.trim().split('\n')[0] ?? '{}';
      const data = JSON.parse(firstLine) as Record<string, unknown>;
      const updated = await mtimeIso(full);
      sessions.push({
        session_id: valueText(data, 'session_id', sessionIdFromFile(file)),
        title: cleanTitle(valueText(data, 'title', '(untitled)')),
        cwd: valueText(data, 'cwd', ''),
        created_at: valueText(data, 'created_at', updated),
        updated_at: valueText(data, 'updated_at', updated),
        source_path: full,
      });
    } catch {
      // skip
    }
  }

  return sortAndLimit(sessions, limit);
};

/**
 * Devin: try `devin list --format json` is async and cwd-scoped; best-effort empty for now
 * unless a local sessions dir appears later.
 */
const readDevinSessions = async (_cwd: string | null, limit: number): Promise<AgentSession[]> => {
  // Devin stores cloud-oriented state; local listing is cwd-scoped via CLI.
  // Try common config locations first.
  const candidates = [
    join(homedir(), '.devin', 'sessions'),
    join(homedir(), '.config', 'devin', 'sessions'),
  ];
  for (const dir of candidates) {
    const files = await readDirSafe(dir);
    if (files.length > 0) {
      return readGenericFromDir(dir, limit);
    }
  }
  return [];
};

const readGenericFromDir = async (dir: string, limit: number): Promise<AgentSession[]> => {
  const files = (await readDirSafe(dir)).filter((f) => f.endsWith('.json') || f.endsWith('.jsonl'));
  const sessions: AgentSession[] = [];
  for (const file of files.slice(0, limit * 2)) {
    const full = join(dir, file);
    const updated = await mtimeIso(full);
    sessions.push({
      session_id: sessionIdFromFile(file),
      title: cleanTitle(sessionIdFromFile(file)),
      cwd: '',
      created_at: updated,
      updated_at: updated,
      source_path: full,
    });
  }
  return sortAndLimit(sessions, limit);
};

/**
 * List sessions for one agent from its local filesystem store.
 *
 * @param agentId - Agent to list.
 * @param cwd - Optional working-directory filter.
 * @param limit - Max rows.
 * @returns Session metadata rows newest first.
 * @example
 * const sessions = await listAgentSessions('claude-code', null, 30);
 */
export const listAgentSessions = async (
  agentId: AgentId,
  cwd: string | null,
  limit: number,
): Promise<AgentSession[]> => {
  switch (agentId) {
    case 'kiro':
      return readKiroSessions(cwd, limit);
    case 'claude-code':
      return readClaudeSessions(cwd, limit);
    case 'cursor':
      return readCursorSessions(cwd, limit);
    case 'codex':
      return readCodexSessions(cwd, limit);
    case 'kimi':
      return readKimiSessions(cwd, limit);
    case 'grok':
      return readGrokSessions(cwd, limit);
    case 'gemini':
      return readGenericSessions('gemini', cwd, limit);
    case 'devin':
      return readDevinSessions(cwd, limit);
  }
};
