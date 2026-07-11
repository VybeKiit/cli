'use client';

import {
  CUSTOM_MOBILE_VIEWPORT_PRESET_ID,
  DEFAULT_MOBILE_VIEWPORT,
  DEFAULT_MOBILE_VIEWPORT_PRESET_ID,
  findMobileViewportPreset,
  type MobileViewportPreset,
} from '@library/data/deviceViewportPresets';
import type { PageRecipeViewport } from '@library/lib/pageRecipeViewport';
import { useCallback, useMemo, useState } from 'react';

export interface UseMobileViewportControlsResult {
  readonly mobilePresetId: string;
  readonly setMobilePresetId: (presetId: string) => void;
  readonly customMobileViewport: PageRecipeViewport;
  readonly selectedPreset: MobileViewportPreset;
  readonly mobileViewport: PageRecipeViewport;
  readonly handleCustomWidthChange: (width: number) => void;
  readonly handleCustomHeightChange: (height: number) => void;
}

/**
 * Mobile preset + custom size state for the Page recipe preview grid.
 *
 * @returns Preset selection, custom dimensions, and the resolved mobile viewport.
 * @example
 * const mobile = useMobileViewportControls();
 */
export const useMobileViewportControls = (): UseMobileViewportControlsResult => {
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

  return {
    mobilePresetId,
    setMobilePresetId,
    customMobileViewport,
    selectedPreset,
    mobileViewport,
    handleCustomWidthChange,
    handleCustomHeightChange,
  };
};
