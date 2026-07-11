import { readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { VybeAssistant } from '@vybekiit/report-mode';

import { resolveAgentStoreRoots } from './agentHomes';
import {
  cleanTitle,
  extractTextContent,
  isNoiseMessage,
  listSubdirs,
  readDirSafe,
  readFileSafe,
  valueText,
} from './fsUtils';
import { listNativeSessions } from './listSessions';
import type { SessionTranscriptMessage, SessionTranscriptResponse } from './types';

/** Cap UI history so huge CLI sessions stay responsive in the panel. */
const MAX_MESSAGES = 200;

/**
 * Strip injection blocks that are not the user's real words.
 * input → "<system-reminder>…</system-reminder>\nhello" → "hello"
 *
 * @param text - Raw user/assistant text from a transcript line.
 * @returns Cleaned display text.
 */
const stripInjectionBlocks = (text: string): string =>
  text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, '')
    .replace(/<\/?user_query>/gi, '')
    .replace(/<environment_context>[\s\S]*?<\/environment_context>/gi, '')
    .replace(/\[REDACTED\]/g, '')
    .trim();

/**
 * Append a chat bubble when text is non-empty and not noise.
 *
 * @param messages - Mutable message list.
 * @param role - user or assistant.
 * @param rawText - Raw extracted text.
 * @param timestamp - Optional ISO timestamp.
 */
const pushMessage = (
  messages: SessionTranscriptMessage[],
  role: 'user' | 'assistant',
  rawText: string,
  timestamp?: string,
): void => {
  const text = stripInjectionBlocks(rawText);
  if (text.length === 0 || isNoiseMessage(text)) {
    return;
  }
  // Merge consecutive same-role rows (agents often emit multiple assistant lines per turn).
  const last = messages.at(-1);
  if (last !== undefined && last.role === role) {
    const merged = `${last.text}\n\n${text}`.trim();
    let timestampFields: { readonly timestamp?: string } = {};
    if (last.timestamp !== undefined) {
      timestampFields = { timestamp: last.timestamp };
    } else if (timestamp !== undefined) {
      timestampFields = { timestamp };
    }
    messages[messages.length - 1] = {
      role,
      text: merged,
      ...timestampFields,
    };
    return;
  }
  messages.push({
    role,
    text,
    ...(timestamp !== undefined && timestamp.length > 0 ? { timestamp } : {}),
  });
};

/**
 * Extract plain text from Kiro-style content parts (`kind: text`, `data: string`).
 *
 * @param content - Kiro content array or string.
 * @returns Flattened text.
 */
const extractKiroContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  const parts: string[] = [];
  for (const part of content) {
    if (!part || typeof part !== 'object') {
      continue;
    }
    const row = part as { kind?: unknown; data?: unknown; type?: unknown; text?: unknown };
    if (row.kind === 'text' && typeof row.data === 'string') {
      parts.push(row.data);
      continue;
    }
    if (row.type === 'text' && typeof row.text === 'string') {
      parts.push(row.text);
    }
  }
  return parts.join('\n').trim();
};

/**
 * Parse a Claude Code `.jsonl` transcript into panel chat messages.
 *
 * @param raw - Full file contents.
 * @returns Ordered user/assistant messages (noise filtered).
 * @example
 * parseClaudeTranscriptJsonl('{"type":"user","message":{"content":"hi"}}\\n');
 */
export const parseClaudeTranscriptJsonl = (raw: string): readonly SessionTranscriptMessage[] => {
  const messages: SessionTranscriptMessage[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const type = row.type;
      if (type !== 'user' && type !== 'assistant') {
        continue;
      }
      if (!row.message || typeof row.message !== 'object') {
        continue;
      }
      const text = extractTextContent((row.message as { content?: unknown }).content);
      const ts = typeof row.timestamp === 'string' ? row.timestamp : undefined;
      pushMessage(messages, type === 'user' ? 'user' : 'assistant', text, ts);
    } catch {
      // skip bad / truncated lines
    }
  }
  return messages.slice(-MAX_MESSAGES);
};

