'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { LibraryDialogContent } from '@library/components/layout/LibraryDialogContent';
import { Z_LAYOUT_POPOVER } from '@library/components/layout/layoutChrome';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import {
  CATALOG_GRID_PRESETS,
  type CatalogGridLayoutId,
  type CatalogGridPreset,
} from '@library/lib/catalogGridLayout';
import { LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function LayoutPreviewIcon({
  cols,
  rows,
  active,
}: {
  cols: number;
  rows: number;
  active?: boolean;
}) {
  const cappedCols = Math.min(cols, 5);
  const cells = cappedCols * Math.min(rows, 4);

  return (
    <div
      className={cn(
        'grid w-14 shrink-0 gap-0.5 rounded-md border p-1.5',
        active ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/30',
      )}
      style={{ gridTemplateColumns: `repeat(${cappedCols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }).map((_, index) => (
        <div
          className={cn(
            'aspect-square rounded-[2px]',
            active ? 'bg-primary/50' : 'bg-muted-foreground/25',
          )}
          key={index}
        />
      ))}
    </div>
  );
}

function LayoutOption({
  preset,
  active,
  onSelect,
}: {
  preset:
    | CatalogGridPreset
    | {
        id: 'custom';
        label: string;
        description: string;
        previewCols: number;
        previewRows: number;
      };
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors',
        active
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border hover:bg-muted/40',
      )}
      onClick={onSelect}
      type="button"
    >
      <LayoutPreviewIcon active={active} cols={preset.previewCols} rows={preset.previewRows} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{preset.label}</p>
        <p className="text-muted-foreground text-xs leading-snug">{preset.description}</p>
      </div>
    </button>
  );
}

function LayoutOptionsList({ onPresetPick }: { onPresetPick?: () => void }) {
  const { layoutId, customCols, setLayout } = useCatalogGridLayout();

  const pickPreset = (id: CatalogGridLayoutId) => {
    setLayout(id);
    onPresetPick?.();
  };

  const pickCustomCols = (cols: number) => {
    setLayout('custom', cols);
  };

  return (
    <div className="flex flex-col gap-1">
      {CATALOG_GRID_PRESETS.map((preset) => (
        <LayoutOption
          active={layoutId === preset.id}
          key={preset.id}
          onSelect={() => pickPreset(preset.id)}
          preset={preset}
        />
      ))}
      <LayoutOption
        active={layoutId === 'custom'}
        onSelect={() => pickPreset('custom')}
        preset={{
          id: 'custom',
          label: `Custom · ${customCols} columns`,
          description: 'Set an exact column count for your monitor.',
          previewCols: customCols,
          previewRows: 2,
        }}
      />
      <label className="mt-2 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Custom columns
        </span>
        <div className="flex items-center gap-3">
          <input
            className="h-8 flex-1 cursor-pointer accent-primary"
            max={6}
            min={1}
            onChange={(event) => pickCustomCols(Number(event.target.value))}
            onPointerDown={(event) => event.stopPropagation()}
            step={1}
            type="range"
            value={customCols}
          />
          <span className="w-6 font-mono text-sm tabular-nums">{customCols}</span>
        </div>
      </label>
    </div>
  );
}

export function CatalogGridLayoutPicker() {
  const { layoutLabel: activeLabel } = useCatalogGridLayout();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; right: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const updatePopoverPosition = useCallback(() => {
    const anchor = surfaceRef.current;
    if (!anchor) {
      return;
    }
    const rect = anchor.getBoundingClientRect();
    setPopoverStyle({
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setPopoverOpen(false), 280);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (dialogOpen) {
      setPopoverOpen(false);
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!popoverOpen) {
      return;
    }
    updatePopoverPosition();
    const onScrollOrResize = () => updatePopoverPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [popoverOpen, updatePopoverPosition]);

  const popoverPanel =
    popoverOpen && popoverStyle && !dialogOpen ? (
      <div
        className="fixed w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
        style={{
          top: popoverStyle.top,
          right: popoverStyle.right,
          zIndex: Z_LAYOUT_POPOVER,
        }}
      >
        <div className="border-border border-b px-3 py-2">
          <p className="font-medium text-sm">Grid layout</p>
          <p className="text-muted-foreground text-xs">Quick pick — scroll for more</p>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          <LayoutOptionsList onPresetPick={() => setPopoverOpen(false)} />
        </div>
        <div className="border-border border-t p-2">
          <Button
            className="w-full"
            onClick={() => {
              setPopoverOpen(false);
              setDialogOpen(true);
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            Open full layout picker
          </Button>
        </div>
      </div>
    ) : null;

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => {
          clearCloseTimer();
          updatePopoverPosition();
          setPopoverOpen(true);
        }}
        onMouseLeave={scheduleClose}
        ref={surfaceRef}
      >
        <LayoutTooltip
          disabled={popoverOpen || dialogOpen}
          label="Change how many component cards appear per row — hover for quick picks or open all layouts."
        >
          <Button
            aria-expanded={popoverOpen}
            aria-haspopup="dialog"
            aria-label="Catalog grid layout"
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => setDialogOpen(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            <LayoutGrid className="size-3.5" />
            Layout
            <span className="text-muted-foreground">· {activeLabel}</span>
          </Button>
        </LayoutTooltip>

        {typeof document !== 'undefined' && popoverPanel
          ? createPortal(popoverPanel, document.body)
          : null}
      </div>

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <LibraryDialogContent className="flex max-h-[min(85vh,640px)] max-w-md flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-border border-b px-6 py-4 text-start">
            <DialogTitle>Catalog grid layout</DialogTitle>
            <DialogDescription>
              Pick how many cards show per row. Your choice is saved for next visit.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto px-4 py-3">
            <LayoutOptionsList />
          </div>
        </LibraryDialogContent>
      </Dialog>
    </>
  );
}
