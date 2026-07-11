import { spawn } from 'node:child_process';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { describePageContext, PageContext } from '@vybekiit/assistant-chat/context';
import { type BridgeEvent, serializeBridgeEvent } from '@vybekiit/assistant-chat/protocol';
import type { VybeAssistant } from '@vybekiit/report-mode';
import { Schema } from 'effect';
import { buildSpawnPlan, type LiveAssistant, mapCliEvent } from './adapters';
import { type AttachmentInput, persistAttachments } from './attachmentFiles';
import {
  handleCapabilitiesRequest,
  handleModelsRequest,
  handleSessionsRequest,
  readJsonBody,
} from './routes';

const decodePageContext = Schema.decodeUnknownOption(PageContext);

const LIVE: readonly VybeAssistant[] = ['claude', 'codex', 'kimi', 'grok'];
const DEFAULT_ALLOW_ORIGIN = '*';
const DEFAULT_SESSION_ID = 'default';
const DEFAULT_REQUEST_PATH = '/';

const isLive = (assistant: VybeAssistant | null): assistant is LiveAssistant =>
  assistant !== null && LIVE.includes(assistant);

type SendPayload = {
  readonly sessionId?: string;
  readonly text?: string;
  readonly context?: unknown;
  readonly assistant?: VybeAssistant;
  readonly model?: string;
  /** Native agent CLI session id — resume that conversation on this turn. */
  readonly agentSessionId?: string;
  /** Project folder for this turn (CLI session cwd). Falls back to bridge cwd. */
  readonly cwd?: string;
  readonly attachments?: readonly AttachmentInput[];
};

/**
 * Standalone dev-only SSE bridge. The browser opens `GET /events` and posts turns to `/send`.
 */
export type BridgeOptions = {
  readonly port: number;
  readonly assistant: VybeAssistant | null;
  readonly cwd: string;
  /** Origin allowed to connect from the dev app. Defaults to localhost-safe wildcard behavior. */
  readonly allowOrigin?: string;
};

type Session = {
  readonly res: ServerResponse;
};

const resolveAllowOrigin = (options: BridgeOptions): string => {
  if (typeof options.allowOrigin === 'string') {
    return options.allowOrigin;
  }

  return DEFAULT_ALLOW_ORIGIN;
};

const resolveRequestUrl = (req: IncomingMessage, port: number): URL => {
  if (typeof req.url === 'string') {
    return new URL(req.url, `http://localhost:${port}`);
  }

  return new URL(DEFAULT_REQUEST_PATH, `http://localhost:${port}`);
};

const resolveSessionId = (value: string | null | undefined): string => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return DEFAULT_SESSION_ID;
};

const resolveTurnAssistant = (
  payload: SendPayload,
  options: BridgeOptions,
): VybeAssistant | null => {
  if (payload.assistant !== undefined) {
    return payload.assistant;
  }

  return options.assistant;
};

const resolveTurnText = (payload: SendPayload): string => {
  if (typeof payload.text === 'string') {
    return payload.text;
  }

  return '';
};

/**
 * Start the assistant chat bridge server.
 *
 * @param options - Bridge port, cwd, assistant, and optional CORS origin.
 * @returns The HTTP server so the caller can close it on shutdown.
 * @example
 * const server = startAssistantChatBridge({ port: 4319, assistant: 'codex', cwd: process.cwd() });
 */
export const startAssistantChatBridge = (options: BridgeOptions): Server => {
  const sessions = new Map<string, Session>();
  const allowOrigin = resolveAllowOrigin(options);

  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const url = resolveRequestUrl(req, options.port);
    if (req.method === 'GET' && url.pathname === '/events') {
      openStream(resolveSessionId(url.searchParams.get('session')), res, sessions);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/capabilities') {
      handleCapabilitiesRequest(res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/models') {
      void handleModelsRequest(url.searchParams.get('assistant'), res);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/sessions') {
      void handleSessionsRequest(url.searchParams.get('assistant'), res);
      return;
    }
    if (req.method === 'POST' && url.pathname === '/send') {
      void handleSend(req, res, sessions, options);
      return;
    }
    res.writeHead(404).end();
  });

  server.listen(options.port);
  return server;
};

