import { cn } from '@/lib/utils';

export interface LayoutPreviewIconProps {
  readonly cols: number;
  readonly rows: number;
  readonly active?: boolean;
}

/**
 * Render a miniature grid preview for a catalog layout option.
 *
 * @param props - Column/row counts and active highlight state.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutPreviewIcon cols={3} rows={2} active />;
 */
export const LayoutPreviewIcon = ({ cols, rows, active = false }: LayoutPreviewIconProps) => {
  const cappedCols = Math.min(cols, 5);
  const cells = cappedCols * Math.min(rows, 4);

  return (
    <div
      className={cn(
        'grid w-14 shrink-0 gap-0.5 rounded-md border p-1.5',
        active
          ? 'border-primary bg-zinc-100 dark:bg-zinc-900'
          : 'border-border bg-zinc-50 dark:bg-zinc-900',
      )}
      style={{ gridTemplateColumns: `repeat(${cappedCols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells }).map((_, index) => (
        <div
          className={cn(
            'aspect-square rounded-[2px]',
            active ? 'bg-zinc-400 dark:bg-zinc-500' : 'bg-zinc-300 dark:bg-zinc-600',
          )}
          key={index}
        />
      ))}
    </div>
  );
};
