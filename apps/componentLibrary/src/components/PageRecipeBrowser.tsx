'use client';

import {
  type PageRecipeGroupHeader,
  PageRecipeSections,
} from '@library/components/PageRecipeSections';
import { PageContainer } from '@library/components/shell/PageContainer';
import { PageHeader } from '@library/components/shell/PageHeader';
import type { PageRecipe } from '@library/data/pageRecipes';
import { useClientReady } from '@library/hooks/useClientReady';
import { recipeMatchesQuery } from '@library/lib/recipeMatchesQuery';
import { safeInitialGroupId } from '@library/lib/safeInitialGroupId';
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';

interface PageRecipeBrowserProps {
  readonly initialGroupId?: string;
  readonly recipes: readonly PageRecipe[];
  readonly groups: readonly PageRecipeGroupHeader[];
}

/**
 * Render the Page recipe catalog browser.
 *
 * @param props - Props passed to the Page recipe browser.
 * @returns A React element for browsing source-backed Page recipes.
 * @example
 * const element = <PageRecipeBrowser initialGroupId="payments" />;
 */
export const PageRecipeBrowser = ({
  groups,
  initialGroupId,
  recipes: allRecipes,
}: PageRecipeBrowserProps) => {
  const ready = useClientReady();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [groupId, setGroupId] = useState(safeInitialGroupId(initialGroupId));

  // The shell sidebar drives the active group via the URL; sync local state when it changes.
  useEffect(() => {
    setGroupId(safeInitialGroupId(initialGroupId));
  }, [initialGroupId]);

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const recipes = useMemo(
    () =>
      allRecipes.filter((recipe) => {
        if (groupId !== 'all' && recipe.groupId !== groupId) {
          return false;
        }
        return recipeMatchesQuery(recipe, debouncedQuery);
      }),
    [allRecipes, debouncedQuery, groupId],
  );

  const grouped = useMemo(
    () =>
      groups
        .map((group) => ({
          group,
          recipes: recipes.filter((recipe) => recipe.groupId === group.id),
        }))
        .filter((group) => group.recipes.length > 0),
    [groups, recipes],
  );

  return (
    <main className="min-w-0 flex-1" data-page-recipes-ready={ready ? 'true' : 'false'}>
      <PageContainer size="wide">
        <PageHeader
          description="Source-backed SaaS pages with desktop, tablet, and mobile previews. Copy the page component or copy the install prompt for your coding agent."
          eyebrow="VybeKiit · ui.vybekiit.com"
          title="Page Recipes"
        />

        <div className="mb-6">
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            onChange={handleQueryChange}
            placeholder="Search page recipes"
            type="search"
            value={query}
          />
        </div>

        <PageRecipeSections grouped={grouped} />
      </PageContainer>
    </main>
  );
};
