'use client';

import { CatalogSidebar } from '@library/components/CatalogSidebar';
import { PAGE_RECIPES, type PageRecipe } from '@library/data/pageRecipes';
import type {
  TemplateSurface,
  TemplateSurfaceAppRoute,
  TemplateSurfacePreview,
  TemplateSurfaceRoute,
} from '@library/data/templateSurfaces';
import { useClientReady } from '@library/hooks/useClientReady';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@vybekiit/ui/sidebar';
import { ExternalLink, FileCode2, Layers3, Route, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface TemplateSurfaceBrowserProps {
  readonly surface: TemplateSurface;
  readonly activeRoute: TemplateSurfaceAppRoute;
}

interface TemplateSurfacePreviewCardProps {
  readonly preview: TemplateSurfacePreview;
  readonly recipe: PageRecipe;
}

interface RouteStackCardProps {
  readonly item: TemplateSurfaceRoute;
}

interface ZoomControlsProps {
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly zoom: number;
}

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 1;

/**
 * Resolve the page recipe backing a template preview.
 *
 * @param slug - Page recipe slug from template surface data.
 * @returns The matching page recipe.
 * @example
 * const recipe = recipeBySlug('auth');
 */
const recipeBySlug = (slug: string): PageRecipe => {
  const recipe = PAGE_RECIPES.find((candidate) => candidate.slug === slug);
  if (recipe === undefined) {
    throw new Error(`Missing page recipe for template surface preview: ${slug}`);
  }
  return recipe;
};

/**
 * Clamp a viewport zoom value to the supported preview range.
 *
 * @param value - Candidate zoom value.
 * @returns A zoom value between the configured minimum and maximum.
 * @example
 * const zoom = clampZoom(0.55);
 */
const clampZoom = (value: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

/**
 * Build the nested route href for a template surface route.
 *
 * @param surface - Template surface metadata.
 * @param route - App route metadata.
 * @returns URL path for the nested route.
 * @example
 * const href = surfaceRouteHref(surface, route);
 */
const surfaceRouteHref = (surface: TemplateSurface, route: TemplateSurfaceAppRoute): string =>
  `${surface.href}/${route.path}`;

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
const viewportWrapperStyle = (width: number, height: number, zoom: number): CSSProperties => ({
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
const iframeZoomStyle = (zoom: number): CSSProperties => ({
  transform: `scale(${zoom})`,
  transformOrigin: 'top left',
});

/**
 * Render icon-only zoom controls for a preview viewport.
 *
 * @param props - Current zoom and stable zoom handlers.
 * @returns A compact plus/minus zoom control.
 * @example
 * const element = <ZoomControls zoom={0.8} onZoomIn={() => {}} onZoomOut={() => {}} />;
 */
const ZoomControls = ({ onZoomIn, onZoomOut, zoom }: ZoomControlsProps) => (
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

/**
 * Render one route-stack card for a template surface.
 *
 * @param props - Route stack item to display.
 * @returns A route description card.
 * @example
 * const element = <RouteStackCard item={surface.routeStack[0]} />;
 */
const RouteStackCard = ({ item }: RouteStackCardProps) => (
  <article className="rounded-lg border bg-card p-4">
    <div className="mb-3 flex items-center gap-2">
      <Route className="h-4 w-4 text-primary" />
      <h3 className="font-semibold text-sm">{item.label}</h3>
    </div>
    <code className="rounded bg-muted px-2 py-1 text-xs">{item.route}</code>
    <p className="mt-3 text-muted-foreground text-sm">{item.description}</p>
  </article>
);

/**
 * Render an iframe preview sized like its target template surface.
 *
 * @param props - Preview metadata and backing page recipe.
 * @returns A template preview card with the live recipe embed.
 * @example
 * const element = <TemplateSurfacePreviewCard preview={preview} recipe={recipe} />;
 */
const TemplateSurfacePreviewCard = ({ preview, recipe }: TemplateSurfacePreviewCardProps) => (
  <TemplateSurfacePreviewCardInner preview={preview} recipe={recipe} />
);

/**
 * Render the stateful body for a zoomable preview card.
 *
 * @param props - Preview metadata and backing recipe.
 * @returns A preview card with independent zoom controls.
 * @example
 * const element = <TemplateSurfacePreviewCardInner preview={preview} recipe={recipe} />;
 */
const TemplateSurfacePreviewCardInner = ({ preview, recipe }: TemplateSurfacePreviewCardProps) => {
  const [zoom, setZoom] = useState(0.75);
  const wrapperStyle = useMemo(
    () => viewportWrapperStyle(preview.width, preview.height, zoom),
    [preview.height, preview.width, zoom],
  );
  const frameStyle = useMemo(() => iframeZoomStyle(zoom), [zoom]);
  const zoomIn = () => setZoom((current) => clampZoom(current + ZOOM_STEP));
  const zoomOut = () => setZoom((current) => clampZoom(current - ZOOM_STEP));

  return (
    <article className="min-w-0 rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{preview.viewportLabel}</Badge>
            <span className="text-muted-foreground text-xs">{recipe.groupLabel}</span>
          </div>
          <h3 className="font-semibold">{preview.label}</h3>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">{preview.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} zoom={zoom} />
          <Button asChild={true} size="sm" variant="outline">
            <Link href={`/embed/pages/${recipe.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Open preview
            </Link>
          </Button>
        </div>
      </div>
      <div className="max-h-[820px] overflow-auto bg-muted/30 p-4">
        <div
          className="overflow-hidden rounded-md border bg-background shadow-sm"
          style={wrapperStyle}
        >
          <iframe
            className="block bg-background"
            height={preview.height}
            loading="lazy"
            src={`/embed/pages/${recipe.slug}`}
            style={frameStyle}
            title={`${preview.label} preview`}
            width={preview.width}
          />
        </div>
      </div>
    </article>
  );
};

/**
 * Render the nested playable app preview for one template surface route.
 *
 * @param props - Template surface and active nested route.
 * @returns A nested route preview with sidebar navigation and zoom controls.
 * @example
 * const element = <TemplateSurfaceAppPreview surface={surface} activeRoute={route} />;
 */
const TemplateSurfaceAppPreview = ({ activeRoute, surface }: TemplateSurfaceBrowserProps) => {
  const [zoom, setZoom] = useState(0.65);
  const activeRecipe = recipeBySlug(activeRoute.recipeSlug);
  const wrapperStyle = useMemo(
    () => viewportWrapperStyle(activeRoute.width, activeRoute.height, zoom),
    [activeRoute.height, activeRoute.width, zoom],
  );
  const frameStyle = useMemo(() => iframeZoomStyle(zoom), [zoom]);
  const zoomIn = () => setZoom((current) => clampZoom(current + ZOOM_STEP));
  const zoomOut = () => setZoom((current) => clampZoom(current - ZOOM_STEP));

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

      <div className="grid min-h-[640px] lg:grid-cols-[232px_1fr]">
        <aside className="border-b bg-background/70 p-3 lg:border-r lg:border-b-0">
          <div className="mb-3 rounded-md border bg-muted/40 p-3">
            <p className="font-medium text-xs uppercase">Nested route</p>
            <code className="mt-2 block truncate rounded bg-background px-2 py-1 text-xs">
              {surfaceRouteHref(surface, activeRoute)}
            </code>
          </div>
          <nav className="grid gap-1">
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
              >
                <Route className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 overflow-auto bg-muted/30 p-4">
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

/**
 * Render a template surface browser for website, mobile, and extension SaaS previews.
 *
 * @param props - Template surface metadata to render.
 * @returns A sidebar-backed browser for one SaaS template surface.
 * @example
 * const element = <TemplateSurfaceBrowser activeRoute={route} surface={surface} />;
 */
export const TemplateSurfaceBrowser = ({ activeRoute, surface }: TemplateSurfaceBrowserProps) => {
  const ready = useClientReady();
  const recipeStack = surface.recipeSlugs.map(recipeBySlug);

  return (
    <SidebarProvider defaultOpen={true}>
      <CatalogSidebar surface={surface.id} />
      <SidebarInset className="pb-24">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ms-1" />
          <span className="font-semibold text-sm">{surface.navLabel}</span>
        </header>

        <main className="flex-1 p-6 md:p-8" data-template-surface-ready={ready ? 'true' : 'false'}>
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                VybeKiit · {surface.sourceTemplate}
              </p>
              <h1 className="mt-1 font-bold text-3xl tracking-tight">{surface.title}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">{surface.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="w-fit" variant="outline">
                <Layers3 className="mr-1 h-3.5 w-3.5" />
                {surface.routeStack.length} route groups
              </Badge>
              <Badge className="w-fit" variant="outline">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {surface.previews.length} live previews
              </Badge>
            </div>
          </header>

          <TemplateSurfaceAppPreview activeRoute={activeRoute} surface={surface} />

          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-lg">Template route stack</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {surface.routeStack.map((item) => (
                <RouteStackCard item={item} key={`${surface.id}-${item.label}`} />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-lg">Live template previews</h2>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {surface.previews.map((preview) => (
                <TemplateSurfacePreviewCard
                  key={`${surface.id}-${preview.label}`}
                  preview={preview}
                  recipe={recipeBySlug(preview.slug)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-lg">Reusable recipe stack</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recipeStack.map((recipe) => (
                <article
                  className="rounded-lg border bg-card p-4"
                  key={`${surface.id}-${recipe.id}`}
                >
                  <Badge variant="secondary">{recipe.groupLabel}</Badge>
                  <h3 className="mt-3 font-semibold">{recipe.title}</h3>
                  <p className="mt-1 text-muted-foreground text-sm">{recipe.summary}</p>
                  <Button asChild={true} className="mt-4" size="sm" variant="outline">
                    <Link href={`/pages/${recipe.slug}`}>
                      <ExternalLink className="h-4 w-4" />
                      View recipe
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