/**
 * Parse a Grok `chat_history.jsonl` into panel chat messages.
 *
 * @param raw - Full file contents.
 * @returns Ordered user/assistant messages.
 * @example
 * parseGrokChatHistoryJsonl('{"type":"user","content":"hi"}\\n');
 */
export const parseGrokChatHistoryJsonl = (raw: string): readonly SessionTranscriptMessage[] => {
  const messages: SessionTranscriptMessage[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const type = row.type;
      if (type !== 'user' && type !== 'assistant') {
        continue;
      }
      const text = extractTextContent(row.content);
      pushMessage(messages, type === 'user' ? 'user' : 'assistant', text);
    } catch {
      // skip
    }
  }
  return messages.slice(-MAX_MESSAGES);
};

/**
 * Parse Cursor agent-transcripts `.jsonl` (`role` + `message.content`).
 *
 * @param raw - Full file contents.
 * @returns Ordered messages.
 * @example
 * parseCursorTranscriptJsonl('{"role":"user","message":{"content":"hi"}}\\n');
 */
export const parseCursorTranscriptJsonl = (raw: string): readonly SessionTranscriptMessage[] => {
  const messages: SessionTranscriptMessage[] = [];
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
      const cleaned = stripInjectionBlocks(
        content.replace(/^<timestamp>[\s\S]*?<\/timestamp>\s*/i, ''),
      );
      pushMessage(messages, roleRaw === 'user' ? 'user' : 'assistant', cleaned);
    } catch {
      // skip
    }
  }
  return messages.slice(-MAX_MESSAGES);
};

/**
 * Parse Codex rollout `.jsonl` (`event_msg` user_message / agent_message).
 *
 * @param raw - Full file contents.
 * @returns Ordered messages.
 * @example
 * parseCodexRolloutJsonl('{"type":"event_msg","payload":{"type":"user_message","message":"hi"}}\\n');
 */
export const parseCodexRolloutJsonl = (raw: string): readonly SessionTranscriptMessage[] => {
  const messages: SessionTranscriptMessage[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (row.type !== 'event_msg' || !row.payload || typeof row.payload !== 'object') {
        continue;
      }
      const payload = row.payload as Record<string, unknown>;
      const eventType = valueText(payload, 'type', '');
      if (eventType === 'user_message') {
        pushMessage(
          messages,
          'user',
          typeof payload.message === 'string'
            ? payload.message
            : extractTextContent(payload.message ?? payload.content),
          typeof row.timestamp === 'string' ? row.timestamp : undefined,
        );
      } else if (eventType === 'agent_message') {
        pushMessage(
          messages,
          'assistant',
          typeof payload.message === 'string'
            ? payload.message
            : extractTextContent(payload.message ?? payload.content),
          typeof row.timestamp === 'string' ? row.timestamp : undefined,
        );
      }
    } catch {
      // skip
    }
  }
  return messages.slice(-MAX_MESSAGES);
};

/**
 * Parse Kimi Code `wire.jsonl` (turn.prompt + content.part text).
 *
 * @param raw - Full file contents.
 * @returns Ordered messages.
 * @example
 * parseKimiWireJsonl('{"type":"turn.prompt","input":[{"type":"text","text":"hi"}]}\\n');
 */
export const parseKimiWireJsonl = (raw: string): readonly SessionTranscriptMessage[] => {
  const messages: SessionTranscriptMessage[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const type = valueText(row, 'type', '');
      if (type === 'turn.prompt') {
        pushMessage(messages, 'user', extractTextContent(row.input));
        continue;
      }
      if (type === 'context.append_message' && row.message && typeof row.message === 'object') {
        const message = row.message as Record<string, unknown>;
        const role = valueText(message, 'role', '');
        if (role === 'user' || role === 'assistant') {
          pushMessage(messages, role, extractTextContent(message.content));
        }
        continue;
      }
      if (type === 'context.append_loop_event' && row.event && typeof row.event === 'object') {
        const event = row.event as Record<string, unknown>;
        if (valueText(event, 'type', '') !== 'content.part') {
          continue;
        }
        const part =
          event.part && typeof event.part === 'object'
            ? (event.part as Record<string, unknown>)
            : null;
        if (part === null || valueText(part, 'type', '') !== 'text') {
          continue;
        }
        const text = typeof part.text === 'string' ? part.text : '';
        pushMessage(messages, 'assistant', text);
      }
    } catch {
      // skip
    }
  }
  return messages.slice(-MAX_MESSAGES);
};

