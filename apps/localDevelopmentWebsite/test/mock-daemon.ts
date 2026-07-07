#!/usr/bin/env node
/**
 * Mock daemon: opens a WebSocket server on ws://localhost:3006 and emits
 * synthetic `agent.step` protocol messages to drive e2e workflow tests.
 */

import { WebSocketServer } from 'ws';

const PORT = 3006;
const STEPS = ['scaffold', 'landing', 'auth', 'dashboard', 'database', 'payment', 'deploy'];

const wss = new WebSocketServer({ port: PORT });

const writeInfo = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

wss.on('connection', (ws) => {
  writeInfo('[mock-daemon] client connected');

  ws.send(
    JSON.stringify({
      type: 'agent.status',
      sessionId: 'mock-session-1',
      status: 'running',
    }),
  );

  let i = 0;
  const tick = () => {
    if (i >= STEPS.length) {
      ws.send(
        JSON.stringify({
          type: 'agent.status',
          sessionId: 'mock-session-1',
          status: 'idle',
        }),
      );
      writeInfo('[mock-daemon] all steps complete');
      return;
    }

    const stepId = STEPS[i];
    ws.send(
      JSON.stringify({
        type: 'agent.step',
        sessionId: 'mock-session-1',
        stepId,
        status: 'running',
      }),
    );
    writeInfo(`[mock-daemon] step running: ${stepId}`);

    setTimeout(() => {
      ws.send(
        JSON.stringify({
          type: 'agent.step',
          sessionId: 'mock-session-1',
          stepId,
          status: 'done',
        }),
      );
      writeInfo(`[mock-daemon] step done: ${stepId}`);
      i += 1;
      setTimeout(tick, 500);
    }, 800);
  };

  tick();

  ws.on('close', () => {
    writeInfo('[mock-daemon] client disconnected');
  });
});

writeInfo(`[mock-daemon] listening on ws://localhost:${PORT}`);
