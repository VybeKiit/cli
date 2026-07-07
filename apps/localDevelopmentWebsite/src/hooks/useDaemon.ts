'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkflowStore } from '@/stores';

type DaemonStatus = 'connecting' | 'connected' | 'disconnected';

const DAEMON_URL = 'ws://localhost:3006';
const RECONNECT_DELAY = 3000;

/** Maps agent output keywords to workflow step IDs for auto-progress. */
const STEP_KEYWORDS: Record<string, string> = {
  scaffold: 'scaffold',
  'landing page': 'landing',
  'terms of service': 'terms',
  'privacy policy': 'privacy',
  dashboard: 'dashboard',
  billing: 'billing',
  settings: 'settings',
  authentication: 'auth',
  'sign up': 'auth-signup',
  'sign in': 'auth-signin',
  'google sign': 'auth-google',
  'forgot password': 'auth-otp',
  database: 'database',
  'wire the database': 'database',
  payment: 'payment',
  payments: 'payment',
  deploy: 'deploy',
  'go live': 'deploy',
};

const detectStepFromOutput = (chunk: string): string | null => {
  const lower = chunk.toLowerCase();
  for (const [keyword, stepId] of Object.entries(STEP_KEYWORDS)) {
    if (lower.includes(keyword)) {
      return stepId;
    }
  }
  return null;
};

type DaemonMessage =
  | { type: 'agent.output'; sessionId: string; chunk: string }
  | { type: 'agent.step'; sessionId: string; stepId: string; status: 'running' | 'done' | 'error' }
  | { type: 'agent.status'; sessionId: string; status: 'running' | 'idle' | 'error' }
  | { type: 'error'; message: string };

/**
 * WebSocket client to the local daemon. Wires real agent output to the chat
 * store and workflow store so steps advance from actual agent activity.
 */
/**
 * Read daemon state.
 *
 * @returns The state and actions exposed by useDaemon.
 * @example
 * const value = useDaemon();
 */
export const useDaemon = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<DaemonStatus>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const markStepRunning = useWorkflowStore((s) => s.markStepRunning);
  const markStepDone = useWorkflowStore((s) => s.markStepDone);
  const setRunning = useWorkflowStore((s) => s.setRunning);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStepRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const ws = new WebSocket(DAEMON_URL);

    ws.onopen = () => {
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as DaemonMessage;

      switch (msg.type) {
        case 'agent.output': {
          setSessionId(msg.sessionId);
          // Log agent output into the active conversation (if any)
          // In a full implementation this would route to the correct conversation
          const stepId = detectStepFromOutput(msg.chunk);
          if (stepId && stepId !== lastStepRef.current) {
            if (lastStepRef.current) {
              markStepDone(lastStepRef.current);
            }
            markStepRunning(stepId);
            lastStepRef.current = stepId;
          }
          break;
        }
        case 'agent.step': {
          setSessionId(msg.sessionId);
          if (msg.status === 'running') {
            markStepRunning(msg.stepId);
            setRunning(true);
          } else if (msg.status === 'done') {
            markStepDone(msg.stepId);
          }
          break;
        }
        case 'agent.status': {
          if (msg.status === 'running') {
            setSessionId(msg.sessionId);
            setRunning(true);
          } else {
            setRunning(false);
            setSessionId(null);
          }
          break;
        }
        case 'error': {
          setStatus('disconnected');
          break;
        }
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [markStepRunning, markStepDone, setRunning]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  const spawn = useCallback((agent: string) => {
    lastStepRef.current = null;
    wsRef.current?.send(JSON.stringify({ type: 'agent.spawn', agent }));
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!sessionId) return;
      wsRef.current?.send(JSON.stringify({ type: 'agent.send', sessionId, content }));
    },
    [sessionId],
  );

  const stop = useCallback(() => {
    if (!sessionId) return;
    wsRef.current?.send(JSON.stringify({ type: 'agent.stop', sessionId }));
  }, [sessionId]);

  return { status, sessionId, spawn, sendMessage, stop };
};