/**
 * Parse Kiro CLI session `.jsonl` (`kind: Prompt` / `AssistantMessage`).
 *
 * @param raw - Full file contents.
 * @returns Ordered messages.
 * @example
 * parseKiroSessionJsonl('{"kind":"Prompt","data":{"content":[{"kind":"text","data":"hi"}]}}\\n');
 */
export const parseKiroSessionJsonl = (raw: string): readonly SessionTranscriptMessage[] => {
  const messages: SessionTranscriptMessage[] = [];
  for (const line of raw.split('\n')) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      const kind = valueText(row, 'kind', '');
      const data =
        row.data && typeof row.data === 'object' ? (row.data as Record<string, unknown>) : null;
      if (data === null) {
        continue;
      }
      if (kind === 'Prompt') {
        pushMessage(messages, 'user', extractKiroContent(data.content));
      } else if (kind === 'AssistantMessage') {
        pushMessage(messages, 'assistant', extractKiroContent(data.content));
      }
    } catch {
      // skip
    }
  }
  return messages.slice(-MAX_MESSAGES);
};

/**
 * Parse Devin transcript JSON (`steps[].source` + `message`).
 *
 * @param raw - Full JSON file contents.
 * @returns Ordered messages.
 * @example
 * parseDevinTranscriptJson('{"steps":[{"source":"user","message":"hi"}]}');
 */
export const parseDevinTranscriptJson = (raw: string): readonly SessionTranscriptMessage[] => {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const messages: SessionTranscriptMessage[] = [];
    if (!Array.isArray(data.steps)) {
      return [];
    }
    for (const step of data.steps) {
      if (step === null || typeof step !== 'object') {
        continue;
      }
      const row = step as Record<string, unknown>;
      const source = valueText(row, 'source', '');
      if (source !== 'user' && source !== 'agent' && source !== 'assistant') {
        continue;
      }
      const text = typeof row.message === 'string' ? row.message : extractTextContent(row.message);
      // Drop system-prompt-sized agent dumps and the ❭ CLI prefix noise.
      const cleaned = text.replace(/^❭\s*/, '').trim();
      if (source === 'user') {
        pushMessage(
          messages,
          'user',
          cleaned,
          typeof row.timestamp === 'string' ? row.timestamp : undefined,
        );
      } else {
        // Skip enormous system-style agent blobs (first step is often the full system prompt).
        if (cleaned.length > 8000 && cleaned.includes('You are Devin')) {
          continue;
        }
        pushMessage(
          messages,
          'assistant',
          cleaned,
          typeof row.timestamp === 'string' ? row.timestamp : undefined,
        );
      }
    }
    return messages.slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
};

const findClaudeTranscriptPath = async (sessionId: string): Promise<string | null> => {
  const projectsRoot = resolveAgentStoreRoots().claudeProjects;
  const projectDirs = await listSubdirs(projectsRoot);
  for (const projectDir of projectDirs) {
    const direct = join(projectDir, `${sessionId}.jsonl`);
    if ((await readFileSafe(direct)) !== null) {
      return direct;
    }
  }
  for (const projectDir of projectDirs) {
    const files = (await readDirSafe(projectDir)).filter(
      (file) => file.endsWith('.jsonl') && !file.includes('subagent'),
    );
    for (const file of files) {
      const full = join(projectDir, file);
      const content = await readFileSafe(full);
      if (content !== null && content.includes(sessionId)) {
        return full;
      }
    }
  }
  return null;
};

