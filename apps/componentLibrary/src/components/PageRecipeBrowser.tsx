'use client';

import { CatalogSidebar } from '@library/components/CatalogSidebar';
import { PageRecipeSections } from '@library/components/PageRecipeSections';
import { PAGE_RECIPE_GROUPS, PAGE_RECIPES } from '@library/data/pageRecipes';
import { useClientReady } from '@library/hooks/useClientReady';
import { PAGE_RECIPE_GROUP_SUMMARIES } from '@library/lib/pageRecipeGroupSummaries';
import { recipeMatchesQuery } from '@library/lib/recipeMatchesQuery';
import { safeInitialGroupId } from '@library/lib/safeInitialGroupId';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@vybekiit/ui/sidebar';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useCallback, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';

interface PageRecipeBrowserProps {
  readonly initialGroupId?: string;
}

/**
 * Render the Page recipe catalog browser.
 *
 * @param props - Props passed to the Page recipe browser.
 * @returns A React element for browsing source-backed Page recipes.
 * @example
 * const element = <PageRecipeBrowser initialGroupId="payments" />;
 */
export const PageRecipeBrowser = ({ initialGroupId }: PageRecipeBrowserProps) => {
  const router = useRouter();
  const ready = useClientReady();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [groupId, setGroupId] = useState(safeInitialGroupId(initialGroupId));

  const handleGroupChange = useCallback(
    (nextGroupId: string) => {
      setGroupId(nextGroupId);
      router.replace(nextGroupId === 'all' ? '/pages' : `/pages?group=${nextGroupId}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const recipes = useMemo(
    () =>
      PAGE_RECIPES.filter((recipe) => {
        if (groupId !== 'all' && recipe.groupId !== groupId) {
          return false;
        }
        return recipeMatchesQuery(recipe, debouncedQuery);
      }),
    [debouncedQuery, groupId],
  );

  const grouped = useMemo(
    () =>
      PAGE_RECIPE_GROUPS.map((group) => ({
        group,
        recipes: recipes.filter((recipe) => recipe.groupId === group.id),
      })).filter((group) => group.recipes.length > 0),
    [recipes],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <CatalogSidebar
        activePageGroup={groupId}
        onPageGroupChange={handleGroupChange}
        pageGroups={PAGE_RECIPE_GROUP_SUMMARIES}
        surface="pages"
      />
      <SidebarInset className="min-w-0 overflow-x-clip pb-24">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ms-1" />
          <span className="font-semibold text-sm">Pages</span>
        </header>

        <main
          className="min-w-0 flex-1 p-6 md:p-8"
          data-page-recipes-ready={ready ? 'true' : 'false'}
        >
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                VybeKiit · ui.vybekiit.com
              </p>
              <h1 className="mt-1 font-bold text-3xl tracking-tight">Page Recipes</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Source-backed SaaS pages with desktop, tablet, and mobile previews. Copy the page
                component or copy the install prompt for your coding agent.
              </p>
            </div>
          </header>

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
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
