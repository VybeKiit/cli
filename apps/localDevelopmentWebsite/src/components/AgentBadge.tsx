'use client';

import { Badge } from '@vybekiit/ui';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { DetectedAgent } from '@/stores';

type AgentBadgeProps = {
  agent: DetectedAgent;
  pulse?: boolean;
};

export const AgentBadge = ({ agent, pulse = false }: AgentBadgeProps) => (
  <Badge
    variant="outline"
    className={cn(
      'gap-2 rounded-full border-zinc-800 bg-zinc-900/60 px-3 py-1.5 backdrop-blur',
      pulse && 'animate-pulse-slow',
    )}
  >
    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
      <Image
        src={agent.brandSrc}
        alt={agent.name}
        width={20}
        height={20}
        className="h-4 w-4 object-contain"
        unoptimized={true}
      />
    </span>
    <span className="hidden text-zinc-200 sm:inline">{agent.name}</span>
    {agent.mcpSupported && (
      <span className="ml-1 rounded-full bg-vybe-500/15 px-2 py-0.5 font-semibold text-[10px] text-vybe-300 uppercase tracking-wider">
        MCP
      </span>
    )}
  </Badge>
);
