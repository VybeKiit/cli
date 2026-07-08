'use client';

import { PageRecipeFrame, type PageRecipeViewport } from '@library/components/PageRecipeFrame';
import {
  CUSTOM_MOBILE_VIEWPORT_PRESET_ID,
  clampMobileViewportDimension,
  DEFAULT_MOBILE_VIEWPORT,
  DEFAULT_MOBILE_VIEWPORT_PRESET_ID,
  findMobileViewportPreset,
  MOBILE_VIEWPORT_PRESETS,
  type MobileViewportPreset,
} from '@library/data/deviceViewportPresets';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageRecipePreviewGridProps {
  readonly slug: string;
  readonly title: string;
  readonly className?: string;
}

interface CustomMobileFieldsProps {
  readonly viewport: PageRecipeViewport;
  readonly onWidthChange: (width: number) => void;
  readonly onHeightChange: (height: number) => void;
}

interface MobileViewportControlsProps {
  readonly mobilePresetId: string;
  readonly customMobileViewport: PageRecipeViewport;
  readonly selectedPreset: MobileViewportPreset;
  readonly onPresetChange: (presetId: string) => void;
  readonly onCustomWidthChange: (width: number) => void;
  readonly onCustomHeightChange: (height: number) => void;
}

const TABLET_VIEWPORT: PageRecipeViewport = {
  width: 768,
  height: 1024,
};

const DESKTOP_VIEWPORT: PageRecipeViewport = {
  width: 1280,
  height: 800,
};

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

const CustomMobileFields = ({
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

const MobileViewportControls = ({
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
    <div className="mb-3 rounded-lg border bg-muted/20 p-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <label className="grid gap-1.5 text-xs">
          <span className="font-medium text-muted-foreground">Mobile viewport preset</span>
          <select
            aria-label="Mobile viewport preset"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            onChange={handlePresetChange}
            value={mobilePresetId}
          >
            {PRESET_GROUPS.map(renderPresetOptions)}
            <option value={CUSTOM_MOBILE_VIEWPORT_PRESET_ID}>Custom mobile size</option>
          </select>
        </label>
        <a
          className="text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
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

/**
 * Render the shared Page recipe preview grid.
 *
 * @param props - Props passed to this component.
 * @returns A React element with mobile, tablet, and desktop recipe previews.
 * @example
 * const element = <PageRecipePreviewGrid slug="auth" title="Auth page" />;
 */
export const PageRecipePreviewGrid = ({ slug, title, className }: PageRecipePreviewGridProps) => {
  const [mobilePresetId, setMobilePresetId] = useState(DEFAULT_MOBILE_VIEWPORT_PRESET_ID);
  const [customMobileViewport, setCustomMobileViewport] =
    useState<PageRecipeViewport>(DEFAULT_MOBILE_VIEWPORT);

  const selectedPreset = useMemo(() => findMobileViewportPreset(mobilePresetId), [mobilePresetId]);
  const mobileViewport =
    mobilePresetId === CUSTOM_MOBILE_VIEWPORT_PRESET_ID ? customMobileViewport : selectedPreset;
  const handleCustomWidthChange = useCallback((width: number) => {
    setCustomMobileViewport((current) => ({ ...current, width }));
  }, []);
  const handleCustomHeightChange = useCallback((height: number) => {
    setCustomMobileViewport((current) => ({ ...current, height }));
  }, []);

  const mobileControls = (
    <MobileViewportControls
      customMobileViewport={customMobileViewport}
      mobilePresetId={mobilePresetId}
      onCustomHeightChange={handleCustomHeightChange}
      onCustomWidthChange={handleCustomWidthChange}
      onPresetChange={setMobilePresetId}
      selectedPreset={selectedPreset}
    />
  );

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      <PageRecipeFrame
        controls={mobileControls}
        device="mobile"
        slug={slug}
        title={title}
        viewport={mobileViewport}
      />
      <PageRecipeFrame device="tablet" slug={slug} title={title} viewport={TABLET_VIEWPORT} />
      <PageRecipeFrame
        className="md:col-span-2"
        device="desktop"
        slug={slug}
        title={title}
        viewport={DESKTOP_VIEWPORT}
      />
    </div>
  );
};
