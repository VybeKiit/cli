'use client';

import Image from 'next/image';
import { useAgentStore } from '@/stores';

/**
 * Render the agent carousel component.
 *
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <AgentCarousel />;
 */
export const AgentCarousel = () => {
  const agentsMap = useAgentStore((s) => s.agents);
  const agents = Object.values(agentsMap);

  return (
    <div className="agent-carousel border-zinc-800/60 border-y bg-zinc-950/30 py-3">
      <div className="agent-carousel-track">
        {agents.map((agent) => (
          <div key={`a-${agent.id}`} className="agent-carousel-copy flex items-center gap-3 px-5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur shadow-[0_0_22px_rgba(139,92,246,0.3)]">
              <Image
                src={agent.brandSrc}
                alt={agent.name}
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
                unoptimized={true}
              />
            </div>
            <span className="whitespace-nowrap font-medium text-sm text-zinc-300">
              {agent.name}
            </span>
          </div>
        ))}
        {agents.map((agent) => (
          <div key={`b-${agent.id}`} className="agent-carousel-copy flex items-center gap-3 px-5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur shadow-[0_0_22px_rgba(139,92,246,0.3)]">
              <Image
                src={agent.brandSrc}
                alt={agent.name}
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
                unoptimized={true}
              />
            </div>
            <span className="whitespace-nowrap font-medium text-sm text-zinc-300">
              {agent.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
