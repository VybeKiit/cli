'use client';

import { CardPreviewWithTheme } from '@library/components/CardPreviewWithTheme';
import { ComponentSelectCheckbox } from '@library/components/ComponentSelectCheckbox';
import { CopyPromptButton } from '@library/components/CopyPromptButton';
import type { CatalogEntry } from '@library/data/catalog';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';
import { sourceLabelFor } from '@library/lib/sourceLabels';
import { UNAVAILABLE_CHIP } from '@library/lib/unavailableReasons';
import Link from 'next/link';
import { memo } from 'react';
import { cn } from '@/lib/utils';

interface ComponentCardProps {
  readonly entry: CatalogEntry;
  readonly href: string;
  readonly tourAnchor?: boolean;
}

const componentCardPropsEqual = (prev: ComponentCardProps, next: ComponentCardProps): boolean =>
  prev.entry.previewKey === next.entry.previewKey &&
  prev.href === next.href &&
  prev.tourAnchor === next.tourAnchor;

/**
 * Render a catalog entry card with optional live preview thumb.
 *
 * @param props - Entry, detail href, and optional tour anchor.
 * @returns A React element for the component-library grid.
 * @example
 * const element = <ComponentCard entry={entry} href="/components/magicui/marquee" />;
 */
export const ComponentCard = memo(({ entry, href, tourAnchor = false }: ComponentCardProps) => {
  const sourceLabel = sourceLabelFor(entry.namespace);

  return (
    <article
      className={cn(
        'group relative isolate flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 transition-colors hover:border-primary/40 hover:bg-accent/30 [content-visibility:auto] [contain-intrinsic-size:420px]',
      )}
      data-tour={tourAnchor ? 'component-card' : undefined}
    >
      {entry.previewable ? (
        <Link className="mb-4 block" href={href} prefetch={false}>
          <CardPreviewWithTheme entry={entry} />
        </Link>
      ) : null}

      <div className="mb-3 flex w-full min-w-0 flex-wrap items-stretch gap-1.5">
        <CopyPromptButton compact={true} entry={entry} />
        <ComponentSelectCheckbox compact={true} previewKey={entry.previewKey} />
      </div>

      <Link className="flex flex-col" href={href} prefetch={false}>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
            {sourceLabel}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {categoryLabelFromSlug(entry.category)}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {entry.kind}
          </span>
          {entry.previewable ? (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">live</span>
          ) : null}
          {!entry.previewable && entry.unavailableReason ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {UNAVAILABLE_CHIP[entry.unavailableReason]}
            </span>
          ) : null}
        </div>
        <span className="font-semibold text-base group-hover:text-primary">{entry.name}</span>
        <span className="mt-1 truncate font-mono text-xs text-muted-foreground">
          {entry.importPath}
        </span>
      </Link>
    </article>
  );
}, componentCardPropsEqual);
ComponentCard.displayName = 'ComponentCard';
