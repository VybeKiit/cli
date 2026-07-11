import type { VybeAssistant } from '@vybekiit/report-mode';

/**
 * One native CLI session row discovered on the local machine.
 * Ids are the values each agent expects for its resume flag.
 */
export type NativeAgentSession = {
  readonly sessionId: string;
  readonly title: string;
  readonly cwd: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly assistant: VybeAssistant;
  /** Absolute path to the source transcript when known. */
  readonly sourcePath?: string | undefined;
};

/** Response shape for GET /sessions (bridge + landing API). */
export type ListSessionsResponse = {
  readonly assistant: VybeAssistant;
  readonly sessions: readonly NativeAgentSession[];
  readonly fetchedAt: string;
};

/** One chat bubble loaded from a native CLI transcript for panel hydrate. */
export type SessionTranscriptMessage = {
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly timestamp?: string;
};

/**
 * Full conversation payload for Resume hydrate.
 * Panel maps `messages` into `useAssistantChat` so history is visible, not only linked.
 */
export type SessionTranscriptResponse = {
  readonly assistant: VybeAssistant;
  readonly sessionId: string;
  readonly title: string;
  readonly cwd: string;
  readonly messages: readonly SessionTranscriptMessage[];
  readonly sourcePath?: string;
  readonly fetchedAt: string;
};
