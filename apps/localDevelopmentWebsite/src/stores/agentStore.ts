import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORE_KEYS } from '@/lib/keys';

export type AgentId = 'kiro' | 'claude-code' | 'cursor' | 'gemini' | 'codex';

export type DetectedAgent = {
  id: AgentId;
  name: string;
  /** Brand color for glow effects */
  color: string;
  brandSrc: string;
  command: string;
  mcpSupported: boolean;
  resumeFlag?: string;
};

const AGENTS: Record<AgentId, DetectedAgent> = {
  kiro: {
    id: 'kiro',
    name: 'Kiro',
    color: '#FF6B00',
    brandSrc: '/brand-marks/kiro.webp',
    command: 'kiro-cli',
    mcpSupported: true,
    resumeFlag: '--resume-id',
  },
  'claude-code': {
    id: 'claude-code',
    name: 'Claude Code',
    color: '#D97757',
    brandSrc: '/brand-marks/claude.webp',
    command: 'claude',
    mcpSupported: true,
    resumeFlag: '--continue',
  },
  cursor: {
    id: 'cursor',
    name: 'Cursor',
    color: '#00D4AA',
    brandSrc: '/brand-marks/cursor.webp',
    command: 'cursor',
    mcpSupported: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini CLI',
    color: '#4285F4',
    brandSrc: '/brand-marks/googlegemini.webp',
    command: 'gemini',
    mcpSupported: false,
  },
  codex: {
    id: 'codex',
    name: 'Codex',
    color: '#10A37F',
    brandSrc: '/brand-marks/openai.webp',
    command: 'codex',
    mcpSupported: false,
  },
};

type AgentState = {
  activeAgentId: AgentId;
  agents: Record<AgentId, DetectedAgent>;
  setActive: (id: AgentId) => void;
  getActive: () => DetectedAgent;
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      activeAgentId: 'kiro',
      agents: AGENTS,
      setActive: (id) => set({ activeAgentId: id }),
      getActive: () => AGENTS[get().activeAgentId],
    }),
    { name: STORE_KEYS.agents },
  ),
);
