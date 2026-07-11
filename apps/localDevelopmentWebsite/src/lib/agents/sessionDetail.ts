import { readdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import {
  cleanTitle,
  extractTextContent,
  isNoiseMessage,
  listSubdirs,
  readDirSafe,
  readFileSafe,
  valueText,
} from './fsUtils';
import type { AgentId } from './registry';
import { listAgentSessions } from './sessionReaders';
import type { SessionDetail, SessionMessage } from './sessionTypes';

const MAX_MESSAGES = 200;

const pushMessage = (
  messages: SessionMessage[],
  role: 'user' | 'agent',
  content: string,
  timestamp?: string,
): void => {
  const text = content.trim();
  if (text.length === 0 || isNoiseMessage(text)) {
    return;
  }
  messages.push({
    role,
    content: text,
    ...(timestamp ? { timestamp } : {}),
  });
};

/**
 * Load Kiro session JSON messages.
 */
const loadKiroDetail = async (id: string): Promise<SessionDetail | null> => {
  const path = join(homedir(), '.kiro', 'sessions', 'cli', `${id}.json`);
  const raw = await readFileSafe(path);
  if (raw === null) {
    return null;
  }
  const data = JSON.parse(raw) as Record<string, unknown>;
  const messages: SessionMessage[] = [];
  if (Array.isArray(data.messages)) {
    for (const m of data.messages as Array<Record<string, unknown>>) {
      const roleRaw = valueText(m, 'role', 'agent');
      const role = roleRaw === 'user' ? 'user' : 'agent';
      pushMessage(
        messages,
        role,
        valueText(m, 'content', ''),
        valueText(m, 'timestamp', '') || undefined,
      );
    }
  }
  return {
    session_id: valueText(data, 'session_id', id),
    title: cleanTitle(valueText(data, 'title', '(untitled)')),
    cwd: valueText(data, 'cwd', ''),
    messages: messages.slice(-MAX_MESSAGES),
    created_at: valueText(data, 'created_at', ''),
    updated_at: valueText(data, 'updated_at', ''),
    agent: 'kiro',
  };
};

/**
 * Load Claude Code jsonl transcript by session id (search projects tree).
 */
const loadClaudeDetail = async (id: string): Promise<SessionDetail | null> => {
  const projectsRoot = join(homedir(), '.claude', 'projects');
  const projectDirs = await listSubdirs(projectsRoot);

  for (const projectDir of projectDirs) {
    const candidate = join(projectDir, `${id}.jsonl`);
    let raw = await readFileSafe(candidate);
    if (raw === null) {
      // Search files that embed this sessionId
      const files = (await readDirSafe(projectDir)).filter((f) => f.endsWith('.jsonl'));
      for (const file of files) {
        const full = join(projectDir, file);
        const content = await readFileSafe(full);
        if (content !== null && content.includes(id)) {
          raw = content;
          break;
        }
      }
    }
    if (raw === null) {
      continue;
    }

    const messages: SessionMessage[] = [];
    let title = '(untitled)';
    let createdAt = '';
    let updatedAt = '';
    let cwd = '';

    for (const line of raw.split('\n')) {
      if (line.trim().length === 0) {
        continue;
      }
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        if (typeof row.cwd === 'string' && cwd.length === 0) {
          cwd = row.cwd;
        }
        if (typeof row.timestamp === 'string') {
          if (createdAt.length === 0) {
            createdAt = row.timestamp;
          }
          updatedAt = row.timestamp;
        }
        if (row.type === 'user' && row.message && typeof row.message === 'object') {
          const text = extractTextContent((row.message as { content?: unknown }).content);
          if (title === '(untitled)' && text.length > 0 && !isNoiseMessage(text)) {
            title = cleanTitle(text);
          }
          pushMessage(messages, 'user', text, valueText(row, 'timestamp', '') || undefined);
        }
        if (row.type === 'assistant' && row.message && typeof row.message === 'object') {
          const text = extractTextContent((row.message as { content?: unknown }).content);
          pushMessage(messages, 'agent', text, valueText(row, 'timestamp', '') || undefined);
        }
      } catch {
        // skip
      }
    }

    return {
      session_id: id,
      title,
      cwd,
      messages: messages.slice(-MAX_MESSAGES),
      created_at: createdAt,
      updated_at: updatedAt,
      agent: 'claude-code',
    };
  }

  return null;
};

