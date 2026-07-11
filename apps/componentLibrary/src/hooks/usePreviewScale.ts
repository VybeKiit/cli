'use client';

import {
  DEVICE_MAX_HEIGHTS,
  type PageRecipeDevice,
  type PageRecipeViewport,
} from '@library/lib/pageRecipeViewport';
import { type RefObject, useEffect, useRef, useState } from 'react';

/** Inner device shell border width (`border` = 1px). Reserved in scale so the clip box matches. */
const DEVICE_SHELL_BORDER_PX = 1;

export interface UsePreviewScaleResult {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly measured: boolean;
  readonly maxHeight: number;
  readonly scale: number;
  readonly contentWidth: number;
  readonly contentHeight: number;
}

/**
 * Fit a device viewport into the measured frame width without ever expanding the page.
 * Until ResizeObserver reports a width, return scale 0 so the unscaled iframe cannot
 * force a horizontal overflow (which scrolled content under the fixed sidebar).
 *
 * @param viewport - Logical device viewport in CSS pixels.
 * @param device - Preview device tier (drives max height).
 * @returns Scale state and a ref for the width-measuring container.
 * @example
 * const { containerRef, measured, scale } = usePreviewScale(
 *   { width: 1280, height: 800 },
 *   'desktop',
 * );
 */
export const usePreviewScale = (
  viewport: PageRecipeViewport,
  device: PageRecipeDevice,
): UsePreviewScaleResult => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        // contentRect excludes padding; we measure the inner usable width.
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    // Seed from the first layout so we don't wait an extra frame on stable widths.
    setContainerWidth(container.clientWidth);
    return () => observer.disconnect();
  }, []);

  const maxHeight = DEVICE_MAX_HEIGHTS[device];
  const measured = containerWidth > 0;
  // Never default widthScale to 1 — that painted 768–1280px frames before measure
  // and permanently widened the catalog past the sidebar.
  // Reserve the device-shell border so transform-origin top-left cannot overshoot the
  // clip box by a subpixel (reads as a thicker border on the right/bottom only).
  const usableWidth = Math.max(0, containerWidth - DEVICE_SHELL_BORDER_PX * 2);
  const usableHeight = Math.max(0, maxHeight - DEVICE_SHELL_BORDER_PX * 2);
  const scale = measured
    ? Math.min(1, usableWidth / viewport.width, usableHeight / viewport.height)
    : 0;
  const contentWidth = measured ? viewport.width * scale : 0;
  const contentHeight = measured ? viewport.height * scale : 0;

  return {
    containerRef,
    measured,
    maxHeight,
    scale,
    contentWidth,
    contentHeight,
  };
};
