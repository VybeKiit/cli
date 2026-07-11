'use client';

import type { ShowcaseEntry } from '@/data/componentShowcase';
import { cn } from '@/lib/utils';

const SOURCE_LABELS: Record<string, string> = {
  bundui: 'BundUI',
  magicui: 'Magic UI',
  kokonutui: 'Kokonut',
  aceternity: 'Aceternity',
  untitled: 'Untitled',
  gluestack: 'Gluestack',
  kit: 'VybeKiit',
};

interface ComponentPreviewCardProps {
  readonly entry: ShowcaseEntry;
  readonly className?: string;
}

/**
 * Fixed-frame preview card with source badge and static fallback shell.
 *
 * @param props - Component props.
 * @returns The rendered ComponentPreviewCard element.
 * @example
 * ```tsx
 * <ComponentPreviewCard />
 * ```
 */

export const ComponentPreviewCard = ({ entry, className }: ComponentPreviewCardProps) => {
  const mappedSourceLabel = SOURCE_LABELS[entry.source];
  const sourceLabel = mappedSourceLabel === undefined ? entry.source : mappedSourceLabel;

  return (
    <article
      className={cn(
        'component-preview-card flex h-[180px] w-[280px] shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/90',
        className,
      )}
    >
      <div className="flex items-center justify-between border-white/10 border-b px-3 py-2">
        <span className="font-medium text-xs text-[var(--text-muted)] uppercase tracking-wide">
          {sourceLabel}
        </span>
        <span className="truncate font-semibold text-xs text-white">{entry.name}</span>
      </div>
      <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent p-3">
        <div className="h-full w-full rounded-lg border border-white/15 border-dashed bg-white/[0.03]" />
        <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-[var(--text-faint)]">
          {entry.renderMode === 'live' ? 'live' : 'preview'}
        </span>
      </div>
    </article>
  );
};
