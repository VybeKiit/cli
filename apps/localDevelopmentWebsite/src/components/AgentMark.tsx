'use client';

import { AgentLogo } from '@vybekiit/ui';
import type { AgentId } from '@/lib/agents/registry';
import { AGENTS } from '@/lib/agents/registry';
import { cn } from '@/lib/utils';

type AgentMarkProps = {
  readonly slug: AgentId;
  readonly size?: number;
  readonly className?: string;
};

const SVG_LOGO_SLUGS = new Set(['kiro', 'claude-code', 'cursor', 'gemini', 'codex']);

/**
 * Agent brand mark — uses @vybekiit/ui AgentLogo when available, else brand-mark image.
 *
 * @param props - Agent slug, size, className.
 * @returns Logo element.
 * @example
 * <AgentMark slug="grok" size={20} />
 */
export const AgentMark = ({ slug, size = 20, className }: AgentMarkProps) => {
  if (SVG_LOGO_SLUGS.has(slug)) {
    return (
      <AgentLogo
        slug={slug as 'kiro' | 'claude-code' | 'cursor' | 'gemini' | 'codex'}
        size={size}
        {...(className === undefined ? {} : { className })}
      />
    );
  }

  const def = AGENTS[slug];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local static brand mark
    <img
      src={def.brandSrc}
      alt=""
      width={size}
      height={size}
      className={cn('rounded-sm object-contain', className)}
      aria-hidden={true}
    />
  );
};
