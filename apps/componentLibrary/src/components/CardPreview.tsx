'use client';

import { PreviewLoadingOverlay } from '@library/components/PreviewLoadingOverlay';
import type { CatalogEntry } from '@library/data/catalog';
import { useCardPreview } from '@library/hooks/useCardPreview';
import type { PreviewMode } from '@library/lib/theme';
import { memo } from 'react';
import { cn } from '@/lib/utils';

const CARD_PREVIEW_HEIGHT = 'h-64 md:h-72';
const CARD_IFRAME_HEIGHT = 720;

interface CardPreviewProps {
  readonly entry: CatalogEntry;
  readonly mode: PreviewMode;
}

/**
 * Lazy iframe for a catalog card — static thumb in grid; hover/focus enables interaction.
 *
 * @param props - Catalog entry and resolved preview mode.
 * @returns A React element hosting the scroll-loaded preview iframe.
 * @example
 * const element = <CardPreview entry={entry} mode="light" />;
 */
export const CardPreview = memo(
  ({ entry, mode }: CardPreviewProps) => {
    const {
      hostRef,
      iframeRef,
      src,
      engaged,
      setEngaged,
      showSpinner,
      wasLoaded,
      handleIframeLoad,
      handleIframeError,
    } = useCardPreview({
      namespace: entry.namespace,
      name: entry.name,
      previewKey: entry.previewKey,
      mode,
    });

    const previewLoading = showSpinner && !wasLoaded;

    return (
      <div
        className={cn(
          'relative isolate overflow-hidden rounded-lg border border-border bg-muted/30',
          CARD_PREVIEW_HEIGHT,
        )}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setEngaged(false);
          }
        }}
        onFocus={() => setEngaged(true)}
        onMouseEnter={() => setEngaged(true)}
        onMouseLeave={() => setEngaged(false)}
        ref={hostRef}
        tabIndex={-1}
      >
        {src ? (
          <>
            <div
              className={cn(
                'absolute top-0 left-0 z-0 max-w-none origin-top-left scale-50 transition-opacity',
                previewLoading ? 'opacity-0' : 'opacity-100',
              )}
              style={{
                height: CARD_IFRAME_HEIGHT,
                width: '200%',
              }}
            >
              <iframe
                className="h-full w-full border-0 bg-background"
                loading="lazy"
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                ref={iframeRef}
                src={src}
                style={{ pointerEvents: engaged ? 'auto' : 'none' }}
                title={`Preview ${entry.name}`}
              />
            </div>
            {previewLoading ? (
              <PreviewLoadingOverlay className="absolute inset-0 z-10" size="sm" />
            ) : null}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            Preview loads on scroll
          </div>
        )}
      </div>
    );
  },
  (prev, next) => prev.entry.previewKey === next.entry.previewKey && prev.mode === next.mode,
);
CardPreview.displayName = 'CardPreview';
