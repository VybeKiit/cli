'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AgentId } from '@/lib/agents/registry';
import { useAgentStore } from '@/stores/agentStore';

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

type LaunchResult = {
  readonly ok: boolean;
  readonly command: string;
  readonly cwd: string;
  readonly launched: boolean;
  readonly message: string;
  readonly error?: string;
};

type UseAgentSessionsReturn = {
  readonly sessions: AgentSession[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly refresh: () => void;
  readonly createSession: (title: string) => Promise<void>;
  readonly resumeSession: (sessionId: string, cwd?: string) => Promise<void>;
};

/**
 * Fetches real coding sessions from the active agent's storage and
 * launches/resumes CLIs via the local launch API.
 *
 * @returns Session list state and launch actions.
 * @example
 * const { sessions, refresh, createSession } = useAgentSessions();
 */
export const useAgentSessions = (): UseAgentSessionsReturn => {
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const getActive = useAgentStore((s) => s.getActive);
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions?agent=${activeAgentId}&limit=30`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { sessions: AgentSession[]; error?: string };
      if (data.error) {
        throw new Error(data.error);
      }
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

  const postLaunch = useCallback(
    async (body: {
      agent: AgentId;
      mode: 'new' | 'resume';
      sessionId?: string;
      prompt?: string;
      cwd?: string;
    }) => {
      const res = await fetch('/api/agents/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as LaunchResult;
      if (!res.ok || data.ok === false) {
        throw new Error(data.error ?? data.message ?? 'Launch failed');
      }

      try {
        await navigator.clipboard.writeText(
          data.cwd ? `cd ${data.cwd} && ${data.command}` : data.command,
        );
      } catch {
        // clipboard optional
      }

      if (data.launched) {
        toast.success(data.message, { description: data.command });
      } else {
        toast.message(data.message, {
          description: `Copied: ${data.command}`,
        });
      }

      return data;
    },
    [],
  );

  const createSession = useCallback(
    async (title: string) => {
      const agent = getActive();
      try {
        const projectCwd = process.env.NEXT_PUBLIC_PROJECT_CWD;
        await postLaunch({
          agent: agent.id,
          mode: 'new',
          prompt: title,
          ...(projectCwd === undefined ? {} : { cwd: projectCwd }),
        });
        setTimeout(fetchSessions, 2500);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not launch agent';
        setError(message);
        toast.error(message);
      }
    },
    [getActive, postLaunch, fetchSessions],
  );

  const resumeSession = useCallback(
    async (sessionId: string, cwd?: string) => {
      const agent = getActive();
      try {
        const resolvedCwd = cwd ?? process.env.NEXT_PUBLIC_PROJECT_CWD;
        await postLaunch({
          agent: agent.id,
          mode: 'resume',
          sessionId,
          ...(resolvedCwd === undefined ? {} : { cwd: resolvedCwd }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not resume session';
        setError(message);
        toast.error(message);
      }
    },
    [getActive, postLaunch],
  );

  return {
    sessions,
    loading,
    error,
    refresh: fetchSessions,
    createSession,
    resumeSession,
  };
};
