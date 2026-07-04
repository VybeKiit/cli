'use client';

import { ComponentCard } from '@library/components/ComponentCard';
import type { CatalogEntry } from '@library/data/catalog';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const CARD_ROW_ESTIMATE = 420;
const VIRTUALIZE_THRESHOLD = 32;

function chunkRows<T>(items: readonly T[], columnCount: number): T[][] {
  if (columnCount < 1) {
    return [items.slice()];
  }
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columnCount) {
    rows.push(items.slice(index, index + columnCount));
  }
  return rows;
}

function useColumnCount(gridClassName: string): number {
  return useMemo(() => {
    if (gridClassName.includes('grid-cols-6')) {
      return 6;
    }
    if (gridClassName.includes('2xl:grid-cols-5') || gridClassName.includes('xl:grid-cols-5')) {
      return 5;
    }
    if (gridClassName.includes('2xl:grid-cols-4') || gridClassName.includes('xl:grid-cols-4')) {
      return 4;
    }
    if (gridClassName.includes('lg:grid-cols-3') || gridClassName.includes('md:grid-cols-3')) {
      return 3;
    }
    if (gridClassName.includes('md:grid-cols-2') || gridClassName.includes('sm:grid-cols-2')) {
      return 2;
    }
    return 1;
  }, [gridClassName]);
}

interface CatalogEntryGridProps {
  readonly entries: readonly CatalogEntry[];
  readonly gridClassName: string;
  readonly virtualize: boolean;
  readonly tourAnchorKey?: string;
}

export function CatalogEntryGrid({
  entries,
  gridClassName,
  virtualize,
  tourAnchorKey,
}: CatalogEntryGridProps) {
  const columnCount = useColumnCount(gridClassName);
  const rows = useMemo(() => chunkRows(entries, columnCount), [columnCount, entries]);
  const shouldVirtualize = virtualize && entries.length >= VIRTUALIZE_THRESHOLD;

  const rowVirtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    estimateSize: () => CARD_ROW_ESTIMATE,
    overscan: 2,
  });

  if (!shouldVirtualize) {
    return (
      <div className={cn('grid min-w-0 gap-4 [&>*]:min-w-0', gridClassName)}>
        {entries.map((entry) => (
          <ComponentCard
            entry={entry}
            href={`/components/${entry.namespace}/${encodeURIComponent(entry.name)}`}
            key={entry.previewKey}
            tourAnchor={entry.previewKey === tourAnchorKey}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const rowEntries = rows[virtualRow.index] ?? [];
        return (
          <div
            className={cn(
              'absolute top-0 left-0 w-full grid min-w-0 gap-4 [&>*]:min-w-0',
              gridClassName,
            )}
            key={virtualRow.key}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {rowEntries.map((entry) => (
              <ComponentCard
                entry={entry}
                href={`/components/${entry.namespace}/${encodeURIComponent(entry.name)}`}
                key={entry.previewKey}
                tourAnchor={entry.previewKey === tourAnchorKey}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
