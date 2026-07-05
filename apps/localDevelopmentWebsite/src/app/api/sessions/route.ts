import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { NextResponse } from 'next/server';

const KIRO_SESSIONS_DIR = join(homedir(), '.kiro', 'sessions', 'cli');
const CLAUDE_SESSIONS_DIR = join(homedir(), '.claude', 'sessions');
const CURSOR_TRANSCRIPTS_DIR = join(homedir(), '.cursor', 'projects');

export interface AgentSession {
  session_id: string;
  title: string;
  cwd: string;
  created_at: string;
  updated_at: string;
  parent_session_id?: string | undefined;
  session_created_reason?: string | undefined;
}

/**
 * Read Kiro sessions from ~/.kiro/sessions/cli/*.json
 */
async function readKiroSessions(cwd: string | null, limit: number): Promise<AgentSession[]> {
  try {
    const files = await readdir(KIRO_SESSIONS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const sessions: AgentSession[] = [];
    for (const file of jsonFiles.slice(0, 200)) {
      try {
        const raw = await readFile(join(KIRO_SESSIONS_DIR, file), 'utf-8');
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (data.session_created_reason === 'subagent') {
          continue;
        }
        if (cwd && data.cwd !== cwd) {
          continue;
        }

        const s: AgentSession = {
          session_id: String(data.session_id ?? file.replace('.json', '')),
          title: String(data.title ?? '(untitled)').slice(0, 120),
          cwd: String(data.cwd ?? ''),
          created_at: String(data.created_at ?? ''),
          updated_at: String(data.updated_at ?? ''),
        };
        if (data.parent_session_id) {
          s.parent_session_id = String(data.parent_session_id);
        }
        if (data.session_created_reason) {
          s.session_created_reason = String(data.session_created_reason);
        }
        sessions.push(s);
      } catch {
        // skip malformed files
      }
    }

    sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return sessions.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Read Claude Code sessions from ~/.claude/sessions/ (best-effort heuristics)
 */
async function readClaudeSessions(_cwd: string | null, limit: number): Promise<AgentSession[]> {
  try {
    const files = await readdir(CLAUDE_SESSIONS_DIR);
    const sessionFiles = files.filter((f) => f.endsWith('.json') || f.endsWith('.jsonl'));

    const sessions: AgentSession[] = [];
    for (const file of sessionFiles.slice(0, limit * 2)) {
      try {
        const raw = await readFile(join(CLAUDE_SESSIONS_DIR, file), 'utf-8');
        const lines = raw.trim().split('\n');
        const first = lines[0] ? (JSON.parse(lines[0]) as Record<string, unknown>) : {};

        sessions.push({
          session_id: String(first.session_id ?? file.replace(/\.(json|jsonl)$/, '')),
          title: String(first.title ?? first.request ?? '(untitled)').slice(0, 120),
          cwd: String(first.cwd ?? ''),
          created_at: String(first.timestamp ?? first.created_at ?? Date.now()),
          updated_at: String(first.timestamp ?? first.updated_at ?? Date.now()),
        });
      } catch {
        // skip malformed
      }
    }

    sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return sessions.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Read Cursor sessions from ~/.cursor/projects\/*\/agent-transcripts\/*.jsonl
 */
async function readCursorSessions(cwd: string | null, limit: number): Promise<AgentSession[]> {
  try {
    const projectDirs = await readdir(CURSOR_TRANSCRIPTS_DIR);
    const sessions: AgentSession[] = [];

    for (const projectDir of projectDirs) {
      if (cwd && !projectDir.includes((cwd.split('/').pop()) ?? '')) {
        continue;
      }

      const transcriptsDir = join(CURSOR_TRANSCRIPTS_DIR, projectDir, 'agent-transcripts');
      try {
        const files = await readdir(transcriptsDir);
        for (const file of files.filter((f) => f.endsWith('.jsonl')).slice(0, limit)) {
          try {
            const raw = await readFile(join(transcriptsDir, file), 'utf-8');
            const lines = raw.trim().split('\n');
            const first = lines[0] ? (JSON.parse(lines[0]) as Record<string, unknown>) : {};
            const lastLine = lines.length > 0 ? lines[lines.length - 1] : undefined;
            const lasts = lastLine ? (JSON.parse(lastLine) as Record<string, unknown>) : first;

            sessions.push({
              session_id: file.replace('.jsonl', ''),
              title: String(first.title ?? first.request ?? '(untitled)').slice(0, 120),
              cwd: String(first.cwd ?? projectDir),
              created_at: String(first.timestamp ?? first.created_at ?? Date.now()),
              updated_at: String(lasts.timestamp ?? lasts.updated_at ?? Date.now()),
            });
          } catch {
            // skip malformed
          }
        }
      } catch {
        // skip project dirs without transcripts
      }
    }

    sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return sessions.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Gemini/Codex fallback — generic .agent/ directory scan
 */
async function readGenericAgentSessions(
  agentName: string,
  _cwd: string | null,
  limit: number,
): Promise<AgentSession[]> {
  try {
    const genericDir = join(homedir(), `.${agentName}`, 'sessions');
    const files = await readdir(genericDir);
    const sessions: AgentSession[] = [];

    for (const file of files.filter((f) => f.endsWith('.json') || f.endsWith('.jsonl')).slice(0, limit * 2)) {
      try {
        const raw = await readFile(join(genericDir, file), 'utf-8');
        const lines = raw.trim().split('\n');
        const data = lines[0] ? (JSON.parse(lines[0]) as Record<string, unknown>) : {};

        sessions.push({
          session_id: String(data.session_id ?? file.replace(/\.(json|jsonl)$/, '')),
          title: String(data.title ?? '(untitled)').slice(0, 120),
          cwd: String(data.cwd ?? ''),
          created_at: String(data.created_at ?? Date.now()),
          updated_at: String(data.updated_at ?? Date.now()),
        });
      } catch {
        // skip
      }
    }

    sessions.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return sessions.slice(0, limit);
  } catch {
    return [];
  }
}

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const cwd = searchParams.get('cwd');
  const limit = parseInt(searchParams.get('limit') ?? '30', 10);
  const agentParam = searchParams.get('agent') ?? 'kiro';

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
      sessions = [];
  }

  return NextResponse.json({
    agent: agentParam,
    sessions,
    total: sessions.length,
  });
};
