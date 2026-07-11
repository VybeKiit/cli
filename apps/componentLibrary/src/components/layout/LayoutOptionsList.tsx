'use client';

import { LayoutOption } from '@library/components/layout/LayoutOption';
import { useCatalogGridLayout } from '@library/context/CatalogGridLayoutContext';
import { CATALOG_GRID_PRESETS, type CatalogGridLayoutId } from '@library/lib/catalogGridLayout';

export interface LayoutOptionsListProps {
  readonly onPresetPick?: () => void;
}

/**
 * Render the full catalog grid layout preset list plus custom column slider.
 *
 * @param props - Optional callback after a built-in preset is chosen.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LayoutOptionsList onPresetPick={() => setOpen(false)} />;
 */
export const LayoutOptionsList = ({ onPresetPick }: LayoutOptionsListProps) => {
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
      <label className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-zinc-50 px-3 py-3 dark:bg-zinc-900">
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
};
