'use client';

import { ZoomControls } from '@library/components/ZoomControls';
import type { TemplateSurface, TemplateSurfaceAppRoute } from '@library/data/templateSurfaces';
import { usePersistedNavScroll } from '@library/hooks/usePersistedNavScroll';
import { usePreviewZoom } from '@library/hooks/usePreviewZoom';
import type { TemplateSurfaceRecipeRef } from '@library/lib/surfaceRecipeMap';
import { surfaceRouteHref } from '@library/lib/surfaceRouteHref';
import { iframeZoomStyle, viewportWrapperStyle } from '@library/lib/templateSurfaceZoom';
import { Badge } from '@vybekiit/ui/badge';
import { Route } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TemplateSurfaceAppPreviewProps {
  readonly surface: TemplateSurface;
  readonly activeRoute: TemplateSurfaceAppRoute;
  readonly activeRecipe: TemplateSurfaceRecipeRef;
}

/**
 * Nested playable app preview for one template surface route.
 *
 * @param props - Template surface and active nested route.
 * @returns A nested route preview with sidebar navigation and zoom controls.
 * @example
 * const element = <TemplateSurfaceAppPreview surface={surface} activeRoute={route} />;
 */
export const TemplateSurfaceAppPreview = ({
  activeRecipe,
  activeRoute,
  surface,
}: TemplateSurfaceAppPreviewProps) => {
  const { zoom, zoomIn, zoomOut } = usePreviewZoom(0.65);
  const navRef = usePersistedNavScroll(surface.id);
  const wrapperStyle = useMemo(
    () => viewportWrapperStyle(activeRoute.width, activeRoute.height, zoom),
    [activeRoute.height, activeRoute.width, zoom],
  );
  const frameStyle = useMemo(() => iframeZoomStyle(zoom), [zoom]);

  return (
    <section className="mb-8 overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge>{activeRoute.viewportLabel}</Badge>
            <Badge variant="secondary">{activeRecipe.groupLabel}</Badge>
          </div>
          <h2 className="font-semibold text-lg">Playable nested app</h2>
          <p className="mt-1 max-w-3xl text-muted-foreground text-sm">{activeRoute.description}</p>
        </div>
        <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} zoom={zoom} />
      </header>

      {/*
        Fixed stage height so the route nav scrolls inside the card instead of the page.
        Page scroll was forcing users past the header to reach lower routes, then Next
        scroll-to-top on Link navigation jumped them back to the start of the UI.
      */}
      <div className="grid h-[min(72vh,720px)] min-h-[560px] lg:grid-cols-[232px_1fr]">
        <aside className="flex min-h-0 flex-col border-b bg-background/70 p-3 lg:border-r lg:border-b-0">
          <div className="mb-3 shrink-0 rounded-md border bg-muted/40 p-3">
            <p className="font-medium text-xs uppercase">Nested route</p>
            <code className="mt-2 block truncate rounded bg-background px-2 py-1 text-xs">
              {surfaceRouteHref(surface, activeRoute)}
            </code>
          </div>
          <nav
            aria-label={`${surface.navLabel} nested routes`}
            className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto overscroll-contain pr-1"
            ref={navRef}
          >
            {surface.appRoutes.map((route) => (
              <Link
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  route.id === activeRoute.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                href={surfaceRouteHref(surface, route)}
                key={`${surface.id}-${route.id}`}
                // Keep window scroll where it is when swapping nested routes.
                scroll={false}
              >
                <Route className="h-4 w-4 shrink-0" />
                <span className="truncate">{route.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-h-0 min-w-0 overflow-auto bg-muted/30 p-4">
          <div
            className="overflow-hidden rounded-md border bg-background shadow-sm"
            style={wrapperStyle}
          >
            <iframe
              className="block bg-background"
              height={activeRoute.height}
              loading="lazy"
              src={`/embed/pages/${activeRecipe.slug}`}
              style={frameStyle}
              title={`${surface.navLabel} ${activeRoute.label} nested preview`}
              width={activeRoute.width}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
