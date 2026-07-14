export type AgentId =
  | 'kiro'
  | 'claude-code'
  | 'cursor'
  | 'gemini'
  | 'codex'
  | 'kimi'
  | 'grok'
  | 'devin';

export type WorkflowStepStatus = 'pending' | 'running' | 'done' | 'error';

export type ClientMessage =
  | { readonly type: 'agent.send'; readonly agent: AgentId; readonly content: string }
  | { readonly type: 'agent.stop' };

export type DaemonMessage =
  | { readonly type: 'agent.output'; readonly chunk: string; readonly sessionId?: string }
  | { readonly type: 'agent.tool'; readonly name: string }
  | {
      readonly type: 'agent.step';
      readonly stepId: string;
      readonly status: WorkflowStepStatus;
      readonly sessionId?: string;
    }
  | {
      readonly type: 'agent.status';
      readonly status: 'running' | 'idle' | 'error';
      readonly sessionId?: string;
    }
  | { readonly type: 'error'; readonly message: string };
