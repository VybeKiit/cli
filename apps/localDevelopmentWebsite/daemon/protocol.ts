export type AgentId = 'claude-code' | 'cursor' | 'gemini' | 'codex';

export type WorkflowStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

/** Browser → daemon. */
export type ClientMessage =
  | { type: 'agent.send'; agent: AgentId; content: string }
  | { type: 'agent.stop' };

/**
 * Daemon → browser.
 *
 * `sessionId` is optional throughout: the streaming daemon manages continuity
 * internally, while the e2e mock daemon still stamps a session id — both remain
 * valid on the wire.
 */
export type DaemonMessage =
  | { type: 'agent.output'; chunk: string; sessionId?: string }
  | { type: 'agent.tool'; name: string }
  | { type: 'agent.step'; stepId: string; status: WorkflowStep['status']; sessionId?: string }
  | { type: 'agent.status'; status: 'running' | 'idle' | 'error'; sessionId?: string }
  | { type: 'error'; message: string };
