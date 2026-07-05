'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAgentStore } from '@/stores/agentStore';

export interface AgentSession {
  session_id: string;
  title: string;
  cwd: string;
  created_at: string;
  updated_at: string;
  parent_session_id?: string | undefined;
  session_created_reason?: string | undefined;
}

interface UseAgentSessionsReturn {
  sessions: AgentSession[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createSession: (title: string) => Promise<void>;
}

/**
 * Fetches real coding sessions from the active agent's storage.
 * For Kiro: reads ~/.kiro/sessions/cli/*.json via our API route.
 * Supports all agents: kiro | claude-code | cursor | gemini | codex.
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
      setSessions(data.sessions ?? []);
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
      const command =
        agent.id === 'kiro'
          ? `kiro-cli chat "${title}"`
          : agent.id === 'claude-code'
            ? `claude "${title}"`
            : `${agent.command} "${title}"`;

      try {
        await navigator.clipboard.writeText(command);
      } catch {
        // Fallback: just log it
      }
      console.log(`[VybeKiit] Launch new session: ${command}`);
      setTimeout(fetchSessions, 2000);
    },
    [getActive, fetchSessions],
  );

  return { sessions, loading, error, refresh: fetchSessions, createSession };
};
