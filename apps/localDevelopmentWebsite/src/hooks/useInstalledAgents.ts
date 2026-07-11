'use client';

import { useEffect } from 'react';
import type { AgentId } from '@/lib/agents/registry';
import { useAgentStore } from '@/stores/agentStore';

/**
 * Probe which agent CLIs are installed and write status into the agent store.
 *
 * @returns void — side-effect hook.
 * @example
 * useInstalledAgents();
 */
export const useInstalledAgents = (): void => {
  const setInstalled = useAgentStore((s) => s.setInstalled);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch('/api/agents');
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as {
          agents: Array<{
            id: AgentId;
            installed: boolean;
            resolvedCommand: string | null;
          }>;
        };
        if (cancelled || !Array.isArray(data.agents)) {
          return;
        }
        setInstalled(
          data.agents.map((a) => ({
            id: a.id,
            installed: a.installed,
            resolvedCommand: a.resolvedCommand,
          })),
        );
      } catch {
        // offline / first paint — leave install status unknown
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [setInstalled]);
};
