'use client';

import { buildPageRecipePreviewSrc } from '@library/lib/theme';
import type { ReactNode, SVGProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type PageRecipeDevice = 'desktop' | 'tablet' | 'mobile';

export interface PageRecipeViewport {
  readonly width: number;
  readonly height: number;
}

interface PageRecipeFrameProps {
  readonly slug: string;
  readonly title: string;
  readonly device: PageRecipeDevice;
  readonly viewport: PageRecipeViewport;
  readonly className?: string;
  readonly controls?: ReactNode;
}

const DEVICE_LABELS: Record<PageRecipeDevice, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

const DEVICE_MAX_HEIGHTS: Record<PageRecipeDevice, number> = {
  desktop: 560,
  tablet: 500,
  mobile: 500,
};

const DevicePreviewIcon = ({
  device,
  ...props
}: SVGProps<SVGSVGElement> & { readonly device: PageRecipeDevice }) => {
  if (device === 'mobile') {
    return (
      <svg aria-label="Mobile preview" fill="none" role="img" viewBox="0 0 24 24" {...props}>
        <rect height="20" rx="3.5" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="2" />
        <path d="M10 5h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="12" cy="18" fill="currentColor" r="1" />
      </svg>
    );
  }

  if (device === 'tablet') {
    return (
      <svg aria-label="Tablet preview" fill="none" role="img" viewBox="0 0 24 24" {...props}>
        <rect
          height="17"
          rx="2.8"
          stroke="currentColor"
          strokeWidth="1.8"
          width="14"
          x="5"
          y="3.5"
        />
        <path d="M9 6.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="12" cy="17.5" fill="currentColor" r="1" />
      </svg>
    );
  }

  return (
    <svg aria-label="Desktop preview" fill="none" role="img" viewBox="0 0 24 24" {...props}>
      <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="4" />
      <path d="M9 20h6M12 16v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M6.5 7.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
};

const usePreviewScale = (viewport: PageRecipeViewport, device: PageRecipeDevice) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const maxHeight = DEVICE_MAX_HEIGHTS[device];
  const widthScale = containerWidth > 0 ? containerWidth / viewport.width : 1;
  const heightScale = maxHeight / viewport.height;
  const scale = Math.min(1, widthScale, heightScale);

  return {
    containerRef,
    scale,
    visibleWidth: Math.round(viewport.width * scale),
    visibleHeight: Math.round(viewport.height * scale),
  };
};

/**
 * Render a responsive iframe frame for a Page recipe.
 *
 * @param props - Props passed to this component.
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
  const { containerRef, scale, visibleWidth, visibleHeight } = usePreviewScale(viewport, device);

  return (
    <figure className={cn('min-w-0', className)} data-preview-device={device}>
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
      <div
        className="overflow-hidden rounded-lg border bg-muted/30 p-2 shadow-sm"
        ref={containerRef}
      >
        <div
          className="mx-auto overflow-hidden rounded-md border bg-background"
          style={{ width: visibleWidth, height: visibleHeight }}
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
              className="border-0 bg-background"
              height={viewport.height}
              loading="lazy"
              src={src}
              title={`${title} ${DEVICE_LABELS[device]} preview`}
              width={viewport.width}
            />
          </div>
        </div>
      </div>
    </figure>
  );
};
