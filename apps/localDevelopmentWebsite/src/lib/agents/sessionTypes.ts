/** Session row returned by the local agent sessions API. */
export type AgentSession = {
  readonly session_id: string;
  readonly title: string;
  readonly cwd: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly parent_session_id?: string | undefined;
  readonly session_created_reason?: string | undefined;
  /** Absolute path to the source file (detail loaders). */
  readonly source_path?: string | undefined;
};

/** Hydrated chat message from an agent transcript. */
export type SessionMessage = {
  readonly role: 'user' | 'agent';
  readonly content: string;
  readonly timestamp?: string | undefined;
};

/** Full session detail for the main chat pane. */
export type SessionDetail = {
  readonly session_id: string;
  readonly title: string;
  readonly cwd: string;
  readonly messages: SessionMessage[];
  readonly created_at: string;
  readonly updated_at: string;
  readonly agent: string;
};
