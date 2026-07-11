'use client';

import { DevicePreviewIcon } from '@library/components/DevicePreviewIcon';
import { usePreviewScale } from '@library/hooks/usePreviewScale';
import {
  DEVICE_LABELS,
  type PageRecipeDevice,
  type PageRecipeViewport,
} from '@library/lib/pageRecipeViewport';
import { buildPageRecipePreviewSrc } from '@library/lib/theme';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageRecipeFrameProps {
  readonly slug: string;
  readonly title: string;
  readonly device: PageRecipeDevice;
  readonly viewport: PageRecipeViewport;
  readonly className?: string;
  readonly controls?: ReactNode;
}

/** Outer stage padding (`p-2`) — kept in sync so stage height stays even on every side. */
const STAGE_PADDING_PX = 8;

/**
 * Render a responsive iframe frame for a Page recipe.
 *
 * @param props - Recipe slug, device tier, viewport, and optional controls slot.
 * @returns A React element containing a labeled Page recipe iframe.
 * @example
 * const element = (
 *   <PageRecipeFrame
 *     slug="auth"
 *     title="Auth page"
 *     device="desktop"
 *     viewport={{ width: 1280, height: 800 }}
 *   />
 * );
 */
export const PageRecipeFrame = ({
  slug,
  title,
  device,
  viewport,
  className,
  controls = null,
}: PageRecipeFrameProps) => {
  const src = buildPageRecipePreviewSrc(slug, { thumb: true });
  const { containerRef, measured, maxHeight, scale, contentWidth, contentHeight } = usePreviewScale(
    viewport,
    device,
  );

  return (
    <figure className={cn('min-w-0 w-full', className)} data-preview-device={device}>
      <figcaption className="mb-2 flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
        <span className="flex min-w-0 items-center gap-2">
          <DevicePreviewIcon className="h-4 w-4 shrink-0" device={device} />
          <span className="truncate font-medium text-foreground">
            {device === 'mobile'
              ? 'Mobile (default iPhone 12 Pro Max 428 x 926)'
              : DEVICE_LABELS[device]}
          </span>
        </span>
        <span className="rounded-md border bg-muted/40 px-2 py-0.5 font-mono tabular-nums">
          {viewport.width} x {viewport.height}
        </span>
      </figcaption>
      {controls}
      {/*
        Outer shell keeps equal p-2 gutter; inner stage is a fixed maxHeight so mobile and
        tablet share the same border box. Flex-center keeps the scaled device even on every
        side when it does not fill the stage (width- or height-limited scale).
      */}
      <div
        className="w-full min-w-0 overflow-hidden rounded-lg border bg-muted/30 shadow-sm"
        style={{ padding: STAGE_PADDING_PX }}
      >
        <div
          className="flex w-full min-w-0 items-center justify-center overflow-hidden"
          ref={containerRef}
          style={{ height: maxHeight }}
        >
          {measured ? (
            <div
              className="max-w-full shrink-0 overflow-hidden rounded-md border border-border bg-background"
              style={{
                // content-box: width/height match the scaled iframe; border sits outside so
                // top-left scale never clips only the right/bottom edge.
                boxSizing: 'content-box',
                height: contentHeight,
                width: contentWidth,
              }}
            >
              <div
                style={{
                  height: viewport.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: viewport.width,
                }}
              >
                <iframe
                  className="block border-0 bg-background"
                  height={viewport.height}
                  loading="lazy"
                  src={src}
                  title={`${title} ${DEVICE_LABELS[device]} preview`}
                  width={viewport.width}
                />
              </div>
            </div>
          ) : (
            <div aria-hidden={true} className="h-full w-full rounded-md border bg-background" />
          )}
        </div>
      </div>
    </figure>
  );
};
