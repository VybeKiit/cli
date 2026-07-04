import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { VybeAssistant } from '@vybekiit/report-mode';
import { Schema } from 'effect';
import { describePageContext, PageContext } from '../context';
import { type BridgeEvent, serializeBridgeEvent } from '../protocol';
import { buildSpawnPlan, type LiveAssistant, mapCliEvent } from './adapters';
import { handleCapabilitiesRequest, handleModelsRequest, readJsonBody } from './routes';

const decodePageContext = Schema.decodeUnknownOption(PageContext);

const LIVE: readonly VybeAssistant[] = ['claude', 'codex'];

function isLive(assistant: VybeAssistant | null): assistant is LiveAssistant {
  return assistant !== null && LIVE.includes(assistant);
}

interface AttachmentInput {
  readonly filename?: string;
  readonly mediaType?: string;
  readonly dataBase64?: string;
}

interface SendPayload {
  readonly sessionId?: string;
  readonly text?: string;
  readonly context?: unknown;
  readonly assistant?: VybeAssistant;
  readonly model?: string;
  readonly attachments?: readonly AttachmentInput[];
}

/** Start the bridge; returns the http.Server so the caller can close it on shutdown. */
export function startAssistantChatBridge(options: BridgeOptions): Server {
  const sessions = new Map<string, Session>();
  const cors = options.allowOrigin ?? '*';

  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', cors);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const url = new URL(req.url ?? '/', `http://localhost:${options.port}`);
    if (req.method === 'GET' && url.pathname === '/events') {
      openStream(url.searchParams.get('session') ?? 'default', res, sessions);
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
    if (req.method === 'POST' && url.pathname === '/send') {
      void handleSend(req, res, sessions, options);
      return;
    }
    res.writeHead(404).end();
  });

  server.listen(options.port);
  return server;
}

/**
 * Standalone dev-only SSE bridge. The browser opens `GET /events` (one EventSource per
 * session) and POSTs `{ text, context }` to `/send`; the bridge spawns the active agent
 * CLI for that turn and streams its output back as protocol events. Never run in prod.
 */

export interface BridgeOptions {
  readonly port: number;
  readonly assistant: VybeAssistant | null;
  readonly cwd: string;
  /** Origin allowed to connect (the dev app). Defaults to '*', fine for localhost dev. */
  readonly allowOrigin?: string;
}

interface Session {
  readonly res: ServerResponse;
}

function openStream(sessionId: string, res: ServerResponse, sessions: Map<string, Session>): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
  res.write(': connected\n\n');
  sessions.set(sessionId, { res });
  res.on('close', () => sessions.delete(sessionId));
}

function emit(session: Session | undefined, event: BridgeEvent): void {
  if (!session) {
    return;
  }
  session.res.write(`data: ${serializeBridgeEvent(event)}\n\n`);
}

async function handleSend(
  req: IncomingMessage,
  res: ServerResponse,
  sessions: Map<string, Session>,
  options: BridgeOptions,
): Promise<void> {
  let parsed: SendPayload;
  try {
    parsed = JSON.parse(await readJsonBody(req)) as SendPayload;
  } catch {
    res.writeHead(400).end('bad json');
    return;
  }
  const sessionId = parsed.sessionId ?? 'default';
  const session = sessions.get(sessionId);
  res.writeHead(202).end('accepted');
  runTurn(session, parsed, options);
}

function runTurn(session: Session | undefined, payload: SendPayload, options: BridgeOptions): void {
  const assistant = payload.assistant ?? options.assistant;
  if (!isLive(assistant)) {
    emit(session, {
      type: 'error',
      message: 'No live agent — pick Claude or Codex (Cursor is deeplink-only).',
    });
    emit(session, { type: 'done' });
    return;
  }

  const attachmentPaths = persistAttachments(payload.attachments);
  const prompt = buildPrompt(payload.text ?? '', payload.context, attachmentPaths);
  const plan = buildSpawnPlan(assistant, prompt, {
    ...(payload.model ? { model: payload.model } : {}),
  });
  emit(session, { type: 'status', state: 'starting' });

  // Ignore stdin — the prompt is passed as argv, and an open stdin makes the CLI wait ~3s.
  const child = spawn(plan.command, [...plan.args], {
    cwd: options.cwd,
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
      if (!rawLine) {
        continue;
      }
      try {
        const event = mapCliEvent(assistant, JSON.parse(rawLine));
        if (event) {
          emit(session, event);
        }
      } catch {
        // Non-JSON line (banner/log) — ignore.
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
}

/** Sanitize an untrusted filename to a flat basename so a temp write can't escape its dir. */
function safeFilename(name: string, index: number): string {
  const base = name.split(/[/\\]/).pop() ?? '';
  const cleaned = base.replace(/[^\w.\- ]+/g, '_').trim();
  return cleaned.length > 0 ? cleaned : `attachment-${index}`;
}

/** Write each base64 attachment to a fresh temp dir; return the on-disk paths for @-referencing. */
function persistAttachments(attachments: readonly AttachmentInput[] | undefined): string[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }
  const dir = mkdtempSync(join(tmpdir(), 'vybe-assistant-chat-'));
  const paths: string[] = [];
  attachments.forEach((attachment, index) => {
    if (!attachment.dataBase64) {
      return;
    }
    const filePath = join(dir, safeFilename(attachment.filename ?? '', index));
    writeFileSync(filePath, Buffer.from(attachment.dataBase64, 'base64'));
    paths.push(filePath);
  });
  return paths;
}

function buildPrompt(
  text: string,
  rawContext: unknown,
  attachmentPaths: readonly string[],
): string {
  const option = decodePageContext(rawContext);
  const withContext =
    option._tag === 'Some' ? `${describePageContext(option.value)}\n\n${text}` : text;
  if (attachmentPaths.length === 0) {
    return withContext;
  }
  // Both the claude and codex CLIs read `@path` file references from the prompt text.
  const refs = attachmentPaths.map((path) => `@${path}`).join(' ');
  return `${withContext}\n\nAttached files: ${refs}`;
}
