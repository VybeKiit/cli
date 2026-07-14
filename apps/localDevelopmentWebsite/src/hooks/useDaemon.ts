'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentStore, useChatStore, useWorkflowStore } from '@/stores';

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
  | { type: 'agent.output'; chunk: string }
  | { type: 'agent.tool'; name: string }
  | { type: 'agent.step'; stepId: string; status: 'running' | 'done' | 'error' }
  | { type: 'agent.status'; status: 'running' | 'idle' | 'error' }
  | { type: 'error'; message: string };

/**
 * WebSocket client to the local daemon. Streams real agent output into the
 * active conversation (token by token) and advances the workflow board — so the
 * agent works inside the browser tab instead of a spawned terminal window.
 *
 * @returns Connection status plus `sendPrompt` / `stop` actions.
 * @example
 * const { status, sendPrompt } = useDaemon();
 */
export const useDaemon = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<DaemonStatus>('disconnected');
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStepRef = useRef<string | null>(null);
  const activeConversationRef = useRef<string | null>(null);

  const markStepRunning = useWorkflowStore((s) => s.markStepRunning);
  const markStepDone = useWorkflowStore((s) => s.markStepDone);
  const setRunning = useWorkflowStore((s) => s.setRunning);
  const appendAssistantDelta = useChatStore((s) => s.appendAssistantDelta);
  const finalizeAssistant = useChatStore((s) => s.finalizeAssistant);

  const advanceStep = useCallback(
    (stepId: string) => {
      if (stepId === lastStepRef.current) {
        return;
      }
      if (lastStepRef.current !== null) {
        markStepDone(lastStepRef.current);
      }
      markStepRunning(stepId);
      lastStepRef.current = stepId;
    },
    [markStepDone, markStepRunning],
  );

  const handleMessage = useCallback(
    (msg: DaemonMessage) => {
      switch (msg.type) {
        case 'agent.output': {
          const conversationId = activeConversationRef.current;
          if (conversationId !== null) {
            appendAssistantDelta(conversationId, msg.chunk);
          }
          const stepId = detectStepFromOutput(msg.chunk);
          if (stepId !== null) {
            advanceStep(stepId);
          }
          break;
        }
        case 'agent.step': {
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
            setRunning(true);
            break;
          }
          setRunning(false);
          if (lastStepRef.current !== null) {
            markStepDone(lastStepRef.current);
            lastStepRef.current = null;
          }
          const conversationId = activeConversationRef.current;
          if (conversationId !== null) {
            finalizeAssistant(conversationId);
          }
          break;
        }
        default:
          // agent.tool / error: reserved for richer cards; no-op for now.
          break;
      }
    },
    [
      advanceStep,
      appendAssistantDelta,
      finalizeAssistant,
      markStepDone,
      markStepRunning,
      setRunning,
    ],
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    setStatus('connecting');
    const ws = new WebSocket(DAEMON_URL);

    ws.onopen = () => setStatus('connected');
    ws.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data) as DaemonMessage);
      } catch {
        // Ignore malformed frames.
      }
    };
    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };
    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [handleMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  /**
   * Send a user turn to the daemon, routing streamed output into this
   * conversation. Returns false when the daemon isn't connected so callers can
   * fall back to the terminal launcher.
   */
  const sendPrompt = useCallback((conversationId: string, content: string): boolean => {
    const ws = wsRef.current;
    if (ws === null || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    activeConversationRef.current = conversationId;
    lastStepRef.current = null;
    ws.send(
      JSON.stringify({
        type: 'agent.send',
        agent: useAgentStore.getState().activeAgentId,
        content,
      }),
    );
    return true;
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'agent.stop' }));
  }, []);

  return { status, sendPrompt, stop };
};