const findGrokChatHistoryPath = async (sessionId: string): Promise<string | null> => {
  const root = resolveAgentStoreRoots().grokSessions;
  const projectDirs = await listSubdirs(root);
  for (const projectDir of projectDirs) {
    if (basename(projectDir).includes('subagent-')) {
      continue;
    }
    const candidate = join(projectDir, sessionId, 'chat_history.jsonl');
    if ((await readFileSafe(candidate)) !== null) {
      return candidate;
    }
  }
  for (const projectDir of projectDirs) {
    try {
      const sessionDirs = await readdir(projectDir, { withFileTypes: true });
      for (const entry of sessionDirs) {
        if (!entry.isDirectory()) {
          continue;
        }
        if (entry.name !== sessionId && !entry.name.includes(sessionId)) {
          continue;
        }
        const candidate = join(projectDir, entry.name, 'chat_history.jsonl');
        if ((await readFileSafe(candidate)) !== null) {
          return candidate;
        }
      }
    } catch {
      // skip
    }
  }
  return null;
};

const findCursorTranscriptPath = async (sessionId: string): Promise<string | null> => {
  const projectsRoot = resolveAgentStoreRoots().cursorProjects;
  const projectDirs = await listSubdirs(projectsRoot);
  for (const projectDir of projectDirs) {
    const direct = join(projectDir, 'agent-transcripts', sessionId, `${sessionId}.jsonl`);
    if ((await readFileSafe(direct)) !== null) {
      return direct;
    }
  }
  return null;
};

const findCodexRolloutPath = async (sessionId: string): Promise<string | null> => {
  const root = resolveAgentStoreRoots().codexSessions;
  const walk = async (dir: string, depth: number): Promise<string | null> => {
    if (depth > 6) {
      return null;
    }
    const entries = await readDirSafe(dir);
    // Prefer filename match (rollout-…-{uuid}.jsonl).
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry.endsWith('.jsonl') && entry.includes(sessionId)) {
        return full;
      }
    }
    for (const entry of entries) {
      if (entry.endsWith('.jsonl')) {
        continue;
      }
      const full = join(dir, entry);
      const nested = await walk(full, depth + 1);
      if (nested !== null) {
        return nested;
      }
    }
    return null;
  };
  return walk(root, 0);
};

const findKimiWirePath = async (sessionId: string): Promise<string | null> => {
  const indexPath = resolveAgentStoreRoots().kimiSessionIndex;
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
      if (valueText(row, 'sessionId', '') !== sessionId) {
        continue;
      }
      const sessionDir = valueText(row, 'sessionDir', '');
      if (sessionDir.length === 0) {
        return null;
      }
      const wire = join(sessionDir, 'agents', 'main', 'wire.jsonl');
      if ((await readFileSafe(wire)) !== null) {
        return wire;
      }
      return null;
    } catch {
      // skip
    }
  }
  return null;
};

const findKiroTranscriptPath = async (sessionId: string): Promise<string | null> => {
  const dir = resolveAgentStoreRoots().kiroSessionsCli;
  const jsonl = join(dir, `${sessionId}.jsonl`);
  if ((await readFileSafe(jsonl)) !== null) {
    return jsonl;
  }
  const json = join(dir, `${sessionId}.json`);
  if ((await readFileSafe(json)) !== null) {
    return json;
  }
  return null;
};

const findDevinTranscriptPath = async (sessionId: string): Promise<string | null> => {
  const dirs = resolveAgentStoreRoots().devinTranscriptDirs;
  for (const dir of dirs) {
    const direct = join(dir, `${sessionId}.json`);
    if ((await readFileSafe(direct)) !== null) {
      return direct;
    }
    const files = (await readDirSafe(dir)).filter((file) => file.endsWith('.json'));
    for (const file of files) {
      const full = join(dir, file);
      const raw = await readFileSafe(full);
      if (raw === null) {
        continue;
      }
      try {
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (valueText(data, 'session_id', '') === sessionId) {
          return full;
        }
      } catch {
        // skip
      }
    }
  }
  return null;
};

