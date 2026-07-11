'use client';

import { PreviewDeviceFrame } from '@library/components/PreviewDeviceFrame';
import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingOverlay';
import type { CatalogEntry } from '@library/data/catalog';
import { usePreviewLoaded } from '@library/hooks/usePreviewLoaded';
import { markPreviewLoaded } from '@library/lib/previewCache';
import { postPreviewTheme } from '@library/lib/previewMessaging';
import type { ViewportPreset } from '@library/lib/previewViewport';
import { buildPreviewSrc, type PreviewMode } from '@library/lib/theme';
import { useEffect, useRef, useState } from 'react';

const PREVIEW_BASE_HEIGHT = 520;

interface PreviewIframeProps {
  readonly entry: CatalogEntry;
  readonly mode: PreviewMode;
  readonly primary: string;
  readonly viewportWidth: string;
  readonly sizeScale: number;
  readonly viewport: ViewportPreset;
}

/**
 * Detail-page live preview iframe with device chrome and theme sync.
 *
 * @param props - Entry, theme, viewport sizing, and device preset.
 * @returns A framed iframe that applies preview theme on load.
 * @example
 * const element = (
 *   <PreviewIframe
 *     entry={entry}
 *     mode="light"
 *     primary="#171717"
 *     viewportWidth="100%"
 *     sizeScale={1}
 *     viewport="desktop"
 *   />
 * );
 */
export const PreviewIframe = ({
  entry,
  mode,
  primary,
  viewportWidth,
  viewport,
  sizeScale,
}: PreviewIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const src = buildPreviewSrc(entry.namespace, entry.name);
  const wasLoaded = usePreviewLoaded(entry.previewKey);
  const [showSpinner, setShowSpinner] = useState(!wasLoaded);
  const scaledHeight = PREVIEW_BASE_HEIGHT * sizeScale;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset the spinner when the previewed entry changes
  useEffect(() => {
    setShowSpinner(!wasLoaded);
  }, [wasLoaded, entry.previewKey]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      return;
    }
    const applyTheme = () => postPreviewTheme(iframe, mode, primary);
    iframe.addEventListener('load', applyTheme);
    applyTheme();
    return () => iframe.removeEventListener('load', applyTheme);
  }, [mode, primary]);

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-border bg-muted/20">
      {showSpinner ? <PreviewLoadingOverlay className="absolute inset-0 z-10" /> : null}
      <PreviewDeviceFrame viewport={viewport}>
        <div
          className="mx-auto overflow-hidden transition-[height,width] duration-300 ease-in-out"
          style={{ height: scaledHeight, maxWidth: '100%', width: viewportWidth }}
        >
          <div
            className="origin-top transition-transform duration-300 ease-in-out"
            style={{
              height: PREVIEW_BASE_HEIGHT,
              transform: `scale(${sizeScale})`,
              width: viewportWidth === '100%' ? '100%' : viewportWidth,
            }}
          >
            <iframe
              className="w-full rounded-lg border-0 bg-background"
              loading="lazy"
              onLoad={() => {
                markPreviewLoaded(entry.previewKey);
                setShowSpinner(false);
                postPreviewTheme(iframeRef.current, mode, primary);
              }}
              ref={iframeRef}
              src={src}
              style={{ height: PREVIEW_BASE_HEIGHT }}
              title={`Preview ${entry.name}`}
            />
          </div>
        </div>
      </PreviewDeviceFrame>
    </div>
  );
};
