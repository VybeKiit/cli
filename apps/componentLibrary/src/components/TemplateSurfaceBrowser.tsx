'use client';

import { RouteStackCard } from '@library/components/RouteStackCard';
import { PageContainer } from '@library/components/shell/PageContainer';
import { PageHeader } from '@library/components/shell/PageHeader';
import { TemplateSurfaceAppPreview } from '@library/components/TemplateSurfaceAppPreview';
import { TemplateSurfacePreviewCard } from '@library/components/TemplateSurfacePreviewCard';
import type { TemplateSurface, TemplateSurfaceAppRoute } from '@library/data/templateSurfaces';
import { useClientReady } from '@library/hooks/useClientReady';
import type { TemplateSurfaceRecipeRef } from '@library/lib/surfaceRecipeMap';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { ExternalLink, FileCode2, Layers3, Route, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TemplateSurfaceBrowserProps {
  readonly surface: TemplateSurface;
  readonly activeRoute: TemplateSurfaceAppRoute;
  readonly recipes: Readonly<Record<string, TemplateSurfaceRecipeRef>>;
}

/**
 * Template surface browser for website, mobile, and extension SaaS previews.
 *
 * @param props - Template surface metadata to render.
 * @returns A sidebar-backed browser for one SaaS template surface.
 * @example
 * const element = <TemplateSurfaceBrowser activeRoute={route} surface={surface} />;
 */
export const TemplateSurfaceBrowser = ({
  activeRoute,
  recipes,
  surface,
}: TemplateSurfaceBrowserProps) => {
  const ready = useClientReady();
  const recipeStack = surface.recipeSlugs
    .map((slug) => recipes[slug])
    .filter((recipe): recipe is TemplateSurfaceRecipeRef => recipe !== undefined);
  const activeRecipe = recipes[activeRoute.recipeSlug];

  return (
    <main className="flex-1" data-template-surface-ready={ready ? 'true' : 'false'}>
      <PageContainer size="wide">
        <PageHeader
          actions={
            <>
              <Badge className="w-fit" variant="outline">
                <Layers3 className="mr-1 h-3.5 w-3.5" />
                {surface.routeStack.length} route groups
              </Badge>
              <Badge className="w-fit" variant="outline">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                {surface.previews.length} live previews
              </Badge>
            </>
          }
          description={surface.summary}
          eyebrow={`VybeKiit · ${surface.sourceTemplate}`}
          title={surface.title}
        />

        {activeRecipe ? (
          <TemplateSurfaceAppPreview
            activeRecipe={activeRecipe}
            activeRoute={activeRoute}
            surface={surface}
          />
        ) : null}

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
            {surface.previews.map((preview) => {
              const recipe = recipes[preview.slug];
              if (recipe === undefined) {
                return null;
              }
              return (
                <TemplateSurfacePreviewCard
                  key={`${surface.id}-${preview.label}`}
                  preview={preview}
                  recipe={recipe}
                />
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-lg">Reusable recipe stack</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recipeStack.map((recipe) => (
              <article className="rounded-lg border bg-card p-4" key={`${surface.id}-${recipe.id}`}>
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
      </PageContainer>
    </main>
  );
};
