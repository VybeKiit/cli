import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AGENTS, type AgentDefinition, type AgentId } from '@/lib/agents/registry';
import { STORE_KEYS } from '@/lib/keys';

export type DetectedAgent = AgentDefinition & {
  installed?: boolean;
  resolvedCommand?: string | null;
};

type AgentState = {
  activeAgentId: AgentId;
  agents: Record<AgentId, DetectedAgent>;
  setActive: (id: AgentId) => void;
  getActive: () => DetectedAgent;
  setInstalled: (
    statuses: Array<{ id: AgentId; installed: boolean; resolvedCommand: string | null }>,
  ) => void;
};

const baseAgents = Object.fromEntries(
  (Object.keys(AGENTS) as AgentId[]).map((id) => [
    id,
    { ...AGENTS[id], resolvedCommand: null as string | null },
  ]),
) as unknown as Record<AgentId, DetectedAgent>;

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      activeAgentId: 'claude-code',
      agents: baseAgents,
      setActive: (id) => set({ activeAgentId: id }),
      getActive: () => get().agents[get().activeAgentId],
      setInstalled: (statuses) =>
        set((state) => {
          const next = { ...state.agents };
          for (const status of statuses) {
            const existing = next[status.id];
            if (existing === undefined) {
              continue;
            }
            next[status.id] = {
              ...existing,
              installed: status.installed,
              resolvedCommand: status.resolvedCommand,
            };
          }
          return { agents: next };
        }),
    }),
    {
      name: STORE_KEYS.agents,
      // Only persist the active selection — install status is re-probed.
      partialize: (state) => ({ activeAgentId: state.activeAgentId }),
      merge: (persisted, current) => {
        const p = persisted as { activeAgentId?: AgentId } | undefined;
        if (p?.activeAgentId && p.activeAgentId in current.agents) {
          return { ...current, activeAgentId: p.activeAgentId };
        }
        return current;
      },
    },
  ),
);
