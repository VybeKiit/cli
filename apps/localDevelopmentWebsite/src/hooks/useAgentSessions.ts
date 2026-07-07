'use client';

import { useCallback, useEffect, useState } from 'react';
import { type AgentId, useAgentStore } from '@/stores/agentStore';

/** Session metadata loaded from a local agent's filesystem state. */
export type AgentSession = {
  readonly session_id: string;
  readonly title: string;
  readonly cwd: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly parent_session_id?: string | undefined;
  readonly session_created_reason?: string | undefined;
};

type UseAgentSessionsReturn = {
  readonly sessions: AgentSession[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
  readonly createSession: (title: string) => Promise<void>;
};

const launchCommandByAgent: Record<AgentId, (title: string) => string> = {
  kiro: (title) => `kiro-cli chat "${title}"`,
  'claude-code': (title) => `claude "${title}"`,
  cursor: (title) => `cursor "${title}"`,
  gemini: (title) => `gemini "${title}"`,
  codex: (title) => `codex "${title}"`,
};

/**
 * Fetches real coding sessions from the active agent's storage.
 * For Kiro: reads ~/.kiro/sessions/cli/*.json via our API route.
 * Supports all agents: kiro | claude-code | cursor | gemini | codex.
 *
 * @returns Session list state, refresh action, and create-session action.
 * @example
 * const { sessions, refresh } = useAgentSessions();
 */
export const useAgentSessions = (): UseAgentSessionsReturn => {
  const { activeAgentId, getActive } = useAgentStore();
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions?agent=${activeAgentId}&limit=30`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { sessions: AgentSession[] };
      if (!Array.isArray(data.sessions)) {
        throw new Error('Sessions response did not include a session list.');
      }
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [activeAgentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(
    async (title: string) => {
      const agent = getActive();
      const makeLaunchCommand = launchCommandByAgent[agent.id];
      if (makeLaunchCommand === undefined) {
        setError(`Unsupported agent: ${agent.id}`);
        return;
      }
      const command = makeLaunchCommand(title);

      try {
        await navigator.clipboard.writeText(command);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not copy launch command');
      }
      setTimeout(fetchSessions, 2000);
    },
    [getActive, fetchSessions],
  );

  return { sessions, loading, error, refresh: fetchSessions, createSession };
};
