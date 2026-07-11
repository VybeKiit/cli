'use client';

import { PageRecipeCard } from '@library/components/PageRecipeCard';
import type { PAGE_RECIPE_GROUPS, PageRecipe } from '@library/data/pageRecipes';
import { Empty, EmptyDescription, EmptyHeader } from '@vybekiit/ui/empty';

type PageRecipeBrowserGroup = (typeof PAGE_RECIPE_GROUPS)[number];

export interface GroupedPageRecipes {
  readonly group: PageRecipeBrowserGroup;
  readonly recipes: readonly PageRecipe[];
}

interface PageRecipeSectionsProps {
  readonly grouped: readonly GroupedPageRecipes[];
}

/**
 * Render grouped page-recipe card sections (or an empty state).
 *
 * @param props - Grouped recipes for the current filter/search.
 * @returns A React element for the Pages browser body.
 * @example
 * const element = <PageRecipeSections grouped={grouped} />;
 */
export const PageRecipeSections = ({ grouped }: PageRecipeSectionsProps) => (
  <div className="min-w-0 space-y-8">
    {grouped.map(({ group, recipes }) => (
      <section className="min-w-0" key={group.id}>
        <div className="mb-3">
          <h2 className="font-semibold text-xl">{group.label}</h2>
          <p className="text-muted-foreground text-sm">{group.description}</p>
        </div>
        <div className="grid min-w-0 gap-4 [&>*]:min-w-0">
          {recipes.map((recipe) => (
            <PageRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    ))}
    {grouped.length === 0 ? (
      <Empty variant="dashed">
        <EmptyHeader>
          <EmptyDescription>No page recipes match this search.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : null}
  </div>
);
