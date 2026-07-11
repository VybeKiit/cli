'use client';

import { ZoomControls } from '@library/components/ZoomControls';
import type { PageRecipe } from '@library/data/pageRecipes';
import type { TemplateSurfacePreview } from '@library/data/templateSurfaces';
import { usePreviewZoom } from '@library/hooks/usePreviewZoom';
import { iframeZoomStyle, viewportWrapperStyle } from '@library/lib/templateSurfaceZoom';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

interface TemplateSurfacePreviewCardProps {
  readonly preview: TemplateSurfacePreview;
  readonly recipe: PageRecipe;
}

/**
 * Iframe preview sized like its target template surface, with independent zoom.
 *
 * @param props - Preview metadata and backing page recipe.
 * @returns A template preview card with the live recipe embed.
 * @example
 * const element = <TemplateSurfacePreviewCard preview={preview} recipe={recipe} />;
 */
export const TemplateSurfacePreviewCard = ({
  preview,
  recipe,
}: TemplateSurfacePreviewCardProps) => {
  const { zoom, zoomIn, zoomOut } = usePreviewZoom(0.75);
  const wrapperStyle = useMemo(
    () => viewportWrapperStyle(preview.width, preview.height, zoom),
    [preview.height, preview.width, zoom],
  );
  const frameStyle = useMemo(() => iframeZoomStyle(zoom), [zoom]);

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