const metaFromClaudeRaw = (
  raw: string,
  sessionId: string,
): { readonly title: string; readonly cwd: string } => {
  let title = '(untitled)';
  let cwd = '';
  for (const line of raw.split('\n').slice(0, 120)) {
    if (line.trim().length === 0) {
      continue;
    }
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (typeof row.cwd === 'string' && row.cwd.length > 0 && cwd.length === 0) {
        cwd = row.cwd;
      }
      if (row.type === 'user' && row.message && typeof row.message === 'object') {
        const text = stripInjectionBlocks(
          extractTextContent((row.message as { content?: unknown }).content),
        );
        if (title === '(untitled)' && text.length > 0 && !isNoiseMessage(text)) {
          title = cleanTitle(text);
        }
      }
      if (title !== '(untitled)' && cwd.length > 0) {
        break;
      }
    } catch {
      // skip
    }
  }
  return { title: title === '(untitled)' ? cleanTitle(sessionId) : title, cwd };
};

const titleFromMessages = (
  messages: readonly SessionTranscriptMessage[],
  fallback: string,
): string => {
  const firstUser = messages.find((message) => message.role === 'user');
  if (firstUser !== undefined) {
    return cleanTitle(firstUser.text);
  }
  return cleanTitle(fallback);
};

const okResponse = (
  assistant: VybeAssistant,
  sessionId: string,
  messages: readonly SessionTranscriptMessage[],
  meta: { readonly title?: string; readonly cwd?: string; readonly sourcePath?: string },
): SessionTranscriptResponse => ({
  assistant,
  sessionId,
  title:
    meta.title !== undefined && meta.title.length > 0
      ? meta.title
      : titleFromMessages(messages, sessionId),
  cwd: meta.cwd ?? '',
  messages,
  ...(meta.sourcePath === undefined ? {} : { sourcePath: meta.sourcePath }),
  fetchedAt: new Date().toISOString(),
});

/**
 * Load a native CLI conversation into panel-shaped messages so Resume shows history
 * for every supported agent (not only links the session id for the next turn).
 *
 * @param assistant - Agent whose store to read.
 * @param sessionId - Native session id (resume flag value).
 * @param sourcePathHint - Optional path from list-sessions (`sourcePath`).
 * @returns Transcript payload, or null when not found.
 * @example
 * const detail = await loadSessionTranscript('claude', '6ab76094-…');
 */