const openStream = (
  sessionId: string,
  res: ServerResponse,
  sessions: Map<string, Session>,
): void => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.write(': connected\n\n');
  sessions.set(sessionId, { res });
  res.on('close', () => sessions.delete(sessionId));
};

const emit = (session: Session | undefined, event: BridgeEvent): void => {
  if (!session) {
    return;
  }
  session.res.write(`data: ${serializeBridgeEvent(event)}\n\n`);
};

const handleSend = async (
  req: IncomingMessage,
  res: ServerResponse,
  sessions: Map<string, Session>,
  options: BridgeOptions,
): Promise<void> => {
  let parsed: SendPayload;
  try {
    parsed = JSON.parse(await readJsonBody(req)) as SendPayload;
  } catch {
    res.writeHead(400).end('bad json');
    return;
  }
  const sessionId = resolveSessionId(parsed.sessionId);
  const session = sessions.get(sessionId);
  res.writeHead(202).end('accepted');
  runTurn(session, parsed, options);
};

const runTurn = (
  session: Session | undefined,
  payload: SendPayload,
  options: BridgeOptions,
): void => {
  const assistant = resolveTurnAssistant(payload, options);
  if (!isLive(assistant)) {
    emit(session, {
      type: 'error',
      message:
        'No live agent for in-panel stream — pick Claude, Codex, Kimi, or Grok (others open in Terminal).',
    });
    emit(session, { type: 'done' });
    return;
  }

  const attachmentPaths = persistAttachments(payload.attachments);
  const prompt = buildPrompt(resolveTurnText(payload), payload.context, attachmentPaths);
  const agentSessionId =
    typeof payload.agentSessionId === 'string' && payload.agentSessionId.length > 0
      ? payload.agentSessionId
      : undefined;
  const plan = buildSpawnPlan(assistant, prompt, {
    ...(payload.model ? { model: payload.model } : {}),
    ...(agentSessionId === undefined ? {} : { agentSessionId }),
  });
  emit(session, { type: 'status', state: 'starting' });

  const turnCwd =
    typeof payload.cwd === 'string' && payload.cwd.length > 0 ? payload.cwd : options.cwd;

  // Ignore stdin - the prompt is passed as argv, and an open stdin makes the CLI wait ~3s.
  const child = spawn(plan.command, [...plan.args], {
    cwd: turnCwd,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let buffer = '';
  emit(session, { type: 'status', state: 'streaming' });

  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    let newlineAt = buffer.indexOf('\n');
    while (newlineAt !== -1) {
      const rawLine = buffer.slice(0, newlineAt).trim();
      buffer = buffer.slice(newlineAt + 1);
      newlineAt = buffer.indexOf('\n');
      if (rawLine.length > 0) {
        try {
          const event = mapCliEvent(assistant, JSON.parse(rawLine));
          if (event) {
            emit(session, event);
          }
        } catch {
          // Non-JSON line (banner/log) - ignore.
        }
      }
    }
  });

  child.stderr.on('data', (chunk: Buffer) => {
    emit(session, {
      type: 'tool_call',
      name: 'stderr',
      detail: chunk.toString('utf8').slice(0, 500),
    });
  });

  child.on('error', (error) => {
    emit(session, { type: 'error', message: error.message });
    emit(session, { type: 'done' });
  });

  child.on('close', (code) => {
    emit(session, { type: 'status', state: 'idle' });
    emit(session, { type: 'done', ...(code === null ? {} : { exitCode: code }) });
  });
};

const buildPrompt = (
  text: string,
  rawContext: unknown,
  attachmentPaths: readonly string[],
): string => {
  const option = decodePageContext(rawContext);
  const withContext =
    option._tag === 'Some' ? `${describePageContext(option.value)}\n\n${text}` : text;
  if (attachmentPaths.length === 0) {
    return withContext;
  }
  // Both the claude and codex CLIs read `@path` file references from the prompt text.
  const refs = attachmentPaths.map((path) => `@${path}`).join(' ');
  return `${withContext}\n\nAttached files: ${refs}`;
};
