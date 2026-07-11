'use client';

import { clampMobileViewportDimension } from '@library/data/deviceViewportPresets';
import type { PageRecipeViewport } from '@library/lib/pageRecipeViewport';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

interface CustomMobileFieldsProps {
  readonly viewport: PageRecipeViewport;
  readonly onWidthChange: (width: number) => void;
  readonly onHeightChange: (height: number) => void;
}

/**
 * Width/height inputs for a custom mobile Page recipe viewport.
 *
 * @param props - Current viewport and change handlers.
 * @returns Two numeric fields for custom mobile size.
 * @example
 * const element = (
 *   <CustomMobileFields
 *     viewport={{ width: 390, height: 844 }}
 *     onWidthChange={setWidth}
 *     onHeightChange={setHeight}
 *   />
 * );
 */
export const CustomMobileFields = ({
  viewport,
  onWidthChange,
  onHeightChange,
}: CustomMobileFieldsProps) => {
  const handleWidthChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onWidthChange(clampMobileViewportDimension(Number(event.target.value)));
    },
    [onWidthChange],
  );
  const handleHeightChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onHeightChange(clampMobileViewportDimension(Number(event.target.value)));
    },
    [onHeightChange],
  );

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-muted-foreground">Width</span>
        <input
          aria-label="Custom mobile width"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          inputMode="numeric"
          min={320}
          onChange={handleWidthChange}
          type="number"
          value={viewport.width}
        />
      </label>
      <label className="grid gap-1.5 text-xs">
        <span className="font-medium text-muted-foreground">Height</span>
        <input
          aria-label="Custom mobile height"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          inputMode="numeric"
          min={320}
          onChange={handleHeightChange}
          type="number"
          value={viewport.height}
        />
      </label>
    </div>
  );
};