/**
 * Load Cursor agent transcript by chat id.
 */
const loadCursorDetail = async (id: string): Promise<SessionDetail | null> => {
  const projectsRoot = join(homedir(), '.cursor', 'projects');
  const projectDirs = await listSubdirs(projectsRoot);

  for (const projectDir of projectDirs) {
    const full = join(projectDir, 'agent-transcripts', id, `${id}.jsonl`);
    const raw = await readFileSafe(full);
    if (raw === null) {
      continue;
    }

    const messages: SessionMessage[] = [];
    let title = '(untitled)';

    for (const line of raw.split('\n')) {
      if (line.trim().length === 0) {
        continue;
      }
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        const roleRaw = valueText(row, 'role', '');
        if (roleRaw !== 'user' && roleRaw !== 'assistant') {
          continue;
        }
        const content = extractTextContent(
          row.message && typeof row.message === 'object'
            ? (row.message as { content?: unknown }).content
            : row.content,
        );
        const withoutTs = content.replace(/^<timestamp>[\s\S]*?<\/timestamp>\s*/i, '');
        const cleaned = withoutTs
          .replace(/<\/?user_query>/gi, '')
          .replace(/\[REDACTED\]/g, '')
          .trim();
        if (roleRaw === 'user' && title === '(untitled)' && cleaned.length > 0) {
          title = cleanTitle(cleaned);
        }
        pushMessage(messages, roleRaw === 'user' ? 'user' : 'agent', cleaned);
      } catch {
        // skip
      }
    }

    return {
      session_id: id,
      title,
      cwd: projectDir,
      messages: messages.slice(-MAX_MESSAGES),
      created_at: '',
      updated_at: '',
      agent: 'cursor',
    };
  }

  return null;
};

/**
 * Load Grok summary as a stub (full transcript is heavy); surface summary as one agent message.
 */
const loadGrokDetail = async (id: string): Promise<SessionDetail | null> => {
  const root = join(homedir(), '.grok', 'sessions');

  const walk = async (dir: string, depth: number): Promise<SessionDetail | null> => {
    if (depth > 6) {
      return null;
    }
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return null;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      try {
        const infoStat = await stat(full);
        if (infoStat.isDirectory()) {
          const nested = await walk(full, depth + 1);
          if (nested !== null) {
            return nested;
          }
          continue;
        }
      } catch {
        continue;
      }
      if (entry !== 'summary.json') {
        continue;
      }
      const raw = await readFileSafe(full);
      if (raw === null) {
        continue;
      }
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        const info =
          data.info && typeof data.info === 'object' ? (data.info as Record<string, unknown>) : {};
        if (valueText(info, 'id', '') !== id && basename(dir) !== id) {
          continue;
        }
        const summary = valueText(data, 'session_summary', '(untitled)');
        return {
          session_id: id,
          title: cleanTitle(summary),
          cwd: valueText(info, 'cwd', ''),
          messages: [
            {
              role: 'agent',
              content: `Session summary: ${summary}\n\nOpen this session in Grok CLI to continue (use Resume in the sidebar).`,
            },
          ],
          created_at: valueText(data, 'created_at', ''),
          updated_at: valueText(data, 'updated_at', ''),
          agent: 'grok',
        };
      } catch {}
    }
    return null;
  };

  return walk(root, 0);
};

/**
 * Load Kimi session from state + wire.jsonl if present.
 */
