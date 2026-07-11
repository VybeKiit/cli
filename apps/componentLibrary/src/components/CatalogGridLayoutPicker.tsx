'use client';

import { LayoutOptionsList } from '@library/components/layout/LayoutOptionsList';
import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { LibraryDialogContent } from '@library/components/layout/LibraryDialogContent';
import { Z_LAYOUT_POPOVER } from '@library/components/layout/layoutChrome';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import { Button } from '@vybekiit/ui/button';
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@vybekiit/ui/dialog';
import { LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Render the catalog grid layout picker component.
 *
 * @returns A React element for the component-library UI.
 * @example
 * const element = <CatalogGridLayoutPicker />;
 */
export const CatalogGridLayoutPicker = () => {
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

  const handleOpenFullPicker = (): void => {
    setPopoverOpen(false);
    setDialogOpen(true);
  };

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
        className="fixed isolate w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-white text-foreground shadow-2xl dark:bg-zinc-950"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
        style={{
          top: popoverStyle.top,
          right: popoverStyle.right,
          zIndex: Z_LAYOUT_POPOVER,
          // Hard opaque fallback — theme tokens alone still lost to card iframes.
          backgroundColor: 'hsl(var(--background, 0 0% 100%))',
        }}
      >
        <div className="border-border border-b bg-white px-3 py-2 dark:bg-zinc-950">
          <p className="font-medium text-sm">Grid layout</p>
          <p className="text-muted-foreground text-xs">Quick pick — scroll for more</p>
        </div>
        <div className="max-h-72 overflow-y-auto bg-white p-2 dark:bg-zinc-950">
          <LayoutOptionsList onPresetPick={() => setPopoverOpen(false)} />
        </div>
        <div className="border-border border-t bg-white p-2 dark:bg-zinc-950">
          <Button
            className="w-full"
            onClick={handleOpenFullPicker}
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
};
