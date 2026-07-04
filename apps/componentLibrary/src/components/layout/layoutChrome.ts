import { cn } from '@/lib/utils';

/** Stacking order for gallery chrome — keep popover below dialog, tooltips below popover. */
export const Z_TOOLTIP = 40;
export const Z_STICKY_CHROME = 30;
export const Z_LAYOUT_POPOVER = 100;
export const Z_LAYOUT_DIALOG = 110;
export const Z_SELECTION_TRAY = 50;
export const Z_TUTORIAL = 120;

/** Shared sizing for card chrome actions (copy prompt, select, etc.). */
export function layoutActionButtonClass(compact = true): string {
  return cn(
    'min-w-0 shrink justify-center gap-1.5 shadow-sm backdrop-blur-sm bg-background/90',
    compact
      ? 'h-8 min-w-0 flex-1 basis-[calc(50%-0.375rem)] px-2 text-xs'
      : 'h-9 w-full min-w-0 px-3 text-sm sm:w-auto sm:min-w-[9.75rem]',
  );
}
