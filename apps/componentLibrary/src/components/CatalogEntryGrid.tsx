'use client';

import { ComponentCard } from '@library/components/ComponentCard';
import type { CatalogEntry } from '@library/data/catalog';
import { useColumnCount } from '@library/hooks/useColumnCount';
import { chunkRows } from '@library/lib/chunkRows';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const CARD_ROW_ESTIMATE = 420;
const VIRTUALIZE_THRESHOLD = 32;

interface CatalogEntryGridProps {
  readonly entries: readonly CatalogEntry[];
  readonly gridClassName: string;
  readonly virtualize: boolean;
  readonly tourAnchorKey?: string;
}

/**
 * Render the catalog entry grid component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <CatalogEntryGrid {...props} />;
 */
export const CatalogEntryGrid = ({
  entries,
  gridClassName,
  virtualize,
  tourAnchorKey,
}: CatalogEntryGridProps) => {
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
        const rowEntries = rows[virtualRow.index];
        if (rowEntries === undefined) {
          throw new Error(`Virtual catalog row ${virtualRow.index} has no matching row data.`);
        }
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
};