const loadKimiDetail = async (id: string): Promise<SessionDetail | null> => {
  const indexPath = join(homedir(), '.kimi-code', 'session_index.jsonl');
  const indexRaw = await readFileSafe(indexPath);
  if (indexRaw === null) {
    return null;
  }

  for (const line of indexRaw.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (valueText(row, 'sessionId', '') !== id) {
        continue;
      }
      const sessionDir = valueText(row, 'sessionDir', '');
      const workDir = valueText(row, 'workDir', '');
      const stateRaw =
        sessionDir.length > 0 ? await readFileSafe(join(sessionDir, 'state.json')) : null;
      let title = '(untitled)';
      let createdAt = '';
      let updatedAt = '';
      if (stateRaw !== null) {
        const state = JSON.parse(stateRaw) as Record<string, unknown>;
        title = cleanTitle(valueText(state, 'title', '(untitled)'));
        createdAt = valueText(state, 'createdAt', '');
        updatedAt = valueText(state, 'updatedAt', '');
      }

      const messages: SessionMessage[] = [];
      const wirePath =
        sessionDir.length > 0 ? join(sessionDir, 'agents', 'main', 'wire.jsonl') : '';
      if (wirePath.length > 0) {
        const wire = await readFileSafe(wirePath);
        if (wire !== null) {
          for (const wline of wire.split('\n')) {
            if (wline.trim().length === 0) {
              continue;
            }
            try {
              const w = JSON.parse(wline) as Record<string, unknown>;
              const roleRaw = valueText(w, 'role', valueText(w, 'type', ''));
              const content = extractTextContent(w.content ?? w.message ?? w.text);
              if (roleRaw.includes('user') || roleRaw === 'human') {
                pushMessage(messages, 'user', content);
              } else if (roleRaw.includes('assistant') || roleRaw.includes('agent')) {
                pushMessage(messages, 'agent', content);
              }
            } catch {
              // skip
            }
          }
        }
      }

      if (messages.length === 0) {
        messages.push({
          role: 'agent',
          content: `Kimi session "${title}". Use Resume in the sidebar to continue in the Kimi CLI.`,
        });
      }

      return {
        session_id: id,
        title,
        cwd: workDir,
        messages: messages.slice(-MAX_MESSAGES),
        created_at: createdAt,
        updated_at: updatedAt,
        agent: 'kimi',
      };
    } catch {
      // skip
    }
  }

  return null;
};

/**
 * Codex / gemini / devin: list-only with a stub message pointing at Resume.
 */
const loadStubFromList = async (agentId: AgentId, id: string): Promise<SessionDetail | null> => {
  const sessions = await listAgentSessions(agentId, null, 100);
  const match = sessions.find((s) => s.session_id === id);
  if (match === undefined) {
    return null;
  }
  return {
    session_id: match.session_id,
    title: match.title,
    cwd: match.cwd,
    messages: [
      {
        role: 'agent',
        content: `${match.title}\n\nThis ${agentId} session is available on disk. Click "Resume in terminal" (or New session) to continue in the real CLI.`,
      },
    ],
    created_at: match.created_at,
    updated_at: match.updated_at,
    agent: agentId,
  };
};

/**
 * Hydrate one session's messages for the chat pane.
 *
 * @param agentId - Owning agent.
 * @param sessionId - Session id.
 * @returns Detail payload or null when not found.
 * @example
 * const detail = await loadSessionDetail('claude-code', id);
 */
export const loadSessionDetail = async (
  agentId: AgentId,
  sessionId: string,
): Promise<SessionDetail | null> => {
  switch (agentId) {
    case 'kiro':
      return loadKiroDetail(sessionId);
    case 'claude-code':
      return loadClaudeDetail(sessionId);
    case 'cursor':
      return loadCursorDetail(sessionId);
    case 'kimi':
      return loadKimiDetail(sessionId);
    case 'grok':
      return loadGrokDetail(sessionId);
    case 'codex':
    case 'gemini':
    case 'devin':
      return loadStubFromList(agentId, sessionId);
  }
};
