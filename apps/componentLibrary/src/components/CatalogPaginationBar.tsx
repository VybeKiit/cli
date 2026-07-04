'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

interface CatalogPaginationBarProps {
  readonly page: number;
  readonly pageCount: number;
  readonly total: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
}

export function CatalogPaginationBar({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: CatalogPaginationBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || pageCount <= 1) {
    return null;
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return createPortal(
    <nav
      aria-label="Catalog pagination"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 md:pl-[var(--sidebar-width,16rem)]"
      style={{ bottom: '1.5rem' }}
    >
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-3 sm:px-4">
        <p className="hidden text-muted-foreground text-xs sm:block">
          {from}–{to} of {total}
        </p>
        <div className="flex items-center gap-1">
          <LayoutTooltip label="Previous page">
            <Button
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </LayoutTooltip>
          <span className="min-w-[5.5rem] text-center text-sm tabular-nums">
            Page {page} / {pageCount}
          </span>
          <LayoutTooltip label="Next page">
            <Button
              aria-label="Next page"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              size="icon"
              type="button"
              variant="outline"
            >
              <ChevronRight className="size-4" />
            </Button>
          </LayoutTooltip>
        </div>
      </div>
    </nav>,
    document.body,
  );
}
