'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { AgentAvatar } from '@vybekiit/ui/agent-avatar';

const AGENTS = [
  { name: 'Kiro', status: 'online' },
  { name: 'Claude Code', status: 'busy' },
  { name: 'Cursor', status: 'idle' },
  { name: 'Gemini', status: 'online' },
  { name: 'Codex', status: 'offline' },
] as const;

const SIZES = ['sm', 'md', 'lg'] as const;

/** AgentAvatar for each of the 5 agents (all statuses), plus all 3 sizes. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          Agents (md) — status rings
        </span>
        <div className="flex items-center gap-8">
          {AGENTS.map(({ name, status }) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <AgentAvatar name={name} status={status} size="md" />
              <span className="font-medium text-muted-foreground text-xs">{name}</span>
              <span className="text-muted-foreground text-xs capitalize opacity-60">{status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          Sizes (Claude Code, online)
        </span>
        <div className="flex items-end gap-8">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <AgentAvatar name="Claude Code" status="online" size={size} />
              <span className="font-medium text-muted-foreground text-xs uppercase">{size}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          With avatar image (Kiro, busy)
        </span>
        <AgentAvatar name="Kiro" src="https://i.pravatar.cc/80?img=12" status="busy" size="lg" />
      </div>
    </div>
  ),
};

export default story;
