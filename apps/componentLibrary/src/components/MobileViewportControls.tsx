'use client';

import { CustomMobileFields } from '@library/components/CustomMobileFields';
import {
  CUSTOM_MOBILE_VIEWPORT_PRESET_ID,
  DEFAULT_MOBILE_VIEWPORT_PRESET_ID,
  findMobileViewportPreset,
  MOBILE_VIEWPORT_PRESETS,
  type MobileViewportPreset,
} from '@library/data/deviceViewportPresets';
import type { PageRecipeViewport } from '@library/lib/pageRecipeViewport';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';

interface MobileViewportControlsProps {
  readonly mobilePresetId: string;
  readonly customMobileViewport: PageRecipeViewport;
  readonly selectedPreset: MobileViewportPreset;
  readonly onPresetChange: (presetId: string) => void;
  readonly onCustomWidthChange: (width: number) => void;
  readonly onCustomHeightChange: (height: number) => void;
}

const PRESET_GROUPS = ['iPhone', 'Android'] as const;

const renderPresetOptions = (group: (typeof PRESET_GROUPS)[number]) => (
  <optgroup key={group} label={group}>
    {MOBILE_VIEWPORT_PRESETS.filter((preset) => preset.group === group).map((preset) => (
      <option key={preset.id} value={preset.id}>
        {preset.label} · {preset.width} x {preset.height}
      </option>
    ))}
  </optgroup>
);

/**
 * Mobile viewport preset picker for the Page recipe preview grid.
 *
 * @param props - Preset state, selection handlers, and custom size fields.
 * @returns Controls for preset selection and optional custom dimensions.
 * @example
 * const element = (
 *   <MobileViewportControls
 *     mobilePresetId="iphone-14"
 *     customMobileViewport={custom}
 *     selectedPreset={preset}
 *     onPresetChange={setPreset}
 *     onCustomWidthChange={setWidth}
 *     onCustomHeightChange={setHeight}
 *   />
 * );
 */
export const MobileViewportControls = ({
  mobilePresetId,
  customMobileViewport,
  selectedPreset,
  onPresetChange,
  onCustomWidthChange,
  onCustomHeightChange,
}: MobileViewportControlsProps) => {
  const handlePresetChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onPresetChange(event.target.value);
    },
    [onPresetChange],
  );
  const sourceLink =
    mobilePresetId === CUSTOM_MOBILE_VIEWPORT_PRESET_ID
      ? findMobileViewportPreset(DEFAULT_MOBILE_VIEWPORT_PRESET_ID)
      : selectedPreset;

  return (
    <div className="mb-3 min-w-0 rounded-lg border bg-muted/20 p-3">
      <div className="flex min-w-0 flex-wrap items-end gap-x-3 gap-y-2">
        <label className="grid min-w-0 flex-1 basis-[min(100%,14rem)] gap-1.5 text-xs">
          <span className="font-medium text-muted-foreground">Mobile viewport preset</span>
          <select
            aria-label="Mobile viewport preset"
            className="h-9 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-2 text-sm"
            onChange={handlePresetChange}
            value={mobilePresetId}
          >
            {PRESET_GROUPS.map(renderPresetOptions)}
            <option value={CUSTOM_MOBILE_VIEWPORT_PRESET_ID}>Custom mobile size</option>
          </select>
        </label>
        <a
          className="max-w-full shrink-0 break-words text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
          href={sourceLink.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          {sourceLink.sourceLabel}
        </a>
      </div>
      {mobilePresetId === CUSTOM_MOBILE_VIEWPORT_PRESET_ID ? (
        <CustomMobileFields
          onHeightChange={onCustomHeightChange}
          onWidthChange={onCustomWidthChange}
          viewport={customMobileViewport}
        />
      ) : null}
    </div>
  );
};
