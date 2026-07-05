export type AgentId = 'claude-code' | 'cursor' | 'gemini' | 'codex';

export type AgentStatus = {
  id: AgentId;
  sessionId: string | null;
  status: 'running' | 'idle' | 'error';
};

export type Session = {
  id: string;
  agentId: AgentId;
  startedAt: number;
  title: string;
};

export type WorkflowStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

export type ClientMessage =
  | { type: 'agent.spawn'; agent: AgentId }
  | { type: 'agent.stop'; sessionId: string }
  | { type: 'agent.send'; sessionId: string; content: string }
  | { type: 'agent.list' }
  | { type: 'session.history'; agent: AgentId };

export type DaemonMessage =
  | { type: 'agent.output'; sessionId: string; chunk: string }
  | { type: 'agent.step'; sessionId: string; step: WorkflowStep }
  | { type: 'agent.status'; sessionId: string; status: 'running' | 'idle' | 'error' }
  | { type: 'agent.list'; agents: AgentStatus[] }
  | { type: 'session.history'; sessions: Session[] }
  | { type: 'error'; message: string };
