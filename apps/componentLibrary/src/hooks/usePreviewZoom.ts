'use client';

import { clampZoom, ZOOM_STEP } from '@library/lib/templateSurfaceZoom';
import { useCallback, useState } from 'react';

export interface UsePreviewZoomResult {
  readonly zoom: number;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
}

/**
 * Independent zoom controls for a template surface iframe.
 *
 * @param initialZoom - Starting zoom (0–1 scale).
 * @returns Current zoom and step handlers.
 * @example
 * const { zoom, zoomIn, zoomOut } = usePreviewZoom(0.75);
 */
export const usePreviewZoom = (initialZoom: number): UsePreviewZoomResult => {
  const [zoom, setZoom] = useState(initialZoom);
  const zoomIn = useCallback(() => setZoom((current) => clampZoom(current + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((current) => clampZoom(current - ZOOM_STEP)), []);
  return { zoom, zoomIn, zoomOut };
};
