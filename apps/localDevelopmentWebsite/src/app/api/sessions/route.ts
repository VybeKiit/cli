import { readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

const KIRO_SESSIONS_DIR = join(homedir(), '.kiro', 'sessions', 'cli');
const CLAUDE_SESSIONS_DIR = join(homedir(), '.claude', 'sessions');
const CURSOR_TRANSCRIPTS_DIR = join(homedir(), '.cursor', 'projects');

/** Session row returned by the local agent sessions API. */
export type AgentSession = {
  readonly session_id: string;
  readonly title: string;
  readonly cwd: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly parent_session_id?: string | undefined;
  readonly session_created_reason?: string | undefined;
};

const valueText = (data: Record<string, unknown>, key: string, defaultValue: string): string => {
  const value = data[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return String(value);
};

const sessionIdFromFile = (file: string): string => {
  if (file.endsWith('.jsonl')) {
    return file.slice(0, -'.jsonl'.length);
  }
  if (file.endsWith('.json')) {
    return file.slice(0, -'.json'.length);
  }
  return file;
};

const lastPathPart = (path: string): string => {
  const parts = path.split('/').filter((part) => part.length > 0);
  const last = parts.at(-1);
  if (last === undefined) {
    throw new Error(`Could not read the last path part from ${path}.`);
  }
  return last;
};

const readSessionDirectory = async (directory: string): Promise<string[]> => {
  try {
    return await readdir(directory);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const parseLimit = (limitParam: string | null): number => {
  if (limitParam === null) {
    return 30;
  }

  const limit = Number.parseInt(limitParam, 10);
  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error(`Invalid session limit: ${limitParam}.`);
  }
  return limit;
};

/**
 * Read Kiro sessions from ~/.kiro/sessions/cli/*.json
 */
const readKiroSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const files = await readSessionDirectory(KIRO_SESSIONS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  const sessions: AgentSession[] = [];
  for (const file of jsonFiles.slice(0, 200)) {
    const raw = await readFile(join(KIRO_SESSIONS_DIR, file), 'utf-8');
    const data = JSON.parse(raw) as Record<string, unknown>;
    const shouldInclude =
      data.session_created_reason !== 'subagent' && (cwd === null || data.cwd === cwd);

    if (shouldInclude) {
      const session: AgentSession = {
        session_id: valueText(data, 'session_id', sessionIdFromFile(file)),
        title: valueText(data, 'title', '(untitled)').slice(0, 120),
        cwd: valueText(data, 'cwd', ''),
        created_at: valueText(data, 'created_at', ''),
        updated_at: valueText(data, 'updated_at', ''),
      };
      if (data.parent_session_id) {
        sessions.push({
          ...session,
          parent_session_id: String(data.parent_session_id),
        });
      } else if (data.session_created_reason) {
        sessions.push({
          ...session,
          session_created_reason: String(data.session_created_reason),
        });
      } else {
        sessions.push(session);
      }

      if (data.parent_session_id && data.session_created_reason) {
        const lastIndex = sessions.length - 1;
        const lastSession = sessions[lastIndex];
        if (lastSession === undefined) {
          throw new Error(`Could not build session row for ${file}.`);
        }
        sessions[lastIndex] = {
          ...lastSession,
          session_created_reason: String(data.session_created_reason),
        };
      }
    }
  }

  sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return sessions.slice(0, limit);
};

/**
 * Read Claude Code sessions from ~/.claude/sessions/ (best-effort heuristics)
 */
const readClaudeSessions = async (_cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const files = await readSessionDirectory(CLAUDE_SESSIONS_DIR);
  const sessionFiles = files.filter((f) => f.endsWith('.json') || f.endsWith('.jsonl'));

  const sessions: AgentSession[] = [];
  for (const file of sessionFiles.slice(0, limit * 2)) {
    const raw = await readFile(join(CLAUDE_SESSIONS_DIR, file), 'utf-8');
    const lines = raw.trim().split('\n');
    const first = lines[0] ? (JSON.parse(lines[0]) as Record<string, unknown>) : {};

    sessions.push({
      session_id: valueText(first, 'session_id', sessionIdFromFile(file)),
      title: valueText(first, 'title', valueText(first, 'request', '(untitled)')).slice(0, 120),
      cwd: valueText(first, 'cwd', ''),
      created_at: valueText(first, 'timestamp', valueText(first, 'created_at', String(Date.now()))),
      updated_at: valueText(first, 'timestamp', valueText(first, 'updated_at', String(Date.now()))),
    });
  }

  sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return sessions.slice(0, limit);
};

/**
 * Read Cursor sessions from ~/.cursor/projects\/*\/agent-transcripts\/*.jsonl
 */
const readCursorSessions = async (cwd: string | null, limit: number): Promise<AgentSession[]> => {
  const projectDirs = await readSessionDirectory(CURSOR_TRANSCRIPTS_DIR);
  const sessions: AgentSession[] = [];

  for (const projectDir of projectDirs) {
    const cwdMatches = cwd === null || projectDir.includes(lastPathPart(cwd));

    if (cwdMatches) {
      const transcriptsDir = join(CURSOR_TRANSCRIPTS_DIR, projectDir, 'agent-transcripts');
      const files = await readSessionDirectory(transcriptsDir);
      for (const file of files.filter((f) => f.endsWith('.jsonl')).slice(0, limit)) {
        const raw = await readFile(join(transcriptsDir, file), 'utf-8');
        const lines = raw.trim().split('\n');
        const first = lines[0] ? (JSON.parse(lines[0]) as Record<string, unknown>) : {};
        const lastLine = lines.length > 0 ? lines[lines.length - 1] : undefined;
        const lasts = lastLine ? (JSON.parse(lastLine) as Record<string, unknown>) : first;

        sessions.push({
          session_id: sessionIdFromFile(file),
          title: valueText(first, 'title', valueText(first, 'request', '(untitled)')).slice(0, 120),
          cwd: valueText(first, 'cwd', projectDir),
          created_at: valueText(
            first,
            'timestamp',
            valueText(first, 'created_at', String(Date.now())),
          ),
          updated_at: valueText(
            lasts,
            'timestamp',
            valueText(lasts, 'updated_at', String(Date.now())),
          ),
        });
      }
    }
  }

  sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return sessions.slice(0, limit);
};

/**
 * Gemini/Codex fallback — generic .agent/ directory scan
 */
const readGenericAgentSessions = async (
  agentName: string,
  _cwd: string | null,
  limit: number,
): Promise<AgentSession[]> => {
  const genericDir = join(homedir(), `.${agentName}`, 'sessions');
  const files = await readSessionDirectory(genericDir);
  const sessions: AgentSession[] = [];

  for (const file of files
    .filter((f) => f.endsWith('.json') || f.endsWith('.jsonl'))
    .slice(0, limit * 2)) {
    const raw = await readFile(join(genericDir, file), 'utf-8');
    const lines = raw.trim().split('\n');
    const data = lines[0] ? (JSON.parse(lines[0]) as Record<string, unknown>) : {};

    sessions.push({
      session_id: valueText(data, 'session_id', sessionIdFromFile(file)),
      title: valueText(data, 'title', '(untitled)').slice(0, 120),
      cwd: valueText(data, 'cwd', ''),
      created_at: valueText(data, 'created_at', String(Date.now())),
      updated_at: valueText(data, 'updated_at', String(Date.now())),
    });
  }

  sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  return sessions.slice(0, limit);
};

/**
 * List local agent sessions for the requested agent.
 *
 * @param request - Incoming request with optional agent, cwd, and limit query params.
 * @returns JSON response containing session rows for the active agent.
 * @example
 * const response = await GET(request);
 */
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const cwd = searchParams.get('cwd');
  const limitParam = searchParams.get('limit');
  const limit = parseLimit(limitParam);
  const requestedAgent = searchParams.get('agent');
  const agentParam = requestedAgent === null ? 'kiro' : requestedAgent;

  let sessions: AgentSession[] = [];

  switch (agentParam) {
    case 'kiro':
      sessions = await readKiroSessions(cwd, limit);
      break;
    case 'claude-code':
      sessions = await readClaudeSessions(cwd, limit);
      break;
    case 'cursor':
      sessions = await readCursorSessions(cwd, limit);
      break;
    case 'gemini':
    case 'codex':
      sessions = await readGenericAgentSessions(agentParam, cwd, limit);
      break;
    default:
      return NextResponse.json({ error: `Unsupported agent: ${agentParam}` }, { status: 400 });
  }

  return NextResponse.json({
    agent: agentParam,
    sessions,
    total: sessions.length,
  });
};
