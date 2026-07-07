import { CopyPageRecipePromptButton } from '@library/components/CopyPageRecipePromptButton';
import { CopyPageRecipeSourceButton } from '@library/components/CopyPageRecipeSourceButton';
import { PageRecipeFrame } from '@library/components/PageRecipeFrame';
import type { PageRecipe } from '@library/data/pageRecipes';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface PageRecipeCardProps {
  readonly recipe: PageRecipe;
}

/**
 * Render a Page recipe catalog card.
 *
 * @param props - Props passed to this component.
 * @returns A React element for a Page recipe card.
 * @example
 * const element = <PageRecipeCard recipe={recipe} />;
 */
export const PageRecipeCard = ({ recipe }: PageRecipeCardProps) => (
  <article className="rounded-lg border bg-card p-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{recipe.groupLabel}</Badge>
          <code className="rounded bg-muted px-2 py-0.5 text-xs">{recipe.targetRoute}</code>
        </div>
        <h2 className="font-semibold text-xl">{recipe.title}</h2>
        <p className="mt-1 text-muted-foreground text-sm">{recipe.summary}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <CopyPageRecipeSourceButton compact={true} recipe={recipe} />
        <CopyPageRecipePromptButton compact={true} recipe={recipe} />
      </div>
    </div>

    <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.9fr_0.45fr]">
      <PageRecipeFrame device="desktop" slug={recipe.slug} title={recipe.title} />
      <PageRecipeFrame device="tablet" slug={recipe.slug} title={recipe.title} />
      <PageRecipeFrame device="mobile" slug={recipe.slug} title={recipe.title} />
    </div>

    <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <ul className="min-w-0 space-y-1 text-muted-foreground text-sm">
        {recipe.installNotes.slice(0, 2).map((note) => (
          <li className="truncate" key={`${recipe.id}-${note.label}`}>
            {note.label}: {note.note}
          </li>
        ))}
      </ul>
      <Button asChild={true} className="shrink-0" size="sm" variant="outline">
        <Link href={`/pages/${recipe.slug}`}>
          Open full route
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  </article>
);
