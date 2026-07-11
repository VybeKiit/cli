'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { usePreviewTheme } from '@library/hooks/usePreviewTheme';
import { isPrimarySelected } from '@library/lib/primaryColorMatch';
import { DEFAULT_PRIMARY, PRESET_PRIMARIES } from '@library/lib/theme';
import { RotateCcw } from 'lucide-react';

/**
 * Preset swatches, custom color input, and reset for the gallery primary.
 *
 * @returns A React element that writes the shared global preview primary color.
 * @example
 * const element = <PrimaryPicker />;
 */
export const PrimaryPicker = () => {
  const { primary, setPrimary, resetPrimary } = usePreviewTheme();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-xs">Primary</span>
      {PRESET_PRIMARIES.map((preset) => (
        <LayoutTooltip
          key={preset.hex}
          label={`Set the gallery accent to ${preset.name}. Previews inherit this brand color.`}
        >
          <button
            aria-label={preset.name}
            aria-pressed={isPrimarySelected(primary, preset.hex)}
            className={`size-5 rounded-full border border-border/60 ${
              isPrimarySelected(primary, preset.hex)
                ? 'ring-2 ring-ring ring-offset-1 ring-offset-background'
                : ''
            }`}
            onClick={() => setPrimary(preset.hex)}
            style={{ backgroundColor: preset.hex }}
            type="button"
          />
        </LayoutTooltip>
      ))}
      <LayoutTooltip label="Pick a custom accent color for all live previews.">
        <label className="relative size-5 cursor-pointer rounded-full border border-border/60">
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => setPrimary(event.target.value)}
            type="color"
            value={primary}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs leading-none">
            +
          </span>
        </label>
      </LayoutTooltip>
      {primary.toLowerCase() === DEFAULT_PRIMARY ? null : (
        <LayoutTooltip label="Reset the accent color to the VybeKiit default.">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={resetPrimary}
            type="button"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </LayoutTooltip>
      )}
    </div>
  );
};
