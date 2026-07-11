'use client';

import { MAX_ZOOM, MIN_ZOOM } from '@library/lib/templateSurfaceZoom';
import { Button } from '@vybekiit/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomControlsProps {
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly zoom: number;
}

/**
 * Icon-only zoom controls for a preview viewport.
 *
 * @param props - Current zoom and stable zoom handlers.
 * @returns A compact plus/minus zoom control.
 * @example
 * const element = <ZoomControls zoom={0.8} onZoomIn={() => {}} onZoomOut={() => {}} />;
 */
export const ZoomControls = ({ onZoomIn, onZoomOut, zoom }: ZoomControlsProps) => (
  <div className="flex items-center gap-1 rounded-full border bg-background/80 p-1 shadow-sm backdrop-blur">
    <Button
      aria-label="Decrease preview zoom"
      disabled={zoom <= MIN_ZOOM}
      onClick={onZoomOut}
      size="icon"
      title="Decrease preview zoom"
      type="button"
      variant="ghost"
    >
      <ZoomOut className="h-4 w-4" />
    </Button>
    <span className="min-w-12 text-center font-medium text-xs tabular-nums">
      {Math.round(zoom * 100)}%
    </span>
    <Button
      aria-label="Increase preview zoom"
      disabled={zoom >= MAX_ZOOM}
      onClick={onZoomIn}
      size="icon"
      title="Increase preview zoom"
      type="button"
      variant="ghost"
    >
      <ZoomIn className="h-4 w-4" />
    </Button>
  </div>
);
