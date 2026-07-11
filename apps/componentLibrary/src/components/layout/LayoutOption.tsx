'use client';

import { LayoutPreviewIcon } from '@library/components/layout/LayoutPreviewIcon';
import type { CatalogGridPreset } from '@library/lib/catalogGridLayout';
import { cn } from '@/lib/utils';

/** Preset row or the synthetic “custom columns” option. */
export type LayoutOptionPreset =
  | CatalogGridPreset
  | {
      readonly id: 'custom';
      readonly label: string;
      readonly description: string;
      readonly previewCols: number;
      readonly previewRows: number;
    };

export interface LayoutOptionProps {
  readonly preset: LayoutOptionPreset;
  readonly active: boolean;
  readonly onSelect: () => void;
}

/**
 * Render one selectable catalog grid layout row with a preview icon.
 *
 * @param props - Preset data, active state, and select handler.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutOption active={false} onSelect={() => {}} preset={preset} />;
 */
export const LayoutOption = ({ preset, active, onSelect }: LayoutOptionProps) => (
  <button
    className={cn(
      // Solid fills only — alpha backgrounds let scaled card iframes show through.
      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors',
      active
        ? 'border-primary bg-zinc-100 dark:bg-zinc-900'
        : 'border-transparent bg-white hover:border-border hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900',
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