export const loadSessionTranscript = async (
  assistant: VybeAssistant,
  sessionId: string,
  sourcePathHint?: string,
): Promise<SessionTranscriptResponse | null> => {
  if (sessionId.trim().length === 0) {
    return null;
  }

  if (assistant === 'claude') {
    let path =
      sourcePathHint !== undefined && sourcePathHint.endsWith('.jsonl')
        ? sourcePathHint
        : await findClaudeTranscriptPath(sessionId);
    path ??= await findClaudeTranscriptPath(sessionId);
    if (path === null) {
      return null;
    }
    const raw = await readFileSafe(path);
    if (raw === null) {
      return null;
    }
    const messages = parseClaudeTranscriptJsonl(raw);
    const meta = metaFromClaudeRaw(raw, sessionId);
    return okResponse(assistant, sessionId, messages, {
      title: meta.title,
      cwd: meta.cwd,
      sourcePath: path,
    });
  }

  if (assistant === 'grok') {
    let path: string | null = null;
    if (sourcePathHint !== undefined) {
      const sibling = join(dirname(sourcePathHint), 'chat_history.jsonl');
      if ((await readFileSafe(sibling)) !== null) {
        path = sibling;
      }
    }
    path ??= await findGrokChatHistoryPath(sessionId);
    if (path === null) {
      return null;
    }
    const raw = await readFileSafe(path);
    if (raw === null) {
      return null;
    }
    const messages = parseGrokChatHistoryJsonl(raw);
    const summaryRaw = await readFileSafe(join(dirname(path), 'summary.json'));
    let title = '(untitled)';
    let cwd = '';
    if (summaryRaw !== null) {
      try {
        const data = JSON.parse(summaryRaw) as Record<string, unknown>;
        title = cleanTitle(
          valueText(data, 'session_summary', valueText(data, 'generated_title', title)),
        );
        const info =
          data.info && typeof data.info === 'object' ? (data.info as Record<string, unknown>) : {};
        cwd = valueText(info, 'cwd', '');
      } catch {
        // keep defaults
      }
    }
    return okResponse(assistant, sessionId, messages, { title, cwd, sourcePath: path });
  }

  if (assistant === 'cursor') {
    let path =
      sourcePathHint !== undefined && sourcePathHint.endsWith('.jsonl')
        ? sourcePathHint
        : await findCursorTranscriptPath(sessionId);
    path ??= await findCursorTranscriptPath(sessionId);
    if (path === null) {
      return null;
    }
    const raw = await readFileSafe(path);
    if (raw === null) {
      return null;
    }
    return okResponse(assistant, sessionId, parseCursorTranscriptJsonl(raw), {
      sourcePath: path,
    });
  }

  if (assistant === 'codex') {
    let path =
      sourcePathHint !== undefined && sourcePathHint.endsWith('.jsonl')
        ? sourcePathHint
        : await findCodexRolloutPath(sessionId);
    path ??= await findCodexRolloutPath(sessionId);
    if (path === null) {
      return null;
    }
    const raw = await readFileSafe(path);
    if (raw === null) {
      return null;
    }
    let cwd = '';
    // session_meta is usually the first line.
    for (const line of raw.split('\n').slice(0, 5)) {
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        if (row.type === 'session_meta' && row.payload && typeof row.payload === 'object') {
          cwd = valueText(row.payload as Record<string, unknown>, 'cwd', '');
          break;
        }
      } catch {
        // skip
      }
    }
    return okResponse(assistant, sessionId, parseCodexRolloutJsonl(raw), {
      cwd,
      sourcePath: path,
    });
  }

  if (assistant === 'kimi') {
    let path: string | null = null;
    if (sourcePathHint !== undefined) {
      // list-sessions points at state.json — wire is under agents/main/.
      const wire = join(dirname(sourcePathHint), 'agents', 'main', 'wire.jsonl');
      if ((await readFileSafe(wire)) !== null) {
        path = wire;
      }
    }
    path ??= await findKimiWirePath(sessionId);
    if (path === null) {
      return null;
    }
    const raw = await readFileSafe(path);
    if (raw === null) {
      return null;
    }
    let title = '(untitled)';
    let cwd = '';
    const stateRaw = await readFileSafe(join(dirname(dirname(dirname(path))), 'state.json'));
    // path = sessionDir/agents/main/wire.jsonl → sessionDir is 3 up… actually dirname thrice:
    // wire → main → agents → sessionDir. Yes 3 dirnames.
    if (stateRaw !== null) {
      try {
        const state = JSON.parse(stateRaw) as Record<string, unknown>;
        title = cleanTitle(valueText(state, 'title', title));
      } catch {
        // keep
      }
    }
    const indexRaw = await readFileSafe(resolveAgentStoreRoots().kimiSessionIndex);
    if (indexRaw !== null) {
      for (const line of indexRaw.split('\n')) {
        try {
          const row = JSON.parse(line) as Record<string, unknown>;
          if (valueText(row, 'sessionId', '') === sessionId) {
            cwd = valueText(row, 'workDir', '');
            break;
          }
        } catch {
          // skip
        }
      }
    }
    return okResponse(assistant, sessionId, parseKimiWireJsonl(raw), {
      title,
      cwd,
      sourcePath: path,
    });
  }

  if (assistant === 'kiro') {
    let path =
      sourcePathHint !== undefined &&
      (sourcePathHint.endsWith('.jsonl') || sourcePathHint.endsWith('.json'))
        ? sourcePathHint
        : await findKiroTranscriptPath(sessionId);
    path ??= await findKiroTranscriptPath(sessionId);
    if (path === null) {
      return null;
    }
    // Prefer the streaming jsonl when the hint is the summary .json.
    if (path.endsWith('.json')) {
      const jsonl = path.replace(/\.json$/u, '.jsonl');
      if ((await readFileSafe(jsonl)) !== null) {
        path = jsonl;
      }
    }
    const raw = await readFileSafe(path);
    if (raw === null) {
      return null;
    }
    if (path.endsWith('.jsonl')) {
      let title = '(untitled)';
      let cwd = '';
      const summaryPath = path.replace(/\.jsonl$/u, '.json');
      const summaryRaw = await readFileSafe(summaryPath);
      if (summaryRaw !== null) {
        try {
          const data = JSON.parse(summaryRaw) as Record<string, unknown>;
          title = cleanTitle(valueText(data, 'title', title));
          cwd = valueText(data, 'cwd', '');
        } catch {
          // keep
        }
      }
      return okResponse(assistant, sessionId, parseKiroSessionJsonl(raw), {
        title,
        cwd,
        sourcePath: path,
      });
    }
    // JSON-only sessions: assistant turns in conversation_metadata when present.
    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      const messages: SessionTranscriptMessage[] = [];
      const title = cleanTitle(valueText(data, 'title', '(untitled)'));
      if (title !== '(untitled)') {
        pushMessage(messages, 'user', title);
      }
      const state =
        data.session_state && typeof data.session_state === 'object'
          ? (data.session_state as Record<string, unknown>)
          : {};
      const meta =
        state.conversation_metadata && typeof state.conversation_metadata === 'object'
          ? (state.conversation_metadata as Record<string, unknown>)
          : {};
      const turns = Array.isArray(meta.user_turn_metadatas) ? meta.user_turn_metadatas : [];
      for (const turn of turns) {
        if (turn === null || typeof turn !== 'object') {
          continue;
        }
        const result = (turn as Record<string, unknown>).result;
        if (result === null || typeof result !== 'object') {
          continue;
        }
        const ok = (result as Record<string, unknown>).Ok;
        if (ok === null || typeof ok !== 'object') {
          continue;
        }
        const okRow = ok as Record<string, unknown>;
        if (valueText(okRow, 'role', '') === 'assistant') {
          pushMessage(messages, 'assistant', extractKiroContent(okRow.content));
        }
      }
      return okResponse(assistant, sessionId, messages.slice(-MAX_MESSAGES), {
        title,
        cwd: valueText(data, 'cwd', ''),
        sourcePath: path,
      });
    } catch {
      return null;
    }
  }

  if (assistant === 'devin') {
    let path =
      sourcePathHint !== undefined && sourcePathHint.endsWith('.json')
        ? sourcePathHint
        : await findDevinTranscriptPath(sessionId);
    // list-sessions often points at sessions.db — resolve real transcript file.
    if (path !== null && path.endsWith('.db')) {
      path = await findDevinTranscriptPath(sessionId);
    }
    path ??= await findDevinTranscriptPath(sessionId);
    if (path !== null) {
      const raw = await readFileSafe(path);
      if (raw !== null) {
        return okResponse(assistant, sessionId, parseDevinTranscriptJson(raw), {
          sourcePath: path,
        });
      }
    }
    // Most Devin sessions live only in sessions.db (title + cwd) without a steps JSON
    // export. Still hydrate a readable stub so Resume never lands empty.
    const listed = await listNativeSessions('devin', 200);
    const match = listed.find((row) => row.sessionId === sessionId);
    const title = match?.title ?? sessionId;
    const cwd = match?.cwd ?? '';
    return okResponse(
      assistant,
      sessionId,
      [
        {
          role: 'assistant',
          text: `Devin session: ${title}\n\nFull step history is not exported for this chat on disk (only the session list is). The session is still linked — send a message to continue in Terminal.`,
        },
      ],
      {
        title: cleanTitle(title),
        cwd,
        ...(match?.sourcePath === undefined ? {} : { sourcePath: match.sourcePath }),
      },
    );
  }

  return null;
};
