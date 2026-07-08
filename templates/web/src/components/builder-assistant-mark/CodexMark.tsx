'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils';

import { CODEX_CLOUD_PATH } from './builderAssistantMarkPaths';

interface CodexMarkProps {
  readonly className?: string;
}

/**
 * Codex CLI logo with gradient cloud and prompt cutout.
 *
 * @returns Inline SVG mark for Codex.
 * @example
 * <CodexMark className="size-6" />;
 */
export const CodexMark = ({ className }: CodexMarkProps) => {
  const uid = useId().replaceAll(':', '');
  const gradientId = `codex-grad-${uid}`;
  const maskId = `codex-mask-${uid}`;

  return (
    <svg aria-hidden={true} className={cn('codex-mark', className)} viewBox="0 0 24 24">
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={gradientId}
          x1="12"
          x2="12"
          y1="3"
          y2="21"
        >
          <stop offset="0%" stopColor="#C8C4FF" />
          <stop offset="52%" stopColor="#7B8CFF" />
          <stop offset="100%" stopColor="#2A3FD4" />
        </linearGradient>
        <mask id={maskId}>
          <path d={CODEX_CLOUD_PATH} fill="white" />
          <polyline
            fill="none"
            points="7.55,9.35 10.05,12 7.55,14.65"
            stroke="black"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.35"
          />
          <rect fill="black" height="1.55" rx="0.78" width="3.55" x="11.05" y="13.32" />
        </mask>
      </defs>
      <rect fill={`url(#${gradientId})`} height="24" mask={`url(#${maskId})`} width="24" />
    </svg>
  );
};
