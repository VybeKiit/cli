import { cn } from '@/lib/utils';

/** Stacking order for gallery tooltips. */
export const Z_TOOLTIP = 40;
/** Stacking order for sticky gallery chrome. */
export const Z_STICKY_CHROME = 30;
/**
 * Stacking order for layout popovers.
 * Above sticky chrome, card `isolate` contexts, and scaled preview iframes
 * (those layers often paint over z≈100–1000).
 */
export const Z_LAYOUT_POPOVER = 9999;
/** Stacking order for layout dialogs. */
export const Z_LAYOUT_DIALOG = 10_050;
/** Stacking order for the selected-components tray. */
export const Z_SELECTION_TRAY = 50;
/** Stacking order for tutorial overlays. */
export const Z_TUTORIAL = 10_100;

/**
 * Build shared sizing classes for card chrome actions.
 *
 * @param compact - Whether to use the compact grid-card action style.
 * @returns Class names for copy/select toolbar buttons.
 * @example
 * const className = layoutActionButtonClass(true);
 */
export const layoutActionButtonClass = (compact = true): string =>
  cn(
    'min-w-0 shrink justify-center gap-1.5 shadow-sm backdrop-blur-sm bg-background/90',
    compact
      ? 'h-8 min-w-0 flex-1 basis-[calc(50%-0.375rem)] px-2 text-xs'
      : 'h-9 w-full min-w-0 px-3 text-sm sm:w-auto sm:min-w-[9.75rem]',
  );
