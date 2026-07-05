#!/usr/bin/env node
/**
 * Mock daemon: opens a WebSocket server on ws://localhost:3006 and emits
 * synthetic `agent.step` protocol messages to drive e2e workflow tests.
 */

import { WebSocketServer } from 'ws';

const PORT = 3006;
const STEPS = [
  'scaffold',
  'landing',
  'auth',
  'dashboard',
  'database',
  'payment',
  'deploy',
];

const wss = new WebSocketServer({ port: PORT });

let running = false;

wss.on('connection', (ws) => {
  console.log('[mock-daemon] client connected');

  ws.send(
    JSON.stringify({
      type: 'agent.status',
      sessionId: 'mock-session-1',
      status: 'running',
    }),
  );

  if (running) return;
  running = true;

  let i = 0;
  function tick() {
    if (i >= STEPS.length) {
      ws.send(
        JSON.stringify({
          type: 'agent.status',
          sessionId: 'mock-session-1',
          status: 'idle',
        }),
      );
      console.log('[mock-daemon] all steps complete');
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
    console.log(`[mock-daemon] step running: ${stepId}`);

    setTimeout(() => {
      ws.send(
        JSON.stringify({
          type: 'agent.step',
          sessionId: 'mock-session-1',
          stepId,
          status: 'done',
        }),
      );
      console.log(`[mock-daemon] step done: ${stepId}`);
      i += 1;
      setTimeout(tick, 500);
    }, 800);
  }

  tick();

  ws.on('close', () => {
    console.log('[mock-daemon] client disconnected');
    running = false;
  });
});

console.log(`[mock-daemon] listening on ws://localhost:${PORT}`);
