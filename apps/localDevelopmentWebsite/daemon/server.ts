import { WebSocketServer } from 'ws';
import { type AgentProcess, sendToAgent, spawnClaude, spawnGemini, stopAgent } from './agents';
import type { AgentId, ClientMessage, DaemonMessage } from './protocol';

const PORT = 3006;
const sessions = new Map<string, AgentProcess>();

const wss = new WebSocketServer({ port: PORT });
const writeInfo = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const send = (ws: import('ws').WebSocket, msg: DaemonMessage) => {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
};

const spawnAgent = (ws: import('ws').WebSocket, agentId: AgentId) => {
  const onOutput = (chunk: string) => {
    const session = [...sessions.values()].find((s) => s.id === agentId);
    if (session) {
      send(ws, { type: 'agent.output', sessionId: session.sessionId, chunk });
    }
  };

  const onExit = (code: number | null) => {
    const session = [...sessions.values()].find((s) => s.id === agentId);
    if (session) {
      sessions.delete(session.sessionId);
      send(ws, { type: 'agent.status', sessionId: session.sessionId, status: 'idle' });
    }
  };

  let agent: AgentProcess;

  switch (agentId) {
    case 'claude-code':
      agent = spawnClaude(onOutput, onExit);
      break;
    case 'gemini':
      agent = spawnGemini(onOutput, onExit);
      break;
    default:
      send(ws, { type: 'error', message: `Agent "${agentId}" not yet supported` });
      return;
  }

  sessions.set(agent.sessionId, agent);
  send(ws, { type: 'agent.status', sessionId: agent.sessionId, status: 'running' });
};

const route = (ws: import('ws').WebSocket, msg: ClientMessage) => {
  switch (msg.type) {
    case 'agent.spawn':
      spawnAgent(ws, msg.agent);
      break;

    case 'agent.stop': {
      const session = sessions.get(msg.sessionId);
      if (session) {
        stopAgent(session);
        sessions.delete(msg.sessionId);
        send(ws, { type: 'agent.status', sessionId: msg.sessionId, status: 'idle' });
      } else {
        send(ws, { type: 'error', message: `No session "${msg.sessionId}"` });
      }
      break;
    }

    case 'agent.send': {
      const session = sessions.get(msg.sessionId);
      if (session) {
        sendToAgent(session, msg.content);
      } else {
        send(ws, { type: 'error', message: `No session "${msg.sessionId}"` });
      }
      break;
    }

    case 'agent.list': {
      const agents = [...sessions.values()].map((s) => ({
        id: s.id,
        sessionId: s.sessionId,
        status: 'running' as const,
      }));
      send(ws, { type: 'agent.list', agents });
      break;
    }

    case 'session.history':
      send(ws, { type: 'session.history', sessions: [] });
      break;
  }
};

wss.on('connection', (ws) => {
  writeInfo('[daemon] client connected');

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as ClientMessage;
      route(ws, msg);
    } catch (err) {
      send(ws, { type: 'error', message: 'Invalid JSON' });
    }
  });

  ws.on('close', () => {
    writeInfo('[daemon] client disconnected');
  });
});

writeInfo(`[daemon] VybeKiit daemon listening on ws://localhost:${PORT}`);
