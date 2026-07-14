import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { type WebSocket, WebSocketServer } from 'ws';
import { type Agent, createClaudeAgent } from './agents';
import type { AgentId, ClientMessage, DaemonMessage } from './protocol';

const PORT = 3006;

/**
 * Send a typed message to a client when its socket is open.
 *
 * @param ws - Target socket.
 * @param msg - Message to serialize.
 * @returns Nothing.
 */
const send = (ws: WebSocket, msg: DaemonMessage): void => {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
};

/**
 * Directory the agent builds in. Defaults to a dedicated `~/vybekiit-agent-workspace`
 * (created on demand) so an autonomous agent never edits the kit repo itself;
 * override with `VYBEKIIT_AGENT_CWD` to point at a specific project.
 *
 * @returns Absolute working directory for agent turns.
 */
const resolveAgentCwd = (): string => {
  const dir = process.env.VYBEKIIT_AGENT_CWD ?? join(homedir(), 'vybekiit-agent-workspace');
  mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * Build a streaming agent for the given id, or null when one isn't wired yet.
 *
 * @param id - Requested agent id.
 * @param cwd - Working directory for the agent.
 * @returns An {@link Agent}, or null.
 */
const createAgent = (id: AgentId, cwd: string): Agent | null =>
  id === 'claude-code' ? createClaudeAgent(cwd) : null;

/**
 * Wire one client connection: one agent (conversation) per socket.
 *
 * @param ws - The connected socket.
 * @returns Nothing.
 */
const handleConnection = (ws: WebSocket): void => {
  let agent: Agent | null = null;

  const runTurn = (id: AgentId, content: string): void => {
    if (agent === null) {
      agent = createAgent(id, resolveAgentCwd());
    }
    if (agent === null) {
      send(ws, { type: 'error', message: `Agent "${id}" is not available in streaming mode yet.` });
      send(ws, { type: 'agent.status', status: 'idle' });
      return;
    }
    send(ws, { type: 'agent.status', status: 'running' });
    agent.send(content, {
      onText: (text) => send(ws, { type: 'agent.output', chunk: text }),
      onTool: (name) => send(ws, { type: 'agent.tool', name }),
      onEnd: ({ isError }) =>
        send(ws, { type: 'agent.status', status: isError ? 'error' : 'idle' }),
    });
  };

  ws.on('message', (data) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString()) as ClientMessage;
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }
    if (msg.type === 'agent.send') {
      runTurn(msg.agent, msg.content);
    } else if (msg.type === 'agent.stop') {
      agent?.stop();
      send(ws, { type: 'agent.status', status: 'idle' });
    }
  });

  ws.on('close', () => {
    agent?.stop();
    agent = null;
  });
};

let server: WebSocketServer | null = null;

/**
 * Start the daemon WebSocket server once (idempotent). Safe to call from Next
 * instrumentation or a standalone entry; tolerates an already-bound port.
 *
 * @returns Nothing.
 * @example
 * startDaemon();
 */
export const startDaemon = (): void => {
  if (server !== null) {
    return;
  }
  const wss = new WebSocketServer({ port: PORT });
  wss.on('connection', handleConnection);
  wss.on('error', (err: NodeJS.ErrnoException) => {
    server = null;
    if (err.code === 'EADDRINUSE') {
      process.stdout.write(`[daemon] port ${PORT} already in use — reusing existing daemon\n`);
    } else {
      process.stderr.write(`[daemon] ${err.message}\n`);
    }
  });
  server = wss;
  process.stdout.write(`[daemon] VybeKiit daemon listening on ws://localhost:${PORT}\n`);
};

// Running this file directly (node/tsx) starts the daemon immediately.
const entry = process.argv[1] ?? '';
if (entry.endsWith('server.ts') || entry.endsWith('server.js')) {
  startDaemon();
}
