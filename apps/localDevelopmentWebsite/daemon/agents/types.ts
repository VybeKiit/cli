import type { AgentId } from '@/daemon/contract';

/** Callbacks a running agent uses to report streamed activity for one turn. */
export type TurnHandlers = {
  /** A chunk of assistant text (token-level when partial streaming is on). */
  readonly onText: (text: string) => void;
  /** The turn finished (success or error). */
  readonly onEnd: (info: { readonly isError: boolean }) => void;
  /** The agent's session id, once known (for resume continuity). */
  readonly onSession?: (sessionId: string) => void;
  /** A tool the agent started using (rendered as a workflow card). */
  readonly onTool?: (name: string) => void;
};

/** A long-lived agent bound to one working directory / conversation. */
export type Agent = {
  readonly id: AgentId;
  /** Run one user turn, streaming activity through the handlers. */
  readonly send: (prompt: string, handlers: TurnHandlers) => void;
  /** Terminate any in-flight turn. */
  readonly stop: () => void;
};
