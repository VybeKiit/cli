import type { CSSProperties } from 'react';

export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 1;

/**
 * Clamp a viewport zoom value to the supported preview range.
 *
 * @param value - Candidate zoom value.
 * @returns A zoom value between the configured minimum and maximum.
 * @example
 * clampZoom(0.55); // 0.55
 */
export const clampZoom = (value: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

/**
 * Build the scaled viewport wrapper style for an iframe.
 *
 * @param width - Unscaled viewport width.
 * @param height - Unscaled viewport height.
 * @param zoom - Active zoom value.
 * @returns CSS style for the scaled viewport wrapper.
 * @example
 * const style = viewportWrapperStyle(1280, 760, 0.7);
 */
export const viewportWrapperStyle = (
  width: number,
  height: number,
  zoom: number,
): CSSProperties => ({
  height: height * zoom,
  width: width * zoom,
});

/**
 * Build the transform style for a zoomed iframe.
 *
 * @param zoom - Active zoom value.
 * @returns CSS style that scales an iframe from the top-left corner.
 * @example
 * const style = iframeZoomStyle(0.75);
 */
export const iframeZoomStyle = (zoom: number): CSSProperties => ({
  transform: `scale(${zoom})`,
  transformOrigin: 'top left',
});
