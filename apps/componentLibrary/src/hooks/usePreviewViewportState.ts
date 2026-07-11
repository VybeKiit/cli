'use client';

import {
  loadCustomViewportWidth,
  loadPreviewSize,
  loadViewportPreset,
  type PreviewSize,
  resolveViewportWidth,
  saveCustomViewportWidth,
  savePreviewSize,
  saveViewportPreset,
  type ViewportPreset,
} from '@library/lib/previewViewport';
import type { PreviewMode } from '@library/lib/theme';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export interface UsePreviewViewportStateResult {
  readonly mounted: boolean;
  readonly mode: PreviewMode;
  readonly setModeOverride: (mode: PreviewMode | null) => void;
  readonly viewport: ViewportPreset;
  readonly setViewport: (viewport: ViewportPreset) => void;
  readonly customWidth: number;
  readonly setCustomWidth: (width: number) => void;
  readonly size: PreviewSize;
  readonly setSize: (size: PreviewSize) => void;
  readonly viewportWidth: string;
  readonly persistViewport: (next: ViewportPreset) => void;
  readonly persistCustomWidth: (width: number) => void;
  readonly persistSize: (next: PreviewSize) => void;
}

/**
 * Detail-page preview chrome: mode override, viewport preset, size, and persistence.
 *
 * @returns Mounted flag, mode, viewport controls, and localStorage-backed setters.
 * @example
 * const chrome = usePreviewViewportState();
 */
export const usePreviewViewportState = (): UsePreviewViewportStateResult => {
  const { resolvedTheme } = useTheme();
  const [modeOverride, setModeOverride] = useState<PreviewMode | null>(null);
  const [mounted, setMounted] = useState(false);
  const [viewport, setViewport] = useState<ViewportPreset>('desktop');
  const [customWidth, setCustomWidth] = useState(960);
  const [size, setSize] = useState<PreviewSize>('l');

  useEffect(() => {
    setMounted(true);
    setViewport(loadViewportPreset());
    setCustomWidth(loadCustomViewportWidth());
    setSize(loadPreviewSize());
  }, []);

  let mode: PreviewMode;
  if (modeOverride === null) {
    mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  } else {
    mode = modeOverride;
  }

  const viewportWidth = resolveViewportWidth(viewport, customWidth);

  return {
    mounted,
    mode,
    setModeOverride,
    viewport,
    setViewport,
    customWidth,
    setCustomWidth,
    size,
    setSize,
    viewportWidth,
    persistViewport: (next) => {
      setViewport(next);
      saveViewportPreset(next);
    },
    persistCustomWidth: (width) => {
      setCustomWidth(width);
      saveCustomViewportWidth(width);
    },
    persistSize: (next) => {
      setSize(next);
      savePreviewSize(next);
    },
  };
};
